const roles = ['screening operator', 'surveillance officer', 'clinician', 'administrator', 'auditor'];

export function session() {
  return JSON.parse(localStorage.getItem('gm-session') || 'null');
}

export function login(role) {
  if (!roles.includes(role)) throw new Error('Select an available operational role.');
  const next = { role, issuedAt: new Date().toISOString() };
  localStorage.setItem('gm-session', JSON.stringify(next));
  return next;
}

export function logout() {
  localStorage.removeItem('gm-session');
}

export function availableRoles() {
  return [...roles];
}
