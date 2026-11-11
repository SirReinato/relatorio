import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { ApiError } from './errors.js';
import { canonicalTemplates } from './canonicalTemplates.js';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function createDatabase({ path, adminUsername, adminPassword }) {
  const databasePath = resolve(path);
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pdf_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      html TEXT NOT NULL,
      css TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      resource_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const account = db.prepare('SELECT id FROM admin_accounts LIMIT 1').get();
  if (!account) {
    if (!adminUsername || !adminPassword) {
      db.close();
      throw new ApiError(
        500,
        'ADMIN_BOOTSTRAP_REQUIRED',
        'Configure ADMIN_INITIAL_USERNAME e ADMIN_INITIAL_PASSWORD para provisionar o administrador inicial.',
      );
    }
    if (adminUsername.trim().length === 0 || adminUsername.length > 100) {
      db.close();
      throw new ApiError(500, 'INVALID_ADMIN_CONFIGURATION', 'ADMIN_INITIAL_USERNAME deve ter entre 1 e 100 caracteres.');
    }
    if (adminPassword.length < 12 || adminPassword.length > 1024) {
      db.close();
      throw new ApiError(500, 'WEAK_ADMIN_PASSWORD', 'ADMIN_INITIAL_PASSWORD deve ter entre 12 e 1024 caracteres.');
    }

    const passwordHash = await hashPassword(adminPassword);
    db.prepare(
      'INSERT INTO admin_accounts (id, username, password_hash, created_at) VALUES (1, ?, ?, ?)',
    ).run(adminUsername, passwordHash, new Date().toISOString());
  }

  const insertTemplateStmt = db.prepare(`
    INSERT OR IGNORE INTO pdf_templates (id, name, description, html, css, status, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const bootstrapNow = new Date().toISOString();
  for (const template of canonicalTemplates) {
    insertTemplateStmt.run(
      template.id,
      template.name,
      template.description,
      template.html,
      template.css,
      template.status,
      template.version,
      bootstrapNow,
      bootstrapNow,
    );
  }

  return {
    raw: db,
    close: () => db.close(),
    getAdmin: () => db.prepare('SELECT id, username, password_hash FROM admin_accounts WHERE id = 1').get(),
    updateAdminPassword: (passwordHash) => db.prepare(
      'UPDATE admin_accounts SET password_hash = ? WHERE id = 1',
    ).run(passwordHash),
    deleteAllSessions: () => db.prepare('DELETE FROM sessions').run(),
    createSession: (tokenHash, expiresAt) => {
      db.prepare('INSERT INTO sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)').run(
        tokenHash,
        expiresAt,
        new Date().toISOString(),
      );
    },
    getSession: (tokenHash) => db.prepare(`
      SELECT sessions.expires_at, admin_accounts.id AS admin_id
      FROM sessions
      JOIN admin_accounts ON admin_accounts.id = 1
      WHERE sessions.token_hash = ?
    `).get(tokenHash),
    deleteSession: (tokenHash) => db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash),
    deleteExpiredSessions: (now) => db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now),
    listPublishedTemplates: () => db.prepare(`
      SELECT id, name, description, version, status
      FROM pdf_templates
      WHERE status = 'published'
      ORDER BY name
    `).all(),
    listTemplates: () => db.prepare(`
      SELECT id, name, description, html, css, status, version, created_at AS createdAt, updated_at AS updatedAt
      FROM pdf_templates
      ORDER BY updated_at DESC
    `).all(),
    getTemplate: (id) => db.prepare(`
      SELECT id, name, description, html, css, status, version, created_at AS createdAt, updated_at AS updatedAt
      FROM pdf_templates WHERE id = ?
    `).get(id),
    createTemplate: (template) => db.prepare(`
      INSERT INTO pdf_templates (id, name, description, html, css, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(
      template.id,
      template.name,
      template.description,
      template.html,
      template.css,
      template.now,
      template.now,
    ),
    updateTemplate: (template) => db.prepare(`
      UPDATE pdf_templates
      SET name = ?, description = ?, html = ?, css = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND status = 'draft'
    `).run(
      template.name,
      template.description,
      template.html,
      template.css,
      template.now,
      template.id,
    ),
    setTemplateStatus: (id, status, now) => db.prepare(`
      UPDATE pdf_templates SET status = ?, version = version + 1, updated_at = ? WHERE id = ?
    `).run(status, now, id),
    cloneTemplate: (source, newId, now) => {
      const newName = `${source.name} (Cópia)`.slice(0, 100);
      db.prepare(`
        INSERT INTO pdf_templates (id, name, description, html, css, status, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?)
      `).run(
        newId,
        newName,
        source.description || '',
        source.html,
        source.css,
        now,
        now,
      );
      return {
        id: newId,
        name: newName,
        description: source.description || '',
        html: source.html,
        css: source.css,
        status: 'draft',
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
    },
    deleteTemplate: (id) => db.prepare('DELETE FROM pdf_templates WHERE id = ?').run(id),
    recordAdminEvent: (type, resourceId) => db.prepare(
      'INSERT INTO admin_events (event_type, resource_id, created_at) VALUES (?, ?, ?)',
    ).run(type, resourceId, new Date().toISOString()),
  };
}
