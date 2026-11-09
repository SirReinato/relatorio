import { randomUUID } from 'node:crypto';
import { ApiError } from './errors.js';
import { reportErrors } from './schemas.js';

const REPORT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'sections'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'body', 'importantDetails'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          body: { type: 'string', maxLength: 12000 },
          importantDetails: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string', maxLength: 500 },
          },
        },
      },
    },
  },
};

function fakeReport(input) {
  const topic = input.topic.trim();
  const title = topic.slice(0, 200);
  return {
    schemaVersion: 1,
    id: randomUUID(),
    title,
    topic,
    brief: input.brief,
    sections: [{
      id: randomUUID(),
      title: 'Visão geral',
      body: `Este é um rascunho inicial sobre ${topic}. Revise e complemente o conteúdo antes de exportar.`,
      importantDetails: [],
      images: [],
    }],
    selectedFormats: ['pdf'],
    pdfTemplateId: 'system-default',
    updatedAt: new Date().toISOString(),
  };
}

function outputText(response) {
  if (typeof response.output_text === 'string') return response.output_text;

  const chunks = response.output?.flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text);

  return chunks?.join('') || '';
}

async function openAiJson({ apiKey, model, input, schema, name, timeoutMs, maxOutputTokens }) {
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        max_output_tokens: maxOutputTokens,
        input,
        text: {
          format: { type: 'json_schema', name, strict: true, schema },
        },
      }),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new ApiError(504, 'AI_TIMEOUT', 'A geração excedeu o tempo limite.', { retryable: true });
    }
    throw new ApiError(503, 'AI_UNAVAILABLE', 'O serviço de geração está indisponível.', { retryable: true });
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new ApiError(
      retryable ? 503 : 502,
      retryable ? 'AI_UNAVAILABLE' : 'AI_PROVIDER_ERROR',
      retryable ? 'O serviço de geração está indisponível.' : 'O serviço de geração não aceitou a solicitação.',
      { retryable },
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(502, 'AI_INVALID_RESPONSE', 'O serviço de geração retornou uma resposta inválida.');
  }

  if (result.status === 'incomplete') {
    throw new ApiError(502, 'AI_INCOMPLETE_RESPONSE', 'A geração foi interrompida antes de ser concluída.');
  }

  try {
    return JSON.parse(outputText(result));
  } catch {
    throw new ApiError(502, 'AI_INVALID_RESPONSE', 'O serviço de geração retornou conteúdo fora do formato esperado.');
  }
}

export function createAiService(config) {
  async function generate(input) {
    if (config.aiProvider === 'fake') return fakeReport(input);

    const report = await openAiJson({
      apiKey: config.openAiApiKey,
      model: config.openAiModel,
      timeoutMs: config.aiTimeoutMs,
      name: 'report_draft',
      schema: REPORT_OUTPUT_SCHEMA,
      maxOutputTokens: 6000,
      input: [
        {
          role: 'developer',
          content: 'Crie um rascunho de relatório em português do Brasil. Seja claro e não invente fontes verificadas. Retorne somente o objeto definido pelo schema.',
        },
        { role: 'user', content: JSON.stringify(input) },
      ],
    });
    const reportDraft = {
      schemaVersion: 1,
      id: randomUUID(),
      title: report.title,
      topic: input.topic,
      brief: input.brief,
      sections: report.sections.map((section) => ({
        id: randomUUID(),
        ...section,
        images: [],
      })),
      selectedFormats: ['pdf'],
      pdfTemplateId: 'system-default',
      updatedAt: new Date().toISOString(),
    };
    const errors = reportErrors(reportDraft);
    if (errors) {
      throw new ApiError(502, 'AI_INVALID_RESPONSE', 'A resposta gerada não passou pela validação.', { fieldErrors: errors });
    }
    return reportDraft;
  }

  async function regenerateSection(input) {
    if (config.aiProvider === 'fake') {
      return {
        sectionId: input.targetSection.id,
        clientRevision: input.targetSection.clientRevision,
        proposal: {
          title: input.targetSection.title,
          body: `Nova proposta sobre ${input.reportContext.topic}: ${(input.targetSection.body || 'desenvolva este tópico com informações claras e organizadas.')}`.slice(0, 12000),
          importantDetails: input.targetSection.importantDetails,
        },
      };
    }

    const schema = {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'body', 'importantDetails'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        body: { type: 'string', maxLength: 12000 },
        importantDetails: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', maxLength: 500 },
        },
      },
    };
    const proposal = await openAiJson({
      apiKey: config.openAiApiKey,
      model: config.openAiModel,
      timeoutMs: config.aiTimeoutMs,
      name: 'section_proposal',
      schema,
      maxOutputTokens: 2000,
      input: [
        {
          role: 'developer',
          content: 'Proponha uma nova versão para a seção solicitada em português do Brasil. Não altere outras seções nem invente fontes verificadas.',
        },
        { role: 'user', content: JSON.stringify(input) },
      ],
    });
    const errors = validateProposal(proposal);
    if (errors) {
      throw new ApiError(502, 'AI_INVALID_RESPONSE', 'A resposta gerada não passou pela validação.', { fieldErrors: errors });
    }
    return {
      sectionId: input.targetSection.id,
      clientRevision: input.targetSection.clientRevision,
      proposal,
    };
  }

  return { generate, regenerateSection };
}

function validateProposal(proposal) {
  if (
    !proposal
    || typeof proposal.title !== 'string'
    || proposal.title.length < 1
    || proposal.title.length > 200
    || typeof proposal.body !== 'string'
    || proposal.body.length > 12000
    || !Array.isArray(proposal.importantDetails)
    || proposal.importantDetails.length > 20
    || proposal.importantDetails.some((detail) => typeof detail !== 'string' || detail.length > 500)
  ) {
    return [{ field: '/', message: 'A proposta de seção tem formato inválido.' }];
  }
  return null;
}
