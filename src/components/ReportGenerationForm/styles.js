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

export const ZonaDropUploadStl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px dashed ${({ theme, $isDragging }) => ($isDragging ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $isDragging }) => ($isDragging ? 'rgba(31, 111, 235, 0.1)' : theme.colors.surfaceAlt)};
  text-align: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const InputOcultoUploadStl = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

export const ListaAnexosStl = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const ChipAnexoStl = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 13px;
`;

export const BadgeTipoAnexoStl = styled.span`
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary};
  background: rgba(31, 111, 235, 0.15);
  border-radius: 4px;
`;

export const NomeAnexoStl = styled.span`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
`;

export const TamanhoAnexoStl = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const BotaoRemoverAnexoStl = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: transparent;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
    background: rgba(218, 54, 51, 0.12);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.danger};
    outline-offset: 1px;
  }
`;

export const TextoAjudaAnexoStl = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;
