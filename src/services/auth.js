import { getSessionInfo } from './api.js';

let currentSession = null;

export function session() {
  return currentSession;
}

export async function login(email, password) {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      if (response.status === 502 || response.status === 504) {
        throw new Error('The platform backend is not reachable. Ensure the Go service is running on port 8083.');
      }
      const result = await response.json().catch(() => ({}));
      throw new Error(result.title || 'Sign-in failed. Check your details and try again.');
    }
    currentSession = await response.json();
    return currentSession;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to authentication service. Ensure the Go backend is running on port 8083.');
    }
    throw err;
  }
}

async function authRequest(path, body) {
  try {
    const response = await fetch(`/api/v1/auth/${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 502 || response.status === 504) {
        throw new Error('The platform backend is not reachable. Ensure the Go service is running on port 8083.');
      }
      const result = await response.json().catch(() => ({}));
      throw new Error(result.title || 'The request could not be completed.');
    }
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to authentication service. Ensure the Go backend is running on port 8083.');
    }
    throw err;
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
