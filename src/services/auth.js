import { getSessionInfo } from './api.js';

let currentSession = null;

export function session() {
  return currentSession;
}

export async function login() {
  const response = await fetch('/api/v1/auth/login', { method: 'POST', credentials: 'same-origin' });
  if (!response.ok) throw new Error('Identity provider sign-in could not be started.');
  const result = await response.json();
  window.location.assign(result.authorizationUrl);
}

export async function hydrateSession() {
  try {
    currentSession = await getSessionInfo();
  } catch {
    currentSession = null;
  }
  return currentSession;
}

export async function logout() {
  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
  currentSession = null;
  window.location.assign('/console');
}
