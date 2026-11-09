# EGM Review — Draft do Gerador de Relatórios

**Data:** 2026-11-09  
**Artefato revisado:** `00-anything/02 - gerador de relatorios 2026-11-09/design_draft.md`  
**Referência de escopo:** `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`  
**Resultado:** Bom draft de experiência e produto; ainda não está pronto para implementação integral sem resolver decisões operacionais do MVP.

---

## 1. Síntese executiva

O draft traduz bem a ideia central: criação pública de relatórios com ou sem IA, revisão humana no mesmo editor, imagens por seção, exportação em vários formatos e administração separada para modelos PDF. Está alinhado com os requisitos já confirmados e, corretamente, não promete pesquisa factual, citações verificadas, contas de usuário final ou templates customizados para DOCX/Markdown.

Os pontos fortes são o mapa de experiência, a preocupação com estados de erro, a separação entre conteúdo semântico e template visual e a identificação explícita de questões em aberto. As principais lacunas são operacionais: fluxo inicial em condições sem modelos publicados, ciclo de vida de rascunhos anônimos e imagens durante exportação no servidor, bootstrap/recuperação do único acesso administrativo e semântica de geração/retry/exportação. Essas lacunas podem causar bloqueios de produto ou perda de trabalho se ficarem apenas para decisões implícitas durante implementação.

**Recomendação:** aprovar o draft como artefato de exploração e avançar para a Etapa 1 do plano, mas não iniciar as etapas de integração, autenticação ou exportação até registrar as decisões e contratos indicados nas prioridades P0/P1 abaixo. As decisões visuais e a identidade de marca podem permanecer abertas sem bloquear a arquitetura.

## 2. Avaliação por dimensão

| Dimensão | Avaliação | Observação |
|---|---|---|
| Coerência com requisitos confirmados | Forte | Preserva acesso público sem conta, login só do admin, criação IA/manual, edição e exportação múltipla. |
| Fluxo ponta a ponta | Bom, com lacunas | Os caminhos estão mapeados; estados iniciais sem template, retomada e interrupção ainda não fecham a experiência. |
| Modelo de conteúdo | Boa base | Separa relatório de apresentação, mas precisa definir rich text, detalhes, imagens e identificação/versão de rascunhos. |
| Segurança e privacidade | Boa intenção; contrato incompleto | Identifica segredos, templates e retenção, mas upload/renderização e provisionamento admin ainda precisam de limites operacionais. |
| Exportação | Direção correta | Define diferenças entre formatos e falha parcial; faltam contrato de entrega, tratamento de imagens e comportamento após fechar a página. |
| Prontidão de implementação | Parcial | Suficiente para orientar decisões técnicas; não suficiente para congelar API ou executar todas as etapas sem decisões adicionais. |

## 3. Achados priorizados

### P0 — Bloqueios que devem ser decididos antes das etapas dependentes

#### P0.1 — Não há comportamento definido quando não existe modelo PDF publicado

O PDF é um formato selecionável desde a modal, mas os modelos vêm da área administrativa protegida. Um ambiente novo ou uma instalação sem modelos publicados deixa o usuário sem uma escolha válida; o draft lista o estado “nenhum modelo publicado”, mas não define se há template padrão do sistema nem se PDF continua habilitado.

**Recomendação:** definir um template de sistema padrão e não editável, disponível como fallback. Quando houver modelos publicados pelo admin, mostrar o padrão junto das opções (ou decidir explicitamente substituição). Se nenhum modelo puder ser carregado, manter o rascunho e explicar se o PDF está temporariamente indisponível, sem bloquear DOCX/Markdown.

#### P0.2 — Ciclo de vida dos dados anônimos está incompleto

O draft promete retomada local, enquanto geração e exportação parecem depender de serviços remotos. Não está explícito quais dados (texto, parâmetros, imagens) saem do navegador, por quanto tempo ficam no servidor, nem se o servidor precisa guardar o relatório para exportar vários formatos.

**Recomendação:** decidir um contrato de processamento transitório: envio apenas quando necessário para geração/exportação, processamento sem persistência de relatórios por padrão, descarte de temporários com prazo definido e política separada para modelos administrativos. Informar ao usuário que a retomada do rascunho é local e que o processamento remoto ocorre sob demanda. Definir o que acontece com falhas de rede e com uploads temporários.

#### P0.3 — Bootstrap e recuperação do acesso administrativo não foram definidos

Há um único administrador, mas não está especificado como a primeira credencial é criada, como se recupera acesso, nem como evitar que um segredo fixo seja incluído no bundle ou em configuração versionada.

**Recomendação:** escolher um mecanismo server-side de provisionamento inicial (por exemplo, segredo de bootstrap fornecido fora do repositório, de uso único, seguido de troca por credencial protegida) e documentar recuperação/rotação. O detalhe depende do backend escolhido, mas o critério “nenhuma credencial administrativa no cliente/repositório” deve ser obrigatório.

#### P0.4 — O modelo de conteúdo não define formato do campo “conteúdo”

O editor é descrito como texto de conteúdo, mas não se sabe se aceita texto simples, Markdown ou rich text. Isso afeta edição, sanitização, geração de PDF, conversão para DOCX e fidelidade de Markdown.

**Recomendação:** adotar texto simples/Markdown restrito no MVP, com esquema explícito e conversores por saída, ou selecionar um formato rich text com serialização bem definida. Não aceitar HTML arbitrário nos campos de relatório. Registrar decisões para listas, links, ênfase e quebras de linha.

### P1 — Decisões importantes antes de congelar os contratos

#### P1.1 — Upload local e exportação no servidor precisam de um percurso de imagem definido

O rascunho fica localmente, mas gerar PDF/DOCX no servidor pode exigir upload das imagens. A seção de armazenamento local não explica se os arquivos serão enviados na exportação, se haverá upload temporário anterior, nem como as referências sobreviverão a retries.

**Recomendação:** decidir endpoint e payload de upload transitório, limites por arquivo/relatório, formatos realmente aceitos, identificação de imagens e limpeza após exportação/expiração. Validar o conteúdo real no servidor, não confiar apenas em extensão/MIME declarado pelo navegador.

#### P1.2 — Modal mistura decisões iniciais com opções que podem depender de etapas posteriores

O usuário escolhe modo, múltiplos formatos e template na modal; depois o draft também permite alterar formatos antes de exportar. Falta definir a fonte de verdade e comportamento quando o usuário remove PDF, troca modelo ou retorna ao fluxo.

**Recomendação:** a modal registra preferências iniciais, mas a tela final de revisão é a confirmação autoritativa. Ao desmarcar PDF, preservar o último template selecionado no rascunho, sem exigir carregar o template para formatos que não sejam PDF.

#### P1.3 — Falta política de concorrência e proteção contra sobrescrever alterações

Regeneração da seção tem uma boa regra de confirmação, mas não define o que acontece se o usuário continuar editando enquanto a geração está em andamento, apertar retry ou receber uma resposta atrasada.

**Recomendação:** gerar em estado temporário associado à versão da seção enviada; ao receber o resultado, comparar versão/estado atual. Se houve alteração posterior, oferecer comparar/substituir, nunca sobrescrever automaticamente. Garantir idempotência ou impedir submissões duplicadas.

#### P1.4 — Exportação parcial pede comportamento de retry e entrega explícito

O draft prevê sucesso/falha por formato, mas não explica se os arquivos são transferidos individualmente, por pacote, ou mantidos temporariamente no servidor. Fechar a aba durante a operação pode tornar o resultado irrecuperável.

**Recomendação:** para o MVP, preferir resultados independentes por formato com download conforme conclusão; mostrar claramente quais formatos falharam e permitir nova tentativa. Definir expiração dos arquivos temporários e não exigir histórico remoto persistente. Se for gerar um ZIP, estabelecer o que ocorre quando um formato falha.

#### P1.5 — Fontes fornecidas pelo usuário precisam de semântica e aviso

“Fontes” pode significar texto colado, URLs ou arquivos; o escopo exclui pesquisa verificada. Sem distinção, usuários podem interpretar a geração como verificação ou leitura automática das referências.

**Recomendação:** no MVP, se fontes forem incluídas, limitar a referências textuais/URLs como contexto fornecido pelo usuário e informar que não são necessariamente acessadas ou verificadas pela IA. Upload de documentos e navegação web ficam fora até requisitos próprios.

#### P1.6 — HTML/CSS restritos não é ainda uma especificação implementável

O draft corretamente exclui JavaScript e componentes React executáveis, porém “sanitizado e isolado” não especifica lista permitida de tags, CSS, URLs, fontes ou recursos externos. A prévia também pode renderizar markup do administrador e exige isolamento independente da exportação.

**Recomendação:** na Etapa 1, definir placeholders permitidos, política de CSS e de recursos externos, escaping de valores do relatório e sandbox da prévia/renderizador. Não carregar imagens/fontes/URLs remotas por padrão; qualquer suporte a recursos externos requer allowlist explícita.

### P2 — Melhorias que podem ser resolvidas durante prototipagem/design detalhado

#### P2.1 — Rotas propostas descrevem um único rascunho

`/relatorio/editar` sem identificador combina com um rascunho corrente, mas não está claro se abrir outra aba substitui o documento, cria outro ou retoma o mesmo. O escopo exclui histórico centralizado, não necessariamente vários rascunhos locais.

**Recomendação:** definir uma chave local por rascunho e uma regra simples para múltiplos documentos (ou explicitar que só há um rascunho ativo no MVP). Evitar depender apenas de uma rota estática para identificar conteúdo.

#### P2.2 — Ações de seção não descrevem acessibilidade de ordenação

O draft observa corretamente que ordenação por teclado deve ser definida. Definir controles acessíveis para mover para cima/baixo como alternativa a drag-and-drop e anunciar a nova posição.

#### P2.3 — Falta distinguir remoção de arquivo local e referência temporária

Ao remover uma imagem de uma seção, o draft não especifica se apaga imediatamente o arquivo local, se preserva enquanto houver undo ou se um upload transitório permanece até expirar.

**Recomendação:** explicitar vínculo de ciclo de vida e evitar arquivos órfãos; eventual undo não deve reanexar referência expirada sem aviso.

#### P2.4 — Identidade visual é aberta, adequadamente, mas faltam critérios de conteúdo

O draft não fixa marca, o que é apropriado nesta fase. Para o primeiro protótipo, definir apenas critérios neutros: linguagem pt-BR, promessa sem alegações de verificação, instruções curtas e feedback de salvamento/exportação.

## 4. Contradições ou tensões encontradas

1. **Template PDF selecionável vs. ausência de template inicial:** a primeira instalação não tem fluxo de bootstrap de modelo descrito.
2. **Rascunho local vs. renderização e IA remotas:** existe dependência de envio de texto/imagens, mas a fronteira de persistência não está fechada.
3. **Escolha de formatos na modal vs. escolha/editabilidade na revisão:** falta definir qual tela confirma a seleção final.
4. **Prévia final vs. fidelidade de paginação aberta:** a interface promete prévia, mas admite que ela talvez seja apenas aproximada; o rótulo/expectativa precisa refletir isso.
5. **Editor HTML/CSS no admin vs. descrição de “styled-components”:** o draft já corrige a interpretação: styled-components estiliza o próprio app; templates armazenados devem ser HTML/CSS restritos. Manter essa distinção no plano e implementação.

## 5. Recomendações para consolidar o draft

1. Acrescentar um **template PDF padrão do sistema** como fallback, se aprovado, e indicar o comportamento quando a lista de templates falhar.
2. Incluir uma seção curta de **fronteira de dados**: o que fica no navegador, o que vai ao servidor, duração/eliminação de temporários e tratamento de imagens.
3. Definir formato do conteúdo (texto simples, Markdown restrito ou rich text) antes de definir os contratos de exportação.
4. Tornar a tela de prévia/exportação a confirmação final de formatos/modelo e documentar o fluxo de retry por formato.
5. Definir bootstrap e recuperação segura da única conta administrativa durante a decisão de backend/auth.
6. Separar fontes textuais fornecidas pelo usuário de pesquisa/citação automatizada; manter esta última fora do MVP.
7. Converter as questões abertas P0/P1 em decisões registradas da Etapa 1; não transformar recomendações deste review em requisitos aprovados sem confirmação do usuário.

## 6. Prontidão e próxima ação

**Prontidão do draft:** adequada para exploração de produto e desenho de protótipos; parcialmente pronta para especificação técnica.

**Prontidão de implementação:** não iniciar ainda a implementação completa. A Etapa 1 do plano pode começar agora, mas deve produzir decisões explícitas para P0.1–P0.4 e P1.1–P1.6 antes que as etapas de API, IA, templates ou exportação fechem seus contratos. P2.1–P2.4 podem ser refinados no desenho detalhado.

**Próxima atividade:** atualizar o plano com decisões aprovadas após a Etapa 1, preservando as propostas ainda não confirmadas como alternativas, e então dividir/implementar a primeira etapa técnica conforme os prompts copiáveis do plano.

### Prompt copiável para a próxima etapa

> Leia `AGENTS.md`, `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`, `00-anything/02 - gerador de relatorios 2026-11-09/design_draft.md` e este review. Execute somente a Etapa 1 do plano: investigue as opções técnicas e apresente decisões/recomendações explícitas para os achados P0 e P1, especialmente fallback de modelo PDF, fronteira e retenção de dados anônimos, bootstrap do administrador, formato do conteúdo, ciclo de vida de imagens, retry/exportação e limites de template HTML/CSS. Não implemente funcionalidades nem trate recomendações do review como decisões já aprovadas. Registre alternativas, trade-offs e perguntas que exigem decisão do proprietário do produto; siga todas as regras de isolamento e documentação do `AGENTS.md`.
