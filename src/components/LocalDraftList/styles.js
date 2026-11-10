import styled from 'styled-components';

export const ListaRascunhosStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: clamp(16px, 4vw, 28px);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

export const TituloRascunhosStl = styled.h2`
  color: ${({ theme }) => theme.typography.subtitle.color};
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
`;

export const CartaoRascunhoStl = styled.article`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const TextoRascunhoStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`;

export const AcoesRascunhoStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const BotaoRascunhoStl = styled.button`
  min-height: 44px;
  padding: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].padding};
  color: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].color};
  background: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].background};
  border: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].border};
  border-radius: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].borderRadius};
  font: inherit;
  font-weight: 600;

  &:hover {
    background: ${({ theme, $variant }) => theme.buttons[$variant || 'secondary'].hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const BotaoRetomarStl = styled.button`
  min-height: 44px;
  padding: ${({ theme }) => theme.buttons.primary.padding};
  color: ${({ theme }) => theme.buttons.primary.color};
  background: ${({ theme }) => theme.buttons.primary.background};
  border: ${({ theme }) => theme.buttons.primary.border};
  border-radius: ${({ theme }) => theme.buttons.primary.borderRadius};
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.buttons.primary.hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textPrimary};
    outline-offset: 2px;
  }
`;
