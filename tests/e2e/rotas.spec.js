import { test, expect } from '@playwright/test';

test.describe('Navegação e Casca Mestre', () => {
  test('deve renderizar o layout geral com Header fixo, conteúdo da Home e Footer', async ({ page }) => {
    await page.goto('/');

    // Valida container geral do layout mestre
    const layoutGeral = page.getByTestId('layout-geral');
    await expect(layoutGeral).toBeVisible();

    // Valida Header fixo e Logo
    const header = page.getByTestId('header-fixo');
    await expect(header).toBeVisible();
    await expect(page.getByTestId('header-logo')).toContainText('Relatórios');

    // Valida renderização da rota index (Home) dentro do Outlet
    const paginaHome = page.getByTestId('pagina-home');
    await expect(paginaHome).toBeVisible();
    await expect(page.getByTestId('titulo-home')).toHaveText('Página Inicial');
    await expect(page.getByTestId('botao-acao-inicial')).toBeVisible();

    // Valida Footer fixo
    const footer = page.getByTestId('footer-fixo');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Sistema de Relatórios');
  });
});
