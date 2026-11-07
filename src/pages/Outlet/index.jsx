import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

export const ContainerGeralStl = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const HeaderStl = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const LogoStl = styled.div`
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
  font-weight: ${({ theme }) => theme.typography.title.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ConteudoPrincipalStl = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
`;

export const FooterStl = styled.footer`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;

export default function MainGeral() {
  return (
    <ContainerGeralStl data-testid="layout-geral">
      <HeaderStl data-testid="header-fixo">
        <LogoStl data-testid="header-logo">
          Relatórios
        </LogoStl>
      </HeaderStl>
      <ConteudoPrincipalStl data-testid="conteudo-outlet">
        <Outlet />
      </ConteudoPrincipalStl>
      <FooterStl data-testid="footer-fixo">
        © {new Date().getFullYear()} Sistema de Relatórios — Todos os direitos reservados
      </FooterStl>
    </ContainerGeralStl>
  );
}
