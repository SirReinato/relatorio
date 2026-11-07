# Plano de Execução — Setup Inicial do Projeto (Casca Mestra Genérica)

**Data:** 2026-11-07  
**Responsável:** Antigravity AI  
**Repositório:** `https://github.com/SirReinato/relatorio.git`  
**Branch:** `main` (solicitado pelo usuário para inicialização)

---

## 1. Atividade do Momento (Etapa Atual)
- **Título**: `feat(setup): inicializacao da casca mestra generica, rotas, styled-components e suite playwright`
- **Objetivo Funcional**: Configurar a infraestrutura inicial do projeto React com Vite, styled-components com tema e reset global (Zero-CSS em `src/`), roteamento mestre (`<MainGeral />` com Header e Footer fixos e `<Outlet />`), rota index neutra (`<Home />`), arquivos ponteiros multi-IA, Playwright configurado e validado, e regras de governança.
- **Passo a Passo Técnico**:
  1. Criar `.gitignore`, `.env.example`, `package.json`, `vite.config.js`, `index.html`.
  2. Criar arquivos ponteiro (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) e `README.md`.
  3. Instalar dependências (`react`, `react-dom`, `react-router-dom`, `styled-components`, `@vitejs/plugin-react`, `vite`, `eslint`, `@playwright/test`).
  4. Implementar `src/themes/theme.jsx` com os 3 botões padrão, tipografia e gradientes.
  5. Implementar `src/themes/GlobalStyled.jsx` com reset global via `createGlobalStyle`.
  6. Implementar `src/main.jsx` e `src/App.jsx` sem qualquer import de CSS.
  7. Implementar `src/routes/AppRoutes.jsx`, `src/pages/Outlet/index.jsx` e `src/pages/Home/index.jsx` com sufixo `Stl` obrigatório.
  8. Configurar pastas de arquitetura (`components/`, `hooks/`, `context/`, `services/`, `utils/`).
  9. Configurar `playwright.config.js` e criar teste `tests/e2e/rotas.spec.js`.
  10. Executar validações (`npm run lint`, `npx playwright test`, `npm audit`).
  11. Atualizar tabela de ambiente da Seção 10 e histórico em `AGENTS.md`.
  12. Commit e push para o repositório remoto na branch `main`.

---

## 2. Etapas Seguintes (Roteiro Futuro)
- **Fase 2 (Próxima)**: Coleta e detalhamento dos requisitos de negócio com o usuário.
  - Objetivo: Definir os objetivos funcionais, modelo de dados, integrações e fluxos de tela do produto.
- **Fase 3**: Implementação dos modelos de dados, contextos e serviços da primeira funcionalidade.
- **Fase 4**: Construção dos componentes visuais específicos e rotas no design system.
- **Fase 5**: Criação dos testes funcionais E2E dedicados à funcionalidade e auditoria de segurança.
