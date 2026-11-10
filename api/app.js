import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import {
  ADMIN_COOKIE,
  SESSION_DURATION_MS,
  createAdminPreHandler,
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} from './auth.js';
import { createAiService } from './ai.js';
import { createDatabase, hashPassword } from './database.js';
import { ApiError } from './errors.js';
import {
  createDocx,
  createMarkdown,
  createPdf,
  inspectImage,
  MAX_NORMALIZED_IMAGES_BYTES,
  safeFileName,
  sanitizeTemplate,
  systemTemplate,
} from './exporters.js';
import {
  generateReportSchema,
  loginSchema,
  passwordChangeSchema,
  regenerateSectionSchema,
  reportErrors,
  templateSchema,
} from './schemas.js';

const UUID_SCHEMA = { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' };
const TEMPLATE_PARAMS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: { id: UUID_SCHEMA },
};

function now() {
  return new Date().toISOString();
}

function createRequestAbortSignal(request, reply) {
  const controller = new AbortController();
  const abortIfDisconnected = () => {
    if (!reply.raw.writableEnded) controller.abort();
  };
  request.raw.once('aborted', abortIfDisconnected);
  reply.raw.once('close', abortIfDisconnected);
  return {
    signal: controller.signal,
    cleanup() {
      request.raw.off('aborted', abortIfDisconnected);
      reply.raw.off('close', abortIfDisconnected);
    },
  };
}

function fail(statusCode, code, message, request, extra = {}) {
  throw new ApiError(statusCode, code, message, extra);
}

function validationError(errors, request) {
  if (!errors) return;
  fail(400, 'VALIDATION_ERROR', 'Revise os campos indicados.', request, { fieldErrors: errors });
}

function errorResponse(error, request, reply) {
  const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode
    : 500;
  if (!(error instanceof ApiError) && statusCode >= 500) {
    request.log.error({
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack,
    }, 'Unhandled API request failure');
  }
  const validationErrors = error.validation?.map((item) => ({
    field: item.instancePath || '/',
    message: item.message || 'Valor inválido.',
  }));
  const code = error.code === 'FST_REQ_FILE_TOO_LARGE'
    ? 'FILE_TOO_LARGE'
    : error instanceof ApiError
      ? error.code
      : validationErrors
        ? 'VALIDATION_ERROR'
        : statusCode === 429
          ? 'RATE_LIMITED'
          : 'INTERNAL_ERROR';
  const message = error instanceof ApiError
    ? error.message
    : validationErrors
      ? 'Revise os campos indicados.'
      : statusCode === 413
        ? 'O conteúdo enviado excede o limite permitido.'
        : statusCode === 429
          ? 'Limite de solicitações atingido. Aguarde antes de tentar novamente.'
          : 'Ocorreu um erro interno. Tente novamente mais tarde.';

  return reply.code(statusCode).send({
    error: {
      code,
      message,
      requestId: request.id,
      retryable: error instanceof ApiError ? error.retryable : statusCode === 429 || statusCode >= 500,
      ...(error instanceof ApiError && error.fieldErrors
        ? { fieldErrors: error.fieldErrors }
        : validationErrors
          ? { fieldErrors: validationErrors }
          : {}),
    },
  });
}

function requireSameOrigin(request, config) {
  const origin = request.headers.origin;
  if (!origin) {
    throw new ApiError(403, 'ORIGIN_REQUIRED', 'A origem da solicitação não foi validada.');
  }

  let actualOrigin;
  try {
    actualOrigin = new URL(origin).origin;
  } catch {
    throw new ApiError(403, 'ORIGIN_INVALID', 'A origem da solicitação não foi validada.');
  }

  const expectedOrigin = config.appOrigin || `${request.protocol}://${request.headers.host}`;
  if (actualOrigin !== expectedOrigin) {
    throw new ApiError(403, 'ORIGIN_INVALID', 'A origem da solicitação não foi validada.');
  }
}

async function parseExportMultipart(request) {
  let report;
  const uploadedImages = new Map();
  let totalImageBytes = 0;
  let totalNormalizedImageBytes = 0;

  try {
    for await (const part of request.parts()) {
      if (part.type === 'field') {
        if (part.fieldname !== 'report' || report !== undefined) {
          throw new ApiError(400, 'INVALID_EXPORT_REQUEST', 'Envie somente um campo report em JSON.');
        }
        if (typeof part.value === 'string') {
          try {
            report = JSON.parse(part.value);
          } catch {
            throw new ApiError(400, 'INVALID_EXPORT_REQUEST', 'O campo report não contém JSON válido.');
          }
        } else if (part.mimetype === 'application/json' && part.value && typeof part.value === 'object') {
          report = part.value;
        } else {
          throw new ApiError(400, 'INVALID_EXPORT_REQUEST', 'O campo report não contém JSON válido.');
        }
        continue;
      }

      const imageMatch = /^image:([0-9a-f-]{36})$/i.exec(part.fieldname);
      if (!imageMatch || uploadedImages.has(imageMatch[1])) {
        throw new ApiError(400, 'INVALID_EXPORT_REQUEST', 'O identificador de uma imagem enviada é inválido ou duplicado.');
      }
      const buffer = await part.toBuffer();
      totalImageBytes += buffer.length;
      if (totalImageBytes > 20 * 1024 * 1024) {
        throw new ApiError(413, 'FILE_TOO_LARGE', 'As imagens do relatório excedem 20 MiB.');
      }
      const inspected = await inspectImage(buffer);
      totalNormalizedImageBytes += inspected.buffer.length;
      if (totalNormalizedImageBytes > MAX_NORMALIZED_IMAGES_BYTES) {
        throw new ApiError(413, 'FILE_TOO_LARGE', 'As imagens normalizadas excedem 20 MiB.');
      }
      uploadedImages.set(imageMatch[1], inspected);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new ApiError(413, 'FILE_TOO_LARGE', 'Cada imagem deve ter no máximo 5 MiB.');
    }
    if (error.code === 'FST_FILES_LIMIT' || error.code === 'FST_PARTS_LIMIT') {
      throw new ApiError(413, 'TOO_MANY_FILES', 'O relatório excede a quantidade permitida de arquivos.');
    }
    throw error;
  }

  if (!report) throw new ApiError(400, 'INVALID_EXPORT_REQUEST', 'O campo report é obrigatório.');
  validationError(reportErrors(report), request);

  const referencedImages = report.sections.flatMap((section) => section.images);
  if (referencedImages.length > 20 || referencedImages.length !== uploadedImages.size) {
    throw new ApiError(400, 'IMAGE_MISMATCH', 'Envie somente as imagens referenciadas no relatório.');
  }

  for (const image of referencedImages) {
    const uploaded = uploadedImages.get(image.id);
    if (
      !uploaded
      || uploaded.originalMediaType !== image.mediaType
      || uploaded.sizeBytes !== image.sizeBytes
    ) {
      throw new ApiError(400, 'IMAGE_MISMATCH', 'Os dados de uma imagem não correspondem ao arquivo enviado.');
    }
  }

  return { report, uploadedImages };
}

function templateRecord(template) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    html: template.html,
    css: template.css,
    status: template.status,
    version: template.version,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export async function createApi(options = {}) {
  const config = {
    databasePath: options.databasePath || process.env.DATABASE_PATH || './data/relatorio.sqlite',
    adminUsername: options.adminUsername ?? process.env.ADMIN_INITIAL_USERNAME,
    adminPassword: options.adminPassword ?? process.env.ADMIN_INITIAL_PASSWORD,
    aiProvider: (options.aiProvider || process.env.AI_PROVIDER || 'fake').trim().toLowerCase(),
    openAiApiKey: options.openAiApiKey ?? process.env.OPENAI_API_KEY,
    openAiModel: options.openAiModel || process.env.OPENAI_MODEL || 'gpt-5-mini',
    geminiApiKey: options.geminiApiKey ?? process.env.GEMINI_API_KEY,
    geminiModel: options.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    aiTimeoutMs: options.aiTimeoutMs || 90000,
    appOrigin: options.appOrigin || process.env.APP_ORIGIN || '',
    secureCookies: options.secureCookies ?? process.env.NODE_ENV === 'production',
    logger: options.logger ?? process.env.NODE_ENV === 'production',
  };

  if (!['fake', 'openai', 'gemini'].includes(config.aiProvider)) {
    throw new ApiError(500, 'INVALID_CONFIGURATION', 'AI_PROVIDER deve ser fake, openai ou gemini.');
  }
  if (config.aiProvider === 'openai' && !config.openAiApiKey) {
    throw new ApiError(500, 'AI_CONFIGURATION_REQUIRED', 'OPENAI_API_KEY é obrigatória quando AI_PROVIDER=openai.');
  }
  if (config.aiProvider === 'gemini' && !config.geminiApiKey) {
    throw new ApiError(500, 'AI_CONFIGURATION_REQUIRED', 'GEMINI_API_KEY é obrigatória quando AI_PROVIDER=gemini.');
  }

  const database = await createDatabase({
    path: config.databasePath,
    adminUsername: config.adminUsername,
    adminPassword: config.adminPassword,
  });
  const app = Fastify({
    logger: config.logger,
    bodyLimit: 1024 * 1024,
    requestIdHeader: false,
    genReqId: () => randomUUID(),
  });
  const ai = createAiService(config);
  const requireAdmin = createAdminPreHandler(database);

  app.decorate('database', database);
  app.addHook('onClose', async () => database.close());
  app.setErrorHandler(errorResponse);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '15 minutes',
    errorResponseBuilder: (request) => ({
      statusCode: 429,
      error: {
        code: 'RATE_LIMITED',
        message: 'Limite de solicitações atingido. Aguarde antes de tentar novamente.',
        requestId: request.id,
        retryable: true,
      },
    }),
  });
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 20,
      fields: 1,
      parts: 21,
      fieldSize: 1024 * 1024,
    },
  });

  app.addHook('preHandler', async (request) => {
    if (
      request.routeOptions.url?.startsWith('/api/v1/admin')
      && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
    ) {
      requireSameOrigin(request, config);
    }
  });
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'no-store');
    return payload;
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post('/api/v1/ai/reports', {
    schema: { body: generateReportSchema },
    config: { rateLimit: { max: 3, timeWindow: '10 minutes' } },
  }, async (request, reply) => {
    const abort = createRequestAbortSignal(request, reply);
    try {
      const report = await ai.generate(request.body, { signal: abort.signal });
      validationError(reportErrors(report), request);
      return report;
    } finally {
      abort.cleanup();
    }
  });

  app.post('/api/v1/ai/sections/regenerate', {
    schema: { body: regenerateSectionSchema },
    config: { rateLimit: { max: 3, timeWindow: '10 minutes' } },
  }, async (request, reply) => {
    const abort = createRequestAbortSignal(request, reply);
    try {
      return await ai.regenerateSection(request.body, { signal: abort.signal });
    } finally {
      abort.cleanup();
    }
  });

  app.get('/api/v1/templates', async () => ({
    templates: [
      { id: systemTemplate.id, name: systemTemplate.name, description: systemTemplate.description, version: systemTemplate.version, status: 'published' },
      ...database.listPublishedTemplates(),
    ],
  }));

  app.post('/api/v1/admin/session', {
    schema: { body: loginSchema },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const admin = database.getAdmin();
    const passwordMatches = await verifyPassword(request.body.password, admin.password_hash);
    if (request.body.username !== admin.username || !passwordMatches) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Usuário ou senha inválidos.');
    }

    database.deleteExpiredSessions(Date.now());
    const token = createSessionToken();
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    database.createSession(hashSessionToken(token), expiresAt);
    reply.setCookie(ADMIN_COOKIE, token, {
      path: '/api/v1/admin',
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
    });
    return { authenticated: true, expiresAt: new Date(expiresAt).toISOString() };
  });

  app.delete('/api/v1/admin/session', { preHandler: requireAdmin }, async (request, reply) => {
    database.deleteSession(request.sessionTokenHash);
    reply.clearCookie(ADMIN_COOKIE, { path: '/api/v1/admin', secure: config.secureCookies, httpOnly: true, sameSite: 'lax' });
    return { authenticated: false };
  });

  app.put('/api/v1/admin/password', {
    schema: { body: passwordChangeSchema },
    preHandler: requireAdmin,
  }, async (request, reply) => {
    const admin = database.getAdmin();
    if (!await verifyPassword(request.body.currentPassword, admin.password_hash)) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'A senha atual está incorreta.');
    }
    database.updateAdminPassword(await hashPassword(request.body.newPassword));
    database.deleteAllSessions();
    reply.clearCookie(ADMIN_COOKIE, {
      path: '/api/v1/admin',
      secure: config.secureCookies,
      httpOnly: true,
      sameSite: 'lax',
    });
    database.recordAdminEvent('admin.password_changed', null);
    return { authenticated: false };
  });

  app.get('/api/v1/admin/templates', { preHandler: requireAdmin }, async () => ({
    templates: database.listTemplates(),
  }));

  app.post('/api/v1/admin/templates', {
    schema: { body: templateSchema },
    preHandler: requireAdmin,
  }, async (request, reply) => {
    const name = request.body.name.trim();
    if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Informe o nome do template.');
    const normalized = sanitizeTemplate({ ...request.body, name });
    const id = randomUUID();
    const timestamp = now();
    database.createTemplate({ ...normalized, id, now: timestamp });
    database.recordAdminEvent('template.created', id);
    reply.code(201);
    return templateRecord(database.getTemplate(id));
  });

  app.put('/api/v1/admin/templates/:id', {
    schema: { params: TEMPLATE_PARAMS_SCHEMA, body: templateSchema },
    preHandler: requireAdmin,
  }, async (request) => {
    const current = database.getTemplate(request.params.id);
    if (!current) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Modelo PDF não encontrado.');
    if (current.status !== 'draft') {
      throw new ApiError(409, 'TEMPLATE_MUST_BE_DRAFT', 'Despublique o modelo antes de editá-lo.');
    }
    const name = request.body.name.trim();
    if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Informe o nome do template.');
    const normalized = sanitizeTemplate({ ...request.body, name });
    database.updateTemplate({ ...normalized, id: current.id, now: now() });
    database.recordAdminEvent('template.updated', current.id);
    return templateRecord(database.getTemplate(current.id));
  });

  app.post('/api/v1/admin/templates/:id/publish', {
    schema: { params: TEMPLATE_PARAMS_SCHEMA },
    preHandler: requireAdmin,
  }, async (request) => {
    const template = database.getTemplate(request.params.id);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Modelo PDF não encontrado.');
    sanitizeTemplate(template);
    database.setTemplateStatus(template.id, 'published', now());
    database.recordAdminEvent('template.published', template.id);
    return templateRecord(database.getTemplate(template.id));
  });

  app.post('/api/v1/admin/templates/:id/unpublish', {
    schema: { params: TEMPLATE_PARAMS_SCHEMA },
    preHandler: requireAdmin,
  }, async (request) => {
    const template = database.getTemplate(request.params.id);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Modelo PDF não encontrado.');
    database.setTemplateStatus(template.id, 'draft', now());
    database.recordAdminEvent('template.unpublished', template.id);
    return templateRecord(database.getTemplate(template.id));
  });

  app.delete('/api/v1/admin/templates/:id', {
    schema: { params: TEMPLATE_PARAMS_SCHEMA },
    preHandler: requireAdmin,
  }, async (request) => {
    const template = database.getTemplate(request.params.id);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Modelo PDF não encontrado.');
    if (template.status !== 'draft') {
      throw new ApiError(409, 'TEMPLATE_MUST_BE_DRAFT', 'Despublique o modelo antes de excluí-lo.');
    }

    database.deleteTemplate(template.id);
    database.recordAdminEvent('template.deleted', template.id);
    return { deleted: true, id: template.id };
  });

  app.post('/api/v1/admin/templates/:id/preview', {
    schema: { params: TEMPLATE_PARAMS_SCHEMA },
    preHandler: requireAdmin,
    config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
  }, async (request, reply) => {
    const template = database.getTemplate(request.params.id);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Modelo PDF não encontrado.');
    const previewReport = {
      title: 'Relatório de exemplo',
      topic: 'Pré-visualização de modelo',
      sections: [{
        title: 'Seção de exemplo',
        body: 'Este conteúdo é fictício e serve apenas para pré-visualização.',
        importantDetails: [],
        images: [],
      }],
    };
    const pdf = await createPdf(previewReport, template);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'inline; filename="previa-modelo.pdf"');
    return reply.send(pdf);
  });

  app.post('/api/v1/exports/:format', {
    schema: {
      params: {
        type: 'object',
        additionalProperties: false,
        required: ['format'],
        properties: { format: { type: 'string', enum: ['pdf', 'docx', 'markdown'] } },
      },
    },
    config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
  }, async (request, reply) => {
    const { report, uploadedImages } = await parseExportMultipart(request);
    let result;
    let contentType;
    let extension;

    if (request.params.format === 'markdown') {
      result = createMarkdown(report);
      contentType = 'text/markdown; charset=utf-8';
      extension = 'md';
    } else if (request.params.format === 'docx') {
      result = await createDocx(report, uploadedImages);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    } else {
      const templateId = report.pdfTemplateId || 'system-default';
      const template = templateId === 'system-default'
        ? systemTemplate
        : database.getTemplate(templateId);
      if (!template || template.status !== 'published') {
        throw new ApiError(400, 'TEMPLATE_UNAVAILABLE', 'O modelo PDF selecionado não está publicado.');
      }
      result = await createPdf(report, template, uploadedImages);
      contentType = 'application/pdf';
      extension = 'pdf';
    }

    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', `attachment; filename="${safeFileName(report.title, extension)}"`);
    return reply.send(result);
  });

  return app;
}
