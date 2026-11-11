import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  consolidateContext,
  escapeMarkdownTableCell,
  estimateTokens,
  extractMarkdownText,
  extractPdfText,
  extractSpreadsheetMarkdown,
  formatMarkdownTable,
  inspectAttachmentImage,
  parseCsvRows,
  parseSingleAttachment,
  sanitizeText,
} from '../../api/parsers.js';
import { ApiError } from '../../api/errors.js';

test('api/parsers: sanitizeText, escapeMarkdownTableCell e estimateTokens', () => {
  const dirty = '  Linha 1\r\n\r\n\r\n\r\nLinha 2 \t\t com espaços  \0 ';
  const clean = sanitizeText(dirty);
  assert.equal(clean, 'Linha 1\n\nLinha 2 com espaços');
  assert.equal(estimateTokens('abcd'), 1);
  assert.equal(estimateTokens(''), 0);
  assert.equal(escapeMarkdownTableCell('A | B'), 'A \\| B');
  assert.equal(escapeMarkdownTableCell(null), '');
});

test('api/parsers: parseCsvRows suporta vírgulas, ponto-e-vírgula e aspas', () => {
  const csvSemicolon = 'Produto;Valor;Observações\nNotebook;4500,00;"Nota com; ponto-e-vírgula"\nMouse;50,00;Óptico';
  const rows = parseCsvRows(csvSemicolon);
  assert.equal(rows.length, 3);
  assert.equal(rows[0][0], 'Produto');
  assert.equal(rows[1][2], 'Nota com; ponto-e-vírgula');

  const csvComma = 'Nome,Idade\nAna,28\nCarlos,35';
  const commaRows = parseCsvRows(csvComma);
  assert.equal(commaRows.length, 3);
  assert.equal(commaRows[1][0], 'Ana');
});

test('api/parsers: formatMarkdownTable gera tabela compatível com Markdown', () => {
  const rows = [
    ['Mês', 'Vendas | Total'],
    ['Janeiro', '10.000'],
    ['Fevereiro', '12.500'],
  ];
  const md = formatMarkdownTable(rows);
  assert.match(md, /\| Mês \| Vendas \\\| Total \|/);
  assert.match(md, /\| --- \| --- \|/);
  assert.match(md, /\| Janeiro \| 10\.000 \|/);
});

test('api/parsers: extractSpreadsheetMarkdown processa CSV e rejeita arquivos vazios ou gigantes', async () => {
  const csvBuffer = Buffer.from('Item,Qtd\nCadeira,4\nMesa,1');
  const result = await extractSpreadsheetMarkdown(csvBuffer, 'inventario.csv');
  assert.equal(result.type, 'csv');
  assert.match(result.text, /Cadeira/);

  await assert.rejects(
    async () => extractSpreadsheetMarkdown(Buffer.alloc(0), 'vazio.csv'),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );

  await assert.rejects(
    async () => extractSpreadsheetMarkdown(Buffer.alloc(6 * 1024 * 1024), 'grande.csv'),
    (err) => err instanceof ApiError && err.statusCode === 413 && err.code === 'FILE_TOO_LARGE',
  );
});

test('api/parsers: inspectAttachmentImage valida dimensões e rejeita imagens falsas ou corrompidas', async () => {
  const validPng = await sharp({
    create: {
      width: 50,
      height: 50,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  }).png().toBuffer();

  const imageResult = await inspectAttachmentImage(validPng, 'grafico.png');
  assert.equal(imageResult.type, 'image');
  assert.equal(imageResult.width, 50);
  assert.equal(imageResult.height, 50);

  await assert.rejects(
    async () => inspectAttachmentImage(Buffer.from('not an image'), 'fake.png'),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );
});

test('api/parsers: extractPdfText rejeita buffer vazio, limite de 10 MiB e PDF corrompido', async () => {
  await assert.rejects(
    async () => extractPdfText(Buffer.alloc(0), 'vazio.pdf'),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );

  await assert.rejects(
    async () => extractPdfText(Buffer.alloc(11 * 1024 * 1024), 'pesado.pdf'),
    (err) => err instanceof ApiError && err.statusCode === 413 && err.code === 'FILE_TOO_LARGE',
  );

  await assert.rejects(
    async () => extractPdfText(Buffer.from('corrupted binary content not valid pdf'), 'corrompido.pdf'),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );
});

test('api/parsers: parseSingleAttachment rejeita formato não suportado', async () => {
  await assert.rejects(
    async () => parseSingleAttachment({ fileName: 'script.sh', buffer: Buffer.from('echo 1') }),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );
});

test('api/parsers: consolidateContext aplica limites globais e compõe texto analítico', async () => {
  const validPng = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 1 },
    },
  }).png().toBuffer();

  const attachments = [
    {
      fileName: 'dados.csv',
      buffer: Buffer.from('Conta;Saldo\nCaixa;15000\nBanco;85000'),
    },
    {
      fileName: 'foto.png',
      buffer: validPng,
    },
  ];

  const consolidated = await consolidateContext(attachments);
  assert.equal(consolidated.attachmentsMeta.length, 2);
  assert.match(consolidated.text, /Documento Anexo 1: dados\.csv/);
  assert.match(consolidated.text, /Documento Anexo 2: foto\.png/);
  assert.equal(consolidated.truncated, false);
  assert.ok(consolidated.tokenEstimate > 0);

  // Rejeita mais de 3 arquivos
  await assert.rejects(
    async () => consolidateContext([
      { fileName: '1.csv', buffer: Buffer.from('a') },
      { fileName: '2.csv', buffer: Buffer.from('b') },
      { fileName: '3.csv', buffer: Buffer.from('c') },
      { fileName: '4.csv', buffer: Buffer.from('d') },
    ]),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'TOO_MANY_FILES',
  );

  // Rejeita total > 15 MiB
  await assert.rejects(
    async () => consolidateContext([
      { fileName: 'a.csv', buffer: Buffer.alloc(8 * 1024 * 1024) },
      { fileName: 'b.csv', buffer: Buffer.alloc(8 * 1024 * 1024) },
    ]),
    (err) => err instanceof ApiError && err.statusCode === 413 && err.code === 'FILE_TOO_LARGE',
  );
});

test('api/parsers: extractMarkdownText processa .md e parseSingleAttachment suporta arquivos markdown', async () => {
  const mdBuffer = Buffer.from('# Título do Documento\n\nEste é um **resumo** com detalhes analíticos.');
  const result = extractMarkdownText(mdBuffer, 'brief.md');
  assert.equal(result.type, 'markdown');
  assert.equal(result.fileName, 'brief.md');
  assert.match(result.text, /Título do Documento/);

  const parsed = await parseSingleAttachment({
    fileName: 'notas.md',
    buffer: mdBuffer,
  });
  assert.equal(parsed.type, 'markdown');
  assert.equal(parsed.fileName, 'notas.md');

  // Rejeita buffer vazio
  assert.throws(
    () => extractMarkdownText(Buffer.alloc(0), 'vazio.md'),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_ATTACHMENT',
  );

  // Rejeita buffer maior que 10 MiB
  assert.throws(
    () => extractMarkdownText(Buffer.alloc(11 * 1024 * 1024), 'grande.md'),
    (err) => err instanceof ApiError && err.statusCode === 413 && err.code === 'FILE_TOO_LARGE',
  );
});
