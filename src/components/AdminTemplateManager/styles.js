import styled from 'styled-components';

const fieldStyles = `
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const GerenciadorModelosStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const CabecalhoModelosStl = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const TituloModelosStl = styled.h2`
  color: ${({ theme }) => theme.typography.subtitle.color};
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
`;

export const FormularioModeloStl = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const CampoModeloStl = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
`;

export const InputModeloStl = styled.input`
  ${fieldStyles}
`;

export const AreaModeloStl = styled.textarea`
  ${fieldStyles}
  min-height: 150px;
  resize: vertical;
  font: inherit;
  font-weight: 400;
`;

export const TextoAjudaModeloStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};

  code {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const ListaModelosStl = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const CartaoModeloStl = styled.li`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const CabecalhoCartaoModeloStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};

  h3 {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const StatusModeloStl = styled.span`
  color: ${({ $published, theme }) => (
    $published ? theme.colors.secondary : theme.colors.textSecondary
  )};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;

export const AcoesModeloStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const BotaoModeloStl = styled.button`
  min-height: 44px;
  padding: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.padding : theme.buttons.secondary.padding
  )};
  color: ${({ theme, $primary, $danger }) => (
    $danger ? '#ffffff' : $primary ? theme.buttons.primary.color : theme.buttons.secondary.color
  )};
  background: ${({ theme, $primary, $danger }) => (
    $danger ? theme.colors.danger : $primary ? theme.buttons.primary.background : theme.buttons.secondary.background
  )};
  border: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.border : theme.buttons.secondary.border
  )};
  border-radius: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.borderRadius : theme.buttons.secondary.borderRadius
  )};
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme, $primary, $danger }) => (
    $danger ? theme.colors.danger : $primary ? theme.buttons.primary.hoverBackground : theme.buttons.secondary.hoverBackground
  )};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const MensagemModeloStl = styled.p`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ $isError, theme }) => (
    $isError ? theme.colors.danger : theme.colors.textSecondary
  )};
`;

export const PainelPreviaModeloStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const FramePreviaModeloStl = styled.iframe`
  width: 100%;
  min-height: 560px;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const PainelModoEditorStl = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const AbaModoStl = styled.button`
  flex: 1;
  padding: 8px 16px;
  color: ${({ $ativo, theme }) => ($ativo ? '#ffffff' : theme.colors.textSecondary)};
  background: ${({ $ativo, theme }) => ($ativo ? theme.colors.primary : 'transparent')};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover:not(:disabled) {
    color: #ffffff;
    background: ${({ $ativo, theme }) => ($ativo ? theme.colors.primary : theme.colors.surfaceAlt)};
  }
`;

export const GradeThemeBuilderStl = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const GrupoControleCorStl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const InputCorStl = styled.input`
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  background: transparent;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
`;

export const SelecaoOpcaoStl = styled.select`
  ${fieldStyles}
`;

export const MiniPreviaThemeStl = styled.div`
  display: grid;
  gap: 8px;
  padding: 14px;
  color: ${({ $textColor }) => $textColor || '#0f172a'};
  background-color: ${({ $bgColor }) => $bgColor || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ $fontFamily }) => $fontFamily || 'Arial, sans-serif'};
  font-size: ${({ $fontSize }) => $fontSize || '12px'};

  .mini-header {
    border-bottom: 2px solid ${({ $primaryColor }) => $primaryColor || '#1f6feb'};
    padding-bottom: 6px;
    margin-bottom: 6px;

    &.split {
      border-left: 4px solid ${({ $primaryColor }) => $primaryColor || '#1f6feb'};
      padding-left: 8px;
    }
    &.centered {
      text-align: center;
    }
  }

  .mini-badge {
    font-size: 9px;
    font-weight: 700;
    color: ${({ $secondaryColor }) => $secondaryColor || '#238636'};
    letter-spacing: 0.5px;
  }

  .mini-title {
    font-size: 15px;
    font-weight: 700;
    color: ${({ $primaryColor }) => $primaryColor || '#1f6feb'};
    margin: 2px 0;
  }

  .mini-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    font-size: 9px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }
`;
