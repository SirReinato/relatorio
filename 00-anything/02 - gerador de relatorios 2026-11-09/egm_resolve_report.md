# EGM Resolve — Gerador de Relatórios

**Data:** 2026-11-09  
**Review resolvido:** `00-anything/02 - gerador de relatorios 2026-11-09/egm_review_report.md`  
**Draft atualizado:** `00-anything/02 - gerador de relatorios 2026-11-09/design_draft.md`  
**Plano de referência:** `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`  
**Resultado:** achados de produto incorporados como propostas/defaults explícitos; decisões de infraestrutura e limites numéricos permanecem para a Etapa 1 e validação do proprietário.

---

## 1. Resolução executiva

O draft foi atualizado em resposta ao review para fechar os comportamentos de produto que podiam ser resolvidos sem escolher serviços ou inventar limites: existe uma proposta de template PDF padrão; a tela de revisão confirma formatos/modelo; falhas de exportação são independentes; alterações concorrentes durante regeneração não são sobrescritas; fontes não implicam pesquisa; rascunhos anônimos são locais e processamento remoto ocorre sob demanda.

Os achados de segurança/infraestrutura foram convertidos em requisitos e decisões explícitas da Etapa 1, sem simular que já foram tecnicamente implementados: políticas de retenção e TTL, limites de upload, armazenamento local, backend/provedor de IA, bootstrap admin e sandbox/allowlist dos templates. O formato de conteúdo sugerido é Markdown restrito, mas permanece como proposta a validar antes de fechar os contratos.

**Leitura do status:** este resolve consolida o artefato de descoberta; não autoriza ainda implementação de API, IA, autenticação ou exportadores.

## 2. Matriz de resolução dos achados

| Achado | Disposição | Resolução aplicada |
|---|---|---|
| P0.1 — Ausência de modelo PDF inicial | Resolvido no nível de produto; validação técnica pendente | Proposto um modelo padrão do sistema, disponível antes de modelos customizados. Falha ao carregar modelos não deve apagar o rascunho; fallback e indisponibilidade de serviço devem ser comunicados. |
| P0.2 — Ciclo de vida dos dados anônimos | Parcialmente resolvido; política operacional pendente | Definido como proposta: conteúdo local até solicitação de IA/exportação, processamento remoto sob demanda e sem persistência de relatórios de visitantes por padrão. Logs, temporários e prazos exatos ficam na Etapa 1. |
| P0.3 — Bootstrap/recuperação do administrador | Requisito resolvido; mecanismo pendente | Nenhuma credencial padrão, versionada ou client-side; provisionamento inicial server-side fora do repositório, com troca/rotação e recuperação documentadas. A tecnologia depende da escolha do backend. |
| P0.4 — Formato do conteúdo | Proposta de resolução | Sugerido texto simples com subset restrito de Markdown, sem HTML arbitrário. É necessário validar suportes e conversores antes de congelar o schema. |
| P1.1 — Imagens locais e exportação remota | Parcialmente resolvido; limites/contratos pendentes | Definido fluxo conceitual de upload transitório somente para exportação, imagens não são enviadas à IA, referência removida não entra em exportações futuras. Tipos, tamanhos, endpoint e limpeza dependem da Etapa 1. |
| P1.2 — Escolha dos formatos/modelo em telas diferentes | Resolvido no nível de UX | Modal registra preferências; revisão/exportação é fonte de verdade. Permite iniciar sem formato; ao desmarcar PDF, preserva a última escolha do modelo no rascunho. |
| P1.3 — Concorrência na regeneração | Resolvido no nível de UX | Resposta vira proposta temporária associada à versão enviada. Se o usuário editar durante a geração, não há sobrescrita; oferece comparar/aceitar/descartar. Bloqueia chamadas duplicadas e resultados antigos. |
| P1.4 — Retry/entrega de exportação | Resolvido como proposta de MVP | Resultados independentes por formato, downloads separados e retry apenas do formato que falhou. Não promete recuperar arquivos não baixados após fechar a página; TTL ainda deve ser definido. |
| P1.5 — Semântica de fontes | Resolvido no escopo proposto | Referências textuais/URLs fornecidas pelo usuário apenas; sem navegação web, ingestão de documentos ou afirmação de verificação factual. |
| P1.6 — Segurança de HTML/CSS | Requisitos resolvidos; allowlist/sandbox pendentes | Sem JavaScript, eventos inline, React executável ou recursos remotos por padrão; escape de placeholders; allowlist e isolamento de preview/renderização devem ser definidos antes da implementação. |
| P2.1 — Múltiplos rascunhos/rotas | Resolvido como proposta local | Cada rascunho tem identificador próprio; múltiplos rascunhos locais não equivalem a histórico sincronizado. Rotas/armazenamento serão definidos na Etapa 1. |
| P2.2 — Ordenação acessível | Resolvido no nível de interação | Mover para cima/baixo como alternativa a drag-and-drop, com anúncio de posição. |
| P2.3 — Remoção/ciclo de vida de imagem | Parcialmente resolvido | Remover imagem do rascunho remove a referência de futuras exportações; cópias temporárias devem ser removidas ou expirar. Undo e retenção exata seguem decisão técnica. |
| P2.4 — Conteúdo e identidade visual | Parcialmente resolvido | Critérios neutros de linguagem e transparência mantidos; marca e textos finais permanecem abertos e não bloqueiam arquitetura. |

## 3. Alterações aplicadas ao draft

O arquivo `design_draft.md` foi atualizado para incluir:

- Modelo PDF padrão de sistema e tratamento de falha/ausência de modelos customizados.
- Preferências iniciais na modal e confirmação autoritativa na revisão/exportação.
- Fontes restritas a referências de texto/URLs, sem alegar verificação.
- Proteção contra perda de edição em geração concorrente e resposta atrasada.
- Retry e download por formato, sem histórico remoto de resultados como requisito.
- Provisionamento seguro do administrador e proibição de segredo default/client-side.
- Requisitos de segurança para templates: placeholders escapados, sem scripts/recursos remotos por padrão e sandbox/allowlist a definir.
- Proposta de subset Markdown; identificadores de rascunhos locais.
- Seção de fronteira de dados e imagens, incluindo processamento remoto sob demanda e itens a definir.
- Separação entre propostas de produto e pendências técnicas da Etapa 1.

Nenhum arquivo de código, dependência ou configuração da aplicação foi alterado.

## 4. Decisões mantidas em aberto

Estas escolhas não foram tratadas como aprovadas, pois dependem de comparação técnica, limites de custo/operação ou confirmação do proprietário:

1. Backend, banco/armazenamento, hospedagem e provedor/modelo de IA.
2. Editor visual, editor de código restrito ou combinação para templates.
3. Allowlist concreta de tags, CSS, placeholders, fontes e URLs; tecnologia de sandbox/renderização PDF.
4. Bootstrap, sessão, rotação e recuperação do admin conforme backend escolhido.
5. IndexedDB ou alternativa para rascunhos/binários, formatos/tamanhos/quantidades de imagem e limites de relatório.
6. Endpoint de upload transitório, limpeza de arquivos, retenção de logs e TTL dos resultados de exportação.
7. Bibliotecas/exportadores e suporte de imagens no PDF, DOCX e Markdown.
8. Subset Markdown final e fidelidade de conversão para cada saída.
9. Preferências/limites de custo e desempenho para geração de IA.
10. Marca, identidade visual e textos finais da landing page.

## 5. Próximo passo e critério de saída

Prosseguir para a **Etapa 1 do plano** como uma tarefa de análise/decisão, não como implementação de funcionalidade. A Etapa 1 estará pronta quando as escolhas tecnológicas e os contratos estiverem documentados, incluindo fronteira de dados, limites e falhas, sem segredos no cliente, com as questões que exigem decisão do proprietário destacadas.

### Prompt copiável

> Leia `AGENTS.md`, `00-anything/02 - gerador de relatorios 2026-11-09/plan.md`, `00-anything/02 - gerador de relatorios 2026-11-09/design_draft.md`, `00-anything/02 - gerador de relatorios 2026-11-09/egm_review_report.md` e `00-anything/02 - gerador de relatorios 2026-11-09/egm_resolve_report.md`. Execute somente a Etapa 1 do plano: compare backend, IA, autenticação admin, persistência de rascunhos/modelos/imagens e exportadores; documente opções, trade-offs e recomendação. Feche os contratos técnicos para processamento remoto sob demanda, sem persistência de relatórios anônimos por padrão, upload e limpeza temporários, bootstrap admin, formato de conteúdo, limites e retries. Trate as decisões deste resolve como propostas de produto a validar, não como fornecedores/limites já escolhidos. Não implemente funcionalidades. Siga integralmente `AGENTS.md` e mantenha quaisquer novos artefatos na pasta sequencial da sessão.
