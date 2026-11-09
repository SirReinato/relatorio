# Decisões de Arquitetura — SIR-68 / Etapa 1

**Data:** 2026-11-09  
**Issue:** `SIR-68` — `docs(arquitetura): decidir backend, IA, persistencia e exportadores`  
**Branch:** `renatofranca2881/sir-68-etapa-1-docsarquitetura-decidir`  
**Status:** Arquitetura de protótipo escolhida; implantação pública e fornecedor de IA precisam de validação do proprietário antes de ativar serviços reais.  
**Referências de produto:**  
- `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`
- `00-anything/02 - gerador de relatorios 2026-11-09/design_draft.md`
- `00-anything/02 - gerador de relatorios 2026-11-09/egm_review_report.md`
- `00-anything/02 - gerador de relatorios 2026-11-09/egm_resolve_report.md`

---

## 1. Resumo da decisão

Na elaboração da Etapa 1, o repositório era uma SPA React/Vite sem API, banco, autenticação, integração com LLM ou armazenamento de produto. Como hospedagem, orçamento e requisitos de retenção ainda não foram aprovados, a Etapa 1 escolheu uma arquitetura de **protótipo local e de baixo volume**, sem tratar a infraestrutura como pronta para produção.

**Atualização após a Etapa 2 (2026-11-09):** a API Fastify foi implementada com adaptadores fake, OpenAI Responses e Gemini `generateContent`. A pedido do proprietário, Gemini está configurado como provedor local de desenvolvimento com segredo server-side; isso não aprova tráfego público nem altera as pendências de privacidade, orçamento e hospedagem registradas abaixo. A tabela desta seção descreve as decisões no momento da Etapa 1.

| Camada | Decisão para o protótipo | Situação na Etapa 1 |
|---|---|---|
| Aplicação web | Manter React 18 + Vite + `react-router-dom` + styled-components; clientes de API ficam em `src/services/` | Stack existente |
| API | Node.js 24 LTS + Fastify 5, no mesmo repositório e origem da SPA; Vite faz proxy de `/api` em desenvolvimento | Selecionado como arquitetura-alvo, ainda não implementado |
| Banco de protótipo | SQLite com arquivo em volume persistente para conta admin, sessões e templates; uma instância da API | Selecionado para protótipo; não assumir múltiplas réplicas |
| Rascunhos anônimos | IndexedDB no navegador para JSON do relatório e `Blob`s de imagem | Selecionado; não sincroniza nem envia conteúdo até operação remota |
| LLM | Contrato `ReportGenerator` isolado; adaptador fake determinístico em testes/protótipo. OpenAI Responses API era candidato recomendado para primeiro piloto real, sujeito a conta, orçamento e revisão de termos | Não ativar chave/provedor nesta etapa |
| PDF | Playwright com Chromium no serviço Node, `page.pdf()`; template do sistema como fallback e templates admin restritos | Selecionado; requer runtime com Chromium, não Edge Functions |
| DOCX | Biblioteca `docx` no servidor, produzindo DOCX a partir do mesmo relatório semântico | Recomendação; validar compatibilidade no spike de implementação |
| Markdown | Serializador próprio a partir do schema de conteúdo em texto simples; sem converter HTML arbitrário | Selecionado; imagem requer decisão/UX adicional registrada abaixo |
| Arquivos temporários | Upload de imagens apenas junto da requisição de exportação; arquivo exportado transmitido diretamente e temporários removidos em `finally`/expiração | Proposta a implementar e testar |

Esta escolha mantém o MVP em JavaScript/Node, deixa o renderizador PDF perto da API, não cria dependência de contas de usuário final e permite iniciar com dados locais. Não é uma autorização para publicar o protótipo na internet sem rate limiting, proteção de custo, HTTPS, segredo de admin e política de dados revisados.

**Ambiente observado nesta tarefa:** Node.js `v26.1.0` e npm `11.13.0`. A baseline escolhida para implementação é Node.js 24 LTS; a API ainda não existe e essa baseline não foi validada por build/teste nesta issue.

## 2. Comparação de alternativas

### 2.1 API e persistência

| Opção | Benefícios | Custos/riscos | Decisão |
|---|---|---|---|
| **Node.js + Fastify + SQLite em container/VM** | Uma linguagem no frontend e backend; schemas JSON Schema integrados ao Fastify; controle sobre sessões, upload e Playwright/Chromium; SQLite é simples para poucos registros e um único admin | Necessita hospedar e operar API; arquivo SQLite precisa de volume persistente e backup; SQLite não deve ser compartilhado por réplicas concorrentes; Chromium aumenta o tamanho do container | **Selecionada para protótipo de instância única** |
| Backend-as-a-Service (ex.: Supabase) | Banco gerenciado, auth/storage prontos e menos operação de banco | PDF ainda exige worker Node/Chromium separado; autenticação gerenciada precisa ser adaptada para um único admin e regras do projeto; dados de relatório poderiam ser persistidos desnecessariamente | Não selecionada agora; reavaliar se publicação gerenciada/escala for requisito |
| Edge/serverless functions | Escala automática e pouca gestão de servidor | Execução curta/efêmera, limites de runtime e incompatibilidade operacional com Chromium completo tornam exportação PDF mais complexa; provavelmente exige outro serviço de renderização | Não selecionada para geração de PDF |

**Limite de validade:** se a implantação escolhida não oferece processo Node persistente e volume durável, SQLite/Playwright deixam de ser uma escolha operacional válida. Nessa situação, reabrir a decisão antes de implementar deployment, usando PostgreSQL gerenciado para metadados e serviço/container Node persistente para renderização.

### 2.2 Provedores de IA

Comparação resumida das páginas oficiais consultadas em **2026-11-09**. Preços são USD por milhão de tokens e podem mudar; consultar novamente e avaliar o modelo efetivamente disponível antes de ativar integração. Não são orçamento nem promessa de custo por relatório.

| Provedor | Exemplo de preço publicado consultado | Dados/termos relevantes | Avaliação |
|---|---|---|---|
| OpenAI API | GPT-5 mini: US$ 0,25 input / US$ 2,00 output por 1M tokens na tabela oficial consultada | API não usa conteúdo para treinamento por padrão; logs de monitoramento contra abuso podem reter conteúdo por até 30 dias, com exceções/controles de retenção sujeitos a elegibilidade | Melhor candidato inicial: preço de exemplo competitivo e suporte documentado a saída JSON Schema estruturada; não ativar sem chave/server config e revisão dos termos atuais |
| Anthropic API | Claude Sonnet 5: US$ 2 input / US$ 10 output por 1M tokens na tabela consultada; Claude Haiku 5.5 lista US$ 0,10 / US$ 0,50 para prompts até 100k tokens | Termos comerciais consultados afirmam que Anthropic não treina modelos com Customer Content e que o cliente deve avaliar/verificar fatos dos outputs | Alternativa forte; validar disponibilidade/modelo, estruturação de JSON e preço aplicável à conta |
| Google Gemini API | O preço depende fortemente do modelo/tier; a página lista tier pago e alterações de preço datadas, devendo ser conferida na seleção | Termos consultados indicam que serviços não pagos podem usar prompt e resposta para melhorar produtos e permitir revisão humana; tier pago diz que o conteúdo não é usado para melhorar produtos | Não usar tier gratuito para conteúdo enviado por usuários; tier pago é candidato possível após análise de preço, região e termos |

**Recomendação para piloto real:** manter interface de provedor (`ReportGenerator`) desacoplada e avaliar saída estruturada e qualidade em português. OpenAI era a recomendação inicial; Gemini foi habilitado posteriormente a pedido do proprietário para desenvolvimento local. Nenhum provedor é aprovado para piloto público sem revisão de orçamento, privacidade e termos. Nenhuma chave é colocada em `VITE_*`, arquivos versionados, browser ou commits.

#### Estimativa ilustrativa, não cotação

Com o preço de exemplo GPT-5 mini consultado, uma chamada que use 3.000 tokens de entrada e 4.000 tokens de saída custaria aproximadamente **US$ 0,00875** (3.000 × US$ 0,25/M + 4.000 × US$ 2/M), antes de retries, outros modelos, cache, impostos, variação de tamanho e mudanças de preço. Regenerar seções consome chamadas adicionais. Impor limites de tokens e orçamento no backend/provedor antes de qualquer piloto público.

### 2.3 Exportadores

| Formato | Escolha | Observações |
|---|---|---|
| PDF | Playwright `page.pdf()` com Chromium | Gera PDF a partir de página Chromium; serviço precisa distribuir/instalar browser compatível. HTML/CSS de templates deve ser validado e executado sem JavaScript, com requisições de rede bloqueadas. |
| DOCX | `docx` (JavaScript/TypeScript) | Constrói parágrafos e imagens com a API de documento; não tentar converter HTML arbitrário do template PDF. Mapear campos semânticos para estilos padrão e testar abertura do arquivo. |
| Markdown | Serializador interno pequeno | O schema é texto simples com parágrafos; headings, listas de detalhes e links são serializados com escape. Não é necessário parser HTML/Markdown nem `dangerouslySetInnerHTML`. |

**Imagens em Markdown:** `.md` sozinho não embute binários de forma interoperável. Proposta para MVP: arquivo Markdown referencia `images/<nome-seguro>` e o download associado é um pacote ZIP com o `.md` e suas imagens quando houver anexos; sem imagens, entregar `.md` direto. Isso exige confirmação de produto, pois a seleção atual diz “Markdown” e não menciona ZIP. Não implementar essa experiência até confirmar; alternativa simples é exportar `.md` com legenda/alt-text sem anexar imagem, explicitando a limitação.

## 3. Responsabilidades e dependências do sistema

```text
Browser (React/Vite)
  ├─ IndexedDB: rascunhos e Blob de imagens (local, sem sync)
  ├─ UI: edição, preview aproximado, seleção final de formatos
  └─ HTTPS / same-origin /api
       └─ Node 24 LTS + Fastify
            ├─ JSON Schema: validação das rotas e payloads
            ├─ SQLite: hash/registro do admin, sessões e templates
            ├─ ReportGenerator interface
            │    ├─ fake deterministic (tests/dev)
            │    └─ provider adapter real (depois de aprovação/configuração)
            ├─ TemplateRenderer: sanitize + placeholders escapados + Chromium isolado
            ├─ ExportService: PDF / DOCX / Markdown
            └─ temporários: disco temporário/memória, sem guardar relatórios
```

- **Desenvolvimento:** `npm run dev` atende a SPA; Vite encaminha `/api` para Fastify. O modo fake não exige rede ou chave externa.
- **Execução protótipo:** um processo Node serve `/api` e pode servir `dist/`; origem única evita CORS. HTTPS deve terminar no proxy/plataforma de deploy.
- **Produção:** exige container/VM com Chromium, volume SQLite durável (ou migração documentada para PostgreSQL), backups protegidos, rate limit, monitoramento e retenção revisados. Nenhum provedor de hospedagem foi selecionado nesta issue.
- **Logs:** request ID, rota, status e duração; não registrar texto do relatório, imagem, prompt, senha, cookie, chave de API ou HTML/CSS completo de template.

## 4. Modelo semântico e limites iniciais propostos

O conteúdo editável é **texto simples com quebras de linha**, sem HTML livre e sem Markdown de entrada no MVP. O exportador Markdown compõe a sintaxe do `.md`; DOCX/PDF preservam parágrafos, quebras e detalhes por conversores próprios. Esta decisão é deliberadamente mais simples e segura que rich text; se listas/ênfase dentro do corpo forem requisito, reabrir o contrato antes da Etapa 4.

```json
{
  "schemaVersion": 1,
  "id": "uuid",
  "title": "string",
  "topic": "string",
  "brief": {
    "objective": "string|null",
    "audience": "string|null",
    "desiredLength": "short|medium|long|null",
    "tone": "string|null",
    "references": ["string"]
  },
  "sections": [
    {
      "id": "uuid",
      "title": "string",
      "body": "plain text with newline paragraph breaks",
      "importantDetails": ["string"],
      "images": [
        {
          "id": "uuid",
          "fileName": "string",
          "mediaType": "image/jpeg|image/png|image/webp",
          "sizeBytes": 1234,
          "caption": "string|null"
        }
      ]
    }
  ],
  "selectedFormats": ["pdf", "docx", "markdown"],
  "pdfTemplateId": "system-default|published-template-id|null",
  "updatedAt": "ISO-8601"
}
```

Os binários não entram no JSON persistido; ficam como `Blob`s na IndexedDB e são anexados em multipart ao export. `pdfTemplateId` pode ficar no rascunho quando PDF estiver temporariamente desmarcado. Identificador de rascunho e `schemaVersion` permitem futuras migrações locais.

### Limites para primeiro protótipo público restrito

São valores iniciais configuráveis, não limites impostos por conta de fornecedor; observar testes/usabilidade e revalidar antes de público geral:

| Campo/ação | Limite inicial proposto |
|---|---:|
| Título / tema | 200 / 500 caracteres |
| Objetivo, público, tom | até 2.000 caracteres cada |
| Referências | até 10, máximo 500 caracteres cada; URL guardada como texto, nunca acessada |
| Seções | máximo 20 |
| Título de seção | 200 caracteres |
| Corpo de seção | 12.000 caracteres; total do relatório máximo 50.000 |
| Detalhes importantes | até 20 por seção, 500 caracteres cada |
| Imagens | JPEG/PNG/WebP apenas; SVG/GIF/PDF rejeitados |
| Cada imagem / relatório | 5 MiB / 20 MiB no total; JPEG/PNG/WebP; validar assinatura e decodificação no servidor; máximo 12 megapixels e 5.000 px por dimensão |
| Modelo HTML/CSS | 50 KiB por campo, no máximo 100 KiB combinados |
| Tokens de saída LLM | até 6.000 por geração completa; regeneração recebe limite menor configurável (ex.: 2.000) |
| Timeout inicial | IA 90s; exportador por formato 60s |
| API pública de IA | no máximo 3 chamadas por IP em 10 minutos como início; configurar atrás de proxy confiável, adicionar limite diário e budget/alerta de gasto antes de piloto público |

Os limites são rejeitados com erro de validação claro. O navegador também deve detectar `QuotaExceededError`/indisponibilidade IndexedDB, preservar o rascunho em memória e avisar que novas alterações não foram persistidas. Não limpar conteúdo automaticamente para liberar espaço.

## 5. Persistência e ciclo de vida

### 5.1 Rascunhos de visitantes

- IndexedDB mantém até 10 rascunhos locais como limite de experiência inicial; quota real é decidida pelo browser, por isso não prometer espaço garantido.
- Guardar JSON e imagens como `Blob`; não usar `localStorage` para binários/documentos grandes.
- Texto/imagens não saem do navegador até ação de geração ou exportação; mostrar aviso antes da primeira transmissão remota.
- Abrir outro navegador/dispositivo não sincroniza. Não existe conta/histórico server-side.
- Falha de gravação mantém edição em memória e mostra aviso persistente com retry; não simular “salvo”.

### 5.2 Dados do servidor

- SQLite no protótipo guarda apenas configuração administrativa necessária: usuário admin (hash de senha), sessão (armazenamento de sessão), templates e metadados/auditoria sem conteúdo do relatório.
- Relatórios anônimos e prompts não são persistidos pela aplicação depois da resposta; logs excluem conteúdo.
- Upload de exportação é transitório; usar `try/finally` para remover arquivos e um job de limpeza de resíduos com mais de 1 hora no arranque/execução. O tempo deve ser revalidado para deploy real.
- Exportação retorna bytes no response como attachment; sem URL de download pública persistida. No piloto, limitar tamanho e streamar quando possível.
- Backup do SQLite contém credenciais hash e modelos: proteger volume e cópias, restringir acesso e definir rotação de backup antes de produção.

## 6. Autenticação e configuração secreta

- Uma conta admin apenas; senha provisionada fora do Git em segredo de servidor no primeiro arranque, nunca senha padrão versionada.
- Persistir hash usando `scrypt` com salt aleatório e parâmetros documentados; não armazenar senha em claro.
- Primeiro provisionamento recebe variável server-side de uso único (por exemplo `ADMIN_INITIAL_PASSWORD`) e grava hash; removida após uso. A aplicação deve falhar de forma explícita se não houver configuração segura, sem criar credencial conhecida.
- Sessão opaca armazenada no servidor/SQLite, cookie `HttpOnly`, `Secure` em produção, `SameSite=Lax`, path restrito e expiração; proteção CSRF/Origin em mutações.
- Logout invalida sessão. Alteração/rotação só por sessão autenticada ou procedimento operacional local documentado; não existe reset público.
- Segredos de LLM permanecem somente no ambiente do servidor, por exemplo `OPENAI_API_KEY` ou `GEMINI_API_KEY`; nenhuma chave administrativa/provider começa com `VITE_`.
- Não criar segredo real nem valor de exemplo com aparência de credencial em `.env.example`.

## 7. Contratos HTTP propostos

Prefixo `/api/v1`. Schemas JSON Schema compartilháveis entre documentação e Fastify; validação no limite da API e validação adicional de conteúdo gerado por LLM. Os contratos abaixo foram implementados como API de protótipo na Etapa 2.

### 7.1 Erro comum

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos indicados.",
    "requestId": "opaque-id",
    "retryable": false,
    "fieldErrors": [{ "field": "topic", "message": "Informe o tema." }]
  }
}
```

Não devolver mensagem bruta do provedor, trace, segredo, caminho local ou HTML completo.

### 7.2 Criação manual

Criação manual é local: UI constrói `ReportDraft`, grava no IndexedDB e navega pelo `id`. Não há `POST /reports` nem armazenamento de relatório anônimo no servidor. A exportação transmite snapshot do draft apenas quando o usuário solicita.

### 7.3 Geração IA e regeneração

`POST /api/v1/ai/reports`

```json
{ "topic": "string", "brief": { "objective": null, "audience": null, "desiredLength": "medium", "tone": null, "references": [] } }
```

Resposta `200`: objeto `ReportDraft` validado segundo `schemaVersion: 1`. Não incluir imagens. O frontend grava resultado em IndexedDB.

`POST /api/v1/ai/sections/regenerate`

```json
{
  "reportContext": { "title": "string", "topic": "string", "brief": {}, "sectionTitles": ["..."] },
  "targetSection": { "id": "uuid", "title": "string", "body": "string", "importantDetails": ["..."], "clientRevision": 4 }
}
```

Resposta é uma **proposta** (`sectionId`, conteúdo proposto, revisão recebida), nunca mutação/persistência do servidor. O cliente só aceita se a revisão ainda for atual; divergência produz UX de comparar/aceitar/descartar. Imagens não são enviadas.

Timeouts, rate-limit, indisponibilidade, refusals e schema inválido têm códigos distintos e `retryable` preciso; retry não ocorre em silêncio e mantém o draft original.

### 7.4 Templates e administrador

- `GET /api/v1/templates?visibility=published` — templates públicos publicados + `system-default`, sem conteúdo privado/rascunho.
- `POST /api/v1/admin/session` — autentica, emite cookie de sessão protegido; erro genérico de credencial.
- `DELETE /api/v1/admin/session` — logout.
- `GET /api/v1/admin/templates` — lista rascunhos e publicados.
- `POST /api/v1/admin/templates` — cria rascunho.
- `PUT /api/v1/admin/templates/:id` — substitui/edita rascunho, valida e registra nova versão.
- `POST /api/v1/admin/templates/:id/preview` — renderiza exemplo sintético, sem persistir relatório real.
- `POST /api/v1/admin/templates/:id/publish` e `/unpublish` — ação explícita e auditada.

Modelo `PdfTemplate`: `{id, name, description, html, css, status:draft|published, version, createdAt, updatedAt}`. `system-default` é embutido e não editável/removível.

**Segurança de template:** aceitar HTML sem scripts, handlers de evento, iframes, forms, embeds, object, recursos/URLs externas ou navegação. Placeholders são identificadores explícitos (`{{report.title}}`, `{{section.title}}`, etc.), substituídos com escaping de texto e escape de atributo. Aplicar parser/allowlist de HTML e CSS; remover `url()`, `@import`, `expression`, seletores/declarações proibidos e limitar tamanho. Chromium separado/contexto novo, `javaScriptEnabled: false`, sem cookies/storage da aplicação e todas requisições de rede bloqueadas; timeout/memória por renderização. Não permitir upload de template executável nem `dangerouslySetInnerHTML` no app.

### 7.5 Exportação

`POST /api/v1/exports/pdf|docx|markdown`, multipart/form-data:

- Campo `report`: JSON snapshot já validado.
- Partes de imagem com IDs que correspondem a `report.sections[].images[].id`.
- PDF recebe `templateId` publicado ou `system-default`; DOCX/Markdown ignoram template.
- Uma requisição por formato, retornando arquivo como `Content-Disposition: attachment`; `Content-Type` correto e nome derivado de título sanitizado.
- Falhas são isoladas por formato no cliente; pode tentar novamente sem alterar o draft ou refazer formato já concluído.
- Nenhum formato pode incluir arquivo que não esteja referenciado no snapshot enviado.
- Resultado multilíngue não usa template HTML salvo; PDF, DOCX e Markdown consomem estrutura semântica comum.

Para Markdown com imagens, contrato final depende da decisão do usuário sobre `.md` simples vs. pacote ZIP com referências e assets. Não enviar um `.md` com caminhos que não acompanham o arquivo sem explicitar a limitação.

## 8. Erros, observabilidade e proteção de abuso

| Situação | Comportamento |
|---|---|
| Payload inválido ou acima de limites | `400/413`, erro de campo/código, manter edição |
| Sem sessão / sessão expirada | `401`, não executar endpoint admin |
| Sem permissão | `403`, sem detalhes de recurso que revelem conteúdo |
| Rate limit | `429`, tempo de espera/retry explícito |
| LLM timeout / provedor indisponível | `504/503`, `retryable:true`, preservar rascunho |
| LLM recusa ou saída fora do schema | erro explícito, não popular editor com sucesso incompleto |
| Exportador falha | erro por formato; manter sucesso dos demais e permitir retry |
| IndexedDB indisponível/cheio | manter estado em memória, marcar como não salvo e oferecer exportar/copiá-lo; nunca afirmar persistência |
| Template inválido ou exportador não consegue aplicá-lo | erro explícito, recomendar `system-default`, sem apagar seleção/conteúdo |

Pré-requisitos para tráfego público real:

- Rate limiting verificado atrás de proxy confiável e proteções antiabuso adicionais para geração custosa.
- Limite de gasto/alertas no provedor de IA, quota e timeout.
- HTTPS e cookies `Secure`; política CORS same-origin.
- Logs sem conteúdo pessoal, request IDs, métricas de latência/erros/custo agregados.
- Política de privacidade/aviso de envio e revisão de termos/região/retention com proprietário.
- Limpeza/teste de temporários e limites de recursos do Chromium.
- Backup/restore do volume de templates e procedimento administrativo.

## 9. Plano de teste técnico antes da integração externa

1. **Fastify/contratos:** validação de payload e multipart, erro envelope, rate limit e sessão com SQLite temporário.
2. **LLM fake:** fixture JSON determinística e fixtures inválidas; testar timeout/falha sem chamada de rede.
3. **Regeneração:** atraso concorrente não substitui seção modificada; request duplicada bloqueada.
4. **IndexedDB:** round-trip de vários drafts/Blob; simular quota indisponível; dados permanecem em memória e aviso aparece.
5. **Templates:** testes negativos para script/eventos, `javascript:`, `@import`, `url()`, URLs externas e placeholder não conhecido; confirmar Chromium sem rede/JS.
6. **Exportadores:** PDF abre com Chromium disponível, DOCX é um ZIP Office válido com conteúdo esperado, Markdown escapa corretamente texto/títulos; imagens seguem contrato explicitado.
7. **Carga/limites:** validar limites máximos, timeout e limpeza de arquivos temporários.

## 10. Pendências que exigem decisão do proprietário antes do piloto público

1. Conta, modelo e orçamento de LLM; a recomendação OpenAI não está autorizada/configurada.
2. Plataforma de hospedagem que suporte processo Node, Chromium e volume persistente, ou aprovação de migração do armazenamento.
3. Aceitar contrato de relatório em texto simples (sem formatação rica no corpo) e limite de saída inicial.
4. Exportação Markdown com imagens: `.md` isolado (sem binários) ou pacote ZIP `.md` + imagens.
5. Política final de privacidade/retention e aprovação do envio de prompts/relatórios a provedor terceirizado.
6. Aprovar limites de chamadas por IP, gasto e arquivos após spike de custo/experiência.
7. Editor de templates: código restrito, visual por blocos ou híbrido; a opção HTML/CSS irrestrita não será suportada.

## 11. Referências oficiais consultadas

Consultadas em 2026-11-09; verificar conteúdo, disponibilidade regional, modelos e preços novamente na implementação.

- Fastify Getting Started: https://fastify.dev/docs/latest/Guides/Getting-Started/
- Playwright Page API (`page.pdf`): https://playwright.dev/docs/api/class-page#page-pdf
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- OpenAI data controls: https://developers.openai.com/api/docs/guides/your-data
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Anthropic API pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Commercial Terms: https://www.anthropic.com/legal/commercial-terms
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms
- `docx` library: https://docx.js.org/

## 12. Critérios de saída da SIR-68

- [x] Escolhida arquitetura explícita de protótipo: SPA + API Node/Fastify, SQLite persistente para administração, IndexedDB para rascunhos e Playwright para PDF.
- [x] Comparadas opções de backend/armazenamento e provedores, com custos e políticas de dados consultadas em fontes oficiais.
- [x] Descrito esquema de relatório, limites iniciais, APIs, erros, autenticação, retenção, upload e exportadores.
- [x] Confirmado que o primeiro protótipo pode usar LLM fake; nenhum segredo client-side é necessário.
- [x] Registrados impactos e referências em `AGENTS.md` e `README.md`.
- [ ] Decisões dependentes do proprietário respondidas antes de integração de IA/deploy público.
