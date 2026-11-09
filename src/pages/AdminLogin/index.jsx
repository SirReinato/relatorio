import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { loginAdmin } from '../../services/api.js';

const FormularioLoginStl = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 36px);
  background: ${({ theme }) => theme.gradients.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const TituloLoginStl = styled.h1`
  font-size: ${({ theme }) => theme.typography.title.fontSize};
  color: ${({ theme }) => theme.typography.title.color};
`;

const TextoLoginStl = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CampoLoginStl = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;

  input {
    min-height: 44px;
    padding: 0 ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
  }

  input:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const MensagemLoginStl = styled.p`
  color: ${({ theme }) => theme.colors.danger};
`;

const BotaoLoginStl = styled.button`
  min-height: 46px;
  padding: ${({ theme }) => theme.buttons.primary.padding};
  color: ${({ theme }) => theme.buttons.primary.color};
  background: ${({ theme }) => theme.buttons.primary.background};
  border-radius: ${({ theme }) => theme.buttons.primary.borderRadius};
  font-weight: 600;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.buttons.primary.hoverBackground};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textPrimary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;

const LinkHomeStl = styled(Link)`
  width: fit-content;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginAdmin({ username: username.trim(), password });
      navigate('/admin', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormularioLoginStl onSubmit={handleSubmit} data-testid="formulario-login-admin">
      <TituloLoginStl>Acesso administrativo</TituloLoginStl>
      <TextoLoginStl>Entre para acessar a área de administração.</TextoLoginStl>
      <CampoLoginStl>
        Usuário
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={100}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </CampoLoginStl>
      <CampoLoginStl>
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </CampoLoginStl>
      {errorMessage && <MensagemLoginStl role="alert">{errorMessage}</MensagemLoginStl>}
      <BotaoLoginStl type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </BotaoLoginStl>
      <LinkHomeStl to="/">Voltar para a página inicial</LinkHomeStl>
    </FormularioLoginStl>
  );
}
