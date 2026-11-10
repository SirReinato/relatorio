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
