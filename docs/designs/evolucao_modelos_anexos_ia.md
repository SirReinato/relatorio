# RFC: Evolução de Modelos PDF e Ingestão de Anexos para IA

* **Author:** Renato França
* **Date:** 2026-11-11
* **Status:** RFC / Feedback da Equipe
* **Iniciativa:** `00-anything/03 - evolucao de modelos e anexos 2026-11-11/`

## 1. Overview

Esta proposta tem como objetivo expandir as capacidades de geração de relatórios com apoio de dados externos e empoderar usuários administradores com ferramentas visuais de criação e seleção de modelos de impressão:
1. **Ingestão Documental como Contexto de IA:** Upload efêmero de arquivos de apoio (PDFs de até 10 MB, planilhas CSV/XLSX de até 5 MB e imagens) cuja informação é extraída no backend e injetada no prompt da IA para produzir relatórios analíticos baseados em evidências.
2. **Seleção e Troca Dinâmica de Modelo no Editor:** Integração de um seletor visual de modelos PDF diretamente no `ManualReportEditor`, eliminando o acoplamento exclusivo ao modal inicial e garantindo sincronização e persistência no IndexedDB.
3. **Catálogo de Modelos Padrões Editáveis:** Provisionamento no banco SQLite de 4 templates canônicos (Executivo, Técnico/Auditoria, Comercial/Vendas e Minimalista), com capacidade de clonagem e customização.
4. **Construtor Visual de Layouts ("Theme Builder"):** Interface visual declarativa para estilização de capas, paleta de cores, tipografia, margens e rodapé, compilando para a allowlist restrita de HTML/CSS do Playwright.

## 2. Análise Técnica & Consenso Multi-Lentes EGM

A análise conjunta com os 6 revisores especializados (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`) estabeleceu os seguintes pilares:

### Segurança de Runtime e Prevenção contra DoS / OOM
* **Proteção contra Zip Bombs em XLSX:** Teto de descompressão limitado a 25 MB.
* **Amostragem Tabular Inteligente:** Até 100 linhas por aba de planilha (máx. 200 linhas totais) convertidas para blocos Markdown tabulares para evitar explosão de tokens e estouro de heap no processo Node.js.
* **Efemeridade Estrita:** Arquivos de upload processados em streaming em memória e descartados imediatamente após a geração. Zero gravação em disco ou SQLite. Zero log de dados pessoais (PII).

### Usabilidade e Integridade do Modelo no Editor
* **Sincronização em Tempo Real:** Alterar o modelo no editor atualiza o rascunho no IndexedDB e reflete na prévia do PDF.
* **Tratamento de Modelo Despublicado:** Fallback gracioso para o modelo padrão com notificação visual não bloqueante.

### Theme Builder Declarativo
* Formulário com parâmetros restritos (cores hexadecimais, fontes permitidas, margens `@page` e rodapé `@bottom-right`) que compila para HTML/CSS e passa pela função existente `sanitizeTemplate`.
* Preservado o "Modo Avançado (HTML/CSS)" para quem necessitar de personalização via código.

## 3. Escopo

* **Em Escopo:**
  * Upload temporário de PDF, CSV/XLSX e imagens no formulário de IA (limite acumulado: 15 MB / máx. 3 arquivos).
  * Extração segura de texto e tabelas (teto de ~30.000 tokens injetados no prompt).
  * Seletor de modelo PDF dinâmico integrado ao `ManualReportEditor`.
  * Inserção dos 4 modelos canônicos iniciais com suporte à duplicação.
  * Painel de criação visual de temas compondo para a allowlist do PostCSS.

* **Fora de Escopo:**
  * Fusão/concatenação física de PDFs como páginas anexas no PDF exportado.
  * Reconhecimento óptico de caracteres (OCR) para imagens sem camada de texto.
  * Editor WYSIWYG de coordenadas livres (drag-and-drop despaginado).
