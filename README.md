# Gerador de Relatórios

Aplicação web planejada para criar relatórios manualmente ou com auxílio de IA, revisar conteúdo por seções e exportar PDF, DOCX e Markdown. Visitantes poderão criar relatórios sem conta; somente o administrador terá acesso autenticado para gerenciar modelos visuais de PDF.

> **Estado atual:** o repositório contém a casca SPA React/Vite. Backend, autenticação administrativa, persistência de produto, integração real de IA e exportadores ainda não foram implementados. A arquitetura registrada para o protótipo não representa uma implantação de produção aprovada.

## Stack atual da SPA

- **Build:** Vite
- **Linguagem/UI:** JavaScript ESM, React 18
- **Rotas:** `react-router-dom`
- **Estilos:** styled-components; sem CSS avulso em `src/`, styled-components terminados em `Stl`
- **Testes E2E:** Playwright
- **Qualidade:** ESLint

## Arquitetura planejada para o protótipo

- API Node.js 24 LTS + Fastify 5, em processo persistente.
- SQLite em volume durável para dados administrativos, em protótipo de instância única.
- IndexedDB para rascunhos anônimos e imagens locais; relatórios não são persistidos no servidor por padrão.
- Adaptador fake de IA para desenvolvimento/testes; OpenAI Responses API é candidato para piloto, ainda sujeito a aprovação, conta, orçamento e revisão de termos.
- Playwright + Chromium para PDF; biblioteca `docx` para DOCX; serializador próprio para Markdown.
- Templates PDF HTML/CSS restritos, sem JavaScript, com modelo padrão do sistema.

**Atenção:** produção requer decidir plataforma de hospedagem, segredo e orçamento de IA, retenção, rate limit, persistência/backup e entrega Markdown com imagens. Não há chaves no cliente e nenhuma integração real está configurada.

As decisões, contratos, limites iniciais, comparações e pendências estão em [architecture_decisions.md](./00-anything/02%20-%20gerador%20de%20relatorios%202026-11-09/architecture_decisions.md). O escopo e os fluxos de produto estão em [design_draft.md](./00-anything/02%20-%20gerador%20de%20relatorios%202026-11-09/design_draft.md). Para regras de arquitetura, segurança e desenvolvimento, consulte [AGENTS.md](./AGENTS.md).

## Comandos disponíveis

```bash
npm install
npm run dev
npm run build
npm run lint
npx playwright test
```

Ainda não há comando de execução da API do protótipo, pois sua implementação ocorrerá em etapas futuras.
