import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchAdminTemplates, logoutAdmin } from '../../services/api.js';

const ConteudoAdminStl = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 40px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const CabecalhoAdminStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TituloAdminStl = styled.h1`
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  color: ${({ theme }) => theme.typography.title.color};
`;

const TextoAdminStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ListaModelosStl = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.md};
    padding: ${({ theme }) => theme.spacing.md};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border-radius: ${({ theme }) => theme.borderRadius.md};
  }
`;

const AcoesAdminStl = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BotaoAdminStl = styled.button`
  min-height: 44px;
  padding: ${({ theme }) => theme.buttons.secondary.padding};
  color: ${({ theme }) => theme.buttons.secondary.color};
  background: ${({ theme }) => theme.buttons.secondary.background};
  border: ${({ theme }) => theme.buttons.secondary.border};
  border-radius: ${({ theme }) => theme.buttons.secondary.borderRadius};
  cursor: pointer;
`;

const LinkAdminStl = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: underline;
  text-underline-offset: 3px;
`;

const MensagemAdminStl = styled.p`
  color: ${({ $isError, theme }) => ($isError ? theme.colors.danger : theme.colors.textSecondary)};
`;

export default function AdminArea() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');
    setIsUnauthorized(false);
    fetchAdminTemplates()
      .then((result) => {
        if (isCurrent) setTemplates(result.templates);
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (error.statusCode === 401) {
          setIsUnauthorized(true);
          return;
        }
        setErrorMessage(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  if (isUnauthorized) return <Navigate to="/admin/login" replace />;

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage('');
    try {
      await logoutAdmin();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      if (error.statusCode === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(error.message);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <ConteudoAdminStl data-testid="pagina-admin">
      <CabecalhoAdminStl>
        <TituloAdminStl>Área administrativa</TituloAdminStl>
        <BotaoAdminStl type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </BotaoAdminStl>
      </CabecalhoAdminStl>
      <TextoAdminStl>
        Acesso autenticado. A edição e publicação de modelos PDF serão ampliadas na etapa de administração.
      </TextoAdminStl>
      {isLoading && <MensagemAdminStl role="status">Verificando sessão…</MensagemAdminStl>}
      {errorMessage && (
        <MensagemAdminStl role="alert" $isError>
          {errorMessage}
        </MensagemAdminStl>
      )}
      {!isLoading && !errorMessage && (
        <>
          <TextoAdminStl>
            {templates.length
              ? `${templates.length} modelo(s) PDF encontrado(s).`
              : 'Nenhum modelo PDF cadastrado.'}
          </TextoAdminStl>
          {templates.length > 0 && (
            <ListaModelosStl aria-label="Modelos PDF cadastrados">
              {templates.map((template) => (
                <li key={template.id}>
                  <span>{template.name}</span>
                  <span>{template.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                </li>
              ))}
            </ListaModelosStl>
          )}
        </>
      )}
      {errorMessage && (
        <AcoesAdminStl>
          <BotaoAdminStl type="button" onClick={() => setRetryCount((current) => current + 1)}>
            Tentar novamente
          </BotaoAdminStl>
          <LinkAdminStl to="/">Voltar para o início</LinkAdminStl>
        </AcoesAdminStl>
      )}
    </ConteudoAdminStl>
  );
}
