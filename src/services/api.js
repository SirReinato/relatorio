class ApiRequestError extends Error {
  constructor(message, statusCode, code, retryable) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = retryable;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedFormats = new Set(['pdf', 'docx', 'markdown']);
const exportFileTypes = {
  pdf: {
    contentType: 'application/pdf',
    extension: 'pdf',
  },
  docx: {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
  },
  markdown: {
    contentType: 'text/markdown',
    extension: 'md',
  },
};

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key));
}

function isText(value, maxLength, allowBlank = true) {
  return typeof value === 'string'
    && value.length <= maxLength
    && (allowBlank || Boolean(value.trim()));
}

function validateBrief(brief) {
  return hasExactKeys(brief, ['objective', 'audience', 'desiredLength', 'tone', 'references'])
    && (brief.objective === null || isText(brief.objective, 2000))
    && (brief.audience === null || isText(brief.audience, 2000))
    && (brief.tone === null || isText(brief.tone, 2000))
    && (brief.desiredLength === null || ['short', 'medium', 'long'].includes(brief.desiredLength))
    && Array.isArray(brief.references)
    && brief.references.length <= 10
    && brief.references.every((reference) => isText(reference, 500));
}

function requestFailure(message = 'A API retornou um relatório fora do contrato esperado.') {
  return new Error(message);
}

export function validateGeneratedReport(report, expectedTopic) {
  if (!hasExactKeys(report, [
    'schemaVersion',
    'id',
    'title',
    'topic',
    'brief',
    'sections',
    'selectedFormats',
    'pdfTemplateId',
    'updatedAt',
  ])) throw requestFailure();

  if (
    report.schemaVersion !== 1
    || !UUID_PATTERN.test(report.id)
    || !isText(report.title, 200, false)
    || report.topic !== expectedTopic
    || !validateBrief(report.brief)
    || !Array.isArray(report.sections)
    || report.sections.length < 1
    || report.sections.length > 20
    || !Array.isArray(report.selectedFormats)
    || report.selectedFormats.length < 1
    || report.selectedFormats.length > 3
    || new Set(report.selectedFormats).size !== report.selectedFormats.length
    || !report.selectedFormats.every((format) => allowedFormats.has(format))
    || !(report.pdfTemplateId === null || isText(report.pdfTemplateId, 100))
    || typeof report.updatedAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(report.updatedAt)
    || Number.isNaN(Date.parse(report.updatedAt))
  ) throw requestFailure();

  const sectionIds = new Set();
  for (const section of report.sections) {
    if (
      !hasExactKeys(section, ['id', 'title', 'body', 'importantDetails', 'images'])
      || !UUID_PATTERN.test(section.id)
      || sectionIds.has(section.id)
      || !isText(section.title, 200, false)
      || !isText(section.body, 12000)
      || !Array.isArray(section.importantDetails)
      || section.importantDetails.length > 20
      || !section.importantDetails.every((detail) => isText(detail, 500))
      || !Array.isArray(section.images)
      || section.images.length !== 0
    ) throw requestFailure();
    sectionIds.add(section.id);
  }

  const totalCharacters = report.sections.reduce((total, section) => total + section.body.length, 0);
  if (totalCharacters > 50000) throw requestFailure();
  return report;
}

export function validateSectionProposal(result, sectionId, clientRevision) {
  if (
    !hasExactKeys(result, ['sectionId', 'clientRevision', 'proposal'])
    || result.sectionId !== sectionId
    || result.clientRevision !== clientRevision
    || !hasExactKeys(result.proposal, ['title', 'body', 'importantDetails'])
    || !isText(result.proposal.title, 200, false)
    || !isText(result.proposal.body, 12000)
    || !Array.isArray(result.proposal.importantDetails)
    || result.proposal.importantDetails.length > 20
    || !result.proposal.importantDetails.every((detail) => isText(detail, 500))
  ) throw requestFailure('A API retornou uma proposta de seção fora do contrato esperado.');

  return result.proposal;
}

async function requestApi(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar à API. Tente novamente.');
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('A API retornou uma resposta inválida.');
  }

  if (!response.ok) {
    throw new ApiRequestError(
      result.error?.message || 'Não foi possível concluir a solicitação.',
      response.status,
      result.error?.code,
      result.error?.retryable,
    );
  }

  return result;
}

async function requestApiBlob(path, { method = 'GET' } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: { Accept: 'application/pdf' },
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Tente novamente.');
  }

  if (!response.ok) {
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('A API retornou uma resposta inválida.');
    }
    throw new ApiRequestError(
      result.error?.message || 'Não foi possível concluir a solicitação.',
      response.status,
      result.error?.code,
      result.error?.retryable,
    );
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('application/pdf')) {
    throw new Error('A API retornou uma prévia em formato inválido.');
  }
  return blob;
}

export async function exportReport(format, report, imageBlobs = new Map()) {
  const fileType = exportFileTypes[format];
  if (!fileType) throw new Error('Formato de exportação inválido.');

  const body = new FormData();
  body.append('report', JSON.stringify(report));
  if (format !== 'markdown') {
    const images = report.sections.flatMap((section) => section.images);
    for (const image of images) {
      const blob = imageBlobs.get(image.id);
      if (!blob || blob.size !== image.sizeBytes || blob.type !== image.mediaType) {
        throw new Error(`A imagem "${image.fileName}" não está disponível para exportação. Recarregue o rascunho e tente novamente.`);
      }
      const extension = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }[image.mediaType];
      if (!extension) throw new Error(`O formato da imagem "${image.fileName}" não é compatível.`);
      body.append(`image:${image.id}`, blob, `image-${image.id}.${extension}`);
    }
  }

  let response;
  try {
    response = await fetch(`/api/v1/exports/${format}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: fileType.contentType },
      body,
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Tente novamente.');
  }

  if (!response.ok) {
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('A API retornou uma resposta inválida.');
    }
    throw new ApiRequestError(
      result.error?.message || 'Não foi possível gerar este formato.',
      response.status,
      result.error?.code,
      result.error?.retryable,
    );
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  if (!contentType.startsWith(fileType.contentType)) {
    throw new Error(`A API retornou um arquivo ${format.toUpperCase()} com tipo inválido.`);
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = /^attachment;\s*filename="([a-z0-9_-]+\.(?:pdf|docx|md))"$/i.exec(disposition);
  if (!filenameMatch || !filenameMatch[1].toLowerCase().endsWith(`.${fileType.extension}`)) {
    throw new Error(`A API retornou um nome de arquivo inválido para ${format.toUpperCase()}.`);
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error(`A API retornou um arquivo ${format.toUpperCase()} vazio.`);
  return { blob, filename: filenameMatch[1] };
}

export async function fetchPublicTemplates() {
  const result = await requestApi('/api/v1/templates');
  if (!Array.isArray(result.templates)) {
    throw new Error('A API retornou uma lista de modelos inválida.');
  }
  return result.templates.filter((template) => template.status === 'published');
}

export function loginAdmin(credentials) {
  return requestApi('/api/v1/admin/session', {
    method: 'POST',
    body: credentials,
  });
}

export function fetchAdminTemplates() {
  return requestApi('/api/v1/admin/templates');
}

export function createAdminTemplate(template) {
  return requestApi('/api/v1/admin/templates', { method: 'POST', body: template });
}

export function updateAdminTemplate(id, template) {
  return requestApi(`/api/v1/admin/templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: template,
  });
}

export function publishAdminTemplate(id) {
  return requestApi(`/api/v1/admin/templates/${encodeURIComponent(id)}/publish`, { method: 'POST' });
}

export function unpublishAdminTemplate(id) {
  return requestApi(`/api/v1/admin/templates/${encodeURIComponent(id)}/unpublish`, { method: 'POST' });
}

export function deleteAdminTemplate(id) {
  return requestApi(`/api/v1/admin/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function cloneAdminTemplate(id) {
  return requestApi(`/api/v1/admin/templates/${encodeURIComponent(id)}/clone`, { method: 'POST' });
}

export function previewAdminTemplate(id) {
  return requestApiBlob(
    `/api/v1/admin/templates/${encodeURIComponent(id)}/preview`,
    { method: 'POST' },
  );
}

export function logoutAdmin() {
  return requestApi('/api/v1/admin/session', { method: 'DELETE' });
}

export function generateReport(input, { signal } = {}) {
  return requestApi('/api/v1/ai/reports', { method: 'POST', body: input, signal });
}

export function regenerateReportSection(input, { signal } = {}) {
  return requestApi('/api/v1/ai/sections/regenerate', { method: 'POST', body: input, signal });
}
