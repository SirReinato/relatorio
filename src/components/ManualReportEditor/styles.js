import styled, { css } from 'styled-components';

const fieldStyles = css`
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

export const PaginaEditorStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 36px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

export const CabecalhoEditorStl = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TituloEditorStl = styled.h1`
  color: ${({ theme }) => theme.typography.title.color};
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  line-height: ${({ theme }) => theme.typography.title.lineHeight};
`;

export const TextoSecundarioStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const GrupoCamposStl = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
`;

export const CampoRelatorioStl = styled.label`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
`;

export const InputRelatorioStl = styled.input`
  ${fieldStyles}
`;

export const AreaTextoRelatorioStl = styled.textarea`
  ${fieldStyles}
  min-height: ${({ $compact }) => ($compact ? '44px' : '120px')};
  resize: vertical;
  font: inherit;
  font-weight: 400;
`;

export const SelecaoRelatorioStl = styled.select`
  ${fieldStyles}
`;

export const GrupoAcoesStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const BotaoEditorStl = styled.button`
  ${({ theme, $variant }) => ($variant === 'danger'
    ? css`
      padding: ${theme.buttons.secondary.padding};
      color: #ffffff;
      background: ${theme.colors.danger};
      border: none;
      border-radius: ${theme.buttons.secondary.borderRadius};
    `
    : css`
      padding: ${theme.buttons[$variant || 'secondary'].padding};
      color: ${theme.buttons[$variant || 'secondary'].color};
      background: ${theme.buttons[$variant || 'secondary'].background};
      border: ${theme.buttons[$variant || 'secondary'].border};
      border-radius: ${theme.buttons[$variant || 'secondary'].borderRadius};
    `)}
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    ${({ theme, $variant }) => ($variant === 'danger'
    ? css`filter: brightness(1.12);`
    : css`background: ${theme.buttons[$variant || 'secondary'].hoverBackground};`)}
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const GrupoSecoesStl = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CartaoSecaoStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const CabecalhoSecaoStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const TituloSecaoStl = styled.h2`
  padding: 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
  font-weight: 700;
`;

export const ListaDetalhesStl = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ItemDetalheStl = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const GradeImagensStl = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CartaoImagemStl = styled.figure`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  img {
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    background: ${({ theme }) => theme.colors.background};
  }

  figcaption {
    color: ${({ theme }) => theme.colors.textSecondary};
    overflow-wrap: anywhere;
  }
`;

export const PainelPreviaStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const MensagemErroStl = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: rgba(218, 54, 51, 0.16);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  ul {
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    padding-left: ${({ theme }) => theme.spacing.lg};
  }
`;

export const StatusSalvamentoStl = styled.p`
  color: ${({ $isError, theme }) => ($isError ? theme.colors.danger : theme.colors.textSecondary)};
`;
