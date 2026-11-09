class ApiRequestError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
  }
}

async function requestApi(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Tente novamente.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('A API retornou uma resposta inválida.');
  }

  if (!response.ok) {
    throw new ApiRequestError(
      result.error?.message || 'Não foi possível concluir a solicitação.',
      response.status,
    );
  }

  return result;
}

export async function fetchPublicTemplates() {
  const result = await requestApi('/api/v1/templates');
  if (!Array.isArray(result.templates)) {
    throw new Error('A API retornou uma lista de modelos inválida.');
  }
  return result.templates.filter((template) => template.status === 'published');
}

export function loginAdmin(credentials) {
  return requestApi('/api/v1/admin/session', {
    method: 'POST',
    body: credentials,
  });
}

export function fetchAdminTemplates() {
  return requestApi('/api/v1/admin/templates');
}

export function logoutAdmin() {
  return requestApi('/api/v1/admin/session', { method: 'DELETE' });
}
