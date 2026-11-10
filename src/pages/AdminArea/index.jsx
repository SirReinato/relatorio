import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AdminTemplateManager from '../../components/AdminTemplateManager/index.jsx';
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setErrorMessage('');
    setIsUnauthorized(false);
    fetchAdminTemplates()
      .then((result) => {
        if (!Array.isArray(result.templates)) {
          throw new Error('A API retornou uma lista de modelos inválida.');
        }
        if (isCurrent) {
          setTemplates(result.templates);
          setHasLoaded(true);
        }
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
  if (isLoading) {
    return (
      <ConteudoAdminStl data-testid="pagina-admin" role="status">
        <MensagemAdminStl>Verificando sessão administrativa…</MensagemAdminStl>
      </ConteudoAdminStl>
    );
  }

  function handleUnauthorized() {
    setIsUnauthorized(true);
  }

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
      <TextoAdminStl>Acesso autenticado. Administre modelos PDF publicados e inativos.</TextoAdminStl>
      {errorMessage && (
        <MensagemAdminStl role="alert" $isError>
          {errorMessage}
        </MensagemAdminStl>
      )}
      {errorMessage && (
        <AcoesAdminStl>
          <BotaoAdminStl type="button" onClick={() => setRetryCount((current) => current + 1)}>
            Tentar novamente
          </BotaoAdminStl>
          <LinkAdminStl to="/">Voltar para o início</LinkAdminStl>
        </AcoesAdminStl>
      )}
      {(!errorMessage || hasLoaded) && (
        <AdminTemplateManager
          templates={templates}
          onTemplatesChanged={() => setRetryCount((current) => current + 1)}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </ConteudoAdminStl>
  );
}
