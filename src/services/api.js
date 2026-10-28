const API_ROOT = '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

export const getContacts = () => request('/contacts');
export const getAlerts = () => request('/alerts');
export const getOutbox = () => request('/adam/outbox');
export const getSession = () => request('/session');
export const getSessionInfo = () => getSession();
export const getPerson = id => request(`/contacts/${encodeURIComponent(id)}`);
export const acknowledgeAlert = (id, reason) => request(`/alerts/${encodeURIComponent(id)}/acknowledge`, { method: 'POST', body: JSON.stringify({ reason }) });
export const resolveAlert = (id, reason) => request(`/alerts/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: JSON.stringify({ reason }) });
export const createRevealGrant = (id, purpose) => request(`/registry/${encodeURIComponent(id)}/reveal-grants`, { method: 'POST', body: JSON.stringify({ purpose }) });
export const revealIdentity = (id, grant, challenge) => request(`/registry/${encodeURIComponent(id)}/reveal`, { method: 'POST', body: JSON.stringify({ grant, challenge }) });
export const exportAdam = () => request('/adam/exports', { method: 'POST' });
export const inviteUser = (email, role, sites) => request('/admin/users/invite', {
  method: 'POST',
  body: JSON.stringify({ email, role, sites }),
});
