const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** @returns {string | null} JWT armazenado nesta sessão do navegador. */
export function getToken() {
  return localStorage.getItem('helpdesk_token');
}

export function clearSession() {
  localStorage.removeItem('helpdesk_token');
  localStorage.removeItem('helpdesk_user');
}

/**
 * Executa uma requisição autenticada à API HelpDesk.
 * @async
 * @param {string} path Caminho do endpoint, iniciado por /.
 * @param {RequestInit} options Opções nativas do fetch.
 * @returns {Promise<unknown>} Corpo JSON retornado pela API.
 * @throws {Error} Quando a API está indisponível ou responde com erro.
 */
export async function request(path, options = {}) {
  if (!API_URL) throw new Error('Defina VITE_API_URL para conectar a API.');
  const token = getToken();
  const headers = { Accept: 'application/json', ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new Error(data.message || data.error || 'Não foi possível concluir a solicitação.');
  }
  return data;
}

export const endpoints = {
  login: (payload) => request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  tickets: () => request('/api/v1/chamados'),
  createTicket: (payload) => request('/api/v1/chamados', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id, status) => request(`/api/v1/chamados/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  comments: (id) => request(`/api/v1/chamados/${id}/comentarios`),
  addComment: (id, mensagem) => request(`/api/v1/chamados/${id}/comentarios`, { method: 'POST', body: JSON.stringify({ mensagem }) }),
};
