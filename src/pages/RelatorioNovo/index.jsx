import { lazy, Suspense } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';

const ManualReportEditor = lazy(() => import('../../components/ManualReportEditor/index.jsx'));
const ReportGenerationForm = lazy(() => import('../../components/ReportGenerationForm/index.jsx'));

const formatLabels = {
  pdf: 'PDF',
  docx: 'DOCX',
  markdown: 'Markdown',
};

const ConteudoInicioStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 40px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const TituloInicioStl = styled.h1`
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  line-height: ${({ theme }) => theme.typography.title.lineHeight};
  color: ${({ theme }) => theme.typography.title.color};
`;

const DescricaoInicioStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ResumoSelecaoStl = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  div {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
  }

  dt {
    font-weight: 600;
  }

  dd {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const LinkVoltarStl = styled(Link)`
  width: fit-content;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.buttons.primary.padding};
  color: ${({ theme }) => theme.buttons.primary.color};
  background: ${({ theme }) => theme.buttons.primary.background};
  border-radius: ${({ theme }) => theme.buttons.primary.borderRadius};
  font-weight: 600;

  &:hover {
    background: ${({ theme }) => theme.buttons.primary.hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textPrimary};
    outline-offset: 3px;
  }
`;

export default function RelatorioNovo() {
  const { state } = useLocation();
  const { draftId: routeDraftId } = useParams();
  const draftId = state?.draftId || routeDraftId;
  if (state?.mode === 'ai' && !draftId) {
    return (
      <Suspense fallback={<ConteudoInicioStl role="status">Preparando geração assistida…</ConteudoInicioStl>}>
        <ReportGenerationForm configuration={state} />
      </Suspense>
    );
  }
  if (state?.mode === 'manual' || draftId) {
    return (
      <Suspense fallback={<ConteudoInicioStl role="status">Abrindo o editor manual…</ConteudoInicioStl>}>
        <ManualReportEditor
          configuration={state}
          draftId={draftId}
          initialDraft={state?.initialDraft}
          initialSaveError={state?.initialSaveError}
        />
      </Suspense>
    );
  }

  const selectedFormats = Array.isArray(state?.selectedFormats)
    ? state.selectedFormats.filter((format) => formatLabels[format])
    : [];
  const startMode = state?.mode === 'ai'
    ? 'Começar com IA'
    : state?.mode === 'manual'
      ? 'Escrever manualmente'
      : 'Não selecionado';

  return (
    <ConteudoInicioStl data-testid="pagina-novo-relatorio">
      <TituloInicioStl>Seu relatório está pronto para começar</TituloInicioStl>
      <DescricaoInicioStl>
        {state?.mode === 'ai'
          ? 'A geração assistida estará disponível na próxima etapa. Esta escolha não envia nenhum conteúdo à IA ainda.'
          : 'O editor manual será disponibilizado na próxima etapa. Suas escolhas ficam nesta sessão de navegação.'}
      </DescricaoInicioStl>
      <ResumoSelecaoStl aria-label="Resumo das escolhas">
        <div>
          <dt>Modalidade</dt>
          <dd>{startMode}</dd>
        </div>
        <div>
          <dt>Formatos</dt>
          <dd data-testid="formatos-selecionados">
            {selectedFormats.length
              ? selectedFormats.map((format) => formatLabels[format]).join(', ')
              : 'Nenhum formato selecionado; você poderá escolher depois.'}
          </dd>
        </div>
        <div>
          <dt>Modelo PDF</dt>
          <dd data-testid="modelo-selecionado">
            {state?.pdfTemplateName || 'Nenhum modelo selecionado'}
          </dd>
        </div>
      </ResumoSelecaoStl>
      <LinkVoltarStl to="/">Voltar para o início</LinkVoltarStl>
    </ConteudoInicioStl>
  );
}
