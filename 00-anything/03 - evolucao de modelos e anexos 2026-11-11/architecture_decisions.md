# Decisões Arquiteturais: Evolução de Modelos PDF e Ingestão de Anexos para IA

* **Iniciativa:** `00-anything/03 - evolucao de modelos e anexos 2026-11-11/`
* **Data:** 2026-11-11
* **Autor:** Renato França
* **Status:** Aprovado / Pronto para Implementação

---

## 1. Contexto e Motivação

Esta iniciativa atende a duas demandas críticas para a maturidade do produto:
1. Capacitar a IA a analisar documentos externos reais (PDFs analíticos, planilhas orçamentárias e imagens) para compor relatórios baseados em evidências, sem forçar o usuário a digitar dados manualmente.
2. Resolver a desconexão operacional de modelos PDF, garantindo que o modelo escolhido seja visível, alterável no editor compartilhado e efetivamente aplicado no PDF exportado, complementado por uma biblioteca de 4 modelos padrão e um Theme Builder visual.

---

## 2. Decisões Arquiteturais Registradas

### ADR-01: Ingestão Efêmera Multipart em Memória
* **Decisão:** O endpoint `POST /api/v1/ai/reports` processa uploads via `@fastify/multipart` (`request.parts()`) estritamente em memória.
* **Justificativa:** Mantém a promessa de privacidade e zero-retenção no backend, sem gravar arquivos confidenciais em disco ou banco SQLite.
* **Limites Operacionais:** Máximo de 3 arquivos ou 15 MB cumulativos.

### ADR-02: Salvaguardas contra DoS e Decompression Bombs
* **Decisão:** A leitura de planilhas XLSX impõe um teto estrito de descompressão de 25 MB expandidos e extração amostrada das primeiras 100 linhas por aba (máx. 200 linhas totais) convertidas para tabelas Markdown. PDFs têm texto extraído via `pdf-parse`.
* **Justificativa:** Protege o processo único do Node.js contra estouro de memória (OOM) e travamento do event loop, garantindo que o contexto injetado respeite o teto de ~30.000 tokens.

### ADR-03: Governança Reativa do Modelo no Editor
* **Decisão:** O `ManualReportEditor` passa a hospedar o seletor de modelos publicados no topo da interface.
* **Justificativa:** Elimina o acoplamento exclusivo da seleção ao modal de abertura. A seleção persiste no rascunho local do IndexedDB e recarrega a pré-visualização instantaneamente.
* **Resiliência:** Se o modelo for despublicado, o editor alerta o usuário e faz fallback não destrutivo para o modelo padrão.

### ADR-04: Bootstrap e Clonagem de 4 Modelos Canônicos
* **Decisão:** O banco de dados inicializa com 4 modelos padrões (`system-executivo`, `system-tecnico`, `system-comercial`, `system-minimalista`) publicados.
* **Justificativa:** Fornece pontos de partida profissionais imediatos. O endpoint `POST /api/v1/admin/templates/:id/clone` viabiliza a criação de variações sem perder os modelos de fábrica.

### ADR-05: Theme Builder Declarativo Compilado para PostCSS Allowlist
* **Decisão:** O construtor visual no `/admin` manipula propriedades declarativas (paleta de cores, tipografia, margens `@page`, capa e rodapé) e compila para HTML/CSS estritamente validado por `sanitizeTemplate`.
* **Justificativa:** Garante 100% de previsibilidade de paginação no Playwright e segurança contra injeções, mantendo a aba de código avançado para desenvolvedores.
