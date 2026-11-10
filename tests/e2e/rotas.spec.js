import { test, expect } from '@playwright/test';

const publishedTemplates = [
  {
    id: 'system-default',
    name: 'Modelo padrão',
    description: 'Modelo do sistema.',
    status: 'published',
  },
  {
    id: 'modelo-publicado',
    name: 'Modelo publicado',
    description: 'Modelo visível para visitantes.',
    status: 'published',
  },
  {
    id: 'modelo-inativo',
    name: 'Modelo inativo',
    description: 'Rascunho administrativo.',
    status: 'draft',
  },
];

async function fulfillJson(route, status, body) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test.describe('Landing page e início do relatório', () => {
  test('renderiza a casca mestre, a explicação do fluxo e os acessos principais', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('layout-geral')).toBeVisible();
    await expect(page.getByTestId('header-fixo')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transforme suas ideias em relatórios claros.' })).toBeVisible();
    await expect(page.getByTestId('botao-iniciar-relatorio')).toBeVisible();
    await expect(page.getByTestId('link-login-admin')).toHaveAttribute('href', '/admin/login');
    await expect(page.getByTestId('footer-fixo')).toContainText('Sistema de Relatórios');
  });

  test('abre modal acessível por teclado, fecha com Escape e devolve foco ao CTA', async ({ page }) => {
    await page.route('**/api/v1/templates', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await fulfillJson(route, 200, { templates: publishedTemplates });
    });
    await page.goto('/');
    const startButton = page.getByRole('button', { name: 'Iniciar novo relatório' });

    await startButton.click();
    const dialog = page.getByRole('dialog', { name: 'Iniciar novo relatório' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /Escrever manualmente/ })).toBeChecked();
    await expect(dialog.getByRole('status')).toHaveText('Carregando modelos PDF publicados…');
    await expect(dialog.getByLabel('Modelo de PDF')).toHaveValue('system-default');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(startButton).toBeFocused();
  });

  test('seleciona modalidade, vários formatos e apenas modelos publicados antes de continuar', async ({ page }) => {
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: publishedTemplates }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();

    const dialog = page.getByRole('dialog', { name: 'Iniciar novo relatório' });
    await dialog.getByRole('radio', { name: /Começar com IA/ }).check();
    await dialog.getByRole('checkbox', { name: 'DOCX' }).check();
    await dialog.getByRole('checkbox', { name: 'Markdown' }).check();
    await dialog.getByLabel('Modelo de PDF').selectOption('modelo-publicado');

    await expect(dialog.getByLabel('Modelo de PDF').locator('option')).toHaveCount(2);
    await expect(dialog.getByLabel('Modelo de PDF')).not.toContainText('Modelo inativo');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(page).toHaveURL('/relatorios/novo');
    await expect(page.getByTestId('formulario-geracao-ia')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Começar com IA' })).toBeVisible();
    await expect(page.getByTestId('formulario-geracao-ia')).toContainText('Formatos: PDF, DOCX, Markdown.');
    await expect(page.getByTestId('formulario-geracao-ia')).toContainText('Modelo PDF: Modelo publicado.');
  });

  test('permite continuar sem formatos ou modelos publicados', async ({ page }) => {
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();

    const dialog = page.getByRole('dialog', { name: 'Iniciar novo relatório' });
    await expect(dialog.getByRole('status')).toHaveText('Nenhum modelo publicado disponível. Você ainda pode iniciar e escolher depois.');
    await dialog.getByRole('checkbox', { name: 'PDF' }).uncheck();
    await expect(dialog.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(page).toHaveURL(/\/relatorios\/novo\/[0-9a-f-]{36}$/);
    await expect(page.getByTestId('editor-relatorio')).toBeVisible();
    await expect(page.getByLabel('Formato PDF')).not.toBeChecked();
    await expect(page.getByText('Rascunho salvo neste navegador')).toBeVisible();
  });

  test('cria e valida um relatório manual, ordena seções e abre a prévia', async ({ page }) => {
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByTestId('editor-relatorio')).toBeVisible();
    await page.getByRole('button', { name: 'Pré-visualizar' }).click();
    await expect(page.getByTestId('erros-validacao')).toContainText('Informe o tema do relatório.');

    await page.getByLabel('Título do relatório').fill('Relatório de teste');
    await page.getByLabel('Tema do relatório').fill('Validação do editor manual');
    await page.getByLabel('Objetivo').fill('Documentar o fluxo');
    await page.getByLabel('Conteúdo da seção 1').fill('Conteúdo da introdução.');
    await page.getByRole('button', { name: 'Adicionar detalhe importante' }).click();
    await page.getByRole('textbox', { name: 'Detalhe 1 da seção 1' }).fill('Dado relevante');
    await page.getByRole('button', { name: 'Adicionar seção' }).click();
    await page.getByLabel('Título da seção 2').fill('Conclusão');
    await page.getByLabel('Conteúdo da seção 2').fill('Síntese final.');
    await page.getByRole('button', { name: 'Mover seção 2 para cima' }).click();

    await expect(page.getByLabel('Título da seção 1')).toHaveValue('Conclusão');
    await expect(page.getByLabel('Título da seção 2')).toHaveValue('Introdução');
    await page.getByRole('button', { name: 'Pré-visualizar' }).click();
    await expect(page.getByTestId('previa-relatorio')).toContainText('Relatório de teste');
    await expect(page.getByTestId('previa-relatorio')).toContainText('Dado relevante');
    await expect(page.getByTestId('previa-relatorio')).toContainText('PDF');
    await page.getByRole('button', { name: 'Fechar prévia' }).click();
    await page.getByRole('button', { name: 'Remover seção' }).last().click();
    await expect(page.getByTestId('secao-2')).toHaveCount(0);
  });

  test('exporta múltiplos formatos do mesmo snapshot, isola falhas e baixa cada arquivo', async ({ page }) => {
    const exportRequests = [];
    let pdfAttempts = 0;
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.route('**/api/v1/exports/*', async (route) => {
      const request = route.request();
      const format = new URL(request.url()).pathname.split('/').pop();
      const body = request.postDataBuffer().toString('utf8');
      exportRequests.push({ format, body });

      if (format === 'pdf' && pdfAttempts === 0) {
        pdfAttempts += 1;
        await fulfillJson(route, 503, {
          error: { code: 'PDF_BUSY', message: 'PDF temporariamente indisponível.', retryable: true },
        });
        return;
      }

      const fileTypes = {
        pdf: { contentType: 'application/pdf', extension: 'pdf', body: Buffer.from('%PDF-1.4 teste') },
        docx: {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          body: Buffer.from('PK\u0003\u0004teste'),
        },
        markdown: { contentType: 'text/markdown; charset=utf-8', extension: 'md', body: Buffer.from('# Relatório') },
      };
      const fileType = fileTypes[format];
      await route.fulfill({
        status: 200,
        contentType: fileType.contentType,
        headers: { 'content-disposition': `attachment; filename="Relatorio-de-exportacao.${fileType.extension}"` },
        body: fileType.body,
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Título do relatório').fill('Relatório de exportação');
    await page.getByLabel('Tema do relatório').fill('Formatos combinados');
    await page.getByLabel('Conteúdo da seção 1').fill('Conteúdo do snapshot exportado.');
    await page.getByLabel('Formato PDF').check();
    await page.getByLabel('Formato DOCX').check();
    await page.getByLabel('Formato Markdown').check();
    await page.locator('[aria-label="Adicionar imagem à seção 1"]').setInputFiles({
      name: 'evidencia.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPgUbIAAACkAGfNzc0uAAAAAElFTkSuQmCC', 'base64'),
    });
    await page.getByLabel('Legenda da imagem evidencia.png').fill('Imagem do relatório');
    await page.getByRole('button', { name: 'Gerar arquivos selecionados' }).click();

    await expect(page.getByTestId('erro-exportacao-pdf')).toContainText('PDF temporariamente indisponível.');
    await expect(page.getByTestId('estado-exportacao-docx')).toHaveText('DOCX gerado com sucesso.');
    await expect(page.getByTestId('estado-exportacao-markdown')).toHaveText('Markdown gerado com sucesso.');

    const initialRequests = exportRequests.slice(0, 3);
    expect(initialRequests.map(({ format }) => format).sort()).toEqual(['docx', 'markdown', 'pdf']);
    const reportPayloads = initialRequests.map(({ body }) => {
      const match = body.match(/name="report"\r\n\r\n([\s\S]*?)\r\n--/);
      expect(match).not.toBeNull();
      return JSON.parse(match[1]);
    });
    expect(reportPayloads.every((report) => (
      report.title === 'Relatório de exportação'
      && report.sections[0].body === 'Conteúdo do snapshot exportado.'
      && report.sections[0].images[0].caption === 'Imagem do relatório'
    ))).toBe(true);

    const markdownRequest = initialRequests.find(({ format }) => format === 'markdown');
    const binaryRequests = initialRequests.filter(({ format }) => format !== 'markdown');
    expect(markdownRequest.body).not.toContain('name="image:');
    expect(binaryRequests.every(({ body }) => body.includes('name="image:'))).toBe(true);

    await page.getByRole('button', { name: 'Tentar novamente PDF' }).click();
    await expect(page.getByTestId('estado-exportacao-pdf')).toHaveText('PDF gerado com sucesso.');
    expect(exportRequests).toHaveLength(4);

    for (const [label, extension] of [
      ['PDF', 'pdf'],
      ['DOCX', 'docx'],
      ['Markdown', 'md'],
    ]) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: `Baixar ${label}` }).click(),
      ]);
      expect(download.suggestedFilename()).toBe(`Relatorio-de-exportacao.${extension}`);
    }
    expect(exportRequests).toHaveLength(4);
  });

  test('salva e retoma um rascunho com imagem e legenda, validando substituição e remoção', async ({ page }) => {
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Título do relatório').fill('Rascunho com imagem');
    await page.getByLabel('Tema do relatório').fill('Tema persistente');
    await page.locator('[aria-label="Adicionar imagem à seção 1"]').setInputFiles({
      name: 'evidencia.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPgUbIAAACkAGfNzc0uAAAAAElFTkSuQmCC', 'base64'),
    });

    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByLabel('Legenda da imagem evidencia.png').fill('Imagem de comprovação');
    await expect(page.getByTestId('estado-salvamento')).toContainText('Rascunho salvo neste navegador');
    await page.getByRole('button', { name: 'Voltar para o início' }).click();
    await expect(page.getByTestId('lista-rascunhos')).toContainText('Rascunho com imagem');
    await page.getByRole('button', { name: 'Retomar rascunho' }).click();

    await expect(page.getByLabel('Legenda da imagem evidencia.png')).toHaveValue('Imagem de comprovação');
    await expect(page.locator('[aria-label="Substituir imagem evidencia.png"]')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Legenda da imagem evidencia.png')).toHaveValue('Imagem de comprovação');
    await page.locator('[aria-label="Adicionar imagem à seção 1"]').setInputFiles({
      name: 'arquivo.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    });
    await expect(page.getByRole('alert')).toContainText('Use somente arquivos JPEG, PNG ou WebP.');
    await page.locator('[aria-label="Adicionar imagem à seção 1"]').setInputFiles({
      name: 'imagem-grande.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByRole('alert')).toContainText('Cada imagem deve ter até 5 MiB.');
    await page.locator('[aria-label="Substituir imagem evidencia.png"]').setInputFiles({
      name: 'evidencia-revisada.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPgUbIAAACkAGfNzc0uAAAAAElFTkSuQmCC', 'base64'),
    });
    await expect(page.getByLabel('Legenda da imagem evidencia-revisada.png')).toHaveValue('Imagem de comprovação');
    await page.getByRole('button', { name: 'Remover imagem' }).click();
    await expect(page.getByLabel('Legenda da imagem evidencia-revisada.png')).toHaveCount(0);
    await expect(page.getByTestId('estado-salvamento')).toContainText('Rascunho salvo neste navegador');
    await page.getByRole('button', { name: 'Voltar para o início' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Remover rascunho' }).click();
    await expect(page.getByText('Nenhum rascunho salvo ainda.')).toBeVisible();
  });

  test('mantém o conteúdo em memória e sinaliza quando IndexedDB não está disponível', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }));
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('O armazenamento local está indisponível');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabel('Título do relatório').fill('Conteúdo preservado');
    await expect(page.getByTestId('estado-salvamento')).toContainText('O armazenamento local está indisponível');
    await expect(page.getByLabel('Título do relatório')).toHaveValue('Conteúdo preservado');
  });

  test('expõe falha ao carregar modelos e permite tentar novamente', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/v1/templates', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await fulfillJson(route, 503, { error: { code: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível.' } });
        return;
      }
      await fulfillJson(route, 200, { templates: publishedTemplates });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();

    const dialog = page.getByRole('dialog', { name: 'Iniciar novo relatório' });
    await expect(dialog.getByRole('alert')).toContainText('Serviço temporariamente indisponível.');
    await dialog.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(dialog.getByLabel('Modelo de PDF')).toHaveValue('system-default');
    await expect(dialog.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Geração e regeneração com IA', () => {
  test('gera um rascunho validado, preserva escolhas e abre o editor comum', async ({ page }) => {
    let generationInput;
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: publishedTemplates }));
    await page.route('**/api/v1/ai/reports', async (route) => {
      generationInput = route.request().postDataJSON();
      await fulfillJson(route, 200, {
        schemaVersion: 1,
        id: '98cb61d8-6e77-4bdb-8fe8-6028279bcd45',
        title: 'Relatório de energia solar',
        topic: generationInput.topic,
        brief: generationInput.brief,
        sections: [{
          id: '5dc4ec45-fcc6-42fb-8b5a-1178575ab935',
          title: 'Visão geral',
          body: 'Conteúdo inicial gerado.',
          importantDetails: ['Revisar as fontes.'],
          images: [],
        }],
        selectedFormats: ['pdf'],
        pdfTemplateId: 'system-default',
        updatedAt: new Date().toISOString(),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radio', { name: /Começar com IA/ }).check();
    await dialog.getByRole('checkbox', { name: 'DOCX' }).check();
    await dialog.getByLabel('Modelo de PDF').selectOption('modelo-publicado');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByTestId('formulario-geracao-ia')).toBeVisible();
    await page.getByLabel('Tema para geração').fill('Energia solar no Brasil');
    await page.getByLabel('Objetivo da geração').fill('Apresentar oportunidades e desafios.');
    await page.getByLabel('Público-alvo da geração').fill('Gestores públicos');
    await page.getByLabel('Extensão desejada para geração').selectOption('short');
    await page.getByLabel('Tom da geração').fill('Informativo');
    await page.getByLabel('Referências da geração').fill('https://example.test/energia');
    await page.getByRole('button', { name: 'Gerar relatório' }).click();

    await expect(page).toHaveURL(/\/relatorios\/novo\/98cb61d8-6e77-4bdb-8fe8-6028279bcd45$/);
    await expect(page.getByTestId('editor-relatorio')).toBeVisible();
    await expect(page.getByLabel('Título do relatório')).toHaveValue('Relatório de energia solar');
    await expect(page.getByLabel('Tema do relatório')).toHaveValue('Energia solar no Brasil');
    await expect(page.getByLabel('Formato PDF')).toBeChecked();
    await expect(page.getByLabel('Formato DOCX')).toBeChecked();
    await expect(page.getByTestId('modelo-pdf')).toContainText('modelo-publicado');
    await expect(page.getByLabel('Conteúdo da seção 1')).toHaveValue('Conteúdo inicial gerado.');
    await expect(page.getByTestId('estado-salvamento')).toContainText('Rascunho salvo neste navegador');
    expect(generationInput).toEqual({
      topic: 'Energia solar no Brasil',
      brief: {
        objective: 'Apresentar oportunidades e desafios.',
        audience: 'Gestores públicos',
        desiredLength: 'short',
        tone: 'Informativo',
        references: ['https://example.test/energia'],
      },
    });
  });

  test('cancela a geração em andamento sem limpar os parâmetros', async ({ page }) => {
    let requestStarted;
    let finishRequest;
    const requestStartedPromise = new Promise((resolve) => { requestStarted = resolve; });
    const requestGate = new Promise((resolve) => { finishRequest = resolve; });
    await page.route('**/api/v1/ai/reports', async (route) => {
      requestStarted();
      await requestGate;
      try {
        await fulfillJson(route, 200, {});
      } catch {
        // The browser may have already aborted the request.
      }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('radio', { name: /Começar com IA/ }).check();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Tema para geração').fill('Tema que deve permanecer');
    await page.getByRole('button', { name: 'Gerar relatório' }).click();
    await requestStartedPromise;
    await page.getByRole('button', { name: 'Cancelar geração' }).click();
    await expect(page.getByRole('status')).toContainText('Geração cancelada.');
    await expect(page.getByLabel('Tema para geração')).toHaveValue('Tema que deve permanecer');
    finishRequest();
  });

  test('mostra falha de geração, mantém os parâmetros e permite retry', async ({ page }) => {
    let attempts = 0;
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: publishedTemplates }));
    await page.route('**/api/v1/ai/reports', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await fulfillJson(route, 503, {
          error: { code: 'AI_UNAVAILABLE', message: 'Serviço de IA temporariamente indisponível.', retryable: true },
        });
        return;
      }
      const input = route.request().postDataJSON();
      if (attempts === 2) {
        await fulfillJson(route, 200, {
          schemaVersion: 1,
          id: 'f9f1aef6-d6d7-46e8-92a1-36bea15df120',
          title: 'Relatório incompleto',
          topic: input.topic,
          brief: input.brief,
          sections: [],
          selectedFormats: ['pdf'],
          pdfTemplateId: null,
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      await fulfillJson(route, 200, {
        schemaVersion: 1,
        id: 'f9f1aef6-d6d7-46e8-92a1-36bea15df120',
        title: 'Relatório resiliente',
        topic: input.topic,
        brief: input.brief,
        sections: [{
          id: '0cac9ddc-7763-4896-ae15-fb418d7ea1c4',
          title: 'Visão geral',
          body: 'Rascunho após retry.',
          importantDetails: [],
          images: [],
        }],
        selectedFormats: ['pdf'],
        pdfTemplateId: 'system-default',
        updatedAt: new Date().toISOString(),
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('radio', { name: /Começar com IA/ }).check();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabel('Tema para geração').fill('Relatório resiliente');
    await page.getByRole('button', { name: 'Gerar relatório' }).click();
    await expect(page.getByRole('alert')).toContainText('Serviço de IA temporariamente indisponível.');
    await expect(page.getByLabel('Tema para geração')).toHaveValue('Relatório resiliente');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('alert')).toContainText('fora do contrato esperado');
    await expect(page.getByLabel('Tema para geração')).toHaveValue('Relatório resiliente');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByTestId('editor-relatorio')).toBeVisible();
    expect(attempts).toBe(3);
  });

  test('regenera uma seção sem tocar nas demais ou remover imagens e descarta respostas obsoletas', async ({ page }) => {
    let requestCount = 0;
    let releaseFirstResponse;
    let firstRequestArrived;
    const firstRequest = new Promise((resolve) => { firstRequestArrived = resolve; });
    const firstResponseGate = new Promise((resolve) => { releaseFirstResponse = resolve; });
    await page.route('**/api/v1/templates', (route) => fulfillJson(route, 200, { templates: [] }));
    await page.route('**/api/v1/ai/sections/regenerate', async (route) => {
      requestCount += 1;
      const input = route.request().postDataJSON();
      expect(input.targetSection).not.toHaveProperty('images');
      if (requestCount === 1) {
        firstRequestArrived();
        await firstResponseGate;
      }
      await fulfillJson(route, 200, {
        sectionId: input.targetSection.id,
        clientRevision: input.targetSection.clientRevision,
        proposal: {
          title: 'Título revisado pela IA',
          body: 'Texto atualizado pela proposta.',
          importantDetails: ['Novo dado importante.'],
        },
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Título do relatório').fill('Rascunho com regeneração');
    await page.getByLabel('Tema do relatório').fill('Tema para a regeneração');
    await page.getByLabel('Título da seção 1').fill('Seção de contexto');
    await page.getByLabel('Conteúdo da seção 1').fill('Texto que será editado durante a chamada.');
    await page.locator('[aria-label="Adicionar imagem à seção 1"]').setInputFiles({
      name: 'anexo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPgUbIAAACkAGfNzc0uAAAAAElFTkSuQmCC', 'base64'),
    });
    await page.getByLabel('Legenda da imagem anexo.png').fill('Legenda que deve permanecer');
    await page.getByRole('button', { name: 'Adicionar seção' }).click();
    await page.getByLabel('Título da seção 2').fill('Outra seção');
    await page.getByLabel('Conteúdo da seção 2').fill('Conteúdo independente.');

    await page.getByRole('button', { name: 'Regenerar seção com IA' }).first().click();
    await firstRequest;
    await page.getByLabel('Conteúdo da seção 1').fill('Edição manual mais recente.');
    releaseFirstResponse();
    await expect(page.getByRole('alert')).toContainText('A seção mudou durante a geração');
    await expect(page.getByLabel('Conteúdo da seção 1')).toHaveValue('Edição manual mais recente.');

    await page.getByRole('button', { name: 'Regenerar seção com IA' }).first().click();
    await expect(page.getByLabel('Proposta para seção 1')).toBeVisible();
    await page.getByRole('button', { name: 'Aplicar proposta' }).click();
    await expect(page.getByLabel('Título da seção 1')).toHaveValue('Título revisado pela IA');
    await expect(page.getByLabel('Conteúdo da seção 1')).toHaveValue('Texto atualizado pela proposta.');
    await expect(page.getByLabel('Legenda da imagem anexo.png')).toHaveValue('Legenda que deve permanecer');
    await expect(page.getByLabel('Título da seção 2')).toHaveValue('Outra seção');
    await expect(page.getByLabel('Conteúdo da seção 2')).toHaveValue('Conteúdo independente.');
    expect(requestCount).toBe(2);
  });
});

test.describe('Acesso administrativo', () => {
  test('cria, edita, pré-visualiza, publica, despublica e remove modelos PDF', async ({ page }) => {
    const templateId = 'c332c4b2-80f3-4ad0-9131-2bf9055acc01';
    const templates = [];
    await page.route('**/api/v1/admin/session', async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillJson(route, 200, { authenticated: true, expiresAt: new Date().toISOString() });
        return;
      }
      await fulfillJson(route, 200, { authenticated: false });
    });
    await page.route('**/api/v1/admin/templates**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      if (path === '/api/v1/admin/templates' && method === 'GET') {
        await fulfillJson(route, 200, { templates });
        return;
      }
      if (path === '/api/v1/admin/templates' && method === 'POST') {
        const input = request.postDataJSON();
        const template = { ...input, id: templateId, status: 'draft', version: 1 };
        templates.push(template);
        await fulfillJson(route, 201, template);
        return;
      }
      if (path.endsWith('/preview') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: Buffer.from('%PDF-1.4 preview'),
        });
        return;
      }
      if (path.endsWith('/publish') && method === 'POST') {
        templates[0].status = 'published';
        await fulfillJson(route, 200, templates[0]);
        return;
      }
      if (path.endsWith('/unpublish') && method === 'POST') {
        templates[0].status = 'draft';
        await fulfillJson(route, 200, templates[0]);
        return;
      }
      if (method === 'PUT') {
        Object.assign(templates[0], request.postDataJSON(), { version: 2 });
        await fulfillJson(route, 200, templates[0]);
        return;
      }
      if (method === 'DELETE') {
        templates.splice(0, 1);
        await fulfillJson(route, 200, { deleted: true, id: templateId });
        return;
      }
      await fulfillJson(route, 404, { error: { code: 'NOT_FOUND', message: 'Rota de teste não encontrada.' } });
    });
    await page.route('**/api/v1/templates', async (route) => {
      await fulfillJson(route, 200, {
        templates: [
          ...publishedTemplates.filter((template) => template.id === 'system-default'),
          ...templates.filter((template) => template.status === 'published'),
        ],
      });
    });

    await page.goto('/');
    await page.getByRole('link', { name: 'Acesso administrativo' }).click();
    await page.getByLabel('Usuário').fill('admin');
    await page.getByLabel('Senha').fill('senha-temporaria');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByTestId('gerenciador-modelos')).toContainText('Nenhum modelo cadastrado.');

    await page.getByLabel('Nome do modelo').fill('Modelo de demonstração');
    await page.getByLabel('Descrição do modelo').fill('Descrição inicial.');
    await page.getByRole('button', { name: 'Salvar rascunho' }).click();
    const templateCard = page.getByTestId(`modelo-admin-${templateId}`);
    await expect(templateCard).toContainText('Modelo de demonstração');
    await templateCard.getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Nome do modelo').fill('Modelo revisado');
    await page.getByRole('button', { name: 'Salvar rascunho' }).click();
    await expect(templateCard).toContainText('Modelo revisado');
    await page.getByRole('button', { name: 'Salvar e pré-visualizar PDF' }).click();
    await expect(page.getByTestId('previa-modelo-pdf')).toBeVisible();
    const pdfViewer = page.getByTitle('Visualizador PDF do modelo');
    await expect(pdfViewer).toBeVisible();
    await expect(pdfViewer).not.toHaveAttribute('sandbox');
    await expect(pdfViewer).toHaveAttribute('src', /^blob:/);
    await page.getByRole('button', { name: 'Fechar prévia' }).click();

    await templateCard.getByRole('button', { name: 'Publicar' }).click();
    await expect(templateCard).toContainText('Publicado');
    await expect(templateCard.getByRole('button', { name: 'Editar' })).toHaveCount(0);

    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await expect(page.getByLabel('Modelo de PDF')).toContainText('Modelo revisado');
    await page.keyboard.press('Escape');

    await page.goto('/admin');
    await expect(page.getByTestId(`modelo-admin-${templateId}`)).toBeVisible();
    const updatedCard = page.getByTestId(`modelo-admin-${templateId}`);
    await updatedCard.getByRole('button', { name: 'Despublicar' }).click();
    await expect(updatedCard).toContainText('Inativo / rascunho');
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar novo relatório' }).click();
    await expect(page.getByLabel('Modelo de PDF')).not.toContainText('Modelo revisado');
    await page.keyboard.press('Escape');

    await page.goto('/admin');
    const inactiveCard = page.getByTestId(`modelo-admin-${templateId}`);
    page.once('dialog', (dialog) => dialog.accept());
    await inactiveCard.getByRole('button', { name: 'Excluir rascunho' }).click();
    await expect(page.getByTestId(`modelo-admin-${templateId}`)).toHaveCount(0);
  });

  test('envia credenciais à API, abre a área e encerra a sessão', async ({ page }) => {
    await page.route('**/api/v1/admin/session', async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillJson(route, 200, { authenticated: true, expiresAt: new Date().toISOString() });
        return;
      }
      await fulfillJson(route, 200, { authenticated: false });
    });
    await page.route('**/api/v1/admin/templates', (route) => fulfillJson(route, 200, {
      templates: [{
        id: 'modelo-pdf-1',
        name: 'Modelo de teste',
        status: 'published',
      }],
    }));

    await page.goto('/');
    await page.getByRole('link', { name: 'Acesso administrativo' }).click();
    await expect(page).toHaveURL('/admin/login');
    await page.getByLabel('Usuário').fill('admin');
    await page.getByLabel('Senha').fill('senha-temporaria');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/admin');
    await expect(page.getByTestId('pagina-admin')).toContainText('Modelo de teste');
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL('/admin/login');
  });

  test('redireciona à tela de login quando a sessão protegida não existe', async ({ page }) => {
    await page.route('**/api/v1/admin/templates', (route) => fulfillJson(route, 401, {
      error: { code: 'UNAUTHENTICATED', message: 'Sessão administrativa inválida.' },
    }));
    await page.goto('/admin');

    await expect(page).toHaveURL('/admin/login');
    await expect(page.getByTestId('formulario-login-admin')).toBeVisible();
  });
});
