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
import { compileThemeToHtmlAndCss } from '../../src/components/AdminTemplateManager/themeCompiler.js';

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
    const missingOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      payload: { username: 'admin', password: 'local-test-password-123' },
    });
    assert.equal(missingOrigin.statusCode, 403);
    assert.equal(missingOrigin.json().error.code, 'ORIGIN_REQUIRED');
    const foreignOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin: 'https://attacker.example' },
      payload: { username: 'admin', password: 'local-test-password-123' },
    });
    assert.equal(foreignOrigin.statusCode, 403);
    assert.equal(foreignOrigin.json().error.code, 'ORIGIN_INVALID');

    const unauthorizedDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/templates/${randomUUID()}`,
      headers: { origin },
    });
    assert.equal(unauthorizedDelete.statusCode, 401);
    const unauthorizedPreview = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${randomUUID()}/preview`,
      headers: { origin },
    });
    assert.equal(unauthorizedPreview.statusCode, 401);

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
        html: `<div class="page-container">
<header class="report-header">
  <div class="accent-bar"></div>
  <div class="header-content">
    <h1 class="report-title">{{report.title}}</h1>
    <p class="report-topic">{{report.topic}}</p>
  </div>
</header>
<main class="report-body">{{report.sections}}</main>
<footer class="report-footer">
  <div class="footer-left">
    <span class="footer-title">{{report.title}}</span>
    <span class="footer-badge">Confidencial • Uso Interno</span>
  </div>
  <div class="footer-right"><span class="page-number"></span></div>
</footer>
</div>`,
        css: `@page {
  margin: 18mm 15mm 20mm 15mm;
  size: A4 portrait;
  @bottom-right {
    content: "Página " counter(page) " de " counter(pages);
    font-size: 8pt;
    color: #36415A;
    font-family: Arial, sans-serif;
  }
}
* { box-sizing: border-box; }
body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; color: #202734; background-color: #ffffff; line-height: 1.6; font-size: 11pt; margin: 0; padding: 0; }
.page-container { width: 100%; position: relative; min-height: 100%; }
.report-header { border-bottom: 2px solid #36415A; padding-bottom: 14px; margin-bottom: 24px; }
.accent-bar { width: 48px; height: 4px; background-color: #B7D894; margin-bottom: 12px; border-radius: 2px; }
.report-title { color: #202734; font-size: 22pt; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.5px; line-height: 1.2; }
.report-topic { color: #36415A; font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin: 0; }
.report-body { margin-top: 10px; padding-bottom: 40px; }
h2 { color: #202734; font-size: 14pt; border-left: 4px solid #B7D894; padding-left: 10px; margin-top: 24px; margin-bottom: 10px; page-break-after: avoid; }
h3 { color: #36415A; font-size: 12pt; margin-top: 16px; margin-bottom: 6px; page-break-after: avoid; }
p { margin: 0 0 10px 0; text-align: justify; }
blockquote, .highlight-box { background-color: #E0F8C7; border-left: 4px solid #36415A; color: #202734; padding: 10px 14px; margin: 14px 0; border-radius: 0 4px 4px 0; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
th { background-color: #36415A; color: #ffffff; font-weight: 600; text-align: left; padding: 8px 10px; }
td { border-bottom: 1px solid #E0F8C7; padding: 8px 10px; color: #202734; }
tr:nth-child(even) td { background-color: #f7fbf3; }
.report-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 28px; border-top: 1px solid #36415A; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #36415A; padding-top: 6px; }
.footer-left { display: flex; align-items: center; gap: 8px; }
.footer-title { font-weight: 700; color: #202734; }
.footer-badge { background-color: #E0F8C7; color: #202734; padding: 1px 6px; border-radius: 3px; font-size: 7.5pt; font-weight: 600; }
.page-number::before { content: "Página " counter(page); }`,
      },
    });
    assert.equal(create.statusCode, 201);
    assert.equal(create.json().status, 'draft');
    const templateId = create.json().id;

    const update = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/templates/${templateId}`,
      headers: { origin, cookie },
      payload: {
        name: 'Modelo simples revisado',
        description: 'Descrição atualizada.',
        html: create.json().html,
        css: create.json().css,
      },
    });
    assert.equal(update.statusCode, 200);
    assert.equal(update.json().name, 'Modelo simples revisado');

    const preview = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${templateId}/preview`,
      headers: { origin, cookie },
    });
    assert.equal(preview.statusCode, 200, preview.body);
    assert.equal(preview.headers['content-type'], 'application/pdf');
    assert.equal(preview.rawPayload.subarray(0, 5).toString('ascii'), '%PDF-');

    const publish = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${templateId}/publish`,
      headers: { origin, cookie },
    });
    assert.equal(publish.statusCode, 200);
    assert.equal(publish.json().status, 'published');

    const publicTemplates = await app.inject({ method: 'GET', url: '/api/v1/templates' });
    assert.ok(publicTemplates.json().templates.some((template) => template.id === templateId));

    const publishedDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/templates/${templateId}`,
      headers: { origin, cookie },
    });
    assert.equal(publishedDelete.statusCode, 409);

    const unpublish = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${templateId}/unpublish`,
      headers: { origin, cookie },
    });
    assert.equal(unpublish.statusCode, 200);
    assert.equal(unpublish.json().status, 'draft');
    const publicTemplatesAfterUnpublish = await app.inject({ method: 'GET', url: '/api/v1/templates' });
    assert.equal(publicTemplatesAfterUnpublish.json().templates.some((template) => template.id === templateId), false);

    const remove = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/templates/${templateId}`,
      headers: { origin, cookie },
    });
    assert.equal(remove.statusCode, 200);
    assert.equal(remove.json().deleted, true);

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
    assert.throws(() => sanitizeTemplate({
      ...systemTemplate,
      css: '@import url(https://example.invalid/template.css);',
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
    const imageId = randomUUID();
    report.title = 'Relatório <script>\n# não deve virar título';
    report.sections[0].images.push({
      id: imageId,
      fileName: 'imagem.png',
      mediaType: 'image/png',
      sizeBytes: 120,
      caption: 'Figura de exemplo',
    });
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
    assert.match(response.headers['content-type'], /^text\/markdown/);
    assert.match(response.headers['content-disposition'], /\.md"/);
    assert.match(response.body, /Figura de exemplo/);
    assert.doesNotMatch(response.body, /<script>/);
    assert.doesNotMatch(response.body, /\n# não deve virar título/);

    const unselectedFormat = await app.inject({
      method: 'POST',
      url: '/api/v1/exports/pdf',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });
    assert.equal(unselectedFormat.statusCode, 400);
    assert.equal(unselectedFormat.json().error.code, 'FORMAT_NOT_SELECTED');

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
    assert.equal(response.headers['content-type'], 'application/pdf');
    assert.match(response.headers['content-disposition'], /\.pdf"/);
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
    assert.match(response.headers['content-type'], /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
    assert.match(response.headers['content-disposition'], /\.docx"/);
    assert.equal(response.body.slice(0, 2), 'PK');
  });

  it('aceita multipart/form-data com anexos analíticos e injeta contexto no relatório gerado', async () => {
    const boundary = 'relatorio-ai-multipart-boundary';
    const csvContent = 'Mes,Vendas,Margem\nJaneiro,15000,32%\nFevereiro,18500,35%';
    const payloadJson = {
      topic: 'Desempenho Comercial Q1',
      brief,
    };

    const multipart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="payload"',
      'Content-Type: application/json',
      '',
      JSON.stringify(payloadJson),
      `--${boundary}`,
      'Content-Disposition: form-data; name="attachment:1"; filename="vendas_q1.csv"',
      'Content-Type: text/csv',
      '',
      csvContent,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });

    assert.equal(response.statusCode, 200, response.body);
    const report = response.json();
    assert.equal(report.topic, 'Desempenho Comercial Q1');
    assert.equal(report.sections.length, 2);
    assert.equal(report.sections[1].title, 'Análise documental e evidências');
    assert.match(report.sections[1].body, /vendas_q1\.csv/);
    assert.match(report.sections[1].body, /Janeiro/);
    assert.match(report.sections[1].body, /15000/);
    assert.equal(report.sections[1].importantDetails.length, 1);
    assert.match(report.sections[1].importantDetails[0], /vendas_q1\.csv/);
  });

  it('rejeita envio multipart com mais de 3 arquivos anexos com TOO_MANY_FILES', async () => {
    const boundary = 'relatorio-ai-many-boundary';
    const payloadJson = { topic: 'Relatório Excessivo', brief };

    const parts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="payload"',
      'Content-Type: application/json',
      '',
      JSON.stringify(payloadJson),
    ];

    for (let i = 1; i <= 4; i += 1) {
      parts.push(
        `--${boundary}`,
        `Content-Disposition: form-data; name="file_${i}"; filename="doc_${i}.csv"`,
        'Content-Type: text/csv',
        '',
        `col1,col2\nval${i},data${i}`,
      );
    }
    parts.push(`--${boundary}--`, '');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: parts.join('\r\n'),
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'TOO_MANY_FILES');
  });

  it('rejeita anexo com formato não suportado com INVALID_ATTACHMENT', async () => {
    const boundary = 'relatorio-ai-unsupported-boundary';
    const payloadJson = { topic: 'Arquivo Invalido', brief };

    const multipart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="payload"',
      'Content-Type: application/json',
      '',
      JSON.stringify(payloadJson),
      `--${boundary}`,
      'Content-Disposition: form-data; name="script"; filename="malicious.exe"',
      'Content-Type: application/x-msdownload',
      '',
      'MZbinarioexecutavel',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/reports',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart,
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'INVALID_ATTACHMENT');
  });

  it('semeia os 5 modelos canonicos publicados no banco de dados', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/templates' });
    assert.equal(response.statusCode, 200);
    const { templates } = response.json();
    assert.ok(templates.length >= 5);

    const canonicalIds = [
      'system-executivo',
      'system-tecnico',
      'system-comercial',
      'system-minimalista',
      'system-painel-executivo',
    ];
    for (const id of canonicalIds) {
      const found = templates.find((t) => t.id === id);
      assert.ok(found, `Modelo ${id} não encontrado na listagem pública`);
      assert.equal(found.status, 'published');
    }
  });

  it('permite ao administrador duplicar/clonar qualquer modelo existente como rascunho', async () => {
    const missingOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates/system-executivo/clone',
    });
    assert.equal(missingOrigin.statusCode, 403);
    assert.equal(missingOrigin.json().error.code, 'ORIGIN_REQUIRED');

    const unauthorized = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates/system-executivo/clone',
      headers: { origin },
    });
    assert.equal(unauthorized.statusCode, 401);

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin },
      payload: { username: 'admin', password: 'local-test-password-123' },
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.headers['set-cookie'].split(';')[0];

    const notFound = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${randomUUID()}/clone`,
      headers: { origin, cookie },
    });
    assert.equal(notFound.statusCode, 404);
    assert.equal(notFound.json().error.code, 'TEMPLATE_NOT_FOUND');

    const cloneResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates/system-executivo/clone',
      headers: { origin, cookie },
    });
    assert.equal(cloneResponse.statusCode, 201);
    const cloned = cloneResponse.json();
    assert.equal(cloned.name, 'Executivo Moderno (Cópia)');
    assert.equal(cloned.status, 'draft');
    assert.equal(cloned.version, 1);
    assert.notEqual(cloned.id, 'system-executivo');

    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/templates',
      headers: { origin, cookie },
    });
    assert.equal(list.statusCode, 200);
    const adminTemplates = list.json().templates;
    const foundCloned = adminTemplates.find((t) => t.id === cloned.id);
    assert.ok(foundCloned);
    assert.equal(foundCloned.status, 'draft');
  });

  it('valida que templates gerados pelo Theme Builder passam por sanitizeTemplate e geram PDF prévio', async () => {
    const compiled = compileThemeToHtmlAndCss({
      primaryColor: '#7c3aed',
      secondaryColor: '#db2777',
      textColor: '#18181b',
      backgroundColor: '#fafafa',
      fontFamily: 'Helvetica, sans-serif',
      fontSizeBase: '14px',
      coverLayout: 'split-bar',
      pageMargins: 'wide',
      headerBadgeText: 'RELATÓRIO FINANCEIRO',
      footerFormat: 'confidential-page',
    });

    const sanitized = sanitizeTemplate(compiled);
    assert.ok(sanitized.html.includes('header-split'));
    assert.ok(sanitized.html.includes('RELATÓRIO FINANCEIRO'));
    assert.ok(sanitized.css.includes('#7c3aed'));
    assert.ok(sanitized.css.includes('25mm 20mm 25mm 20mm'));

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/session',
      headers: { origin },
      payload: { username: 'admin', password: 'local-test-password-123' },
    });
    const cookie = login.headers['set-cookie'].split(';')[0];

    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/templates',
      headers: { origin, cookie },
      payload: {
        name: 'Modelo Theme Builder',
        description: 'Gerado pelo Theme Builder visual',
        html: compiled.html,
        css: compiled.css,
      },
    });
    assert.equal(create.statusCode, 201);
    const created = create.json();
    assert.equal(created.name, 'Modelo Theme Builder');

    const preview = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/templates/${created.id}/preview`,
      headers: { origin, cookie },
    });
    assert.equal(preview.statusCode, 200);
    assert.equal(preview.headers['content-type'], 'application/pdf');
    assert.ok(preview.rawPayload.length > 1000);
  });

  it('renderiza tabelas Markdown, blocos de citação e callouts de destaque no HTML do PDF', () => {
    const report = makeReport();
    report.sections[0].body = `Contexto geral antes da tabela.\n\n| Chamado | Colaborador | Recurso |\n|---|---|---|\n| #5740 | Leiciane Sousa | Sankhya DP |\n| #5739 | Thais Garcez | Pastas de Rede |\n\n> Diretriz operacional: Atenção ao preenchimento de chamados.`;
    report.sections[0].importantDetails = ['Verificar permissão no AD', 'Priorizar chamado #5740'];

    const html = renderPdfHtml(report, systemTemplate);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<th>Chamado</th>'));
    assert.ok(html.includes('<td>#5740</td>'));
    assert.ok(html.includes('<td>Sankhya DP</td>'));
    assert.ok(html.includes('<blockquote>'));
    assert.ok(html.includes('Diretriz operacional: Atenção ao preenchimento de chamados.'));
    assert.ok(html.includes('class="callout-card"'));
    assert.ok(html.includes('class="callout-tag"'));
    assert.ok(html.includes('Destaque Operacional &amp; Pontos de Atenção'));
    assert.ok(html.includes('Priorizar chamado #5740'));
  });
});
