export const canonicalTemplates = Object.freeze([
  {
    id: 'system-executivo',
    name: 'Executivo Moderno',
    description: 'Layout corporativo contemporâneo com capa minimalista, acentos azul escuro e rodapé institucional numerado.',
    html: `<header class="report-header">
  <div class="accent-bar"></div>
  <div class="header-content">
    <h1 class="report-title">{{report.title}}</h1>
    <p class="report-topic">{{report.topic}}</p>
  </div>
</header>
<main class="report-body">{{report.sections}}</main>
<footer class="report-footer">
  <div class="footer-left">
    <span class="footer-title">{{report.title}}</span>
    <span class="footer-badge">Relatório Executivo</span>
  </div>
  <div class="footer-right"><span class="page-number"></span></div>
</footer>`,
    css: `@page {
  size: a4 portrait;
  margin: 20mm 15mm 20mm 15mm;
  @bottom-right {
    content: "Pág. " counter(page) " de " counter(pages);
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #64748b;
  }
}
body {
  font-family: Arial, sans-serif;
  color: #0f172a;
  line-height: 1.6;
  background-color: #ffffff;
}
.report-header {
  border-bottom: 2px solid #2563eb;
  padding-bottom: 12px;
  margin-bottom: 24px;
}
.report-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 6px;
}
.report-topic {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}
.report-body {
  font-size: 13px;
}
.report-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
}
h2 {
  color: #1e3a8a;
  font-size: 18px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
  margin-top: 20px;
  margin-bottom: 10px;
}
h3 {
  color: #2563eb;
  font-size: 15px;
  margin-top: 14px;
  margin-bottom: 6px;
}
p {
  margin-bottom: 10px;
}`,
    status: 'published',
    version: 1,
  },
  {
    id: 'system-tecnico',
    name: 'Laudo Técnico',
    description: 'Estrutura cartesiana e formal para laudos, auditorias, conformidade e especificações técnicas com tabelas estruturadas.',
    html: `<header class="tech-header">
  <div class="tech-meta">
    <span class="tech-label">DOCUMENTO TÉCNICO</span>
  </div>
  <h1 class="tech-title">{{report.title}}</h1>
  <p class="tech-topic"><strong>Objeto de Análise:</strong> {{report.topic}}</p>
</header>
<main class="tech-content">{{report.sections}}</main>
<footer class="tech-footer">
  <div class="tech-audit">Registro Técnico • Documento Autenticado</div>
</footer>`,
    css: `@page {
  size: a4 portrait;
  margin: 25mm 20mm 20mm 20mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #334155;
  }
}
body {
  font-family: Arial, sans-serif;
  color: #1e293b;
  line-height: 1.5;
}
.tech-header {
  border: 1px solid #0f172a;
  padding: 14px;
  margin-bottom: 20px;
  background-color: #f8fafc;
}
.tech-meta {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #475569;
  margin-bottom: 4px;
}
.tech-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}
.tech-topic {
  font-size: 12px;
  color: #334155;
}
.tech-content {
  font-size: 12px;
}
.tech-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #94a3b8;
  padding-top: 6px;
  font-size: 9px;
  color: #64748b;
}
h2 {
  font-size: 16px;
  color: #0f172a;
  border-left: 4px solid #0f172a;
  padding-left: 8px;
  margin-top: 18px;
  margin-bottom: 8px;
}
h3 {
  font-size: 14px;
  color: #334155;
  margin-top: 12px;
  margin-bottom: 4px;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 12px;
}
th {
  border: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  padding: 6px;
  font-size: 11px;
  text-align: left;
}
td {
  border: 1px solid #cbd5e1;
  padding: 6px;
  font-size: 11px;
}`,
    status: 'published',
    version: 1,
  },
  {
    id: 'system-comercial',
    name: 'Proposta Comercial',
    description: 'Design dinâmico focado em negócios, acentos verdes esmeralda, métricas e propostas de valor.',
    html: `<header class="sales-header">
  <span class="sales-tag">PROPOSTA COMERCIAL</span>
  <h1 class="sales-title">{{report.title}}</h1>
  <p class="sales-topic">{{report.topic}}</p>
</header>
<main class="sales-body">{{report.sections}}</main>
<footer class="sales-footer">
  <span>Proposta Comercial • Confidencial</span>
</footer>`,
    css: `@page {
  size: a4 portrait;
  margin: 20mm 15mm 20mm 15mm;
  @bottom-right {
    content: "Página " counter(page);
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #059669;
  }
}
body {
  font-family: Arial, sans-serif;
  color: #1f2937;
  line-height: 1.6;
}
.sales-header {
  border-left: 6px solid #059669;
  padding-left: 16px;
  margin-bottom: 28px;
}
.sales-tag {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
}
.sales-title {
  font-size: 26px;
  font-weight: 700;
  color: #064e3b;
  margin-bottom: 6px;
}
.sales-topic {
  font-size: 14px;
  color: #4b5563;
}
.sales-body {
  font-size: 13px;
}
.sales-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #a7f3d0;
  padding-top: 6px;
  font-size: 10px;
  color: #059669;
}
h2 {
  color: #064e3b;
  font-size: 18px;
  margin-top: 22px;
  margin-bottom: 8px;
}
h3 {
  color: #059669;
  font-size: 15px;
  margin-top: 14px;
  margin-bottom: 6px;
}
p {
  margin-bottom: 10px;
}`,
    status: 'published',
    version: 1,
  },
  {
    id: 'system-minimalista',
    name: 'Minimalista Limpo',
    description: 'Layout editorial sofisticado com ampla área em branco, tipografia sóbria e leitura fluida.',
    html: `<header class="minimal-header">
  <h1 class="minimal-title">{{report.title}}</h1>
  <p class="minimal-topic">{{report.topic}}</p>
</header>
<main class="minimal-body">{{report.sections}}</main>
<footer class="minimal-footer">
  <span class="minimal-doc">{{report.title}}</span>
</footer>`,
    css: `@page {
  size: a4 portrait;
  margin: 25mm 25mm 25mm 25mm;
  @bottom-right {
    content: counter(page);
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #71717a;
  }
}
body {
  font-family: Arial, sans-serif;
  color: #27272a;
  line-height: 1.7;
}
.minimal-header {
  border-bottom: 1px solid #e4e4e7;
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.minimal-title {
  font-size: 24px;
  font-weight: 400;
  color: #18181b;
  margin-bottom: 4px;
}
.minimal-topic {
  font-size: 13px;
  color: #71717a;
  font-style: italic;
}
.minimal-body {
  font-size: 13px;
}
.minimal-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #f4f4f5;
  padding-top: 6px;
  font-size: 9px;
  color: #a1a1aa;
}
h2 {
  font-size: 17px;
  font-weight: 700;
  color: #18181b;
  margin-top: 20px;
  margin-bottom: 8px;
}
h3 {
  font-size: 14px;
  font-weight: 700;
  color: #3f3f46;
  margin-top: 14px;
  margin-bottom: 6px;
}
p {
  margin-bottom: 12px;
}`,
    status: 'published',
    version: 1,
  },
]);
