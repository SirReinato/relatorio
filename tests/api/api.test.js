import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, it } from 'node:test';
import sharp from 'sharp';
import { createAiService } from '../../api/ai.js';
import { createApi } from '../../api/app.js';
import { renderPdfHtml, sanitizeTemplate, systemTemplate } from '../../api/exporters.js';

const origin = 'http://localhost:5173';
const brief = {
  objective: null,
  audience: null,
  desiredLength: 'medium',
  tone: null,
  references: [],
};
const makeReport = () => ({
  schemaVersion: 1,
  id: randomUUID(),
  title: 'Relatório de teste',
  topic: 'Teste de contratos',
  brief,
  sections: [{
    id: randomUUID(),
    title: 'Introdução',
    body: 'Conteúdo de exemplo.',
    importantDetails: ['Revisar antes de usar.'],
    images: [],
  }],
  selectedFormats: ['markdown'],
  pdfTemplateId: 'system-default',
  updatedAt: new Date().toISOString(),
});

describe('API do protótipo', () => {
  let directory;
  let app;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'relatorio-api-'));
    app = await createApi({
      databasePath: join(directory, 'test.sqlite'),
      adminUsername: 'admin',
      adminPassword: 'local-test-password-123',
      aiProvider: 'fake',
      appOrigin: origin,
      secureCookies: false,
      logger: false,
    });
  });

  afterEach(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  });

  it('valida entradas e gera relatório pelo adaptador fake', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      payload: { topic: '', brief },
    });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR');
    assert.ok(invalid.json().error.fieldErrors.length > 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      payload: { topic: 'Relatórios seguros', brief },
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().topic, 'Relatórios seguros');
    assert.equal(response.json().sections.length, 1);

    for (let attempt = 0; attempt < 1; attempt += 1) {
      const withinLimit = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/reports',
        payload: { topic: 'Relatórios seguros', brief },
      });
      assert.equal(withinLimit.statusCode, 200, withinLimit.body);
    }

    const limited = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      payload: { topic: 'Relatórios seguros', brief },
    });
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.json().error.code, 'RATE_LIMITED');
  });

  it('protege administração, cria modelo rascunho e publica apenas após login', async () => {
    const unauthorized = await app.inject({ method: 'GET', url: '/api/v1/admin/templates' });
    assert.equal(unauthorized.statusCode, 401);

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin },
      payload: { username: 'admin', password: 'local-test-password-123' },
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.headers['set-cookie'].split(';')[0];

    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates',
      headers: { origin, cookie },
      payload: {
        name: 'Modelo simples',
        description: '',
        html: '<h1>{{report.title}}</h1>{{report.sections}}',
        css: 'h1 { color: #172033; }',
      },
    });
    assert.equal(create.statusCode, 201);
    assert.equal(create.json().status, 'draft');

    const publish = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${create.json().id}/publish`,
      headers: { origin, cookie },
    });
    assert.equal(publish.statusCode, 200);
    assert.equal(publish.json().status, 'published');

    const publicTemplates = await app.inject({ method: 'GET', url: '/api/v1/templates' });
    assert.ok(publicTemplates.json().templates.some((template) => template.id === create.json().id));

    const changePassword = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/password',
      headers: { origin, cookie },
      payload: {
        currentPassword: 'local-test-password-123',
        newPassword: 'another-local-password-456',
      },
    });
    assert.equal(changePassword.statusCode, 200);
    const expiredSession = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/templates',
      headers: { cookie },
    });
    assert.equal(expiredSession.statusCode, 401);

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin },
      payload: { username: 'admin', password: 'another-local-password-456' },
    });
    assert.equal(newLogin.statusCode, 200);
  });

  it('rejeita HTML executável em templates administrativos', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin },
      payload: { username: 'admin', password: 'local-test-password-123' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates',
      headers: { origin, cookie: login.headers['set-cookie'].split(';')[0] },
      payload: {
        name: 'Inválido',
        description: '',
        html: '<script>alert(1)</script>',
        css: 'body { color: #111; }',
      },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'INVALID_TEMPLATE');
  });

  it('escapa o conteúdo do relatório e rejeita carregamento remoto em CSS', () => {
    const report = makeReport();
    report.title = '<script>alert(1)</script>';
    const html = renderPdfHtml(report, systemTemplate);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.equal(html.includes('<script>'), false);

    assert.throws(() => sanitizeTemplate({
      ...systemTemplate,
      css: 'body { background-color: url(https://example.invalid/image.png); }',
    }), { code: 'INVALID_TEMPLATE' });
  });

  it('mapeia falha do provedor sem expor resposta nem credencial', async () => {
    const openAiApp = await createApi({
      databasePath: join(directory, 'openai.sqlite'),
      adminUsername: 'admin',
      adminPassword: 'local-test-password-123',
      aiProvider: 'openai',
      openAiApiKey: 'server-only-test-secret',
      appOrigin: origin,
      secureCookies: false,
      logger: false,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(options.headers.authorization, 'Bearer server-only-test-secret');
      return new Response(JSON.stringify({ error: { message: 'secret provider details' } }), { status: 429 });
    };

    try {
      const response = await openAiApp.inject({
        method: 'POST',
        url: '/api/v1/ai/reports',
        payload: { topic: 'Falha de provedor', brief },
      });
      assert.equal(response.statusCode, 503);
      assert.equal(response.json().error.code, 'AI_UNAVAILABLE');
      assert.equal(response.body.includes('server-only-test-secret'), false);
      assert.equal(response.body.includes('secret provider details'), false);
    } finally {
      globalThis.fetch = originalFetch;
      await openAiApp.close();
    }
  });

  it('rejeita uma saída do provedor que não atende ao contrato do relatório', async () => {
    const openAiApp = await createApi({
      databasePath: join(directory, 'openai-invalid-output.sqlite'),
      adminUsername: 'admin',
      adminPassword: 'local-test-password-123',
      aiProvider: 'openai',
      openAiApiKey: 'server-only-test-secret',
      appOrigin: origin,
      secureCookies: false,
      logger: false,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      output_text: JSON.stringify({ title: 'Relatório incompleto', sections: [] }),
    }), { status: 200 });

    try {
      const response = await openAiApp.inject({
        method: 'POST',
        url: '/api/v1/ai/reports',
        payload: { topic: 'Resposta inválida', brief },
      });
      assert.equal(response.statusCode, 502);
      assert.equal(response.json().error.code, 'AI_INVALID_RESPONSE');
      assert.equal(response.json().sections, undefined);
    } finally {
      globalThis.fetch = originalFetch;
      await openAiApp.close();
    }
  });

  it('gera relatório pela API Gemini com chave server-side e schema JSON', async () => {
    const geminiApp = await createApi({
      databasePath: join(directory, 'gemini.sqlite'),
      adminUsername: 'admin',
      adminPassword: 'local-test-password-123',
      aiProvider: 'GEMINI',
      geminiApiKey: 'server-only-gemini-secret',
      geminiModel: 'gemini-test-model',
      appOrigin: origin,
      secureCookies: false,
      logger: false,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent');
      assert.equal(options.headers['x-goog-api-key'], 'server-only-gemini-secret');
      assert.equal(options.headers.authorization, undefined);
      const request = JSON.parse(options.body);
      assert.equal(request.generationConfig.responseMimeType, 'application/json');
      assert.equal(request.generationConfig.responseSchema.type, 'OBJECT');
      assert.ok(request.systemInstruction.parts[0].text.includes('português do Brasil'));
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(request.systemInstruction.parts[0].text.startsWith('Proponha')
                ? {
                  title: 'Seção Gemini atualizada',
                  body: 'Conteúdo atualizado de teste.',
                  importantDetails: [],
                }
                : {
                title: 'Relatório Gemini',
                sections: [{
                  title: 'Visão geral',
                  body: 'Conteúdo estruturado de teste.',
                  importantDetails: [],
                }],
                }),
            }],
          },
          finishReason: 'STOP',
        }],
      }), { status: 200 });
    };

    try {
      const response = await geminiApp.inject({
        method: 'POST',
        url: '/api/v1/ai/reports',
        payload: { topic: 'Teste Gemini', brief },
      });
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(response.json().title, 'Relatório Gemini');
      assert.equal(response.json().sections.length, 1);
      assert.equal(response.body.includes('server-only-gemini-secret'), false);

      const sectionId = randomUUID();
      const regeneration = await geminiApp.inject({
        method: 'POST',
        url: '/api/v1/ai/sections/regenerate',
        payload: {
          reportContext: {
            title: 'Relatório Gemini',
            topic: 'Teste Gemini',
            brief,
            sectionTitles: ['Visão geral'],
          },
          targetSection: {
            id: sectionId,
            title: 'Visão geral',
            body: 'Conteúdo anterior.',
            importantDetails: [],
            clientRevision: 3,
          },
        },
      });
      assert.equal(regeneration.statusCode, 200, regeneration.body);
      assert.equal(regeneration.json().sectionId, sectionId);
      assert.equal(regeneration.json().proposal.title, 'Seção Gemini atualizada');
    } finally {
      globalThis.fetch = originalFetch;
      await geminiApp.close();
    }
  });

  it('mapeia falha de quota Gemini sem expor resposta nem credencial', async () => {
    const geminiApp = await createApi({
      databasePath: join(directory, 'gemini-quota.sqlite'),
      adminUsername: 'admin',
      adminPassword: 'local-test-password-123',
      aiProvider: 'gemini',
      geminiApiKey: 'server-only-gemini-secret',
      appOrigin: origin,
      secureCookies: false,
      logger: false,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      error: { message: 'server-only-gemini-secret quota details' },
    }), { status: 429 });

    try {
      const response = await geminiApp.inject({
        method: 'POST',
        url: '/api/v1/ai/reports',
        payload: { topic: 'Teste de quota Gemini', brief },
      });
      assert.equal(response.statusCode, 503);
      assert.equal(response.json().error.code, 'AI_UNAVAILABLE');
      assert.equal(response.body.includes('server-only-gemini-secret'), false);
      assert.equal(response.body.includes('quota details'), false);
    } finally {
      globalThis.fetch = originalFetch;
      await geminiApp.close();
    }
  });

  it('propaga cancelamento do cliente ao provedor de IA', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => new Promise((resolve, reject) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      options.signal.addEventListener('abort', () => {
        const error = new Error('Request aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    });

    try {
      const service = createAiService({
        aiProvider: 'openai',
        openAiApiKey: 'server-only-test-secret',
        openAiModel: 'test-model',
        aiTimeoutMs: 10000,
      });
      const controller = new AbortController();
      const pending = service.generate({ topic: 'Cancelamento', brief }, { signal: controller.signal });
      controller.abort();
      await assert.rejects(pending, (error) => error.code === 'AI_CANCELLED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('exporta Markdown e rejeita payload de exportação inválido', async () => {
    const boundary = 'relatorio-test-boundary';
    const report = makeReport();
    const multipart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="report"',
      'Content-Type: application/json',
      '',
      JSON.stringify(report),
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/exports/markdown',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.match(response.headers['content-disposition'], /\.md"/);
    assert.match(response.body, /Relatório de teste/);

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/exports/markdown',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart.replace('"schemaVersion":1', '"schemaVersion":2'),
    });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR');
  });

  it('gera PDF isolado com o Chromium local', async () => {
    const boundary = 'relatorio-pdf-boundary';
    const report = makeReport();
    report.selectedFormats = ['pdf'];
    const multipart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="report"',
      'Content-Type: application/json',
      '',
      JSON.stringify(report),
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/exports/pdf',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.rawPayload.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('confere o binário de imagem e produz DOCX sem persistir o anexo', async () => {
    const png = await sharp({
      create: {
        width: 3,
        height: 2,
        channels: 3,
        background: '#336699',
      },
    }).png().toBuffer();
    const report = makeReport();
    const imageId = randomUUID();
    report.selectedFormats = ['docx'];
    report.sections[0].images.push({
      id: imageId,
      fileName: 'imagem.png',
      mediaType: 'image/png',
      sizeBytes: png.length,
      caption: 'Imagem de teste',
    });
    const boundary = 'relatorio-image-boundary';
    const prefix = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="report"',
      'Content-Type: application/json',
      '',
      JSON.stringify(report),
      `--${boundary}`,
      `Content-Disposition: form-data; name="image:${imageId}"; filename="imagem.png"`,
      'Content-Type: image/png',
      '',
    ].join('\r\n');
    const payload = Buffer.concat([
      Buffer.from(`${prefix}\r\n`),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/exports/docx',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload,
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.body.slice(0, 2), 'PK');
  });
});
