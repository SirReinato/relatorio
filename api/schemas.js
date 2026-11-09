import Ajv from 'ajv';

const uuidPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
const nullableText = (maxLength) => ({
  anyOf: [{ type: 'string', maxLength }, { type: 'null' }],
});

export const reportSchema = {
  $id: 'ReportDraft',
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'id',
    'title',
    'topic',
    'brief',
    'sections',
    'selectedFormats',
    'pdfTemplateId',
    'updatedAt',
  ],
  properties: {
    schemaVersion: { const: 1 },
    id: { type: 'string', pattern: uuidPattern },
    title: { type: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
    topic: { type: 'string', minLength: 1, maxLength: 500, pattern: '\\S' },
    brief: {
      type: 'object',
      additionalProperties: false,
      required: ['objective', 'audience', 'desiredLength', 'tone', 'references'],
      properties: {
        objective: nullableText(2000),
        audience: nullableText(2000),
        desiredLength: {
          anyOf: [
            { type: 'string', enum: ['short', 'medium', 'long'] },
            { type: 'null' },
          ],
        },
        tone: nullableText(2000),
        references: {
          type: 'array',
          maxItems: 10,
          items: { type: 'string', maxLength: 500 },
        },
      },
    },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'body', 'importantDetails', 'images'],
        properties: {
          id: { type: 'string', pattern: uuidPattern },
          title: { type: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
          body: { type: 'string', maxLength: 12000 },
          importantDetails: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string', maxLength: 500 },
          },
          images: {
            type: 'array',
            maxItems: 20,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'fileName', 'mediaType', 'sizeBytes', 'caption'],
              properties: {
                id: { type: 'string', pattern: uuidPattern },
                fileName: { type: 'string', minLength: 1, maxLength: 255 },
                mediaType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] },
                sizeBytes: { type: 'integer', minimum: 1, maximum: 5 * 1024 * 1024 },
                caption: nullableText(500),
              },
            },
          },
        },
      },
    },
    selectedFormats: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
      items: { type: 'string', enum: ['pdf', 'docx', 'markdown'] },
    },
    pdfTemplateId: nullableText(100),
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const generateReportSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'brief'],
  properties: {
    topic: { type: 'string', minLength: 1, maxLength: 500, pattern: '\\S' },
    brief: {
      type: 'object',
      additionalProperties: false,
      required: ['objective', 'audience', 'desiredLength', 'tone', 'references'],
      properties: {
        objective: nullableText(2000),
        audience: nullableText(2000),
        desiredLength: {
          anyOf: [
            { type: 'string', enum: ['short', 'medium', 'long'] },
            { type: 'null' },
          ],
        },
        tone: nullableText(2000),
        references: {
          type: 'array',
          maxItems: 10,
          items: { type: 'string', maxLength: 500 },
        },
      },
    },
  },
};

export const regenerateSectionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['reportContext', 'targetSection'],
  properties: {
    reportContext: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'topic', 'brief', 'sectionTitles'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        topic: { type: 'string', minLength: 1, maxLength: 500, pattern: '\\S' },
        brief: generateReportSchema.properties.brief,
        sectionTitles: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', maxLength: 200 },
        },
      },
    },
    targetSection: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'title', 'body', 'importantDetails', 'clientRevision'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
        title: { type: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        body: { type: 'string', maxLength: 12000 },
        importantDetails: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', maxLength: 500 },
        },
        clientRevision: { type: 'integer', minimum: 0 },
      },
    },
  },
};

export const templateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'html', 'css'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
    description: { type: 'string', maxLength: 500 },
    html: { type: 'string', minLength: 1, maxLength: 50 * 1024 },
    css: { type: 'string', maxLength: 50 * 1024 },
  },
};

export const loginSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 1, maxLength: 100 },
    password: { type: 'string', minLength: 1, maxLength: 1024 },
  },
};

export const passwordChangeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['currentPassword', 'newPassword'],
  properties: {
    currentPassword: { type: 'string', minLength: 1, maxLength: 1024 },
    newPassword: { type: 'string', minLength: 12, maxLength: 1024 },
  },
};

const ajv = new Ajv({ allErrors: true, strict: false });
const compiledSchemas = new WeakMap();
ajv.addFormat('uuid', new RegExp(uuidPattern, 'i'));
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);

export function validate(schema, value) {
  let check = compiledSchemas.get(schema);
  if (!check) {
    check = ajv.compile(schema);
    compiledSchemas.set(schema, check);
  }

  if (check(value)) return null;

  return check.errors.map((error) => ({
    field: error.instancePath || '/',
    message: error.message || 'Valor inválido.',
  }));
}

export function reportErrors(report) {
  const errors = validate(reportSchema, report) || [];
  const totalCharacters = report?.sections?.reduce(
    (total, section) => total + (section.body?.length || 0),
    0,
  ) || 0;

  if (totalCharacters > 50000) {
    errors.push({ field: '/sections', message: 'O relatório excede 50.000 caracteres.' });
  }

  return errors.length ? errors : null;
}
