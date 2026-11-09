# EGM Draft — Gerador de Relatórios

**Data:** 2026-11-09  
**Base:** `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`  
**Tipo:** Rascunho de produto e experiência; não é especificação técnica final.  
**Status:** Draft de produto refinado após EGM review/resolve. As decisões técnicas do protótipo estão em `00-anything/02 - gerador de relatorios 2026-11-09/architecture_decisions.md`; produção e algumas decisões de UX continuam pendentes de validação.

---

## 1. Síntese do conceito

O **Gerador de Relatórios** é uma aplicação web para transformar um tema em um documento organizado, com ou sem auxílio de IA. A pessoa informa o assunto, escolhe como começar, desenvolve e revisa o conteúdo em etapas, pode ilustrar seções com imagens e então baixa um ou mais formatos.

O sistema tem dois públicos e espaços distintos:

- **Pessoa visitante:** cria e edita relatórios sem cadastro ou login.
- **Administrador:** autentica-se em uma área restrita para criar, revisar e publicar modelos visuais de PDF.

O nome é apenas descritivo para este draft; a marca, identidade visual e eventual nome público do produto ainda não foram definidos.

## 2. Problema e proposta de valor

Produzir um relatório exige organizar ideias, estruturar seções, revisar texto e formatar o documento. O produto reúne esse fluxo em uma única experiência: a IA pode propor uma primeira estrutura, mas a pessoa mantém controle editorial antes da exportação. Quem prefere começar do zero pode escrever manualmente.

**Proposta de valor:** tornar simples sair de um tema ou rascunho para um relatório editável e exportável, preservando a escolha do usuário e permitindo que o administrador ofereça uma identidade visual consistente nos PDFs.

### Princípios de produto

1. **A pessoa controla o documento:** conteúdo gerado por IA é editável; a IA não publica nem exporta sem revisão.
2. **Mesmo editor para os dois caminhos:** criação manual e geração por IA convergem para uma única estrutura editável.
3. **Sem conta para criar:** a entrada no fluxo público não depende de cadastro.
4. **Transparência:** estados de geração, falhas, limites e salvamento devem ser visíveis.
5. **Um conteúdo, várias saídas:** PDF, DOCX e Markdown derivam do mesmo relatório revisado.
6. **Modelos seguros e previsíveis:** templates administrativos não executam JavaScript; cada formato respeita suas capacidades.

## 3. Escopo do MVP

### Incluído

- Landing page explicativa, com CTA para começar e acesso ao login administrativo.
- Criação manual ou assistida por IA, em português do Brasil como padrão.
- Tema obrigatório e parâmetros opcionais, como objetivo, público-alvo, extensão, tom e fontes.
- Edição de título, conteúdo, detalhes importantes e ordem das seções.
- Inclusão, remoção e reordenação de seções.
- Upload de imagens por seção, validação e legenda opcional.
- Prévia e escolha de um modelo PDF publicado.
- Seleção de um ou mais formatos: PDF, DOCX e Markdown.
- Salvamento local retomável do rascunho, dentro dos limites que serão definidos na decisão técnica.
- Login exclusivo de administrador e gestão/publicação de templates PDF em HTML/CSS restritos.
- PDF com o modelo selecionado; DOCX e Markdown com formatação padrão.

### Fora do MVP

- Contas de usuários finais, equipes, colaboração e compartilhamento.
- Pagamentos e planos.
- Histórico centralizado e sincronização entre dispositivos.
- Templates customizados para DOCX ou Markdown.
- Análise ou interpretação de imagens pela IA.
- JavaScript executável ou componentes React arbitrários nos templates.
- Pesquisa com fontes verificadas ou garantia de citações.

## 4. Mapa da experiência

```text
Landing page
  ├─ Iniciar novo relatório
  │    └─ Modal: IA ou manual + formato(s) + modelo PDF
  │         ├─ Informar tema/parâmetros (se IA)
  │         └─ Editor comum
  │              ├─ Editar seções e detalhes
  │              ├─ Incluir imagens e legendas
  │              ├─ Regenerar seção (se IA)
  │              ├─ Pré-visualizar
  │              └─ Exportar formatos selecionados
  └─ Acesso administrativo
       └─ Login
            └─ Painel de modelos PDF
                 ├─ Criar/editar HTML e CSS
                 ├─ Pré-visualizar
                 └─ Publicar/despublicar
```

### Navegação sugerida

- `/` — landing page pública.
- `/relatorio/novo` — inicialização e formulário de tema/briefing, conforme o modo escolhido.
- `/relatorio/editar` — editor do rascunho atual.
- `/admin/login` — autenticação administrativa.
- `/admin/modelos` — lista e gestão de templates PDF, protegida.
- `/admin/modelos/novo` e `/admin/modelos/:id` — criação e edição, protegidas.

As rotas são uma proposta para o refinamento, não um compromisso arquitetural. O plano atual descreve os fluxos, mas deixa a decisão concreta de rotas e passagem de rascunho para implementação.

## 5. Rascunho de telas e conteúdo

### 5.1 Landing page

**Objetivo:** explicar rapidamente o que o sistema faz e conduzir à criação.

**Hierarquia de conteúdo:**

1. Cabeçalho com nome do produto e botão discreto **Entrar como administrador**.
2. Banner principal:
   - Título orientado ao resultado, por exemplo: “Crie relatórios claros, do seu jeito”.
   - Texto curto explicando criação por IA ou manual, edição e exportação.
   - CTA primário: **Iniciar novo relatório**.
3. Explicação do fluxo em três passos: escolha como começar, revise o conteúdo, exporte.
4. Reforço de que é possível editar antes de baixar.
5. Rodapé simples e informativo.

O conteúdo final de marketing não está fechado. Evitar prometer precisão factual, pesquisa automática ou fontes verificadas, pois isso não está definido no escopo.

### 5.2 Modal “Novo relatório”

**Objetivo:** coletar as decisões iniciais sem sobrecarregar a landing page.

**Campos/decisões:**

- Modo inicial: **Gerar com IA** ou **Escrever manualmente**.
- Formatos desejados: caixas de seleção para **PDF**, **DOCX** e **Markdown**; permitir mais de uma seleção.
- Modelo PDF: mostrar apenas se PDF estiver selecionado e listar o modelo padrão do sistema mais os modelos publicados pelo administrador. O modelo padrão mantém a exportação PDF disponível antes da publicação do primeiro modelo personalizado.
- Ação principal coerente com o modo selecionado, como **Continuar com IA** ou **Começar a escrever**.
- Ação secundária para cancelar/fechar.

**Comportamento:** a modal registra as preferências iniciais; a tela de revisão/exportação é a fonte de verdade para formatos e modelo final. Permitir continuar sem formato selecionado e exigir pelo menos um na revisão/exportação. Ao desmarcar PDF, manter o último modelo escolhido no rascunho, mas não exigir carregá-lo para gerar outros formatos. Se a lista de modelos personalizados falhar, preservar o rascunho, oferecer o modelo padrão e informar o problema.

**Acessibilidade:** foco inicial apropriado, foco contido na modal, fechamento por Escape, rótulos associados e retorno do foco ao botão que a abriu.

### 5.3 Briefing para geração por IA

**Objetivo:** obter contexto suficiente sem transformar o início em um formulário longo.

**Entrada obrigatória:**

- Tema/assunto do relatório.

**Entradas opcionais sugeridas no plano:**

- Objetivo.
- Público-alvo.
- Extensão desejada.
- Tom.
- Referências textuais ou URLs fornecidas pelo usuário. O MVP não navega até URLs, não lê documentos enviados e não garante que referências sejam consultadas ou verificadas.

**Estado durante a geração:** comunicar que o relatório está sendo estruturado; desabilitar submissão duplicada; explicar erros e oferecer nova tentativa sem descartar campos. Limites iniciais configuráveis estão no ADR; cancelamento durante a chamada dependerá do suporte do provedor selecionado.

**Aviso de conteúdo:** deixar claro que a proposta gerada deve ser revisada. Não afirmar que a IA pesquisou ou validou fontes se o produto não tiver uma integração explícita para isso.

### 5.4 Criação manual

**Objetivo:** permitir começar sem geração de IA.

- Solicitar título/tema do relatório.
- Abrir o editor com uma primeira seção em branco ou oferecer uma ação clara para adicionar a primeira seção.
- Evitar exigir campos que não sejam necessários para salvar e continuar.
- Expor as mesmas ações de edição, imagem, prévia e exportação do caminho assistido.

A escolha entre abrir com uma seção vazia e começar numa tela de estrutura ainda deve ser validada no protótipo.

### 5.5 Editor e revisão

**Objetivo:** oferecer controle sobre a estrutura e o conteúdo sem exigir conhecimento de formatação.

**Estrutura visual proposta:**

- Cabeçalho do documento com título e estado do rascunho/salvamento.
- Navegação ou lista de seções, com ação para adicionar e controle de ordenação.
- Área principal da seção atual, com campos de título, conteúdo e detalhes importantes.
- Ações contextuais da seção: regenerar com IA quando aplicável, remover e mover.
- Área de imagem da seção: adicionar/substituir/remover arquivo e preencher legenda opcional.
- Navegação entre etapas ou seções com retorno para prévia/exportação.
- Aviso claro se o salvamento local falhar ou não houver espaço suficiente.

**Regras de interação:**

- Edições manuais não devem ser sobrescritas silenciosamente por geração ou regeneração.
- Regenerar uma seção gera primeiro uma proposta temporária associada à versão enviada. Se o usuário editar a seção enquanto a geração está em andamento, não substituir o conteúdo atual: apresentar a proposta para comparar e aceitar ou descartar. A ação não altera outras seções, imagens ou legendas.
- Impedir submissões duplicadas para a mesma ação enquanto houver uma requisição ativa; resultados de requisições antigas não podem sobrescrever alterações mais recentes.
- Remover seção requer indicação clara da consequência, especialmente quando tiver imagem/conteúdo.
- Mudanças de ordem devem ser refletidas na prévia e nos três formatos de saída. Oferecer ações acessíveis de mover para cima/baixo como alternativa a arrastar e soltar e anunciar a nova posição.

### 5.6 Prévia e exportação

**Objetivo:** confirmar o documento antes de gerar os arquivos.

- Exibir prévia da estrutura final.
- No PDF, usar o template publicado selecionado.
- Para DOCX e Markdown, informar que o MVP utiliza formatação padrão.
- Mostrar os formatos escolhidos e permitir alterá-los; esta tela confirma a seleção final e o modelo PDF.
- Gerar resultados independentes por formato e comunicar progresso e resultado individualmente.
- Se um formato falhar, preservar o relatório e permitir tentar novamente aquele formato sem refazer os bem-sucedidos.
- Fornecer download separado de cada arquivo concluído. Não exigir histórico remoto persistente; resultados temporários devem ter expiração definida antes da produção.
- Se o usuário fechar a página durante a exportação, o rascunho continua local. Sem histórico remoto, resultados que ainda não foram baixados podem precisar ser gerados novamente.

Rotular a prévia como aproximada se não reproduzir a paginação final do PDF. O contrato de imagens no Markdown segue pendente de validação de produto: `.md` simples sem binários ou pacote ZIP com o `.md` e arquivos referenciados. Formatos realmente suportados e expiração dos resultados estão especificados no ADR como valores iniciais para validar.

### 5.7 Área administrativa de modelos PDF

**Objetivo:** permitir que apenas o administrador controle as opções de identidade visual que aparecem ao usuário.

**Lista de modelos:**

- Nome, breve descrição e estado (rascunho/publicado).
- Ações para criar, abrir/editar, pré-visualizar, publicar/despublicar.
- Confirmação antes de despublicar/remover um modelo em uso, com regra final pendente.

**Editor de modelo:**

- Campo para nome e descrição.
- Área de edição do template HTML e dos estilos CSS suportados.
- Referência aos placeholders de dados aceitos, como título, tema, seções, detalhes e imagens/legendas.
- Prévia com um relatório fictício de exemplo, não com conteúdo pessoal real por padrão.
- Validação e mensagem específica para markup/estilos não aceitos.
- Ação explícita para salvar como rascunho e para publicar.

**Decisão de implementação importante:** styled-components deve estilizar a interface React do produto, conforme `AGENTS.md`; não é um formato apropriado para salvar componentes React ou código styled-components executável como template editável no banco. Templates armazenam HTML/CSS restritos, sem JavaScript, processados por pipeline isolada e validada para PDF. Placeholders são escapados; recursos remotos ficam bloqueados. A allowlist recomendada e o isolamento estão registrados no ADR para orientar implementação. O tipo de editor (código restrito, visual ou híbrido) segue pendente de protótipo; não assumir execução de código arbitrário.

**Bootstrap administrativo:** a primeira credencial deve ser provisionada no servidor por um mecanismo fora do repositório, sem senha padrão ou segredo no frontend. A decisão técnica deve definir configuração inicial de uso único, troca/rotação e procedimento de recuperação. Perda de acesso não pode ser resolvida por uma rota pública de redefinição sem autenticação.

**Política inicial de templates:** escapar valores do relatório antes de inseri-los nos placeholders documentados; não executar scripts, eventos inline, componentes React ou código do template. Bloquear recursos remotos (imagens, fontes, CSS e URLs) por padrão. A allowlist recomendada de elementos, placeholders e propriedades CSS e o isolamento de prévia/renderização estão registrados no ADR; a implementação deve validar essa política. Um usuário que despublica um modelo não invalida rascunhos existentes: se o modelo não estiver disponível na exportação, solicitar nova seleção sem descartar conteúdo.

## 6. Modelo conceitual do relatório

O documento é uma estrutura semântica independente do mecanismo de IA e do renderizador:

```text
Relatorio
  id local do rascunho
  titulo
  tema
  parametros opcionais
  formatos selecionados
  modelo PDF selecionado (opcional quando PDF não foi escolhido)
  secoes ordenadas[]
    id
    titulo
    conteudo
    detalhes importantes[]
    imagens[]
      referência do arquivo
      legenda opcional
  estado de salvamento local
```

**Decisão arquitetural SIR-68 para o protótipo:** corpo em texto simples com quebras de linha, sem HTML livre e sem formatação Markdown de entrada. O exportador Markdown compõe headings, parágrafos e detalhes a partir do schema; PDF e DOCX consomem a mesma estrutura semântica. Reabrir se formatação rica for aprovada como requisito.

Cada rascunho local deve ter identificador próprio, permitindo mais de um documento e retomada por chave/rota, sem criar histórico centralizado. A arquitetura do protótipo seleciona IndexedDB para JSON e blobs de imagens; limites iniciais e comportamento de quota estão documentados no ADR, sujeitos a validação antes de produção.

## 6.1 Fronteira de dados e imagens

- O texto e os parâmetros do rascunho permanecem no navegador até a pessoa solicitar geração por IA ou exportação; nessas ações, os dados necessários são enviados ao servidor/provedor escolhido.
- O servidor não deve persistir relatórios de visitantes por padrão. Logs excluem conteúdo; uploads e saídas são transitórios. A arquitetura do protótipo especifica limpeza inicial e critérios, sujeitos a revisão antes de produção.
- Imagens permanecem no rascunho local até exportação. Para gerar arquivos no servidor, enviá-las como anexos temporários vinculados àquela requisição; não enviá-las para análise pela IA no MVP.
- Remover uma imagem do rascunho remove sua referência local e impede incluí-la nas próximas exportações. Cópias temporárias já enviadas devem ser removidas ao final ou expirar conforme política documentada.
- Validar tamanho, formato e conteúdo real no cliente e no servidor. Limites iniciais e política de limpeza estão especificados no ADR de arquitetura, como valores configuráveis para validar antes de tráfego público.
- Informar claramente que rascunhos anônimos são locais e não sincronizam entre navegador/dispositivo; dados transmitidos para IA/exportação são processados remotamente sob demanda.

## 7. Estados e erros que devem ser desenhados

| Área | Estados relevantes |
|---|---|
| Modelos públicos | Carregando, disponíveis, nenhum modelo publicado, falha ao carregar |
| Geração IA | Pronto, enviando, gerando, resultado válido, indisponibilidade/limite/timeout, resposta inválida |
| Editor | Rascunho novo, salvando, salvo localmente, armazenamento indisponível/cheio |
| Imagens | Sem imagem, carregando, anexada, tipo/tamanho inválido, falha ao persistir |
| Login admin | Não autenticado, enviando, erro de credencial, autenticado, sessão expirada |
| Template admin | Rascunho, inválido, prévia, publicado, falha ao salvar/publicar |
| Exportação | Não iniciada, em andamento por formato, sucesso parcial, sucesso completo, falha recuperável |

Nenhum erro deve apagar dados digitados, aparentar sucesso sem arquivo válido ou ocultar uma falha parcial de exportação.

## 8. Segurança, confiança e privacidade

- Segredos de IA e credenciais administrativas permanecem exclusivamente no servidor.
- Login administrativo protege tanto as páginas quanto os endpoints de alteração de modelos.
- Templates armazenados não podem executar JavaScript; prévias e renderização devem ser isoladas e sanitizadas.
- Validar entradas de texto, nomes/extensões/MIME/tamanho das imagens e parâmetros de geração.
- Proteger os endpoints públicos de IA e exportação contra abuso e custos inesperados; valores iniciais configuráveis estão documentados no ADR e precisam ser testados antes do piloto público.
- Informar que o rascunho de usuário anônimo fica localmente no navegador e pode não estar disponível em outro dispositivo/navegador.
- Revisar termos e retenção do provedor antes de ativar IA real; o protótipo usa adaptador fake e não requer chave externa.
- Não usar conteúdo real de relatórios de usuários como amostra de template sem consentimento explícito.

## 9. Direção visual e conteúdo

- Seguir o tema e os tokens existentes do projeto; não criar um sistema visual desconectado.
- Usar styled-components com nomes terminados em `Stl`, sem arquivos CSS avulsos dentro de `src/`.
- Priorizar hierarquia tipográfica, legibilidade de textos longos e estados claros do processo de criação.
- A interface pública deve comunicar foco em criação e revisão, não em configuração técnica.
- A área admin pode expor controles mais técnicos de HTML/CSS, mas deve separar essas ferramentas do fluxo público.
- Nome final, logotipo, ilustrações, paleta final e tom editorial não foram definidos. O primeiro design deve preservar os tokens existentes e evitar tratar conteúdo de exemplo como marca aprovada.

## 10. Decisões de produto propostas e pendências técnicas

As propostas de interação abaixo orientam o protótipo; as decisões técnicas base estão no ADR SIR-68. Pendências de implantação, UX e validação de limites continuam registradas separadamente.

### Propostas de produto para validação

1. **Editor de templates:** HTML/CSS restritos e placeholders, sem execução de código arbitrário; editor de código restrito, visual ou híbrido ainda precisa de protótipo/decisão.
2. **Formato textual:** decidido para o protótipo: texto simples com quebras de linha, sem HTML livre ou Markdown de entrada.
3. **Seleção de formatos:** modal armazena preferência; confirmação final acontece na tela de revisão/exportação; permitir continuar sem selecionar formato inicialmente.
4. **Modelo PDF:** modelo padrão do sistema sempre disponível; modelo desmarcado fica preservado no rascunho; despublicação não apaga relatório.
5. **Interrupção/retry:** resultados por formato independentes; arquivos concluídos podem ser baixados; formato com falha pode ser repetido; ao fechar a aba, sem histórico central não se promete recuperar arquivos não baixados.
6. **Fontes:** somente texto/URLs de referência no MVP, sem navegação web, ingestão de arquivos ou promessa de verificação.
7. **Prévia:** declarar explicitamente se é aproximada, caso não seja idêntica ao PDF final.
8. **Rascunhos:** suportar múltiplos rascunhos locais com identificadores independentes; não há histórico sincronizado.

### Pendências que exigem fechamento antes das etapas correspondentes

1. Definir UI final do editor de templates e validar a allowlist/sandbox documentadas através de testes.
2. Aprovar conta, modelo, orçamento, política de retenção e limites para ativar provedor real de IA; até lá usar adaptador fake.
3. Implementar e testar IndexedDB/upload transitório, validar limites iniciais e limpeza de arquivos.
4. Implementar bootstrap/rotação/recuperação do admin conforme o contrato e o backend efetivamente implantados.
5. Confirmar entrega de Markdown com imagens (arquivo `.md` simples ou pacote ZIP `.md` + imagens) antes da UI de exportação.
6. Validar no spike os exportadores `docx` e Chromium/Playwright nos ambientes de deploy escolhidos.
7. Identidade visual, marca, textos finais e hospedagem específica permanecem abertos; hospedagem é bloqueante antes da implantação pública.

## 11. Riscos e mitigação proposta

| Risco | Impacto | Mitigação de produto/técnica |
|---|---|---|
| Resposta de IA superficial, incorreta ou fora de estrutura | Conteúdo pouco confiável e revisão extra | Gerar estrutura validada, deixar revisão explícita, permitir regenerar seção e evitar alegar verificação de fatos |
| Abuso de geração/exportação pública | Custo e indisponibilidade | Limites no servidor, validação, monitoramento e estratégia de rate limit definidos na Etapa 1 |
| Template HTML/CSS inseguro | XSS ou comportamento não intencional na prévia/exportação | Não executar JavaScript, restringir/sanitizar markup e estilos, isolar prévia/renderização |
| Rascunho local ou imagens excederem armazenamento do navegador | Perda ou falha ao retomar | Limites, aviso de estado, preservação em memória e estratégia de persistência documentada |
| Diferenças entre PDF, DOCX e Markdown | Expectativa de layout idêntico em todos os formatos | Explicar que só PDF usa template admin; validar conteúdo semântico em cada exportador |
| Chave de IA exposta no cliente | Uso indevido e custo | Chamadas de IA somente no servidor, sem segredos em variáveis `VITE_` ou bundle |
| Geração apagar alterações humanas | Perda de trabalho | Gerar em área isolada e solicitar substituição/confirmar antes de substituir conteúdo existente |

## 12. Próxima atividade recomendada

O ADR de arquitetura da **Etapa 1/SIR-68** registra as escolhas de protótipo, contratos e comparações. Antes de iniciar serviços externos ou deploy público, validar as pendências listadas no ADR com o proprietário e seguir para a etapa de implementação da API.

**Prompt copiável para a próxima etapa:**

> Use `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`, este draft e `00-anything/02 - gerador de relatorios 2026-11-09/architecture_decisions.md`. Implemente somente a Etapa 2 do plano na branch aprovada: API Node/Fastify, schemas e persistência de protótipo conforme o ADR. Comece com adaptador de IA fake; não configure provedor real nem credenciais sem aprovação explícita do proprietário. Preserve rascunhos anônimos fora do servidor, implemente validação/erros sem sucesso falso e documente variáveis server-side sem valores secretos. Siga integralmente `AGENTS.md`, incluindo testes, atualização de `AGENTS.md`/`README.md`, graphify e isolamento de artefatos.
