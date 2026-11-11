# Evolução de Modelos PDF e Ingestão de Anexos para IA

* **Author:** Renato França
* **Date:** 2026-11-11

## Overview

Esta iniciativa visa transformar a criação de relatórios em um fluxo analítico guiado por dados e dotar a administração de um sistema robusto e visual para gestão de templates de impressão:
1. **Ingestão Documental como Contexto de IA:** Upload de arquivos de apoio (PDFs de até 10 MB, planilhas CSV/XLSX de até 5 MB e imagens) cuja informação é extraída de forma segura e injetada no prompt de geração e regeneração da IA para produzir relatórios fundamentados em evidências.
2. **Seleção e Troca de Modelo no Editor:** Integração de um seletor visual de modelos PDF diretamente no cabeçalho/barra de exportação do `ManualReportEditor`, eliminando o acoplamento exclusivo ao modal inicial e garantindo feedback imediato sobre qual layout será aplicado.
3. **Catálogo de Modelos Padrões Editáveis:** Criação de 4 templates canônicos (Executivo, Técnico/Auditoria, Comercial/Vendas e Minimalista) provisionados como rascunhos editáveis e clonáveis no painel administrativo.
4. **Construtor Visual de Layouts ("Theme Builder"):** Interface de formulário interativo para estilização de capas, paleta de cores, tipografia, margens e rodapé, compilando automaticamente para o HTML/CSS restrito pela allowlist do Playwright, com modo avançado de código preservado.

## Analysis & Goldfish Multi-Lens Synthesis

A análise cruzada das 6 lentes especializadas (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`) consolidou as seguintes conclusões e requisitos arquiteturais:

### 1. Ingestão e Processamento de Documentos
* **Segurança e Proteção contra OOM / DoS:**
  * Arquivos XLSX são contêineres ZIP; é imperativo impor teto de expansão de descompressão (máx. 25 MB expandidos) para repelir ataques de descompressão recursiva (Zip Bombs).
  * O Fastify executa em processo persistente Node.js. Para evitar estouro de heap sob múltiplos uploads simultâneos, o parsing de planilhas amostra as primeiras 100 linhas por aba (máx. 200 linhas totais) convertidas para blocos Markdown (`| Coluna 1 | Coluna 2 |`).
  * PDFs têm seu texto extraído diretamente via streams leves em memória sem OCR pesado.
  * O `createRequestAbortSignal` deve ser estendido para cancelar imediatamente o parsing de arquivos caso o cliente feche a aba ou cancele a requisição.
* **Efemeridade Estrita e Zero-Logging de PII:**
  * Os arquivos de upload não são gravados em disco nem no banco de dados SQLite; residem em buffers de memória estritamente durante o ciclo da requisição e são descartados imediatamente após a chamada à IA.
  * Os logs da aplicação (`pino`) registram apenas metadados técnicos `{ fileName, sizeBytes, mediaType, tokenEstimate }`, nunca o conteúdo dos documentos.

### 2. Ciclo de Vida do Modelo no Editor
* **Sincronização Bidirecional e Persistência:**
  * O `pdfTemplateId` é sincronizado entre o IndexedDB do rascunho local e o seletor no topo do `ManualReportEditor`. A troca atualiza a pré-visualização e persiste no rascunho sem necessidade de recarregar a página.
  * Se o modelo associado for despublicado no servidor, o editor exibe um aviso amigável e oferece fallback transparente para o modelo padrão sem corromper o texto ou seções do usuário.

### 3. Biblioteca de Modelos Iniciais
* **Bootstrap dos 4 Modelos Canônicos:**
  * Inseridos via migração inicial em `createDatabase` (`api/database.js`) com status `'published'` e suporte à clonagem/duplicação no painel administrativo:
    1. **Executivo Moderno:** Capa em destaque com barra lateral colorida, tipografia sem serifa sóbria, rodapé com numeração alinhada à direita.
    2. **Técnico / Auditoria:** Grade formal com cabeçalho contendo identificador de versão/data, caixas de destaque para detalhes importantes e separadores nítidos.
    3. **Comercial / Vendas:** Foco em tabelas e métricas quantitativas com espaçamentos generosos.
    4. **Minimalista / Acadêmico:** Estrutura editorial limpa, preto e branco com tipografia serifada elegante e margens amplas.

### 4. Construtor Visual de Modelos ("Theme Builder")
* **Compilação Segura para Allowlist PostCSS:**
  * O formulário visual manipula parâmetros declarativos (paleta de cores `#hex`, enum de famílias tipográficas, layout de capa, alinhamento de logo, margens `@page` e numeração `@bottom-right`).
  * O código gerado passa obrigatoriamente pela validação existente `sanitizeTemplate(html, css)` antes de salvar no SQLite, garantindo integridade e prevenindo injeções.
  * Mantido o botão "Modo Avançado (HTML/CSS)" para edição de código bruto quando necessário.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Upload temporário de PDF, CSV/XLSX e imagens na tela de geração de relatórios com IA (até 3 arquivos ou 15 MB combinados).
  * Extração segura de texto/tabelas com amostragem e teto de ~30.000 tokens injetados no prompt da IA.
  * Seletor de modelo PDF dinâmico integrado dentro de `ManualReportEditor` com sincronização no IndexedDB.
  * Catálogo inicial com os 4 modelos canônicos pré-configurados no SQLite.
  * Construtor visual de templates ("Theme Builder") integrado ao painel `/admin` com modo avançado HTML/CSS.

* **Out-of-Scope Non-Goals:**
  * Concatenação física de anexos como páginas extras do PDF gerado.
  * OCR de arquivos escaneados sem texto selecionável.
  * Editor WYSIWYG de coordenadas livres (canvas/arrasta-e-solta despaginado).

## Alternatives Weighed

* *Editor HTML/CSS puro (Atual):* Flexível mas inacessível para usuários não técnicos e sujeito a erros de sintaxe. Mantido como modo avançado.
* *Processamento 100% no navegador (Client-side):* Rejeitado para evitar sobrecarga de memória em dispositivos móveis e bibliotecas de parsing pesadas no bundle Vite.
* *Anexos como apêndices físicos no PDF:* Rejeitado por quebrar a consistência visual do relatório e duplicar consumo de memória no Playwright.

## Key Decisions & Staging for Next Steps

* Adotar streaming multipart (`@fastify/multipart`) em `POST /api/v1/ai/reports` sem persistência em disco.
* Adicionar salvaguardas de descompressão contra Zip Bombs no parser XLSX.
* Atualizar schema do rascunho e componentes do editor para suporte total à troca de modelo.
