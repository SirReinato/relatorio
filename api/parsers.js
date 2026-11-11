import { PDFParse } from 'pdf-parse';
import readXlsxFile from 'read-excel-file/node';
import sharp from 'sharp';
import { ApiError } from './errors.js';

export const MAX_ATTACHMENTS_COUNT = 3;
export const MAX_CUMULATIVE_BYTES = 15 * 1024 * 1024; // 15 MiB
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MiB
export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024; // 5 MiB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MiB
export const MAX_SPREADSHEET_ROWS_PER_SHEET = 100;
export const MAX_SPREADSHEET_ROWS_TOTAL = 200;
export const MAX_ESTIMATED_TOKENS = 30000;
export const MAX_CONTEXT_CHARACTERS = MAX_ESTIMATED_TOKENS * 4; // ~120.000 chars

export const SUPPORTED_EXTENSIONS = new Set(['pdf', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg', 'webp']);

export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function escapeMarkdownTableCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  const stringified = String(value)
    .replace(/\0/g, '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
  return stringified;
}

export function formatMarkdownTable(rows, maxRows = MAX_SPREADSHEET_ROWS_PER_SHEET) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '*(Planilha ou tabela vazia)*\n';
  }

  const effectiveRows = rows.slice(0, maxRows);
  if (effectiveRows.length === 0) return '*(Planilha ou tabela vazia)*\n';

  const colCount = Math.max(...effectiveRows.map((r) => (Array.isArray(r) ? r.length : 0)), 1);

  const headerRow = effectiveRows[0] || [];
  const headers = Array.from({ length: colCount }, (_, i) => {
    const val = escapeMarkdownTableCell(headerRow[i]);
    return val || `Coluna ${i + 1}`;
  });

  const divider = Array.from({ length: colCount }, () => '---');

  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
  ];

  for (let i = 1; i < effectiveRows.length; i += 1) {
    const row = effectiveRows[i];
    if (!Array.isArray(row)) continue;
    const cells = Array.from({ length: colCount }, (_, c) => escapeMarkdownTableCell(row[c]));
    lines.push(`| ${cells.join(' | ')} |`);
  }

  if (rows.length > maxRows) {
    lines.push(`\n*... e mais ${rows.length - maxRows} linhas omitidas para resumo.*`);
  }

  return lines.join('\n');
}

export function parseCsvRows(text) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\0/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!clean.trim()) return [];

  const firstLine = clean.split('\n', 1)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      insideQuotes = true;
    } else if (char === delimiter) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n') {
      currentRow.push(currentField.trim());
      if (currentRow.some((c) => Boolean(c))) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => Boolean(c))) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export async function extractPdfText(buffer, fileName = 'documento.pdf') {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, 'INVALID_ATTACHMENT', `O arquivo "${fileName}" está vazio.`);
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', `O arquivo PDF "${fileName}" excede o limite de 10 MiB.`);
  }

  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const rawText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
    const clean = sanitizeText(rawText);

    if (!clean) {
      return {
        type: 'pdf',
        fileName,
        sizeBytes: buffer.length,
        text: '*(Documento PDF sem camada de texto legível extraída)*',
        pageCount: 1,
      };
    }

    return {
      type: 'pdf',
      fileName,
      sizeBytes: buffer.length,
      text: clean,
      pageCount: textResult?.total || 1,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_ATTACHMENT', `Não foi possível ler o arquivo PDF "${fileName}". Verifique se o arquivo não está corrompido ou protegido por senha.`);
  }
}

export async function extractSpreadsheetMarkdown(buffer, fileName = 'planilha.xlsx') {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, 'INVALID_ATTACHMENT', `O arquivo "${fileName}" está vazio.`);
  }
  if (buffer.length > MAX_SPREADSHEET_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', `A planilha "${fileName}" excede o limite de 5 MiB.`);
  }

  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (extension === 'csv') {
    const textContent = buffer.toString('utf-8');
    const rows = parseCsvRows(textContent);
    const tableMd = formatMarkdownTable(rows, MAX_SPREADSHEET_ROWS_PER_SHEET);
    return {
      type: 'csv',
      fileName,
      sizeBytes: buffer.length,
      text: tableMd,
      totalRows: rows.length,
    };
  }

  try {
    const sheets = await readXlsxFile(buffer, { getSheets: true });
    if (!Array.isArray(sheets) || sheets.length === 0) {
      const rows = await readXlsxFile(buffer);
      const tableMd = formatMarkdownTable(rows, MAX_SPREADSHEET_ROWS_PER_SHEET);
      return {
        type: 'xlsx',
        fileName,
        sizeBytes: buffer.length,
        text: tableMd,
        totalRows: rows.length,
      };
    }

    const sections = [];
    let cumulativeRows = 0;

    for (const sheet of sheets) {
      if (cumulativeRows >= MAX_SPREADSHEET_ROWS_TOTAL) break;
      const remainingRows = MAX_SPREADSHEET_ROWS_TOTAL - cumulativeRows;
      const rows = await readXlsxFile(buffer, { sheet: sheet.name });
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const sheetLimit = Math.min(MAX_SPREADSHEET_ROWS_PER_SHEET, remainingRows);
      const tableMd = formatMarkdownTable(rows, sheetLimit);
      sections.push(`#### Aba: ${sheet.name}\n${tableMd}`);
      cumulativeRows += Math.min(rows.length, sheetLimit);
    }

    return {
      type: 'xlsx',
      fileName,
      sizeBytes: buffer.length,
      text: sections.length > 0 ? sections.join('\n\n') : '*(Planilha sem dados)*',
      totalSheets: sheets.length,
      rowsSampled: cumulativeRows,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_ATTACHMENT', `Não foi possível processar a planilha "${fileName}". Certifique-se de que o arquivo seja um XLSX ou CSV válido.`);
  }
}

export async function inspectAttachmentImage(buffer, fileName = 'imagem.png') {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, 'INVALID_ATTACHMENT', `A imagem "${fileName}" está vazia.`);
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', `A imagem "${fileName}" excede o limite de 5 MiB.`);
  }

  try {
    const image = sharp(buffer, { failOn: 'error' });
    const metadata = await image.metadata();
    if (!metadata.format || !metadata.width || !metadata.height) {
      throw new ApiError(400, 'INVALID_ATTACHMENT', `O arquivo "${fileName}" não é uma imagem válida.`);
    }

    return {
      type: 'image',
      fileName,
      sizeBytes: buffer.length,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      text: `*(Imagem anexada: ${fileName}, formato ${metadata.format.toUpperCase()}, ${metadata.width}x${metadata.height}px, ${Math.round(buffer.length / 1024)} KiB)*`,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_ATTACHMENT', `A imagem "${fileName}" é inválida ou está corrompida.`);
  }
}

export async function parseSingleAttachment(attachment) {
  const { buffer, fileName = 'arquivo', mimeType = '' } = attachment;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return extractPdfText(buffer, fileName);
  }
  if (ext === 'csv' || mimeType.includes('csv')) {
    return extractSpreadsheetMarkdown(buffer, fileName);
  }
  if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return extractSpreadsheetMarkdown(buffer, fileName);
  }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext) || mimeType.startsWith('image/')) {
    return inspectAttachmentImage(buffer, fileName);
  }

  throw new ApiError(400, 'INVALID_ATTACHMENT', `O formato do arquivo "${fileName}" não é suportado. Envie arquivos PDF, planilhas (XLSX, CSV) ou imagens (PNG, JPEG, WebP).`);
}

export async function consolidateContext(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return {
      text: '',
      tokenEstimate: 0,
      truncated: false,
      attachmentsMeta: [],
    };
  }

  if (attachments.length > MAX_ATTACHMENTS_COUNT) {
    throw new ApiError(400, 'TOO_MANY_FILES', `Envie no máximo ${MAX_ATTACHMENTS_COUNT} arquivos de contexto.`);
  }

  const totalBytes = attachments.reduce((acc, a) => acc + (a.buffer?.length || 0), 0);
  if (totalBytes > MAX_CUMULATIVE_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', `O tamanho cumulativo dos arquivos (${Math.round(totalBytes / 1024 / 1024)} MiB) excede o teto de 15 MiB.`);
  }

  const parsedResults = [];
  for (const attachment of attachments) {
    const result = await parseSingleAttachment(attachment);
    parsedResults.push(result);
  }

  const sections = [];
  for (let i = 0; i < parsedResults.length; i += 1) {
    const res = parsedResults[i];
    sections.push(`### Documento Anexo ${i + 1}: ${res.fileName} (${res.type.toUpperCase()})\n${res.text}`);
  }

  let combinedText = sections.join('\n\n---\n\n');
  let truncated = false;

  if (combinedText.length > MAX_CONTEXT_CHARACTERS) {
    combinedText = `${combinedText.slice(0, MAX_CONTEXT_CHARACTERS)}\n\n*(Atenção: Os documentos excederam o limite de ~30.000 tokens e foram truncados para síntese analítica.)*`;
    truncated = true;
  }

  return {
    text: combinedText,
    tokenEstimate: estimateTokens(combinedText),
    truncated,
    attachmentsMeta: parsedResults.map((r) => ({
      fileName: r.fileName,
      type: r.type,
      sizeBytes: r.sizeBytes,
    })),
  };
}
