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

export const FormularioGeracaoStl = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 40px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

export const TituloGeracaoStl = styled.h1`
  color: ${({ theme }) => theme.typography.title.color};
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  line-height: ${({ theme }) => theme.typography.title.lineHeight};
`;

export const TextoGeracaoStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const GradeCamposGeracaoStl = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
`;

export const CampoGeracaoStl = styled.label`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
`;

export const InputGeracaoStl = styled.input`
  ${fieldStyles}
`;

export const TextoAreaGeracaoStl = styled.textarea`
  ${fieldStyles}
  min-height: 110px;
  resize: vertical;
  font: inherit;
  font-weight: 400;
`;

export const SelectGeracaoStl = styled.select`
  ${fieldStyles}
`;

export const AcoesGeracaoStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const BotaoGeracaoStl = styled.button`
  min-height: 44px;
  padding: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.padding : theme.buttons.secondary.padding
  )};
  color: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.color : theme.buttons.secondary.color
  )};
  background: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.background : theme.buttons.secondary.background
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
    background: ${({ theme, $primary }) => (
    $primary ? theme.buttons.primary.hoverBackground : theme.buttons.secondary.hoverBackground
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

export const ErroGeracaoStl = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: rgba(218, 54, 51, 0.16);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;
