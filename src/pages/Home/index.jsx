import styled from 'styled-components';

export const ContainerHomeStl = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const TituloHomeStl = styled.h1`
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  font-weight: ${({ theme }) => theme.typography.title.fontWeight};
  line-height: ${({ theme }) => theme.typography.title.lineHeight};
  color: ${({ theme }) => theme.typography.title.color};
`;

export const SubtituloHomeStl = styled.p`
  font-size: ${({ theme }) => theme.typography.subtitle.fontSize};
  font-weight: ${({ theme }) => theme.typography.subtitle.fontWeight};
  line-height: ${({ theme }) => theme.typography.subtitle.lineHeight};
  color: ${({ theme }) => theme.typography.subtitle.color};
`;

export const CardPlaceholderStl = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TextoDescritivoStl = styled.p`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  color: ${({ theme }) => theme.typography.body.color};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
`;

export const BotaoPrimarioStl = styled.button`
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.color};
  border: ${({ theme }) => theme.buttons.primary.border};
  padding: ${({ theme }) => theme.buttons.primary.padding};
  border-radius: ${({ theme }) => theme.buttons.primary.borderRadius};
  font-weight: 600;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.buttons.primary.hoverBackground};
  }
`;

export default function Home() {
  return (
    <ContainerHomeStl data-testid="pagina-home">
      <TituloHomeStl data-testid="titulo-home">
        Página Inicial
      </TituloHomeStl>
      <SubtituloHomeStl data-testid="subtitulo-home">
        Casca estrutural configurada e pronta para o desenvolvimento de funcionalidades.
      </SubtituloHomeStl>
      <CardPlaceholderStl data-testid="card-placeholder">
        <TextoDescritivoStl>
          A fundação do projeto está pronta: layout mestre, tema global com styled-components,
          roteamento desacoplado e testes pontuais com Playwright.
        </TextoDescritivoStl>
        <div>
          <BotaoPrimarioStl type="button" data-testid="botao-acao-inicial">
            Ação Principal
          </BotaoPrimarioStl>
        </div>
      </CardPlaceholderStl>
    </ContainerHomeStl>
  );
}
