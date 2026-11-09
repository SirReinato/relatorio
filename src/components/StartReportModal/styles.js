import styled from 'styled-components';

export const DialogIniciarStl = styled.dialog`
  width: min(640px, calc(100vw - 32px));
  max-height: min(90vh, 760px);
  margin: auto;
  padding: 0;
  overflow: auto;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};

  &::backdrop {
    background: rgb(0 0 0 / 72%);
    backdrop-filter: blur(3px);
  }
`;

export const ConteudoModalStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: clamp(20px, 5vw, 36px);
`;

export const CabecalhoModalStl = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TituloModalStl = styled.h2`
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
  line-height: ${({ theme }) => theme.typography.title.lineHeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const TextoModalStl = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const BotaoFecharModalStl = styled.button`
  flex: 0 0 auto;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const GrupoOpcoesStl = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0;
  border: 0;
`;

export const LegendaOpcoesStl = styled.legend`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
`;

export const OpcaoCardStl = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  input {
    margin-top: 4px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const TextoOpcaoStl = styled.span`
  display: grid;
  gap: 2px;

  small {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const ListaFormatosStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const FormatoCardStl = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;

  input {
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const SelecaoModeloStl = styled.select`
  width: 100%;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export const MensagemEstadoStl = styled.p`
  color: ${({ $isError, theme }) => ($isError ? theme.colors.danger : theme.colors.textSecondary)};
`;

export const AcoesModalStl = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 480px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;

export const BotaoModalPrimarioStl = styled.button`
  min-height: 44px;
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
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`;

export const BotaoModalSecundarioStl = styled.button`
  min-height: 44px;
  padding: ${({ theme }) => theme.buttons.secondary.padding};
  color: ${({ theme }) => theme.buttons.secondary.color};
  background: ${({ theme }) => theme.buttons.secondary.background};
  border: ${({ theme }) => theme.buttons.secondary.border};
  border-radius: ${({ theme }) => theme.buttons.secondary.borderRadius};

  &:hover {
    background: ${({ theme }) => theme.buttons.secondary.hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
