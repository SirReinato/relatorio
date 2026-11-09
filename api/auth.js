import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export const ADMIN_COOKIE = 'relatorio_admin';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function createAdminPreHandler(database) {
  return async function requireAdmin(request, reply) {
    const token = request.cookies[ADMIN_COOKIE];
    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Autenticação administrativa necessária.',
          requestId: request.id,
          retryable: false,
        },
      });
    }

    const tokenHash = hashSessionToken(token);
    const session = database.getSession(tokenHash);
    if (!session || session.expires_at <= Date.now()) {
      database.deleteSession(tokenHash);
      reply.clearCookie(ADMIN_COOKIE, { path: '/api/v1/admin' });
      return reply.code(401).send({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'A sessão expirou. Autentique-se novamente.',
          requestId: request.id,
          retryable: false,
        },
      });
    }

    request.adminId = session.admin_id;
    request.sessionTokenHash = tokenHash;
  };
}
