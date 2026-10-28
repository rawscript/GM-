let source;
const listeners = new Set();

export function subscribeAlerts(listener) {
  listeners.add(listener);
  if (!source) connect();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && source) {
      source.close();
      source = null;
    }
  };
}

function connect() {
  source = new EventSource('/api/v1/events', { withCredentials: true });
  source.addEventListener('alert.raised', event => publish(event));
  source.addEventListener('alert.escalated', event => publish(event));
}

function publish(event) {
  const alert = JSON.parse(event.data);
  for (const listener of listeners) listener(alert);
}
