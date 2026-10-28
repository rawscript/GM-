import { getSessionInfo } from './api.js';

let currentSession = null;

export function session() {
  return currentSession;
}

export async function login(email, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.title || 'Sign-in failed. Check your details and try again.');
  }
  currentSession = await response.json();
  return currentSession;
}

async function authRequest(path, body) {
  const response = await fetch(`/api/v1/auth/${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.title || 'The request could not be completed.');
  }
}

export const requestPasswordReset = (email) => authRequest('recover', { email });
export const setRecoveredPassword = (accessToken, password) =>
  authRequest('password', { accessToken, password });

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
