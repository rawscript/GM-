export const contacts = [
  { id: 'GM-KEN-1048', status: 'Monitoring', site: 'Jomo Kenyatta International Airport', day: 4, last: '10:42 EAT', quality: 'Good', adam: 'AD-8821', tier: 'green' },
  { id: 'GM-KEN-1072', status: 'Review required', site: 'Kisumu Border Health Unit', day: 9, last: '10:18 EAT', quality: 'Good', adam: 'AD-8846', tier: 'amber' },
  { id: 'GM-KEN-1119', status: 'Health worker follow-up', site: 'Mombasa Port Health', day: 12, last: '09:56 EAT', quality: 'Fair', adam: 'Not linked', tier: 'red' },
  { id: 'GM-KEN-1160', status: 'Monitoring', site: 'Moi International Airport', day: 2, last: '09:23 EAT', quality: 'Good', adam: 'AD-8892', tier: 'green' },
  { id: 'GM-KEN-1194', status: 'Check-in missed', site: 'Nairobi Hospital Entrance', day: 15, last: 'Yesterday 18:10 EAT', quality: 'Gap detected', adam: 'AD-8901', tier: 'amber' }
];

export const alerts = [
  { id: 'AL-24018', person: 'GM-KEN-1119', tier: 'red', title: 'Review trend summary and contact the health worker', trigger: 'Combined trend rule; signal quality fair', time: '09:56 EAT', raised: '18 min ago', actor: 'System rule' },
  { id: 'AL-24016', person: 'GM-KEN-1072', tier: 'amber', title: 'Health-worker call suggested', trigger: 'Exposure flag recorded at checkpoint', time: '10:18 EAT', raised: '36 min ago', actor: 'System rule' },
  { id: 'AL-24011', person: 'GM-KEN-1194', tier: 'amber', title: 'Check-in gap requires review', trigger: 'Expected sequence not received', time: 'Yesterday 18:10 EAT', raised: '16 h ago', actor: 'System rule' }
];

export const outbox = [
  { message: 'GMN-5EA8-1048', type: 'Monitoring summary', patient: 'GM-KEN-1048', adam: 'AD-8821', state: 'Acknowledged', attempts: 1, last: '10:32 EAT' },
  { message: 'GMN-5EA8-1072', type: 'Suspected-case notification', patient: 'GM-KEN-1072', adam: 'AD-8846', state: 'Queued', attempts: 0, last: '10:18 EAT' },
  { message: 'GMN-5EA8-1119', type: 'Suspected-case notification', patient: 'GM-KEN-1119', adam: 'Not linked', state: 'Failed', attempts: 2, last: '09:58 EAT' }
];
