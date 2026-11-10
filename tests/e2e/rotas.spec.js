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
    await expect(page.getByTestId('pagina-novo-relatorio')).toBeVisible();
    await expect(page.getByText('Começar com IA')).toBeVisible();
    await expect(page.getByTestId('formatos-selecionados')).toHaveText('PDF, DOCX, Markdown');
    await expect(page.getByTestId('modelo-selecionado')).toHaveText('Modelo publicado');
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

test.describe('Acesso administrativo', () => {
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
