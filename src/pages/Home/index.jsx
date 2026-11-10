import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LocalDraftList from '../../components/LocalDraftList/index.jsx';
import StartReportModal from '../../components/StartReportModal/index.jsx';

export const ContainerHomeStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  width: 100%;
`;

export const BannerHomeStl = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.8fr);
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: clamp(24px, 6vw, 64px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const ConteudoBannerStl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const SeloHomeStl = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const TituloHomeStl = styled.h1`
  max-width: 700px;
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: ${({ theme }) => theme.typography.title.fontWeight};
  line-height: 1.1;
  color: ${({ theme }) => theme.typography.title.color};
`;

export const SubtituloHomeStl = styled.p`
  max-width: 650px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
  line-height: ${({ theme }) => theme.typography.subtitle.lineHeight};
`;

export const AcoesHomeStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const BotaoPrimarioStl = styled.button`
  min-height: 48px;
  padding: ${({ theme }) => theme.buttons.primary.padding};
  color: ${({ theme }) => theme.buttons.primary.color};
  background: ${({ theme }) => theme.buttons.primary.background};
  border: ${({ theme }) => theme.buttons.primary.border};
  border-radius: ${({ theme }) => theme.buttons.primary.borderRadius};
  font-weight: 600;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.buttons.primary.hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textPrimary};
    outline-offset: 3px;
  }
`;

export const LinkAdminStl = styled(Link)`
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: underline;
  text-underline-offset: 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const PainelEtapasStl = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const TituloEtapasStl = styled.h2`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ListaEtapasStl = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};

  li::marker {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`;

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  function startReport(configuration) {
    setIsModalOpen(false);
    navigate('/relatorios/novo', { state: configuration });
  }

  return (
    <ContainerHomeStl data-testid="pagina-home">
      <BannerHomeStl aria-labelledby="titulo-home">
        <ConteudoBannerStl>
          <SeloHomeStl>Seu próximo relatório começa aqui</SeloHomeStl>
          <TituloHomeStl id="titulo-home" data-testid="titulo-home">
            Transforme suas ideias em relatórios claros.
          </TituloHomeStl>
          <SubtituloHomeStl data-testid="subtitulo-home">
            Crie manualmente ou comece com uma proposta de IA. Organize o conteúdo,
            revise cada seção e escolha os formatos de saída quando estiver pronto.
          </SubtituloHomeStl>
          <AcoesHomeStl>
            <BotaoPrimarioStl
              type="button"
              onClick={() => setIsModalOpen(true)}
              data-testid="botao-iniciar-relatorio"
            >
              Iniciar novo relatório
            </BotaoPrimarioStl>
            <LinkAdminStl to="/admin/login" data-testid="link-login-admin">
              Acesso administrativo
            </LinkAdminStl>
          </AcoesHomeStl>
        </ConteudoBannerStl>
        <PainelEtapasStl aria-label="Etapas para criar um relatório">
          <TituloEtapasStl>Um fluxo simples</TituloEtapasStl>
          <ListaEtapasStl>
            <li>Escolha como começar e seus formatos.</li>
            <li>Escreva ou revise o relatório por seções.</li>
            <li>Exporte quando o conteúdo estiver pronto.</li>
          </ListaEtapasStl>
        </PainelEtapasStl>
      </BannerHomeStl>

      <LocalDraftList />

      <StartReportModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onStart={startReport}
      />
    </ContainerHomeStl>
  );
}
