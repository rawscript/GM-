export function triageTier({ measurementAvailable, exposureFlags, ruleTriggered }) {
  if (!measurementAvailable) return 'amber';
  if (ruleTriggered === 'urgent' || exposureFlags.includes('priority')) return 'red';
  if (ruleTriggered || exposureFlags.length > 0) return 'amber';
  return 'green';
}

export function baselineDeviation(value, baseline) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline)) return null;
  return Math.round((value - baseline) * 10) / 10;
}

export function idempotencyKey(patientId, timestamp, syndrome) {
  return `${patientId}:${timestamp}:${syndrome}`.toLowerCase().replaceAll(/[^a-z0-9:-]/g, '');
}
