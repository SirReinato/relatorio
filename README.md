# Relatórios — Single Page Application (SPA)

Aplicação web moderna, reativa e componentizada desenvolvida em React, Vite e styled-components, com arquitetura desacoplada, suíte de testes funcionais em Playwright e governança estrita de desenvolvimento com IAs baseada em `AGENTS.md`.

## 🛠️ Stack Técnica
- **Build Tool:** Vite
- **Linguagem:** JavaScript (ESM) / React 18
- **Roteamento:** react-router-dom
- **Estilização:** styled-components (Zero-CSS em `src/`, sufixo `Stl` obrigatório)
- **Testes E2E:** Playwright
- **Qualidade & Linting:** ESLint

## 🚀 Comandos Principais
```bash
# Instalar dependências
npm install

# Iniciar servidor local de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Executar linter
npm run lint

# Executar testes funcionais E2E com Playwright
npx playwright test

# Modo interativo do Playwright
npx playwright test --ui
```

## 📋 Governança e Regras do Projeto
Para diretrizes completas de arquitetura, convenções de código, árvore de arquivos e fluxo de desenvolvimento, consulte [AGENTS.md](./AGENTS.md).
