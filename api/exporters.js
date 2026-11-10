import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from 'docx';
import postcss from 'postcss';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { ApiError } from './errors.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_NORMALIZED_IMAGES_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 12_000_000;
const MAX_IMAGE_DIMENSION = 5000;
const MAX_CONCURRENT_PDF_JOBS = 2;
let activePdfJobs = 0;
const ALLOWED_PAGE_CSS_PROPERTIES = new Set(['margin', 'size']);
const ALLOWED_CSS_PROPERTIES = new Set([
  'background-color',
  'border',
  'border-bottom',
  'border-left',
  'border-collapse',
  'border-color',
  'border-radius',
  'border-spacing',
  'border-style',
  'border-width',
  'box-sizing',
  'color',
  'display',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'height',
  'letter-spacing',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-top',
  'max-width',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-top',
  'page-break-after',
  'text-align',
  'text-transform',
  'vertical-align',
  'white-space',
  'width',
]);
const ALLOWED_TAGS = [
  'blockquote', 'br', 'caption', 'dd', 'div', 'dl', 'dt', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main',
  'ol', 'p', 'section', 'small', 'span', 'strong', 'sub', 'sup', 'table',
  'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
];
const ALLOWED_CSS_TAG_SELECTORS = new Set([...ALLOWED_TAGS, 'body']);

function isAllowedCssSelector(selector) {
  return selector.split(/\s+/).every((part) => {
    const nthChildMatch = part.match(/^(.+):nth-child\((?:even|odd|\d+)\)$/i);
    const base = nthChildMatch ? nthChildMatch[1] : part;
    return base === '*'
      || ALLOWED_CSS_TAG_SELECTORS.has(base.toLowerCase())
      || /^[.#][a-zA-Z0-9_-]+$/.test(base);
  });
}

export const systemTemplate = Object.freeze({
  id: 'system-default',
  name: 'Modelo padrão',
  description: 'Modelo padrão do sistema.',
  html: '<h1>{{report.title}}</h1><p>{{report.topic}}</p>{{report.sections}}',
  css: 'body { font-family: Arial, sans-serif; color: #172033; line-height: 1.5; } h1 { font-size: 24px; }',
  status: 'published',
  version: 1,
});

export function sanitizeTemplate(template) {
  if (/[<>&\\]/.test(template.css)) {
    throw new ApiError(400, 'INVALID_TEMPLATE', 'O CSS contém caracteres não permitidos.');
  }

  const html = sanitizeHtml(template.html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { '*': ['class', 'title'] },
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
  }).trim();
  const placeholders = [...html.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]);
  const supported = new Set(['report.title', 'report.topic', 'report.sections']);
  if (placeholders.some((placeholder) => !supported.has(placeholder))) {
    throw new ApiError(400, 'INVALID_TEMPLATE', 'O template contém um placeholder não permitido.');
  }

  if (html !== template.html.trim()) {
    throw new ApiError(400, 'INVALID_TEMPLATE', 'O HTML contém tags ou atributos não permitidos.');
  }

  let css;
  try {
    const root = postcss.parse(template.css);
    root.walkAtRules((atRule) => {
      if (atRule.name.toLowerCase() !== 'page' || atRule.parent !== root || atRule.params.trim()) {
        throw new ApiError(400, 'INVALID_TEMPLATE', 'Somente a regra @page sem modificadores é permitida.');
      }
      atRule.each((node) => {
        if (node.type !== 'decl' && node.type !== 'comment') {
          throw new ApiError(400, 'INVALID_TEMPLATE', 'A regra @page contém uma estrutura não permitida.');
        }
      });
    });
    root.walkRules((rule) => {
      const selectors = rule.selector.split(',').map((selector) => selector.trim());
      if (selectors.some((selector) => !isAllowedCssSelector(selector))) {
        throw new ApiError(400, 'INVALID_TEMPLATE', 'O CSS contém um seletor não permitido.');
      }
    });
    root.walkDecls((declaration) => {
      const value = declaration.value.toLowerCase();
      const pageRule = declaration.parent.type === 'atrule';
      const allowedProperties = pageRule ? ALLOWED_PAGE_CSS_PROPERTIES : ALLOWED_CSS_PROPERTIES;
      if (
        !allowedProperties.has(declaration.prop.toLowerCase())
        || /url\s*\(|expression\s*\(|javascript:|data:/i.test(value)
        || value.includes('\\')
        || (
          pageRule
          && declaration.prop.toLowerCase() === 'size'
          && !/^(?:a[0-6]|letter|legal|tabloid)(?:\s+(?:portrait|landscape))?$/i.test(value.trim())
        )
      ) {
        throw new ApiError(400, 'INVALID_TEMPLATE', 'O CSS contém uma propriedade ou valor não permitido.');
      }
    });
    css = root.toString();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_TEMPLATE', 'O CSS do template é inválido.');
  }

  return { ...template, html, css };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function paragraphs(text) {
  return text.split(/\r?\n/).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

function renderSections(report, images) {
  return report.sections.map((section) => {
    const imageMarkup = section.images.map((image) => {
      const uploaded = images.get(image.id);
      if (!uploaded) return '';
      const caption = image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : '';
      return `<figure><img src="data:${uploaded.mediaType};base64,${uploaded.buffer.toString('base64')}" alt="${escapeHtml(image.caption || image.fileName)}">${caption}</figure>`;
    }).join('');
    const details = section.importantDetails.length
      ? `<ul>${section.importantDetails.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}</ul>`
      : '';
    return `<section><h2>${escapeHtml(section.title)}</h2>${paragraphs(section.body)}${details}${imageMarkup}</section>`;
  }).join('');
}

export function renderPdfHtml(report, template, images = new Map()) {
  const safeTemplate = sanitizeTemplate(template);
  const body = safeTemplate.html
    .replaceAll('{{report.title}}', escapeHtml(report.title))
    .replaceAll('{{report.topic}}', escapeHtml(report.topic))
    .replaceAll('{{report.sections}}', renderSections(report, images));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${safeTemplate.css}</style></head><body>${body}</body></html>`;
}

export async function inspectImage(buffer) {
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'Cada imagem deve ter no máximo 5 MiB.');
  }

  try {
    const image = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' });
    const metadata = await image.metadata();
    const mediaTypeByFormat = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    const mediaType = mediaTypeByFormat[metadata.format];
    if (
      !mediaType
      || !metadata.width
      || !metadata.height
      || metadata.width > MAX_IMAGE_DIMENSION
      || metadata.height > MAX_IMAGE_DIMENSION
      || metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new ApiError(400, 'INVALID_IMAGE', 'Use imagens JPEG, PNG ou WebP de até 12 megapixels.');
    }

    const normalized = await image.rotate().png().toBuffer({ resolveWithObject: true });
    if (normalized.data.length > MAX_IMAGE_BYTES) {
      throw new ApiError(413, 'FILE_TOO_LARGE', 'A imagem excede 5 MiB após a validação.');
    }
    return {
      buffer: normalized.data,
      width: normalized.info.width,
      height: normalized.info.height,
      originalMediaType: mediaType,
      sizeBytes: buffer.length,
      mediaType: 'image/png',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_IMAGE', 'O arquivo enviado não é uma imagem válida.');
  }
}

export async function createPdf(report, template, images = new Map()) {
  if (activePdfJobs >= MAX_CONCURRENT_PDF_JOBS) {
    throw new ApiError(503, 'PDF_BUSY', 'O serviço de PDF está ocupado. Tente novamente.', { retryable: true });
  }

  activePdfJobs += 1;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.route('**/*', (route) => {
      if (route.request().url().startsWith('data:')) return route.continue();
      return route.abort();
    });
    await page.setContent(renderPdfHtml(report, template, images), {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    return await page.pdf({ format: 'A4', printBackground: true, timeout: 60000 });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, 'PDF_UNAVAILABLE', 'Não foi possível gerar o PDF neste servidor.', { retryable: true });
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      activePdfJobs -= 1;
    }
  }
}

export { MAX_NORMALIZED_IMAGES_BYTES };

function escapeMarkdown(value) {
  return String(value).replace(/([\\`*_{}[\]()#+.!|>~-])/g, '\\$1');
}

export function createMarkdown(report) {
  const output = [`# ${escapeMarkdown(report.title)}`, '', `Tema: ${escapeMarkdown(report.topic)}`, ''];
  for (const section of report.sections) {
    output.push(`## ${escapeMarkdown(section.title)}`, '');
    output.push(...section.body.split(/\r?\n/).map(escapeMarkdown), '');
    if (section.importantDetails.length) {
      output.push('### Detalhes importantes', '');
      output.push(...section.importantDetails.map((detail) => `- ${escapeMarkdown(detail)}`), '');
    }
    for (const image of section.images) {
      output.push(`> Imagem anexada: ${escapeMarkdown(image.caption || image.fileName)}`, '');
    }
  }
  return Buffer.from(output.join('\n'), 'utf8');
}

export async function createDocx(report, images = new Map()) {
  const children = [
    new Paragraph({ text: report.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Tema: ${report.topic}` })] }),
  ];

  for (const section of report.sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    for (const paragraph of section.body.split(/\r?\n/)) {
      children.push(new Paragraph({ text: paragraph }));
    }
    for (const detail of section.importantDetails) {
      children.push(new Paragraph({ text: detail, bullet: { level: 0 } }));
    }
    for (const image of section.images) {
      const uploaded = images.get(image.id);
      if (!uploaded) continue;
      const width = Math.min(520, uploaded.width);
      const height = Math.round(uploaded.height * (width / uploaded.width));
      children.push(new Paragraph({
        children: [new ImageRun({
          data: uploaded.buffer,
          type: 'png',
          transformation: { width, height },
        })],
      }));
      if (image.caption) children.push(new Paragraph({ text: image.caption }));
    }
  }

  const document = new Document({ sections: [{ children }] });
  return Packer.toBuffer(document);
}

export function safeFileName(title, extension) {
  const stem = title.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'relatorio';
  return `${stem}.${extension}`;
}
