# Gerador de Relatórios

Aplicação web planejada para criar relatórios manualmente ou com auxílio de IA, revisar conteúdo por seções e exportar PDF, DOCX e Markdown. Visitantes poderão criar relatórios sem conta; somente o administrador terá acesso autenticado para gerenciar modelos visuais de PDF.

> **Estado atual:** SPA React/Vite e API de protótipo implementadas. A API oferece geração fake por padrão, sessão administrativa, modelos PDF e exportação; IA real é opcional e exige configuração server-side. Hospedagem e ativação pública ainda não foram aprovadas.

## Stack atual da SPA

- **Build:** Vite
- **Linguagem/UI:** JavaScript ESM, React 18
- **Rotas:** `react-router-dom`
- **Estilos:** styled-components; sem CSS avulso em `src/`, styled-components terminados em `Stl`
- **Testes E2E:** Playwright
- **Qualidade:** ESLint

## API do protótipo

- Node.js 24 LTS + Fastify 5 e SQLite (`node:sqlite`); SQLite é para uma instância com volume durável.
- Sessão admin opaca com cookie HttpOnly; senha provisionada inicialmente por variáveis server-side.
- Adaptador fake de IA por padrão. OpenAI Responses API (`AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL`) e Gemini API (`AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`) são opcionais e executados exclusivamente no servidor.
- Exportação PDF com Playwright/Chromium, DOCX com `docx` e Markdown próprio; os relatórios não são persistidos no servidor.
- Templates PDF HTML/CSS usam allowlist e renderização sem JavaScript ou acesso à rede.
- Rate limit para IA e exportação, validação por schema e limites em arquivos/imagens.
- A landing abre um modal acessível para modalidade, formatos e modelos publicados. O início do relatório resume as escolhas sem executar geração ou exportação.
- `/admin/login` autentica contra a API e `/admin` verifica a sessão; a gestão de modelos será ampliada na Etapa 6.

### Executar localmente

1. Copie `.env.example` para `.env` e defina uma senha forte em `ADMIN_INITIAL_PASSWORD`.
2. Inicie a API em um terminal: `npm run api:dev`.
3. Inicie a SPA em outro terminal: `npm run dev`. O Vite encaminha `/api` para a API local.

O Node deve ser v24 ou superior. A senha inicial é usada somente para criar a conta admin no primeiro arranque; remova-a do `.env` após o provisionamento. Para usar IA, defina `AI_PROVIDER=openai` ou `AI_PROVIDER=gemini` e configure a chave/modelo correspondentes; chaves nunca devem usar o prefixo `VITE_`. Para gerar PDFs, instale o Chromium compatível com Playwright usando `npx playwright install chromium`, se ainda não estiver instalado.

### Endpoints implementados

| Operação | Endpoint |
|---|---|
| Saúde da API | `GET /health` |
| Gerar relatório / regenerar seção | `POST /api/v1/ai/reports`, `POST /api/v1/ai/sections/regenerate` |
| Listar modelos publicados | `GET /api/v1/templates` |
| Login/logout/rotação de senha admin | `POST /api/v1/admin/session`, `DELETE /api/v1/admin/session`, `PUT /api/v1/admin/password` |
| CRUD/publicação/preview de modelos | `/api/v1/admin/templates` |
| Exportar PDF, DOCX ou Markdown | `POST /api/v1/exports/{pdf,docx,markdown}` |

Rotas da SPA: `/` (landing), `/relatorios/novo` (resumo do início do fluxo), `/admin/login` e `/admin` (área administrativa inicial). Edição, geração e CRUD completo de modelos seguem nas etapas posteriores.

Teste de API: `npm run test:api`. Os dados SQLite locais ficam em `data/`, ignorada pelo Git.

**Atenção:** produção requer decidir hospedagem, orçamento/termos do provedor de IA, política de retenção, limites de concorrência/memória, backups e entrega Markdown com imagens. Não publique a API antes dessa revisão.

As decisões, contratos, limites iniciais, comparações e pendências estão em [architecture_decisions.md](./00-anything/02%20-%20gerador%20de%20relatorios%202026-11-09/architecture_decisions.md). O escopo e os fluxos de produto estão em [design_draft.md](./00-anything/02%20-%20gerador%20de%20relatorios%202026-11-09/design_draft.md). Para regras de arquitetura, segurança e desenvolvimento, consulte [AGENTS.md](./AGENTS.md).

## Comandos disponíveis

```bash
npm install
npm run api:dev
npm run dev
npm run build
npm run lint
npm run test:api
npx playwright test
```
