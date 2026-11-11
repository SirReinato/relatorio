export const DEFAULT_THEME_CONFIG = Object.freeze({
  primaryColor: '#1f6feb',
  secondaryColor: '#238636',
  textColor: '#0f172a',
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  fontSizeBase: '13px',
  coverLayout: 'split-bar',
  pageMargins: 'normal',
  headerBadgeText: 'RELATÓRIO EXECUTIVO',
  footerFormat: 'page-of-pages',
});

export function compileThemeToHtmlAndCss(config = DEFAULT_THEME_CONFIG) {
  const primaryColor = config.primaryColor || '#1f6feb';
  const secondaryColor = config.secondaryColor || '#238636';
  const textColor = config.textColor || '#0f172a';
  const backgroundColor = config.backgroundColor || '#ffffff';
  const fontFamily = config.fontFamily || 'Arial, sans-serif';
  const fontSizeBase = config.fontSizeBase || '13px';
  const coverLayout = config.coverLayout || 'split-bar';
  const pageMargins = config.pageMargins || 'normal';
  const badgeText = (config.headerBadgeText || 'RELATÓRIO').trim().replace(/[<>"]/g, '');
  const footerFormat = config.footerFormat || 'page-of-pages';

  const marginValues = {
    narrow: '15mm 10mm 15mm 10mm',
    normal: '20mm 15mm 20mm 15mm',
    wide: '25mm 20mm 25mm 20mm',
  };
  const marginCss = marginValues[pageMargins] || marginValues.normal;

  let footerContentCss = '"Pág. " counter(page) " de " counter(pages)';
  if (footerFormat === 'page-only') {
    footerContentCss = 'counter(page)';
  } else if (footerFormat === 'confidential-page') {
    footerContentCss = '"Confidencial • Pág. " counter(page)';
  }

  let headerHtml = '';
  if (coverLayout === 'split-bar') {
    headerHtml = `<header class="theme-header header-split">
  <div class="accent-bar"></div>
  <div class="header-content">
    <span class="badge-tag">${badgeText}</span>
    <h1 class="report-title">{{report.title}}</h1>
    <p class="report-topic">{{report.topic}}</p>
  </div>
</header>`;
  } else if (coverLayout === 'centered') {
    headerHtml = `<header class="theme-header header-centered">
  <span class="badge-tag">${badgeText}</span>
  <h1 class="report-title">{{report.title}}</h1>
  <p class="report-topic">{{report.topic}}</p>
</header>`;
  } else {
    headerHtml = `<header class="theme-header header-clean">
  <h1 class="report-title">{{report.title}}</h1>
  <p class="report-topic">{{report.topic}}</p>
</header>`;
  }

  const html = `${headerHtml}
<main class="theme-body">{{report.sections}}</main>
<footer class="theme-footer">
  <span class="footer-title">{{report.title}}</span>
</footer>`.trim();

  const css = `@page {
  size: a4 portrait;
  margin: ${marginCss};
  @bottom-right {
    content: ${footerContentCss};
    font-family: ${fontFamily};
    font-size: 10px;
    color: #64748b;
  }
}
body {
  font-family: ${fontFamily};
  color: ${textColor};
  line-height: 1.6;
  background-color: ${backgroundColor};
}
.theme-header {
  border-bottom: 2px solid ${primaryColor};
  padding-bottom: 14px;
  margin-bottom: 24px;
}
.header-split {
  border-left: 6px solid ${primaryColor};
  padding-left: 14px;
}
.header-centered {
  text-align: center;
}
.badge-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: ${secondaryColor};
  display: block;
  margin-bottom: 4px;
}
.report-title {
  font-size: 24px;
  font-weight: 700;
  color: ${primaryColor};
  margin-bottom: 6px;
}
.report-topic {
  font-size: 14px;
  color: #475569;
}
.theme-body {
  font-size: ${fontSizeBase};
}
.theme-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 6px;
  font-size: 9px;
  color: #64748b;
}
h2 {
  color: ${primaryColor};
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 8px;
}
h3 {
  color: ${secondaryColor};
  font-size: 15px;
  margin-top: 14px;
  margin-bottom: 6px;
}
p {
  margin-bottom: 10px;
}
.callout-card {
  background-color: #fffbeb;
  border-left: 4px solid ${secondaryColor};
  border-radius: 4px;
  padding: 10px 14px;
  margin: 12px 0;
}
.callout-tag {
  color: ${secondaryColor};
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}
.callout-card ul {
  margin: 0;
  padding-left: 18px;
}
.callout-card li {
  margin-bottom: 3px;
}
blockquote {
  background-color: #f8fafc;
  border-left: 4px solid ${primaryColor};
  border-radius: 4px;
  padding: 8px 12px;
  margin: 10px 0;
  font-size: 12px;
  line-height: 1.5;
}
ul {
  padding-left: 20px;
  margin-bottom: 12px;
}
li {
  margin-bottom: 4px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  margin-bottom: 16px;
}
th {
  background-color: #f1f5f9;
  color: ${primaryColor};
  text-align: left;
  padding: 8px;
  border: 1px solid #cbd5e1;
  font-weight: 600;
}
td {
  padding: 8px;
  border: 1px solid #cbd5e1;
}`.trim();

  return { html, css };
}
