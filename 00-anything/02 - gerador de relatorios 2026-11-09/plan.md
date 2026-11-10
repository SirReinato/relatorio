# Plano de Implementação — Gerador de Relatórios

**Data:** 2026-11-09  
**Projeto:** `relatorio`  
**Status:** Plano aprovado. Etapa 1 (SIR-68) documentada em `00-anything/02 - gerador de relatorios 2026-11-09/architecture_decisions.md`; integração real e implantação aguardam validação das pendências pelo proprietário.

## 1. Problema e abordagem proposta

Evoluir a SPA React/Vite existente para uma aplicação que permita criar relatórios em português por geração assistida por IA ou manualmente, editar o conteúdo por etapas, incluir imagens e exportar o mesmo relatório em um ou mais formatos. Um administrador será o único usuário com login e poderá criar e publicar modelos visuais de PDF.

Implementar a experiência em etapas, começando por uma decisão técnica explícita sobre backend, armazenamento e provedor de IA. Credenciais e chamadas de IA ficarão no servidor, nunca no bundle React. A aplicação cliente seguirá React, Vite, `react-router-dom` e `styled-components`, respeitando as convenções do `AGENTS.md` (incluindo styled-components com sufixo `Stl`, sem CSS avulso em `src/`). O editor administrativo produzirá templates HTML/CSS sem JavaScript para PDF; templates customizados para DOCX e Markdown ficam fora do MVP.

## 2. Estado atual do projeto

- SPA inicializada com Vite, React 18, `react-router-dom`, styled-components, ESLint e Playwright.
- A rota `/` apresenta a landing page; `/relatorios/novo` oferece o início manual ou por IA, e `/relatorios/novo/:draftId` retoma um rascunho local.
- A API de protótipo, sessão administrativa e exportadores existem; o fluxo manual persiste drafts e imagens no IndexedDB.
- As Etapas 3 a 7 estão implementadas, incluindo geração assistida, gerenciamento de modelos PDF e exportação multi-formato. A validação final e as decisões de produção permanecem pendentes.
- O `AGENTS.md` exige que alterações estruturais atualizem sua árvore/histórico, o `README.md` quando aplicável e o grafo graphify; também exige branch de feature, validação e isolamento de artefatos de planejamento em `00-anything/`.

## 3. Requisitos e decisões confirmados

| Tema | Decisão |
|---|---|
| Usuários | Criação de relatórios pública, sem conta; login somente para o administrador. |
| IA e infraestrutura | Protótipo: Node/Fastify + SQLite, adaptador fake e integrações opcionais OpenAI/Gemini no servidor; nenhum provedor está aprovado para tráfego público. |
| Entrada do relatório | Tema obrigatório; parâmetros opcionais, como objetivo, público-alvo, extensão, tom e fontes; português do Brasil como padrão. |
| Edição | Editar títulos e conteúdos, adicionar/remover/reordenar seções, editar detalhes importantes, pré-visualizar e regenerar seção com IA. |
| Imagens | Upload com validação e legenda opcional, vinculada à seção. |
| Modelos | Admin cria modelos visuais para PDF usando HTML/CSS; sem JavaScript executável. Modelos customizados para DOCX/Markdown ficam para uma fase futura. |
| Exportação | Poder selecionar vários formatos para o mesmo relatório: PDF, DOCX e Markdown. |
| Salvamento | Rascunho local no navegador para usuários anônimos; modelos do admin persistidos no backend. Histórico/listagem de relatórios não entra no MVP, salvo necessidade identificada na decisão técnica. |
| MVP | Landing page, fluxo manual e por IA, editor por etapas, modelos do administrador e exportação dos três formatos. Pagamentos, contas de usuários e colaboração ficam fora. |

### Fluxo de produto proposto

1. A landing page explica o funcionamento, oferece “Iniciar novo relatório” e acesso de login administrativo.
2. A modal inicial permite escolher criação por IA ou manual e selecionar um ou mais formatos de saída.
3. Na criação por IA, a pessoa informa o tema e parâmetros opcionais; o sistema gera um relatório estruturado em seções.
4. Na criação manual, a pessoa começa com título/tema e estrutura as seções no mesmo editor, sem depender de IA.
5. O editor permite revisar conteúdo por seção, ajustar detalhes, reordenar seções e anexar imagens/legendas. A IA pode regenerar uma seção sob solicitação.
6. A prévia usa o modelo PDF selecionado pelo usuário entre os modelos publicados pelo administrador; DOCX e Markdown usam formatação padrão do MVP.
7. A pessoa exporta todos os formatos selecionados. O rascunho permanece no navegador para retomada no mesmo navegador/dispositivo.
8. O admin autentica-se em área protegida, cria/edita modelos PDF, visualiza uma prévia e publica/despublica modelos.

## 4. Decisões técnicas registradas na Etapa 1

O documento fonte das comparações, trade-offs, contratos, limites iniciais, privacidade e pendências é [`00-anything/02 - gerador de relatorios 2026-11-09/architecture_decisions.md`](./architecture_decisions.md).

Resumo da arquitetura de protótipo:

- SPA atual + API Node.js 24 LTS/Fastify 5 em processo persistente.
- SQLite em volume durável para dados administrativos de uma instância; IndexedDB para rascunhos e blobs anônimos.
- Adaptador fake de IA para desenvolvimento/testes; OpenAI Responses API e Gemini `generateContent` estão disponíveis como integrações server-side opcionais para desenvolvimento local, sem aprovação para tráfego público.
- Playwright/Chromium para PDF; biblioteca `docx` para DOCX; serializador próprio para Markdown.
- Conteúdo de relatório em texto simples com quebras de linha; sem HTML livre. Templates HTML/CSS de PDF são restritos e não executáveis.
- Hospedagem e ativação de IA real continuam bloqueadas pela validação do proprietário e pelo ambiente de deploy.

## 5. Etapas de implementação (issues copiáveis)

As etapas abaixo formam o backlog inicial. Cada uma pode ser copiada para um agente sem Linear MCP e executada de forma sequencial conforme as dependências. Os caminhos de backend indicados são ilustrativos e devem ser ajustados após a decisão técnica da Etapa 1.

### Etapa 1 — `docs(arquitetura): decidir backend, IA, persistencia e exportadores`

**Status:** Concluída documentalmente para arquitetura de protótipo; nenhuma funcionalidade foi implementada. Consulte o ADR acima para pendências antes de produção.

**Objetivo funcional:** Fechar as escolhas técnicas e os contratos necessários para construir o MVP sem acoplar o frontend a um provedor ou expor segredos.

**Passo a passo técnico:**
1. Comparar opções de API/backend, persistência de modelos e armazenamento de imagens adequadas ao projeto e ao ambiente de implantação.
2. Comparar provedores de IA, custos/limites e políticas de dados; documentar chamada do servidor, timeout, erros e limites.
3. Definir o esquema semântico do relatório (`titulo`, `tema`, metadados opcionais, seções ordenadas, conteúdo, detalhes, imagens/legendas e formatos selecionados).
4. Definir contrato de criação manual, geração por IA, regeneração de seção, CRUD/publicação de modelos e exportação.
5. Escolher bibliotecas para PDF, DOCX e Markdown, prevendo renderizações seguras do template PDF e uso do conteúdo estruturado nos formatos de saída.
6. Definir salvamento local do rascunho e anexos, limites e comportamento quando o armazenamento local estiver indisponível.
7. Registrar as decisões e impactos em `AGENTS.md`/`README.md` quando forem decisões estruturais adotadas, antes de implementá-las.

**Critérios de aceitação (DoD):**
- As tecnologias e responsabilidades de cliente, servidor, banco e armazenamento estão escolhidas ou há uma decisão explícita de protótipo.
- O contrato de dados/API, limites iniciais, comportamento de erro e estratégia de segredos estão documentados.
- É possível implementar o MVP sem depender de chave privada no cliente.
- Foram identificadas as bibliotecas/serviços de saída e suas limitações para PDF, DOCX e Markdown.

**Prompt copiável:**  
> Analise este projeto e proponha/registre as decisões de arquitetura para o gerador de relatórios descrito em `plan.md`. Compare backend, persistência, IA e exportadores considerando custo, segurança, deploy e manutenção. Defina contratos de dados/API para criação manual, geração e regeneração de seções por IA, modelos PDF e exportação PDF/DOCX/Markdown. Não implemente a funcionalidade nesta etapa. Não exponha segredos no React; siga `AGENTS.md` e atualize a documentação estrutural pertinente.

### Etapa 2 — `feat(api): criar contratos seguros e integracao de servidor`

**Status:** Implementada como API local de protótipo. As integrações OpenAI e Gemini são opcionais e permanecem desativadas por padrão; a implantação pública e decisões pendentes de produção continuam fora do escopo desta etapa.

**Objetivo funcional:** Disponibilizar a camada de servidor escolhida para IA, persistência administrativa e exportação, isolando segredos e validando entradas.

**Passo a passo técnico:**
1. Criar/configurar a API conforme a decisão da Etapa 1 e documentar comandos/ambiente.
2. Implementar schemas de entrada/saída para relatório, seção, imagem, modelo PDF e exportação.
3. Criar serviços de servidor para persistir modelos publicados e processar as operações necessárias do produto.
4. Implementar integração de IA somente no servidor, com segredo fora do repositório, validação da resposta estruturada, limites de entrada/saída e erros explícitos.
5. Adicionar limites de requisição/arquivo e proteções apropriadas contra abuso, especialmente nos endpoints públicos de IA e exportação.
6. Documentar novas variáveis não secretas em `.env.example`; manter valores privados apenas no ambiente do servidor.

**Critérios de aceitação (DoD):**
- Contratos rejeitam payloads inválidos e retornam erros compreensíveis.
- Chamadas de IA e armazenamento administrativo não dependem de credenciais expostas no navegador.
- Falhas/limites de provedor não retornam sucesso falso nem relatório incompleto sem indicação.
- Configuração e deploy local estão documentados; `AGENTS.md`, `README.md` e graphify refletem a estrutura real.

**Entrega realizada:** API Fastify em `api/`, SQLite para conta/sessões/templates, adaptadores fake/OpenAI/Gemini configuráveis, templates PDF com allowlist, exportadores PDF/DOCX/Markdown, upload de imagens transitório, rate limit, configuração em `.env.example` e testes em `tests/api/api.test.js`.

**Prompt copiável:**  
> Implemente a camada de servidor e os contratos do MVP conforme as decisões registradas na Etapa 1 de `plan.md`. Centralize validação e tratamento de erros, mantenha credenciais exclusivamente no servidor e proteja endpoints públicos contra abuso. Não altere o escopo do produto. Atualize `.env.example`, `AGENTS.md`, `README.md` e graphify conforme as convenções do `AGENTS.md`. Adicione testes focados para validação e falhas do serviço.

### Etapa 3 — `feat(home): criar landing page e inicio do fluxo`

**Status:** Implementada. Landing page, modal acessível, escolha de modelos publicados, fluxo inicial de relatório e rotas administrativas estão conectados.

**Objetivo funcional:** Substituir o placeholder da Home por uma landing page explicativa e permitir iniciar um relatório escolhendo modalidade e formatos.

**Passo a passo técnico:**
1. Atualizar `src/pages/Home/index.jsx` com banner explicativo, CTA “Iniciar novo relatório” e botão de login administrativo.
2. Criar modal acessível para escolher geração por IA ou escrita manual e um ou mais formatos: PDF, DOCX e Markdown.
3. Exibir os modelos PDF publicados disponíveis para seleção, sem oferecer modelos inativos.
4. Criar páginas/rotas para o fluxo de criação e área administrativa conforme os contratos já definidos, mantendo o layout mestre onde apropriado.
5. Implementar estados vazios, carregamento, validação, fechamento/retorno da modal e comportamento responsivo.
6. Usar `styled-components` com sufixo `Stl`, tema compartilhado e sem CSS avulso em `src/`.

**Critérios de aceitação (DoD):**
- A landing page explica em linguagem clara o fluxo principal e apresenta o CTA e o login admin.
- O CTA abre uma modal navegável por teclado que permite escolher modalidade e vários formatos.
- Erros/carregamento/ausência de modelos têm estados visíveis; nenhuma escolha de formato impede edição.
- Rotas e casca mestre continuam funcionais; testes Playwright cobrem abertura, escolhas e navegação essencial.

**Entrega realizada:** Landing responsiva, modal com estados de carregamento/erro/vazio, seleção IA/manual, formatos e modelos publicados, rotas `/relatorios/novo`, `/admin/login` e `/admin`, login/logout por sessão e cobertura E2E. Geração, editor e CRUD de modelos permanecem em etapas posteriores.

**Prompt copiável:**  
> Implemente a landing page e o início do fluxo definidos na Etapa 3 de `plan.md`: banner explicativo, CTA, login admin e modal para escolher IA/manual, múltiplos formatos e modelo PDF publicado. Preserve a arquitetura existente e os padrões de acessibilidade, tema e styled-components com sufixo `Stl`. Não implemente geração de IA nem exportadores nesta etapa. Atualize a documentação estrutural e crie testes E2E dos fluxos críticos.

### Etapa 4 — `feat(relatorios): implementar editor manual e edicao por secoes`

**Status:** Implementada. O editor manual, os anexos validados, a prévia e a persistência/retomada local estão disponíveis.

**Objetivo funcional:** Permitir criar e revisar um relatório estruturado sem IA, com o mesmo formato de dados que será usado na geração assistida.

**Passo a passo técnico:**
1. Criar editor de título/tema e parâmetros opcionais definidos na Etapa 1.
2. Permitir adicionar, editar, remover e reordenar seções, seus títulos, conteúdos e detalhes importantes.
3. Implementar upload de imagens para cada seção, validação de tipo/tamanho, legenda opcional e remoção/substituição.
4. Implementar salvamento e retomada do rascunho no armazenamento local decidido na Etapa 1.
5. Implementar prévia sem exportação final, com indicação de formato/modelo selecionado e estados de validação.
6. Tratar armazenamento local indisponível/cheio de forma explícita, sem descartar conteúdo silenciosamente.

**Critérios de aceitação (DoD):**
- Usuário anônimo consegue montar e editar um relatório manual, inclusive com seções ordenadas e imagens.
- Rascunho é retomável no mesmo navegador/dispositivo conforme o comportamento documentado.
- Entradas e imagens são validadas e erros de persistência não apagam o conteúdo atual em tela.
- Fluxo crítico de criação/edição/persistência está coberto com Playwright.

**Entrega realizada:** Editor manual ligado ao contrato `ReportDraft`, com campos opcionais, até 20 seções editáveis/reordenáveis, detalhes, imagens JPEG/PNG/WebP verificadas por assinatura e decodificação (5 MiB por arquivo, 20 MiB por relatório), legenda, substituição/remoção, validação e prévia. Drafts e blobs são mantidos em IndexedDB, limitados a 10 rascunhos; a lista inicial na Home retoma/remove drafts, e erros de quota/indisponibilidade são explícitos sem apagar o conteúdo em memória. A rota identificada pelo ID permite recarregar e retomar. Nenhum dado é enviado ao servidor nesta etapa.

**Prompt copiável:**  
> Implemente o fluxo manual e editor por seções descritos na Etapa 4 de `plan.md`, usando o contrato de relatório definido na Etapa 1. Inclua edição/reordenação, detalhes importantes, upload validado com legenda, prévia e persistência local retomável. Preserve os dados na tela diante de falhas de persistência. Não implemente chamadas de IA ou exportação final. Siga `AGENTS.md` e cubra o fluxo crítico com Playwright.

### Etapa 5 — `feat(ia): gerar relatorios e regenerar secoes`

**Objetivo funcional:** Gerar um relatório estruturado a partir do tema e dos parâmetros opcionais, e permitir regenerar uma seção mantendo o restante do trabalho.

**Nota de integração:** O fluxo manual da Etapa 4 já grava `ReportDraft` em IndexedDB e abre o mesmo editor. A geração deve popular esse contrato/editor sem sobrescrever edições ou imagens existentes.

**Passo a passo técnico:**
1. Ligar o fluxo “por IA” da modal ao endpoint seguro definido na Etapa 2.
2. Enviar tema e parâmetros opcionais; instruir o modelo a retornar a estrutura semântica contratada, em português do Brasil por padrão.
3. Validar a resposta no servidor e no cliente antes de populá-la no editor.
4. Implementar estados de progresso, cancelamento quando suportado, erro/retry explícitos e limites de geração.
5. Adicionar ação de regenerar somente uma seção, sem sobrescrever outras seções ou alterações manuais.
6. Não enviar imagens à IA para análise no MVP; imagens são anexadas ao documento conforme decisão inicial.

**Critérios de aceitação (DoD):**
- Geração bem-sucedida abre o relatório no editor comum e todos os campos são editáveis.
- Erro/timeout/saída inválida são visíveis; o usuário pode tentar novamente sem perder dados existentes.
- Regenerar uma seção não altera as outras seções nem elimina imagens/legendas anexadas.
- Testes cobrem respostas válidas, falhas e preservação do conteúdo existente; integração usa credencial somente no servidor.

**Entrega realizada (2026-11-10):** Formulário da modalidade IA conectado a `POST /api/v1/ai/reports`, com tema e parâmetros opcionais, indicador de progresso, cancelamento, erro/retry e validação estrita do `ReportDraft` no cliente. Rascunhos válidos recebem as escolhas de formato/modelo da modal e são persistidos no IndexedDB; se a gravação falhar, o conteúdo segue para o editor em memória com erro visível. O editor compartilhado oferece regeneração por seção em `POST /api/v1/ai/sections/regenerate`, envia somente contexto textual, valida a proposta, permite aceitar/descartar e ignora respostas obsoletas quando a seção muda durante a chamada. Aplicar altera apenas título/conteúdo/detalhes da seção alvo, preservando imagens/legendas e demais seções. Cancelamento de desconexão propaga do Fastify ao fetch do provedor. Cobertura adicionada para sucesso, erros/retry, resposta inválida, cancelamento e preservação concorrente; integração real continua dependente de configuração server-side e não foi validada com credenciais reais.

**Prompt copiável:**  
> Conecte o fluxo de geração por IA aos contratos da Etapa 2 e ao editor da Etapa 4. Gere relatório estruturado em português do Brasil por padrão, valide a resposta, trate limites/timeout/erro explicitamente e permita regenerar uma seção sem tocar nas demais alterações ou imagens. A chave do provedor fica exclusivamente no servidor. Siga `AGENTS.md` e teste respostas inválidas e preservação do conteúdo.

### Etapa 6 — `feat(admin): autenticar administrador e gerenciar modelos pdf`

**Objetivo funcional:** Proteger uma área exclusiva do administrador para criar, revisar e publicar templates PDF que serão escolhidos por usuários.

**Nota de replanejamento:** A Etapa 3 já entregou a tela de login integrada a `POST /api/v1/admin/session`, a verificação de sessão em `/admin`, logout e listagem somente leitura de modelos. Esta etapa deve consolidar esses fluxos e implementar CRUD, prévia e publicação.

**Passo a passo técnico:**
1. Fortalecer as rotas administrativas e o tratamento de sessão expirada; não embutir senha/token em código cliente.
2. Validar login/logout e autorização no navegador contra os contratos da API, incluindo falhas de rede e sessão expirada.
3. Criar CRUD de modelos PDF, com nome, descrição, status publicado/inativo e conteúdo HTML/CSS dentro dos limites definidos.
4. Oferecer placeholders documentados para campos do relatório e prévia com dados de exemplo.
5. Sanitizar/restringir HTML e CSS, bloquear JavaScript e renderizar a prévia em contexto isolado; não executar conteúdo arbitrário no DOM da aplicação.
6. Persistir modelos no backend e fornecer somente modelos publicados à experiência pública.

**Critérios de aceitação (DoD):**
- Visitante não autenticado não acessa telas nem endpoints administrativos; login/logout e sessão são testados.
- Admin pode criar, editar, pré-visualizar, publicar e despublicar modelos.
- HTML/CSS potencialmente inseguro é rejeitado ou sanitizado conforme política explícita; JavaScript nunca é executado.
- Os modelos publicados chegam ao seletor público e alterações/inativação são refletidas corretamente.

**Prompt copiável:**  
> Implemente a área de autenticação exclusiva do administrador e o CRUD de modelos visuais para PDF conforme Etapa 6 de `plan.md`. Use a autenticação de servidor decidida na Etapa 1; proteja rotas e endpoints, sem credenciais no frontend. Aceite HTML/CSS restritos sem JavaScript executável, gere a prévia PDF no servidor e apresente-a no visualizador nativo do navegador. Faça modelos publicados aparecerem no fluxo público. Atualize documentação, graphify e testes funcionais de permissão.

**Entrega realizada (2026-11-10):** A sessão existente protege a área e os endpoints administrativos; `/admin` mantém o gerenciador montado durante atualizações para não descartar o formulário em edição. O CRUD permite criar/editar rascunhos, gerar prévia PDF com dados fictícios no visualizador nativo do navegador, publicar/despublicar e excluir somente rascunhos. O iframe da prévia não usa `sandbox`, pois ele bloqueia o visualizador PDF do Chrome; a API retorna somente `application/pdf` gerado no servidor. Templates aceitam tags semânticas seguras, seletores CSS usuais, rodapés fixos e `@page` com margem/tamanho de papel e caixa de numeração `@bottom-right` restritos, sem scripts ou acesso à rede. O seletor público lista apenas modelos publicados. Testes API e E2E cobrem autorização, fluxo CRUD, prévia, publicação e reflexo no seletor.

### Etapa 7 — `feat(exportacao): exportar pdf docx e markdown`

**Objetivo funcional:** Gerar todos os formatos selecionados a partir da mesma versão revisada do relatório, aplicando o modelo do admin ao PDF.

**Passo a passo técnico:**
1. Implementar PDF server-side a partir do relatório estruturado e do template PDF selecionado, com HTML/CSS e imagens validados.
2. Implementar DOCX com formatação padrão do MVP, títulos, seções, detalhes e imagens/legendas quando suportados pelo exportador escolhido.
3. Implementar Markdown com estrutura semântica e referências/embeds de imagens de forma documentada.
4. Permitir exportar múltiplos formatos escolhidos, indicar progresso/falhas por formato e oferecer download de cada resultado sem recomeçar o fluxo.
5. Garantir que o conteúdo exportado corresponde à última versão editada e que nomes/extensões MIME estão corretos.
6. Aplicar limites e limpeza de arquivos temporários no servidor, se usados.

**Critérios de aceitação (DoD):**
- Um relatório pode gerar qualquer formato ou vários em uma execução/fluxo.
- PDF respeita o modelo publicado escolhido; DOCX e Markdown usam os padrões próprios documentados.
- Títulos, seções ordenadas, conteúdo, detalhes e imagens/legendas são mantidos de acordo com as capacidades declaradas de cada formato.
- Falha de um formato não apaga o relatório nem mascara o sucesso/falha dos outros.
- Testes validam conteúdo/tipo dos arquivos e o fluxo E2E de exportação/download.

**Prompt copiável:**  
> Implemente os exportadores PDF, DOCX e Markdown para o relatório estruturado, seguindo Etapa 7 de `plan.md` e decisões de arquitetura. PDF deve aplicar o template administrativo publicado escolhido, com renderização isolada/segura; DOCX e Markdown usam a formatação padrão do MVP. Suporte seleção de múltiplos formatos e reporte erros por formato sem perda de conteúdo. Valide arquivos e downloads com testes apropriados.

**Entrega realizada (2026-11-10):** O editor envia todos os formatos selecionados em paralelo usando o mesmo snapshot do rascunho; cada resultado mantém estado/erro próprio, permite retry isolado e oferece download individual sem interromper os demais. PDF e DOCX recebem as imagens referenciadas; Markdown não envia os binários e registra legenda ou nome da imagem como referência textual, conforme a decisão de arquitetura pendente sobre distribuição de imagens. A API rejeita formatos não selecionados, valida os anexos dos formatos binários e devolve MIME/extensão por formato. O serializador Markdown escapa HTML/markup e normaliza quebras de linha para evitar conteúdo controlado pelo usuário alterar a estrutura. Testes API validam contrato, cabeçalhos e payload; E2E cobre snapshot, falha/retry isolado e downloads.

### Etapa 8 — `test(mvp): validar fluxos e atualizar governanca`

**Objetivo funcional:** Validar ponta a ponta os fluxos públicos e administrativos, fechar lacunas de segurança e alinhar toda documentação à implementação real.

**Passo a passo técnico:**
1. Criar/ajustar testes Playwright para landing, modal, fluxo manual, fluxo IA, retomada local, edição de seções, login admin, CRUD de modelo e downloads.
2. Executar lint, build e testes E2E; testar configurações e falhas relevantes sem depender de serviços reais quando houver mocks seguros.
3. Revisar validação de entrada, autorização, upload, sanitização/renderização HTML, exposição de segredos, limites de uso e erros.
4. Executar `npm audit` e SAST quando aplicável às dependências/integrações adicionadas.
5. Atualizar `AGENTS.md` (rotas, árvore, entidades, regras, ambiente, histórico), `README.md`, `.env.example` e graphify.
6. Confirmar que os artefatos de planejamento e EGM estejam isolados em `00-anything/{sequencial} - {nome} {data}/`.
7. Seguir o fluxo de branch dedicada e push exigido pelo `AGENTS.md` ao concluir a implementação.

**Critérios de aceitação (DoD):**
- Fluxos de usuário/admin e exportação estão cobertos por testes funcionais relevantes.
- Build e lint passam; auditorias aplicáveis foram executadas e achados críticos tratados.
- Documentação e grafo refletem o estado implementado e `.env.example` não contém segredos.
- Implementação está em branch dedicada, com commits semânticos e push conforme governança do projeto.

**Prompt copiável:**  
> Feche a implementação do MVP seguindo Etapa 8 de `plan.md`: valide fluxos críticos com Playwright, rode lint/build e auditorias aplicáveis, corrija falhas relacionadas ao escopo e atualize `AGENTS.md`, `README.md`, `.env.example` e graphify. Confirme segurança de autenticação, chamadas de IA, upload, HTML/CSS de templates, exportadores e ausência de segredos no cliente. Não reverta alterações alheias e siga o fluxo de branch/commit/push do `AGENTS.md`.

**Entrega realizada (2026-11-10):** Os fluxos existentes de landing/modal, edição e retomada manual, geração/regeneração com IA, exportação/download e administração têm cobertura E2E; a API tem testes de contratos, limites, autorização, templates, IA, upload e exportadores. Foi adicionado teste para rejeitar login sem `Origin` e com origem externa. A validação também corrigiu uma corrida em que a canonicalização da URL poderia recarregar um draft já ativo e sobrescrever edições em memória. Lint, build, 12 testes API, 16 testes E2E e `npm audit` passaram; a auditoria de dependências reportou zero vulnerabilidades. Semgrep (`p/javascript` e `p/nodejs`, métricas desativadas) reportou apenas uma regra genérica `express` em `reply.send(result)`; a linha envia bytes/texto gerados pelos serializadores, com MIME explícito e `Content-Disposition: attachment`, e não renderiza HTML, portanto é falso positivo para este endpoint Fastify. `.env.example` contém valores vazios para segredos, `.env` é ignorado pelo Git, o Graphify foi atualizado e a tabela Playwright reflete o cache configurado. A decisão de provedor/produção continua pendente; esta validação não aprova deploy público.

## 6. Dependências entre etapas

```text
Etapa 1 (decisões técnicas)
  └── Etapa 2 (API, contratos e serviços seguros)
       ├── Etapa 3 (landing e início do fluxo)
       ├── Etapa 4 (editor manual e persistência local)
       │    └── Etapa 5 (geração/regeneração por IA)
       ├── Etapa 6 (login admin e templates PDF)
       └── Etapa 7 (exportadores; depende dos contratos do relatório,
            dos modelos PDF e da escolha técnica da Etapa 1)
            └── Etapa 8 (validação final e governança)
```

Observação: Etapas 3 e 4 podem avançar com dados de teste após a Etapa 1 enquanto a API está em desenvolvimento, desde que os contratos definidos sejam respeitados. Integração real de IA, modelos persistidos e exportação final dependem da Etapa 2 e das decisões correspondentes.

## 7. Fora do MVP

- Cadastro/login de usuários finais, equipes, colaboração ou compartilhamento.
- Pagamentos, planos e cobrança por uso.
- Histórico centralizado de relatórios e sincronização entre dispositivos.
- Templates customizados de DOCX e Markdown.
- Interpretação de imagens ou envio de imagens à IA.
- Execução de JavaScript em templates ou componentes React arbitrários salvos no banco.
- Recursos avançados de pesquisa/citação com garantia de fontes, salvo decisão futura explícita.

## 8. Notas de execução e governança

- Este plano está isolado na pasta sequencial `00-anything/02 - gerador de relatorios 2026-11-09/`, conforme `AGENTS.md`. Ao iniciar a implementação, criar uma nova pasta sequencial para os artefatos da execução; não salvar drafts na raiz.
- Usar nomes em português quando fizer sentido, styled-components terminados em `Stl` e os helpers/camadas de `services`, hooks e páginas existentes.
- Toda alteração estrutural deverá atualizar o `AGENTS.md`, seu histórico, `README.md` quando afetar a experiência/configuração e o grafo graphify.
- A integração Linear não foi assumida; as etapas acima incluem objetivos, passos, DoD e prompts copiáveis para execução manual.
