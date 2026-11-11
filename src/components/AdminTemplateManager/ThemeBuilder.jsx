import { DEFAULT_THEME_CONFIG } from './themeCompiler.js';
import {
  CampoModeloStl,
  GradeThemeBuilderStl,
  GrupoControleCorStl,
  InputCorStl,
  InputModeloStl,
  MiniPreviaThemeStl,
  SelecaoOpcaoStl,
  TextoAjudaModeloStl,
} from './styles.js';

export default function ThemeBuilder({ config = DEFAULT_THEME_CONFIG, onChangeConfig }) {
  function update(key, value) {
    onChangeConfig({ ...config, [key]: value });
  }

  const isSplit = config.coverLayout === 'split-bar';
  const isCentered = config.coverLayout === 'centered';

  return (
    <div data-testid="theme-builder">
      <TextoAjudaModeloStl>
        Personalize a identidade visual do modelo. As configurações abaixo são compiladas automaticamente em HTML e CSS seguros compatíveis com as regras de impressão do servidor.
      </TextoAjudaModeloStl>

      <GradeThemeBuilderStl>
        <CampoModeloStl>
          Cor Primária (Títulos e Destaque)
          <GrupoControleCorStl>
            <InputCorStl
              type="color"
              aria-label="Seletor de cor primária"
              value={config.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
            />
            <InputModeloStl
              aria-label="Código hexadecimal da cor primária"
              maxLength={7}
              value={config.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
            />
          </GrupoControleCorStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Cor Secundária (Subtítulos e Tags)
          <GrupoControleCorStl>
            <InputCorStl
              type="color"
              aria-label="Seletor de cor secundária"
              value={config.secondaryColor}
              onChange={(e) => update('secondaryColor', e.target.value)}
            />
            <InputModeloStl
              aria-label="Código hexadecimal da cor secundária"
              maxLength={7}
              value={config.secondaryColor}
              onChange={(e) => update('secondaryColor', e.target.value)}
            />
          </GrupoControleCorStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Cor do Texto
          <GrupoControleCorStl>
            <InputCorStl
              type="color"
              aria-label="Seletor de cor do texto"
              value={config.textColor}
              onChange={(e) => update('textColor', e.target.value)}
            />
            <InputModeloStl
              aria-label="Código hexadecimal da cor do texto"
              maxLength={7}
              value={config.textColor}
              onChange={(e) => update('textColor', e.target.value)}
            />
          </GrupoControleCorStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Família Tipográfica
          <SelecaoOpcaoStl
            aria-label="Família tipográfica"
            value={config.fontFamily}
            onChange={(e) => update('fontFamily', e.target.value)}
          >
            <option value="Arial, sans-serif">Arial (Sem Serifa Corporativo)</option>
            <option value="Georgia, serif">Georgia (Serifa Editorial)</option>
            <option value="Courier, monospace">Courier (Monoespacada Técnica)</option>
          </SelecaoOpcaoStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Tamanho Base da Fonte
          <SelecaoOpcaoStl
            aria-label="Tamanho base da fonte"
            value={config.fontSizeBase}
            onChange={(e) => update('fontSizeBase', e.target.value)}
          >
            <option value="12px">12px (Compacto)</option>
            <option value="13px">13px (Padrão)</option>
            <option value="14px">14px (Amplo)</option>
          </SelecaoOpcaoStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Layout do Cabeçalho / Capa
          <SelecaoOpcaoStl
            aria-label="Layout do cabeçalho"
            value={config.coverLayout}
            onChange={(e) => update('coverLayout', e.target.value)}
          >
            <option value="split-bar">Barra Lateral de Destaque</option>
            <option value="centered">Centralizado Elegante</option>
            <option value="clean">Minimalista Limpo</option>
          </SelecaoOpcaoStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Etiqueta / Tag do Cabeçalho
          <InputModeloStl
            aria-label="Etiqueta do cabeçalho"
            maxLength={60}
            value={config.headerBadgeText}
            onChange={(e) => update('headerBadgeText', e.target.value)}
          />
        </CampoModeloStl>

        <CampoModeloStl>
          Margens de Impressão (@page)
          <SelecaoOpcaoStl
            aria-label="Margens da página"
            value={config.pageMargins}
            onChange={(e) => update('pageMargins', e.target.value)}
          >
            <option value="normal">Normal (20mm topo / 15mm lados)</option>
            <option value="narrow">Estreita (15mm topo / 10mm lados)</option>
            <option value="wide">Ampla (25mm topo / 20mm lados)</option>
          </SelecaoOpcaoStl>
        </CampoModeloStl>

        <CampoModeloStl>
          Formato de Paginação no Rodapé
          <SelecaoOpcaoStl
            aria-label="Formato do rodapé"
            value={config.footerFormat}
            onChange={(e) => update('footerFormat', e.target.value)}
          >
            <option value="page-of-pages">Página X de Y</option>
            <option value="page-only">Apenas número da página</option>
            <option value="confidential-page">Confidencial • Página X</option>
          </SelecaoOpcaoStl>
        </CampoModeloStl>
      </GradeThemeBuilderStl>

      <CampoModeloStl style={{ marginTop: '14px' }}>
        Amostra Visual da Composição
        <MiniPreviaThemeStl
          data-testid="amostra-theme-builder"
          $primaryColor={config.primaryColor}
          $secondaryColor={config.secondaryColor}
          $textColor={config.textColor}
          $bgColor={config.backgroundColor}
          $fontFamily={config.fontFamily}
          $fontSize={config.fontSizeBase}
        >
          <div className={`mini-header ${isSplit ? 'split' : isCentered ? 'centered' : ''}`}>
            <span className="mini-badge">{config.headerBadgeText || 'RELATÓRIO'}</span>
            <div className="mini-title">Título do Relatório de Exemplo</div>
            <small style={{ color: '#64748b' }}>Tema e escopo da análise</small>
          </div>
          <div>Este parágrafo demonstra a proporção visual, cores e tipografia da folha formatada.</div>
          <div className="mini-footer">
            <span>Rodapé do documento</span>
            <span>{config.footerFormat === 'confidential-page' ? 'Confidencial • Pág. 1' : 'Pág. 1 de 3'}</span>
          </div>
        </MiniPreviaThemeStl>
      </CampoModeloStl>
    </div>
  );
}
