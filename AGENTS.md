# AGENTS.md — Modelo Base Universal para Projetos

> **🤖 LEIA ISTO PRIMEIRO.** Este arquivo é a fonte da verdade e o ponto de entrada obrigatório para qualquer modelo de IA ou agente autônomo (Cursor, Claude, Gemini, Copilot, Codex, ChatGPT etc.) que for analisar, criar ou modificar código neste projeto.
> Ele documenta a arquitetura, convenções, stack técnica, estrutura de pastas, regras operacionais, estratégia de testes, segurança e fluxo de tarefas. Leia-o **integralmente** antes de inspecionar ou alterar qualquer arquivo.

---

## ⚠️ REGRAS OBRIGATÓRIAS (ARQUIVO, GIT, GESTÃO & ESTRUTURAÇÃO)

### 1. Toda alteração estrutural DEVE atualizar este `AGENTS.md` no mesmo commit/tarefa

Considera-se "alteração estrutural" qualquer uma das seguintes ações (lista não exaustiva):

* Criar, renomear, mover ou remover arquivos e pastas em `src/`, `public/`, `api/`, `tests/` ou na raiz.
* Criar, modificar ou remover **páginas, rotas, componentes, contexts, hooks, services, utils ou testes funcionais**.
* Adicionar, atualizar (major) ou remover **dependências** ou scripts no `package.json`.
* Adicionar ou alterar **variáveis de ambiente** (e espelhar no `.env.example`).
* Implementar ou alterar **regras de negócio**, modelos de dados, schemas de validação ou integrações com APIs/bancos.
* Adotar novas convenções de arquitetura, padrões de estilo, bibliotecas, regras de segurança ou fluxos de deploy/CI/CD.

**Como atualizar este arquivo após uma alteração estrutural:**
1. Atualize a seção correspondente neste documento (árvore de pastas, tabela de rotas, stack, variáveis, etc.).
2. Registre uma nova entrada na tabela de [Histórico de alterações deste arquivo](#-histórico-de-alterações-deste-arquivo) contendo data (YYYY-MM-DD) e resumo conciso do que mudou.
3. Se a alteração afetar a experiência direta do usuário ou a configuração do projeto, atualize também o `README.md`.

> ⛔ **Atenção:** Se uma IA finalizar uma tarefa estrutural sem atualizar este arquivo e seu histórico, **a tarefa é considerada incompleta e inválida**.

---

### 2. Fluxo obrigatório de Git: Nova Feature/Fix Branch + Push ao GitHub

Para garantir rastreabilidade, isolamento de escopo e facilidade em code reviews e auditorias:

* **NUNCA desenvolva ou commite diretamente na branch `main` (ou `master`)**.
* Toda nova implementação, melhoria, refatoração ou correção DEVE ser desenvolvida em uma branch dedicada:
  ```bash
  git checkout -b feature/nome-da-funcionalidade   # Para novas funcionalidades
  git checkout -b fix/nome-da-correcao            # Para correção de bugs
  git checkout -b refactor/nome-do-ajuste         # Para refatorações estruturais
  ```
* **Commits atômicos, granulares e semânticos (Conventional Commits)**:
  * Nunca crie commits genéricos ou vagos (como `"wip"`, `"update"`, `"ajustes"`, `"fix"`).
  * Use o padrão semântico: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`, `sec:`.
  * Descreva com clareza o escopo da alteração no título e, sempre que aplicável, inclua no corpo o *o quê* e o *porquê* da mudança.
* **Push obrigatório ao repositório remoto ao concluir**:
  ```bash
  git push -u origin <nome-da-branch>
  ```
  Isso viabiliza a criação imediata de Pull Requests e acompanhamento de versão.

---

### 3. Gestão e Decomposição de Demandas em Issues (Linear / MCP & Modo Copiável)

Sempre que uma nova atualização, funcionalidade ou refatoração for solicitada, o agente DEVE organizar o plano de execução em etapas antes ou durante o desenvolvimento:

1. **Decomposição em Etapas Lógicas e Funcionais**:
   * Divida a solicitação em issues granulares, sequenciais e independentes (ex: *Fase 1: Configuração do Serviço/API*, *Fase 2: Criação do Hook/Estado*, *Fase 3: Interface e Componentes*, *Fase 4: Rota e Validação Funcional E2E*).
   * Cada issue deve ser autossuficiente e conter:
     - **Título claro e semântico** (ex: `feat(auth): implementar useAuth e persistência em localStorage`).
     - **Objetivo funcional**: o que essa etapa entrega e por que é necessária.
     - **Passo a passo técnico**: arquivos exatos a criar/alterar e bibliotecas envolvidas.
     - **Critérios de aceitação (DoD)**: como validar que a etapa foi concluída com sucesso.

2. **Criação de Issues com Linear MCP Ativo**:
   * Se o ambiente possuir a integração do **Linear via MCP** habilitada, o agente deve **criar e registrar automaticamente essas issues** no projeto/time correspondente do Linear, associando labels, prioridades e estimativas adequadas.

3. **Formato em .md para Agentes Sem Linear MCP**:
   * Em todas as respostas ou documentações de planejamento, forneça também um bloco claro com o conteúdo exato da **atividade do momento** e das etapas seguintes.
   * Esse bloco deve ser estruturado de forma que o desenvolvedor possa simplesmente **copiar e colar o texto em outro agente ou modelo de IA que não tenha o Linear MCP ativo**, e esse agente entenda perfeitamente o contexto, as restrições e o código que deve produzir sem precisar de instruções adicionais.

4. **Replanejamento e Adaptação Dinâmica de Planos Futuros**:
   * Se durante o desenvolvimento de uma etapa surgirem novos requisitos, bloqueios técnicos ou o usuário alterar decisões arquiteturais, o agente DEVE **atualizar imediatamente as issues e etapas futuras** (seja atualizando os cards no Linear via MCP, seja reescrevendo o roteiro no plano).
   * Nunca prossiga com um plano defasado; o backlog e as próximas etapas devem sempre refletir a realidade mais recente.

---

### 4. Proibição de Arquivos Markdown, Relatórios EGM e Testes na Raiz (`00-anything/`)

* **PROIBIDO** gerar, salvar ou descarregar arquivos de rascunho, drafts, specs temporárias, testes avulsos, relatórios de auditoria/crítica/síntese de agentes EGM (`critic_report.md`, `goldfish_review_report.md`, `implementation_readiness_report.md`, `intermediate_zoom_out_report.md`, `concepts_brief.md`, `design_draft.md` etc.) ou anotações na raiz do repositório.
* A raiz do repositório deve conter **exclusivamente** os arquivos de governança e configuração estruturais (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `package.json`, `vite.config.js` e dotfiles essenciais).
* **Diretório Obrigatório (`00-anything/`)**: Todos os arquivos de ideação, design, reviews de EGM, relatórios de subagentes, artefatos de testes ou documentações exploratórias DEVEM ser alocados dentro do diretório `00-anything/` na raiz do projeto.
* **Padrão Obrigatório de Organização por Iniciativa**:
  Sempre que iniciar uma sessão de EGM, brainstorm, refatoração estrutural, suíte de testes ou planejamento de uma nova feature/implementação, o agente DEVE criar uma pasta principal dentro de `00-anything/` para a iniciativa, e dentro dela agrupar todos os artefatos correlatos dessa sequência, em vez de abrir várias pastas redundantes para cada etapa isolada.
  O formato primário é:
  ```text
  00-anything/{sequencial_2_digitos} - {nome-da-iniciativa} {data-yyyy-mm-dd}/
  ```
  * Exemplo 1: `00-anything/01 - arquitetura multi-workspace 2026-11-04/`
  * Exemplo 2: `00-anything/02 - gerador de relatorios 2026-11-09/`
  * Exemplo 3: `00-anything/03 - onboarding de clientes 2026-11-10/`

  Quando o trabalho de uma mesma iniciativa evoluir em brainstorm, draft, review, resolve e arquitetura, os arquivos devem permanecer dentro da mesma pasta principal, organizados por subnomes ou arquivos principais, por exemplo:
  ```text
  00-anything/02 - gerador de relatorios 2026-11-09/
  ├── plan.md
  ├── design_draft.md
  ├── egm_review_report.md
  ├── egm_resolve_report.md
  ├── architecture_decisions.md
  └── screenshots/
  ```
  ou, se necessário, com subpastas internas como `01-brainstorm/`, `02-draft/`, `03-review/`, `04-resolve/`, `05-arquitetura/`, sempre mantendo a iniciativa como pai único.
* **Isolamento Total do Escopo**: Todos os arquivos que essa estruturação, teste ou execução produzir devem ser salvos exclusivamente dentro da pasta principal da iniciativa correspondente. É terminantemente proibido espalhar artefatos da mesma demanda em pastas separadas quando pertencem ao mesmo fluxo de trabalho.
* **Numeração Sequencial Contínua**: Verifique as pastas já existentes em `00-anything/` e incremente o numeral sequencial de 2 dígitos (`01`, `02`, `03`...) em ordem cronológica crescente. O número identifica a iniciativa, não cada subetapa isolada.

---

### 5. Regra de Inicialização Estrita: Criação Genérica e Literal (Anti-Alucinação / Zero Pré-Concepção)

Ao iniciar um novo projeto a partir deste `AGENTS.md`, o agente DEVE seguir estritamente o princípio de **Construção Literal e Genérica**:

* **PROIBIÇÃO DE INFERIR NICHOS OU MODELOS DE NEGÓCIO**: O agente **NUNCA** deve tentar adivinhar a finalidade do projeto com base no nome da pasta central, do repositório ou de palpites (por exemplo: ver uma pasta chamada `newsHub` e deduzir por conta própria que se trata de um portal de notícias, criando páginas, componentes ou temas pré-concebidos).
* **ESTRUTURA INICIAL ESTRITAMENTE GENÉRICA**: Ao criar as pastas e arquivos iniciais obrigatórios, instancie apenas a casca técnica descrita no `AGENTS.md`:
  - A rota `Home` deve conter apenas uma interface neutra e genérica (placeholder estrutural com título e container básico).
  - O layout `MainGeral` (`Outlet`) deve conter apenas um Header, Footer fixos e a `<Outlet />` de forma limpa e neutra.
  - Nenhum componente temático, modelo de dados ou regra de negócio fictícia deve ser criado sem que o usuário tenha solicitado e documentado os requisitos explicitamente.
* O agente deve instalar as dependências, criar as pastas especificadas, expurgar o CSS do Vite e parar, aguardando as instruções de negócio do usuário.

---

### 6. Dependência Obrigatória: graphify (Sincronização Contínua com AGENTS.md)

* **Instalação e Presença Obrigatória**: O ambiente de desenvolvimento deve disponibilizar o CLI oficial `graphify` no PATH. O pacote npm homônimo não fornece esse executável por si só; não use `npx graphify` para gerar o grafo.
* **Simbiose e Complementaridade**: O `AGENTS.md` e o `graphify` agem sempre juntos: o `AGENTS.md` fornece o contexto semântico, arquitetural e as regras operacionais para as IAs, enquanto o `graphify` mapeia visualmente as relações estruturais e o grafo de dependências do código.
* **Regra de Atualização Simultânea**: Toda e qualquer alteração estrutural no projeto (criação de rotas, páginas, componentes, services, contexts ou hooks) DEVE acionar a atualização do mapa do `graphify` no mesmo ciclo/commit em que o `AGENTS.md` for atualizado.
* **Configuração no Git e Scripts**:
  * Script no `package.json`: `"graphify": "graphify update ."`
  * A pasta gerada pelo graphify (`graphify-out/`) deve constar obrigatoriamente no `.gitignore` para evitar poluição do repositório, mas ser mantida atualizada localmente para consumo das IAs.

---

## 1. Visão geral

> **Nota para o Agente:** Caso este projeto esteja em estágio inicial sem requisitos de negócio explicitados, mantenha esta seção como a fundação padrão genérica. Somente substitua este parágrafo pelo resumo executivo do produto quando o usuário fornecer a especificação de negócio formal.

Este projeto é uma Single Page Application (SPA) moderna, reativa e componentizada, desenvolvida em React com foco em alta performance, estilização consistente via styled-components, navegação desacoplada, segurança por concepção e validação funcional de ponta a ponta.

* **Objetivo do projeto:** Aplicação web para criação manual ou assistida por IA, edição por seções e exportação de relatórios em PDF, DOCX e Markdown; modelos administrativos customizam o PDF.
* **Público-alvo:** Visitantes que criam relatórios sem conta e um único administrador autenticado que gerencia modelos PDF.
* **Status atual:** SPA e API de protótipo implementadas. Geração assistida e regeneração de seções usam os contratos server-side e o editor comum; o adaptador fake é o padrão, e ativação de provedor real/hospedagem continua sujeita a aprovação.

---

## 2. Stack técnica

| Camada | Tecnologia | Observações | 
| ----- | ----- | ----- | 
| **Build & Dev Tool** | **Vite** | Rápido, ESM nativo, scripts em `package.json` | 
| **Linguagem** | **JavaScript / TypeScript** (`.jsx` / `.tsx`) | Padrão modular ESM | 
| **UI Framework** | **React** (v18+ ou v19+) | Componentes funcionais e hooks nativos | 
| **Roteamento** | **react-router-dom** | Roteamento declarativo com `BrowserRouter`, `<Routes>`, `<Route>` e `<Outlet />` | 
| **Estilização** | **styled-components** | **REGRA ESTRITA: ZERO CSS DENTRO DE `src/`**. Não utilize arquivos `.css`, `.scss` ou módulos CSS dentro de `src/`. Todo o reset, tipografia, temas e estilizações locais vêm exclusivamente via `styled-components` (`createGlobalStyle`, `ThemeProvider` e componentes estilizados). | 
| **Nomenclatura de Estilos** | **Sufixo `Stl` Obrigatório** | Todo styled-component DEVE terminar obrigatoriamente com o sufixo `Stl` (ex.: `ContainerGeralStl`, `BannerHomeStl`). | 
| **Testes Funcionais / E2E** | **Playwright** (`@playwright/test`) | Execução headless ultrarrápida com detecção dinâmica do Chromium da máquina atual | 
| **Segurança & SAST** | **Semgrep + npm audit** | Auditoria de dependências e análise estática contra XSS, injeções e vazamento de chaves | 
| **Qualidade de código** | **ESLint** | Linting configurado para manter conformidade e evitar erros em build | 
| **API do protótipo (SIR-68)** | **Node.js 24 LTS + Fastify 5** | API em processo persistente; não é arquitetura edge/serverless |
| **Persistência do protótipo (SIR-68)** | **SQLite + IndexedDB** | SQLite para dados administrativos em uma instância; IndexedDB local para rascunhos anônimos e imagens |
| **PDF do protótipo (SIR-68)** | **Playwright + Chromium** | Geração server-side; requer runtime com Chromium; templates sem JavaScript e sem rede |

> **Implementação atual da API:** rotas Fastify em `api/`, SQLite via `node:sqlite`, sessão administrativa em cookie HttpOnly, IA fake por padrão com adaptadores OpenAI e Gemini opcionais, templates HTML/CSS restritos e exportadores PDF/DOCX/Markdown. A API ainda exige validação operacional antes de qualquer tráfego público.

> 🚫 **Regra de Estilização Zero-CSS em `src/`:**
> Qualquer import de arquivo `.css` (como `import './App.css'` ou `import './index.css'`) dentro de `src/` é **estritamente proibido**. Todas as propriedades visuais devem ser expressas como styled-components ou pelo `<GlobalStyled />`.

### 2.1 Procedimento Obrigatório de Inicialização do Vite (Expurgo de CSS de Fábrica)
Ao inicializar um novo projeto via `npm create vite@latest`, o template do Vite cria por padrão folhas de estilo CSS genéricas. O agente DEVE executar esta rotina de limpeza imediatamente antes de qualquer outra codificação:

1. **Excluir arquivos `.css` gerados automaticamente:**
   * Deletar `src/App.css`
   * Deletar `src/index.css`
2. **Eliminar imports residuais de CSS:**
   * Em `src/main.jsx` (ou `.tsx`), remover a linha `import './index.css';`
   * Em `src/App.jsx` (ou `.tsx`), remover a linha `import './App.css';`
3. **Instanciar o ecossistema oficial styled-components:**
   * Criar `src/themes/GlobalStyled.jsx` contendo o reset CSS completo via `createGlobalStyle`.
   * Criar `src/themes/theme.jsx` (ou `.tsx`) estruturado com os 3 botões padrão, tipografia e 2 gradientes.
   * Envolver a aplicação no `src/main.jsx` com `<ThemeProvider theme={theme}>` e injetar `<GlobalStyled />`.

---

## 3. Comandos principais

| Comando | Descrição | 
| ----- | ----- | 
| `npm install` | Instala todas as dependências do projeto | 
| `npm run dev` | Inicia o servidor local de desenvolvimento (geralmente em `http://localhost:5173`) | 
| `npm run build` | Gera a build otimizada para produção no diretório `dist/` | 
| `npm run preview` | Executa um servidor local servindo a pasta de produção `dist/` | 
| `npm run api:dev` | Inicia a API Node/Fastify usando o `.env` local, se existir |
| `npm run api:start` | Inicia a API para execução local/produção usando o `.env` local, se existir |
| `npm run lint` | Executa a verificação estática do linter (obrigatório rodar antes de finalizar tarefas) | 
| `npm run test:api` | Executa os testes da API com o runner nativo do Node |
| `npx playwright test` | Executa a suíte de testes funcionais E2E com Playwright em modo headless | 
| `npx playwright test --ui` | Executa os testes no modo interativo visual com timeline e DOM snapshot | 
| `npm audit` | Varre dependências do `package.json` em busca de CVEs conhecidas | 
| `semgrep scan --config p/javascript --metrics=off` | Executa regras JavaScript do Semgrep sem enviar métricas de uso |

---

## 4. Variáveis de ambiente

As variáveis de ambiente do client-side devem seguir o prefixo `VITE_` para ficarem disponíveis via `import.meta.env`.

* Arquivo local de desenvolvimento: `.env.local` (nunca commitado, deve estar no `.gitignore`).
* Arquivo de exemplo/documentação: `.env.example` (versionado no Git, sem valores sensíveis).

| Variável | Utilidade | Exemplo | 
| ----- | ----- | ----- | 
| `VITE_API_BASE_URL` | URL base do backend/API | `http://localhost:3000` | 
| `VITE_APP_ENV` | Identificador de ambiente (`development`, `staging`, `production`) | `development` | 

> ⚠️ **Princípio de Zero Segredos:** Variáveis prefixadas com `VITE_` são expostas publicamente no bundle JS final do navegador. **NUNCA** coloque tokens secretos, credenciais de banco ou chaves privadas nessas variáveis.

> **Variáveis exclusivas do servidor (documentadas em `.env.example`):** `API_HOST`, `API_PORT`, `DATABASE_PATH`, `APP_ORIGIN`, `AI_PROVIDER`, `OPENAI_MODEL`, `OPENAI_API_KEY`, `GEMINI_MODEL`, `GEMINI_API_KEY`, `ADMIN_INITIAL_USERNAME` e `ADMIN_INITIAL_PASSWORD`. As chaves OpenAI/Gemini e a senha inicial devem permanecer vazias no exemplo; a senha só provisiona a conta na primeira inicialização e deve ser removida da configuração depois do uso.

---

## 5. Estrutura de pastas e arquivos

```text
meu-projeto/
├── 00-anything/               # Diretório OBRIGATÓRIO para drafts, specs, relatórios EGM e testes
│   ├── 01 - setup inicial 2026-11-07/
│   └── 02 - gerador de relatorios 2026-11-09/
│       ├── plan.md
│       ├── design_draft.md
│       ├── egm_review_report.md
│       ├── egm_resolve_report.md
│       └── architecture_decisions.md
├── api/                      # API Fastify, schemas, auth, SQLite, IA e exportadores
│   ├── ai.js
│   ├── app.js
│   ├── auth.js
│   ├── database.js
│   ├── errors.js
│   ├── exporters.js
│   ├── schemas.js
│   └── server.js
├── AGENTS.md                  # Ponto de entrada e guia vivo para IAs e agentes (este arquivo)
├── CLAUDE.md, GEMINI.md       # Arquivos ponteiro apontando para AGENTS.md (Claude Code / Gemini CLI)
├── .github/copilot-instructions.md # Arquivo ponteiro apontando para AGENTS.md (GitHub Copilot)
├── README.md                  # Apresentação do projeto e instruções de uso humano
├── package.json               # Dependências, scripts e metadados
├── vite.config.js             # Configuração do Vite e plugins
├── playwright.config.js       # Playwright: Chromium headless, webServer e saída na iniciativa
├── eslint.config.js           # Regras do ESLint
├── .gitignore                 # Arquivos ignorados pelo Git (node_modules, .env.local, dist, test-results)
├── .env.example               # Template público de variáveis de ambiente
├── index.html                 # Ponto de entrada HTML do Vite
├── public/                    # Assets estáticos públicos servidos na raiz (ícones, favicons, etc.)
├── tests/                     # Testes funcionais e fluxos E2E com Playwright
│   ├── api/
│   │   └── api.test.js        # Contratos, provedores de IA, cancelamento e exportação
│   └── e2e/
│       └── rotas.spec.js      # Landing, geração/regeneração IA, editor, retomada e acesso administrativo
└── src/
    ├── main.jsx (ou .tsx)     # Bootstrap da aplicação: ThemeProvider + GlobalStyled + App
    ├── App.jsx (ou .tsx)      # Provedores globais e renderização de AppRoutes
    │
    ├── routes/
    │   └── AppRoutes.jsx      # Definição das rotas com <BrowserRouter>:
    │                          #  - Rota de layout mestre (<MainGeral /> com Header e Footer fixos)
    │                          #  - Home, /relatorios/novo/:draftId e acesso administrativo
    │
    ├── components/
    │   ├── LocalDraftList/    # Lista, retomada e remoção de rascunhos locais na Home
    │   ├── AdminTemplateManager/ # CRUD administrativo, publicação e prévia isolada de PDFs
    │   ├── ManualReportEditor/# Editor compartilhado, seções, anexos, prévia, propostas de IA e exportação/download
    │   ├── ReportGenerationForm/ # Parâmetros, cancelamento e estados da geração de relatório
    │   └── StartReportModal/  # Modal acessível para modalidade, formatos e modelos PDF
    ├── pages/                 # Páginas da aplicação (uma pasta por tela)
    │   ├── AdminArea/         # Área inicial protegida pela sessão administrativa
    │   ├── AdminLogin/        # Login conectado à sessão da API
    │   ├── Home/              # Landing page e início do fluxo
    │   ├── Outlet/            # Layout mestre: Header + <Outlet /> + Footer
    │   └── RelatorioNovo/     # Formulário IA e entrada do editor compartilhado por ID
    ├── services/
    │   ├── api.js             # Cliente same-origin, IA, exportação/download, cancelamento e validação de respostas
    │   └── reportDrafts.js    # IndexedDB para drafts e Blob de imagens locais
    │
    ├── themes/                # Configuração central de design system e estilos globais
    │   ├── GlobalStyled.jsx   # Reset CSS completo e estilos base via createGlobalStyle
    │   └── theme.jsx (ou .tsx)# Objeto de tema (cores, 3 botões, tipografia, 2 gradientes)
    │
    ├── hooks/                 # Custom React Hooks para lógicas de estado e side-effects
    ├── context/               # React Contexts para gerenciamento de estado global compartilhado
    └── utils/                 # Funções utilitárias puras (formatação, cálculos, validações)
```

> 💡 **Nota de Expansão:** As pastas `components/`, `hooks/`, `context/`, `services/`, `utils/` e `tests/` iniciam com estrutura mínima e evoluem modularmente conforme o desenvolvimento avança.

### 5.1 Arquivos Ponteiro Multi-IA (Zero Duplicação de Regras)
Ferramentas de IA de mercado procuram nomes específicos de documentação ao inspecionar o repositório. Para evitar duplicar diretrizes ou manter arquivos divergentes, a raiz do projeto DEVE conter arquivos ponteiros leves redirecionando para este `AGENTS.md`:

* **`CLAUDE.md`** (para Claude Code / Claude Desktop):
  ```markdown
  > Consulte integralmente as diretrizes arquiteturais, stack técnica, regras operacionais e convenções em [AGENTS.md](./AGENTS.md).
  ```
* **`GEMINI.md`** (para Gemini CLI / Code Assist):
  ```markdown
  > Consulte integralmente as diretrizes arquiteturais, stack técnica, regras operacionais e convenções em [AGENTS.md](./AGENTS.md).
  ```
* **`.github/copilot-instructions.md`** (para GitHub Copilot Chat):
  ```markdown
  > Consulte integralmente as diretrizes arquiteturais, stack técnica, regras operacionais e convenções em [AGENTS.md](../../AGENTS.md).
  ```

### 5.2 Estrutura Padronizada do `src/themes/theme.jsx` (ou `.tsx`)
O arquivo de tema DEVE conter a seguinte estrutura pré-definida para ser consumida em styled-components via `props.theme`:

```javascript
export const theme = {
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    surfaceAlt: '#21262d',
    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
    border: '#30363d',
    primary: '#1f6feb',
    secondary: '#238636',
    danger: '#da3633',
  },
  // 1. Padrão de 3 Botões Reutilizáveis em todo o projeto
  buttons: {
    primary: {
      background: '#1f6feb',
      color: '#ffffff',
      border: 'none',
      hoverBackground: '#388bfd',
      padding: '10px 18px',
      borderRadius: '6px',
    },
    secondary: {
      background: '#21262d',
      color: '#c9d1d9',
      border: '1px solid #30363d',
      hoverBackground: '#30363d',
      padding: '10px 18px',
      borderRadius: '6px',
    },
    outline: {
      background: 'transparent',
      color: '#58a6ff',
      border: '1px solid #58a6ff',
      hoverBackground: 'rgba(88, 166, 255, 0.1)',
      padding: '10px 18px',
      borderRadius: '6px',
    },
  },
  // 2. Padrão de Tipografia (Títulos, Subtítulos e Texto)
  typography: {
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      lineHeight: '1.25',
      color: '#f0f6fc',
    },
    subtitle: {
      fontSize: '1.25rem',
      fontWeight: '500',
      lineHeight: '1.4',
      color: '#8b949e',
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5',
      color: '#c9d1d9',
    },
    caption: {
      fontSize: '0.85rem',
      fontWeight: '400',
      lineHeight: '1.4',
      color: '#8b949e',
    },
  },
  // 3. Padrão de 2 Gradientes Reutilizáveis
  gradients: {
    primary: 'linear-gradient(135deg, #1f6feb 0%, #a371f7 100%)',   // Gradiente vibrante/destaque
    surface: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',   // Gradiente de superfície/cards
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '12px',
    full: '9999px',
  },
};
```

---

## 6. Arquitetura e fluxo de dados

O ciclo de vida da interface segue a seguinte hierarquia padrão:

```text
main.jsx
  └─ ThemeProvider (fornece theme.jsx)
       └─ GlobalStyled (aplica reset CSS global via styled-components)
            └─ App
                 └─ AppRoutes (BrowserRouter)
                      └─ Route path="/" element={<MainGeral />} (Layout com Header, Footer e <Outlet />)
                           └─ Route index element={<Home />}
                           └─ [Futuras rotas filhas serão inseridas aqui]
```

### Princípios de Responsabilidade:
1. **Componentes/Páginas**: Preocupam-se exclusivamente com a renderização visual e captura de eventos. Não realizam chamadas diretas de I/O em endpoints hardcoded.
2. **Hooks**: Encapsulam regras de estado e cálculos derivados.
3. **Contexts**: Armazenam e distribuem dados globais compartilhados entre múltiplas telas.
4. **Services**: Centralizam todas as requisições HTTP, chamadas a APIs ou acessos ao armazenamento local, aplicando cabeçalhos seguros e tratamento de autenticação.

### 6.1 Decisões de arquitetura do produto (protótipo SIR-68)

As escolhas detalhadas, contratos, limites iniciais, comparações e pendências estão em [`00-anything/02 - gerador de relatorios 2026-11-09/architecture_decisions.md`](./00-anything/02%20-%20gerador%20de%20relatorios%202026-11-09/architecture_decisions.md). A API de protótipo está em `api/`; IA fake é o padrão. OpenAI e Gemini operam somente com configuração explícita do servidor e não representam aprovação para piloto público.

* **Cliente**: SPA existente em React/Vite; comunicação via services, mesma origem `/api` em desenvolvimento/produção.
* **Servidor**: Node.js 24 LTS + Fastify 5 em processo persistente; implementação em `api/`, hospedagem de produção ainda não escolhida.
* **Banco**: SQLite via `node:sqlite` num volume durável para conta/admin, sessões e templates PDF; protótipo de instância única. Não compartilhar arquivo SQLite entre réplicas.
* **Rascunhos públicos**: IndexedDB guarda até 10 relatórios e blobs de imagens neste navegador; não há sincronização nem persistência server-side de relatórios de visitantes.
* **IA**: interface provider-neutral; fake determinístico para desenvolvimento/testes, com adaptadores server-side OpenAI Responses API e Gemini `generateContent`. Provedor, conta, orçamento e termos devem ser aprovados antes do uso público; nenhuma chave é requerida no cliente.
* **PDF/DOCX/Markdown**: Playwright + Chromium, biblioteca `docx` e serializador Markdown próprio, todos derivados do mesmo schema semântico. Imagens são anexadas em memória para PDF/DOCX; Markdown informa legenda/alt-text sem anexar binários, aguardando decisão sobre ZIP.
* **Processamento**: relatórios/imagens só são enviados sob ação explícita de geração/exportação; uploads de exportação permanecem em memória durante a requisição, sem persistência de relatório. Rever limites de concorrência/memória antes de produção.

---

## 7. Modelo de dados e estado

> **Instrução para a IA:** À medida que novas entidades, tipos, schemas ou fontes de dados forem introduzidos, documente-os nesta seção em tabelas ou blocos TypeScript/JSON.

### Entidades principais (modelo do protótipo SIR-68):
| Entidade | Descrição | Onde é persistida / consumida | 
| ----- | ----- | ----- | 
| `ReportDraft` | Rascunho anônimo versionado, com metadados, seções ordenadas, detalhes e referências a imagens | IndexedDB no navegador; enviado ao servidor apenas sob ação explícita de geração/exportação |
| `PdfTemplate` | Modelo de PDF do sistema ou template administrativo HTML/CSS restrito, com estado e versão | `system-default` embutido; modelos administrados persistidos no SQLite da API |
| `AdminAccount` | Conta administrativa única; senha armazenada somente como hash, com sessão opaca server-side | SQLite/API; cookie HttpOnly no cliente, sem credencial no React |
| `ExportRequest` | Snapshot transitório do relatório, formato e anexos vinculados | Memória/arquivos temporários da API durante a requisição; não é histórico persistido |

---

## 8. Regras de negócio

> **Instrução para a IA:** Conforme as regras de negócio forem especificadas pelo usuário (regras de validação, limites, cálculos específicos, permissões ou papéis), documente-as aqui de forma numerada e concisa.

1. **Navegação principal**: Toda tela comum da aplicação deve ser renderizada dentro da casca mestre `MainGeral` (`pages/Outlet/index.jsx`), preservando o Header e Footer fixos.
2. **Estilização uniforme**: Qualquer elemento visual deve consumir valores de `theme.jsx` (ex.: `props.theme.colors...`, `props.theme.buttons.primary...`, `props.theme.gradients.primary...`) para garantir consistência visual no styled-components.
3. **Rascunhos anônimos locais**: Relatórios e blobs ficam no IndexedDB deste navegador (até 10 drafts); conteúdo e imagens só saem do browser quando a pessoa solicita geração IA ou exportação. Falha de gravação mantém o estado em memória e sinaliza que ele não foi salvo.
4. **Conteúdo sem HTML arbitrário**: A decisão do protótipo é corpo em texto simples com quebras de linha; o serializador Markdown constrói o `.md`. Reabrir se formatação rica for aprovada.
5. **Templates PDF não executáveis**: templates administrativos não executam JavaScript, eventos inline, recursos remotos ou componentes React; valores do relatório devem ser escapados. A prévia exibe apenas PDF gerado pela API no visualizador nativo do navegador.
6. **Erro não destrutivo**: falhas de persistência local, IA, template ou exportação devem ser explícitas e preservar o rascunho; geração concorrente nunca sobrescreve silenciosamente edições posteriores.
7. **Sem segredo no client**: chaves do provedor de IA e credenciais admin permanecem em configuração server-side, nunca em código versionado ou variáveis `VITE_`.
8. **Ciclo de vida de templates PDF**: somente modelos publicados aparecem no seletor público; modelos publicados precisam ser despublicados antes de edição ou exclusão. A prévia usa `iframe` sem `sandbox` somente para `application/pdf` gerado pela API, pois o sandbox bloqueia o visualizador nativo do Chrome.
9. **Regeneração não destrutiva**: propostas de IA para uma seção são revisadas antes de aplicar; edições concorrentes invalidam respostas obsoletas, e anexos e seções não alvo permanecem inalterados.
10. **Limites da API**: schemas rejeitam payloads inválidos; uploads aceitam JPEG/PNG/WebP e têm limites de arquivo/pixels/total; IA e exportação têm rate limit por IP.
11. **Templates PDF**: HTML/CSS é limitado por allowlist, incluindo tags semânticas, seletores simples/de descendentes, pseudo-elementos `::before`/`::after` e propriedades de apresentação; `@page` permite margem, tamanho de papel e a caixa `@bottom-right` restrita a texto e contadores de página. Scripts, handlers, outras regras especiais, recursos remotos, URLs CSS e JavaScript no Chromium são rejeitados; templates publicados são os únicos listados publicamente.
12. **Editor local**: máximo de 20 seções, 5 MiB por imagem e 20 MiB de imagens por relatório; IndexedDB guarda JSON e blobs em stores separados, falhas/quota não limpam o estado em memória e a canonicalização da rota não recarrega por cima do rascunho já ativo.

---

## 9. Convenções de código e boas práticas

* **Nomenclatura Obrigatória de Styled-Components (Sufixo `Stl`)**:
  * **REGRA ESTRITA:** Todo e qualquer componente criado com styled-components DEVE obrigatoriamente terminar com o sufixo `Stl`.
  * **Exemplos válidos:**
    ```javascript
    export const ContainerGeralStl = styled.div`...`;
    export const BannerHomeStl = styled.section`...`;
    export const BotaoAcaoStl = styled.button`...`;
    export const TituloSecaoStl = styled.h1`...`;
    export const CardItemStl = styled.article`...`;
    ```
  * **Proibido:** Declarar componentes estilizados sem o sufixo `Stl` (como `const Container = styled.div` ou `const Title = styled.h1`).
* **Nomenclatura Geral**:
  * Componentes e Páginas: **PascalCase** em pastas dedicadas contendo `index.jsx` (ou `index.tsx`).
  * Hooks: **camelCase** iniciando com `use` (ex.: `useDebounce.js`).
  * Contexts: **PascalCase** com sufixo `Context` (ex.: `AuthContext.jsx`).
  * Funções e variáveis: **camelCase** descritivo e sem abreviações obscuras.
* **Styled-components**:
  * Os componentes estilizados específicos de uma página ou componente devem residir no mesmo arquivo ou em um arquivo adjacente `styles.js` na mesma pasta.
  * Utilize propriedades transitórias prefixadas com `$` (ex: `$isActive`, `$variant`) para evitar que props de estilo vazem para o DOM HTML.
* **Git e Commits**:
  * Padrão **Conventional Commits**: `feat(escopo): descrição concisa`, `fix(escopo): correção detalhada`, `test(escopo): testes`, `sec(escopo): segurança`.
  * Commits pequenos, frequentes e atômicos.
  * Push compulsório da branch no GitHub ao finalizar a tarefa.

---

## 10. Estratégia de Testes Funcionais & E2E (Playwright Inteligente)

Para garantir qualidade e confiabilidade sem burocracia excessiva ou lentidão no desenvolvimento, o projeto adota **testes funcionais pontuais e inteligentes** com Playwright.

### 1. Protocolo de Verificação Dinâmica e Descoberta no Primeiro Acesso
Como este template é portátil e pode ser executado em diferentes computadores, sistemas operacionais (Windows, macOS, Linux/WSL) ou ambientes CI/CD, o agente deve seguir o fluxo de descoberta no **primeiro acesso**:

1. **Checagem da Variável de Ambiente `PLAYWRIGHT_BROWSERS_PATH`**:
   * O agente deve inspecionar se a variável `PLAYWRIGHT_BROWSERS_PATH` já está configurada no ambiente do usuário.
   * Se a variável estiver definida, o Playwright usará esse caminho global automaticamente, **evitando o download repetido de navegadores pesados** dentro da pasta `node_modules`.

2. **Detecção dos Caminhos Padrão por Sistema Operacional**:
   Caso `PLAYWRIGHT_BROWSERS_PATH` não esteja explicitamente definida, verifique se os navegadores já estão instalados no local padrão do SO atual:
   * **Windows**: `%LOCALAPPDATA%\ms-playwright` (ex: `C:\Users\<usuario>\AppData\Local\ms-playwright\`)
   * **Linux / WSL**: `~/.cache/ms-playwright/`
   * **macOS**: `~/Library/Caches/ms-playwright/`

3. **Verificação de Instalação Existente**:
   * O agente deve checar rapidamente a presença do Chromium executando um comando de verificação:
     ```bash
     npx playwright --version
     ```
   * Se nenhum navegador for detectado na nova máquina, o agente deve executar apenas a instalação mínima do Chromium headless:
     ```bash
     npx playwright install chromium
     ```
     *(No Windows, `--with-deps` não é necessário, pois as dependências já vêm inclusas no binário; em distros Linux sem interface gráfica, execute `npx playwright install --with-deps chromium`).*

4. **Atualização Automática dos Dados Deste AGENTS.md**:
   * **REGRA DINÂMICA:** Assim que o agente rodar a verificação no primeiro acesso e identificar a máquina atual (usuário, caminhos reais e versão do Chromium), **ele DEVE atualizar a tabela abaixo** com os dados corretos da máquina atual:

| Parâmetro | Detecção da Máquina Atual (Atualizado Dinamicamente) |
| :--- | :--- |
| **Sistema Operacional Detectado** | Windows 11 (PowerShell) |
| **Variável `PLAYWRIGHT_BROWSERS_PATH`** | Definida; cache global configurado disponível (caminho de usuário não fixado neste documento) |
| **Componentes Validados no Ambiente** | Playwright 1.65.0; `chromium-1254`, `chromium_headless_shell-1254`, `ffmpeg-1013`, `winldd-1007` |
| **Reutilização Global Ativa** | Sim (não requer downloads adicionais no `node_modules`) |

---

### 2. Como Inicializar o Playwright em Novos Projetos
Ao configurar um novo projeto que necessite de testes funcionais:
```bash
# 1. Instalar o runner do Playwright como dependência de desenvolvimento:
npm install -D @playwright/test

# 2. (Opcional/Verificação) O Playwright detecta automaticamente o Chromium da máquina:
npx playwright install chromium
```

Configuração recomendada agnóstica de SO em `playwright.config.js`:
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

### 3. Aplicação Inteligente: Quando (e Quando Não) Escrever Testes Funcionais
O agente NÃO deve criar testes cegamente para cada linha de código alterada. Aplique a seguinte regra de bom senso:

* ❌ **NÃO criar testes funcionais para:**
  - Ajustes cosméticos de CSS/styled-components (mudança de cor, padding, fontes).
  - Correção de textos estáticos ou labels.
  - Funções utilitárias puras simples (que preferencialmente usam testes de unidade rápidos ou validação direta).

*  **É OBRIGATÓRIO criar ou executar testes funcionais quando:**
  1. **Navegação & Casca Mestre**: Criação ou alteração de rotas principais para garantir que `<MainGeral />` (Header, Footer fixos e `<Outlet />`) renderiza corretamente sem erros de tela em branco ou loop de redirecionamento.
  2. **Fluxos Críticos de Entrada (Forms/Modais)**: Criação ou alteração de formulários que realizam operações essenciais (ex: cadastro, filtros complexos, edição de entidades).
  3. **Autenticação & Permissões**: Fluxos de login, logout e bloqueio de rotas protegidas.
  4. **Persistência de Dados Críticos**: Garantir que dados submetidos foram salvos ou atualizados no estado global/storage e refletiram na UI.
  5. **API e contratos**: Alterações de rotas, schemas, autenticação, limites ou serviços de servidor devem executar `npm run test:api`.

---

## 11. Estratégia de Segurança (SAST, Auditoria de Dependências & Proteção de Contexto)

Para garantir que o código gerado por agentes seja seguro desde a concepção, o projeto adota verificações automáticas com foco em análise estática rápida, higiene de segredos e validação de contratos de entrada.

### 1. Ferramental Padrão de Verificação

| Camada | Ferramenta / Comando | Objetivo | Quando Executar |
| :--- | :--- | :--- | :--- |
| **Vulnerabilidades em Dependências** | `npm audit` | Identificar CVEs conhecidas nas dependências de produção | Antes de builds e ao instalar novas libs |
| **Análise Estática de Código (SAST)** | **Semgrep** (`semgrep scan --config p/javascript --metrics=off`) | Identificar padrões inseguros no código sem compartilhar métricas de uso | Ao criar novos formulários, rotas ou integrações |
| **Higiene de Segredos** | Verificação de `.env` | Garantir que chaves privadas e tokens de API nunca vazem para o bundle client-side | Em qualquer criação/edição de serviços e variáveis |
| **Segurança de IA / Red Teaming** *(se aplicável)* | **Promptfoo** (`npx promptfoo redteam run`) | Testar contra injeções de prompt e vazamento de instruções de sistema | Em projetos que consom APIs de LLM |

---

### 2. Regras Estritas de Segurança para o Agente (O que NUNCA fazer)

1. **Zero Segredos no Client-Side (SPA/React)**:
   * **NUNCA** insira chaves privadas, segredos de banco ou tokens de serviços (ex: Stripe Secret Key, service roles de banco, credenciais SMTP) dentro de arquivos em `src/` ou variáveis prefixadas com `VITE_`.
   * Lembre-se: qualquer dado presente no bundle React pode ser inspecionado no navegador do usuário.
2. **Prevenção de XSS (Cross-Site Scripting)**:
   * **Proibido** o uso de `dangerouslySetInnerHTML` sem sanitização prévia explícita (ex: via DOMPurify).
   * **Proibido** concatenar dados de entrada de usuários diretamente em URLs ou elementos `href` como `javascript:...`.
3. **Validação Estrita de Entrada (Formulários e Parâmetros de Rota)**:
   * Todo dado inserido pelo usuário deve ser validado antes de ser transmitido para APIs externas. Não confie exclusivamente na validação do servidor.
4. **Comunicação Segura**:
   * Requisições em `src/services/` devem utilizar HTTPS e tratar adequadamente falhas com códigos HTTP 401/403 (redirecionando para login ou limpando sessões expiradas).

---

### 3. Matriz de Decisão: Quando Rodar Auditoria de Segurança

* ❌ **NÃO rodar auditorias pesadas para:**
  * Ajustes de layout, styled-components, temas ou textos estáticos.
  * Refatorações simples de componentes visuais puros.

*  **É OBRIGATÓRIO rodar `npm audit` e verificação estática quando:**
  1. Instalar ou atualizar bibliotecas externas no `package.json`.
  2. Implementar novas integrações de API, camadas de autenticação ou armazenamento de tokens (`localStorage` / cookies).
  3. Adicionar novas variáveis de ambiente em `.env.example`.

---

## 12. Cuidados e armadilhas comuns

1. **Arquivos soltos na raiz**: Nunca salve drafts, specs, notas ou relatórios de subagentes/EGM na raiz. Agrupe tudo por iniciativa em `00-anything/{sequencial} - {nome} {data}/` e, quando necessário, use subpastas internas para separar brainstorm, draft, review e arquitetura sem criar múltiplas pastas paralelas para a mesma demanda.
2. **Alucinação de modelo de negócio**: Nunca deduza o nicho da aplicação pelo nome da pasta (ex: criar tela de notícias só porque a pasta se chama `newsHub`). Crie apenas a estrutura estritamente genérica descrita aqui até que o usuário dite os requisitos.
3. **Esquecer o sufixo `Stl`**: Todo styled-component deve terminar com `Stl` (ex: `ContainerGeralStl`, `BannerHomeStl`).
4. **Vazamento de CSS externo**: Nunca importe arquivos `.css` crus (nem mesmo `App.css` ou `index.css`). Use exclusivamente `GlobalStyled.jsx` e `styled-components`.
5. **Branches esquecidas**: Nunca faça commits na `main`. Se perceber que está na `main`, crie uma nova branch imediatamente antes de commitar.
6. **Esquecer de atualizar o AGENTS.md**: Finalizar a tarefa sem registrar novos componentes, rotas ou dependências neste arquivo fará com que os próximos agentes percam o contexto do projeto.
7. **Trabalhar sem decomposição de etapas**: Tentar fazer uma grande funcionalidade em um único bloco sem quebrar em issues funcionais gera regressões e dificulta a continuidade em outros agentes.
8. **Caminhos fixos de navegador**: Nunca assuma um caminho absoluto de usuário (como `C:\Users\renato.lima\...`) como imutável. No primeiro acesso ao projeto, o agente deve verificar a variável `PLAYWRIGHT_BROWSERS_PATH` e o SO atual, atualizando o `AGENTS.md` dinamicamente.
9. **Downloads duplicados do Chromium**: Nunca force reinstalação completa de browsers pesados sem checar `PLAYWRIGHT_BROWSERS_PATH` ou as pastas de cache global padrão do SO.
10. **Segredos no bundle client-side**: Toda chave colocada em arquivos do React ou prefixada com `VITE_` é pública por definição. Tokens administrativos de banco ou chaves secretas de APIs terceiras devem ficar exclusivamente em backends ou funções serverless.

---

## 13. Checklist para agentes ao finalizar uma tarefa

Antes de considerar qualquer tarefa ou resposta como concluída, o agente DEVE verificar e marcar os itens abaixo:

* [ ] **Isolamento de artefatos na raiz**: Nenhum rascunho, spec, teste temporário ou relatório EGM solto na raiz do repositório (todos salvos dentro de `00-anything/{sequencial} - {nome} {data}/`).
* [ ] **Inicialização estritamente genérica e literal**: Nenhuma inferência ou criação de telas temáticas não solicitadas (zero telas pré-concebidas baseadas no nome da pasta).
* [ ] **Sufixo `Stl` em 100% dos styled-components**: Todos os styled-components criados ou alterados terminam com `Stl` (ex: `ContainerGeralStl`, `BotaoAcaoStl`) da preferencias para nomes em pt-br.
* [ ] **Padrão de tema configurado**: `src/themes/theme.jsx` (ou `.tsx`) contém os 3 botões padrão (`primary`, `secondary`, `outline`), tipografia (título, subtítulo, body) e 2 gradientes reutilizáveis.
* [ ] **Inicialização do repositório limpa**: Arquivos ponteiros (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) criados e CSS padrão de templates Vite excluído (`App.css` e `index.css`).
* [ ] Código livre de arquivos `.css` importados diretamente dentro de `src/` (100% styled-components).
* [ ] O arquivo `src/routes/AppRoutes.jsx` e as páginas existentes continuam íntegros e funcionando.
* [ ] `npm run lint` executado sem erros ou alertas novos de sintaxe/formatação.
* [ ] **Ambiente de testes verificado no primeiro acesso**: Caminhos de browser e SO validados e sincronizados na tabela da Seção 10.
* [ ] **Testes funcionais Playwright executados com sucesso** (`npx playwright test`) caso a tarefa tenha criado ou modificado fluxos críticos (rotas, formulários-chave, autenticação).
* [ ] **Testes da API executados com sucesso** (`npm run test:api`) caso a tarefa tenha alterado rotas, schemas, persistência, autenticação ou serviços do servidor.
* [ ] **Auditoria de segurança e dependências verificada**: `npm audit` sem vulnerabilidades críticas se novas libs foram instaladas, e zero segredos privados em `src/` ou variáveis `VITE_`.
* [ ] Variáveis de ambiente novas (se houver) foram documentadas em `.env.example` e na tabela da Seção 4.
* [ ] A árvore de pastas da Seção 5 reflete com precisão os arquivos criados/modificados.
* [ ] **Sincronização com graphify**: Mapa do graphify gerado/atualizado localmente em `graphify-out/` e pasta devidamente ignorada no `.gitignore` (conforme Regra Obrigatória 6).
* [ ] Este arquivo `AGENTS.md` foi atualizado com todas as mudanças estruturais aplicadas.
* [ ] A nova alteração foi registrada na tabela de **Histórico de alterações deste arquivo** abaixo.
* [ ] Uma branch dedicada (`feature/...` ou `fix/...`) foi criada, recebeu commits claros e foi enviada ao GitHub (`git push -u origin <branch>`).

---

## 📜 Histórico de alterações deste arquivo

| Data | Responsável | Alteração Realizada | 
| ----- | ----- | ----- | 
| 2026-11-03 | Agente IA | Criação inicial do modelo base `AGENTS.md` para novos projetos (Vite + React + styled-components, regras mandatórias 1 e 2, estrutura de pastas com rotas e layout base, convenções e checklists). | 
| 2026-11-04 | Agente IA | Adição da **Regra Obrigatória 3**: Decomposição e documentação de tarefas em issues detalhadas (com suporte a Linear MCP e formato pronto para cópia em IAs sem MCP) com replanejamento dinâmico de etapas futuras. Atualização do checklist de conclusão e cuidados. | 
| 2026-11-04 | Agente IA | Implementação da **Seção 10: Estratégia de Testes Funcionais & E2E (Playwright Inteligente)**. Documentação da reutilização do Chromium global via `PLAYWRIGHT_BROWSERS_PATH`, comandos, configuração recomendada com Vite (`playwright.config.js`), matriz de momentos adequados para testes e atualização do checklist. | 
| 2026-11-04 | Agente IA | Implementação da **Seção 11: Estratégia de Segurança (SAST, Auditoria de Dependências & Proteção de Contexto)**. Inclusão de `npm audit`, Semgrep, Promptfoo, regras estritas contra segredos no client-side e XSS, matriz de execução inteligente de segurança e novos itens no checklist. | 
| 2026-11-04 | Agente IA | Atualização da **Seção 10.1 (Protocolo de Verificação Dinâmica e Descoberta no Primeiro Acesso)**: Instrução explícita para o agente inspecionar o SO e a variável `PLAYWRIGHT_BROWSERS_PATH` em qualquer máquina, atualizar a tabela de status do documento e evitar caminhos absolutos hardcoded. | 
| 2026-11-04 | Agente IA | Adição das recomendações práticas de inicialização: **Subseção 2.1 (Expurgo obrigatório de CSS gerado pelo Vite)**, **Subseção 5.1 (Arquivos ponteiro multi-IA: `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`)** e atualização do checklist de finalização de tarefas. | 
| 2026-11-07 | Agente IA | Adição da **Regra Obrigatória 4 (Isolamento de arquivos e relatórios EGM em `00-anything/{sequencial} - {nome} {data}/`)**, **Regra Obrigatória 5 (Inicialização estritamente literal/genérica sem inferências por nome de pasta)**, **Sufixo `Stl` obrigatório para todos os styled-components** e especificação padronizada de `theme.jsx` com 3 variantes de botões, tipografia completa e 2 padrões de gradiente. | 
| 2026-11-07 | Antigravity AI | Inicialização completa da casca técnica genérica (Vite + React + styled-components + react-router-dom), isolamento em `00-anything/01 - setup inicial 2026-11-07/`, ponteiros multi-IA, testes Playwright validados e detecção do ambiente local. | 
| 2026-11-07 | Antigravity AI | Adição da **Regra Obrigatória 6 (Dependência Obrigatória: graphify e Sincronização Contínua com AGENTS.md)**, adição do script `graphify` no `package.json`, inclusão do `graphify-out/` no `.gitignore` e geração do mapa do projeto. | 
| 2026-11-09 | GitHub Copilot | Registro das decisões arquiteturais de protótipo SIR-68: API Node/Fastify, SQLite/IndexedDB, contrato semântico, privacidade, autenticação admin, comparação de provedores e exportadores. Nenhum serviço ou integração foi implementado; decisões de produção permanecem pendentes. |
| 2026-11-09 | GitHub Copilot | Ajuste da regra de organização em `00-anything/` para agrupar artefatos por iniciativa e evitar pastas redundantes para brainstorm, draft, review e arquitetura da mesma demanda. |
| 2026-11-09 | GitHub Copilot | Implementação da API de protótipo SIR-68 Etapa 2: Fastify, SQLite, sessão admin, contratos, adaptador de IA, templates restritos, exportadores, limites, testes e documentação de configuração. |
| 2026-11-09 | GitHub Copilot | Inclusão do adaptador server-side Gemini `generateContent`, configuração dedicada `GEMINI_API_KEY`/`GEMINI_MODEL`, validação estruturada, testes de falha/segredo e documentação da integração opcional. |
| 2026-11-09 | GitHub Copilot | Implementação da Etapa 3: landing responsiva, modal nativa acessível, seleção de formatos/modelos publicados, rotas de início e administração, login por sessão e testes E2E. |
| 2026-11-09 | GitHub Copilot | Implementação da Etapa 4: editor manual e prévia, edição/reordenação de seções, anexos validados, IndexedDB para rascunhos/imagens, retomada por ID, testes E2E e documentação. |
| 2026-11-10 | GitHub Copilot | Implementação da Etapa 5: geração assistida integrada ao editor compartilhado, validação cliente/servidor, cancelamento, retry, propostas de regeneração não destrutivas, testes API/E2E e atualização da documentação. |
| 2026-11-10 | GitHub Copilot | Implementação da Etapa 6: CRUD e ciclo de publicação de templates PDF, exclusão protegida de rascunhos, prévia PDF gerada no servidor, sincronização com seletor público, cobertura API/E2E e preservação do estado do formulário durante atualizações da lista. |
| 2026-11-10 | GitHub Copilot | Implementação da Etapa 7: exportação multi-formato no editor usando snapshot único, progresso/falhas e retry independentes, downloads individuais, envio de imagens apenas para PDF/DOCX, escaping de Markdown e testes API/E2E. |
| 2026-11-10 | GitHub Copilot | Ajuste da prévia PDF para usar o visualizador nativo do navegador sem `sandbox`, removendo a tela de bloqueio do Chrome; templates continuam restritos e a API fornece somente PDF gerado no servidor. |
| 2026-11-10 | GitHub Copilot | Expansão da allowlist segura de templates PDF para aceitar tags `header`/`main`, seletores comuns e regras `@page` limitadas, permitindo layouts de relatório A4 sem liberar scripts ou acesso à rede. |
| 2026-11-10 | GitHub Copilot | Ampliação da allowlist para rodapé de relatório: tag `footer`, posição fixa, propriedades de layout e `@page @bottom-right` com texto/counters de página restritos; API testa atualização e geração de PDF do template completo. |
| 2026-11-10 | GitHub Copilot | Validação final do MVP: proteção contra origens ausentes/externas no login admin, preservação do rascunho ativo ao canonicalizar a rota, sincronização dos comandos SAST e dados Playwright, e alinhamento da documentação à Etapa 8. |
