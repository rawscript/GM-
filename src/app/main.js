import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '../design/tokens.css';
import { pages, publicLinks } from '../content/pages.js';
import { login, logout, session, hydrateSession } from '../services/auth.js';
import { getAlerts, getContacts, getOutbox, acknowledgeAlert, resolveAlert, createRevealGrant, revealIdentity, exportAdam } from '../services/api.js';
import { subscribeAlerts } from '../services/live.js';

const app = document.querySelector('#app');
let contacts = [];
let alerts = [];
let outbox = [];
const consoleLinks = [['/console', 'Overview'], ['/console/contacts', 'Contacts'], ['/console/alerts', 'Alerts'], ['/console/checkins', 'Missed check-ins'], ['/console/labs', 'Laboratory results'], ['/console/sites', 'Sites'], ['/console/adam', 'ADaM linkage'], ['/console/audit', 'Audit log']];

function linkList(links, current) {
  return links.map(([url, label]) => `<a href="${url}"${url === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

function header(path) {
  return `<a class="skip-link" href="#main">Skip to main content</a><header class="site-header"><div class="container header-row"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">GM</span><span>GM SYSTEM</span></a><nav class="nav-links" aria-label="Primary navigation">${linkList(publicLinks, path)}<a href="/console">Operations</a></nav></div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="container"><div class="footer-top"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">GM</span><span>GM SYSTEM</span></a><nav class="nav-links" aria-label="Footer navigation">${linkList(publicLinks, '')}</nav></div><div class="footer-bottom"><span>Gusmao–Mbaja · Kenya</span><span>Screening, monitoring and triage support. Laboratory confirmation remains with national laboratories.</span></div></div></footer>`;
}

function notice(text) {
  return `<div class="notice" role="note"><span class="index" aria-hidden="true">i</span><div><strong>Designed as a decision-support aid</strong><p>${text}</p></div></div>`;
}

function editorial(points) {
  return `<div class="editorial-list">${points.map(([number, title, description]) => `<article class="editorial-item"><span class="index">${number}</span><h3>${title}</h3><p>${description}</p></article>`).join('')}</div>`;
}

function overview(page) {
  return `<section class="hero"><div class="container"><div class="hero-content"><span class="eyebrow">${page.eyebrow}</span><h1>${page.title}</h1><p class="lead">${page.lead}</p><div class="hero-actions"><a class="button light" href="/checkpoint">Explore the system <span aria-hidden="true">→</span></a><a class="button secondary" href="/integration">How ADaM linkage works</a></div></div></div></section><section class="section"><div class="container grid"><div class="section-head"><span class="eyebrow">The pathway</span><h2>${page.section}</h2></div><p class="section-copy">${page.body}</p>${editorial(page.points)}</div></section><section class="stats-band"><div class="container grid">${page.stats.map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div></section><section class="section"><div class="container">${notice(page.note)}</div></section>`;
}

function detailPage(page, path) {
  const isIntegration = path === '/integration';
  const addition = isIntegration ? `<section class="section soft"><div class="container"><div class="grid"><div class="section-head"><span class="eyebrow">System boundary</span><h2>Each organisation keeps its role.</h2></div><p class="section-copy">The GM Platform is authoritative for device data. ADaM is authoritative for the case record and official case status. No integration creates a competing case file.</p><div class="editorial-list"><table class="compare-table"><thead><tr><th scope="col">Responsibility</th><th scope="col">GM System</th><th scope="col">ADaM</th></tr></thead><tbody><tr><th scope="row">Role</th><td>Screening at entry and continuous monitoring</td><td>Case record, contact tracing and outbreak response</td></tr><tr><th scope="row">Owns</th><td>Device readings, risk tier and vital trends</td><td>Official case and its status</td></tr><tr><th scope="row">Active</th><td>Before a case exists and during follow-up</td><td>From case identification onward</td></tr></tbody></table></div></div></div></section><section class="section"><div class="container grid"><div class="section-head"><span class="eyebrow">Build sequence</span><h2>Begin with the workflow that can be agreed first.</h2></div><div class="section-copy"><p>Phases 1 and 2 are the near-term pilot targets. Phases 3 and 4 depend on interfaces the Ministry of Health and ICAP agree to make available.</p></div><div class="editorial-list">${editorial([['01','Standalone pilot','The surveillance officer reviews a GM export and enters flagged suspected cases into ADaM manually.'],['02','Outbound link','An adapter sends suspected-case notifications using an agreed format and identifier.'],['03','Monitoring link','Wearable alerts are linked into ADaM follow-up records if the required interface is available.'],['04','Two-way profile control','ADaM supplies the active outbreak profile to checkpoints when supported and approved.']])}</div></div></section>` : '';
  const steps = isIntegration ? `<section class="section"><div class="container"><span class="eyebrow">Information flow</span><div class="flow">${[['01','Screen','Checkpoint applies the active disease profile and returns a referral tier.'],['02','Confirm','A nurse checks whether an amber or red result matches the case definition.'],['03','Notify','A suspected-case notification goes to ADaM, which owns and opens the official case.'],['04','Follow up','The person may be isolated or followed up; wearable trend summaries support monitoring.'],['05','Return result','A laboratory result returns by patient ID and specimen number. A clinician reviews release or escalation.'],['06','Set profile','In a later phase, ADaM may provide the active outbreak profile for checkpoints.']].map(([n,t,d]) => `<article class="flow-step"><span class="index">${n}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></div></section>` : '';
  return `<main id="main"><section class="container page-grid grid"><div class="page-intro"><span class="eyebrow">${page.eyebrow}</span><h1>${page.title}</h1><p class="lead">${page.lead}</p></div><aside class="page-aside">${page.illustration ? illustration(page.illustration) : `<span>GM SYSTEM · ${String(Object.keys(pages).indexOf(path)).padStart(2, '0')}</span><p>Designed to support health-worker review and a traceable follow-up pathway.</p>`}</aside><div class="editorial-list">${editorial(page.points)}</div></section>${steps}${addition}<section class="section"><div class="container">${notice(page.note)}</div></section></main>`;
}

function illustration(type) {
  if (type === 'checkpoint') return `<svg viewBox="0 0 360 250" role="img" aria-label="GM Checkpoint unit illustration"><rect x="74" y="20" width="212" height="210" fill="#f0f6f3" stroke="#0a3b2c"/><rect x="112" y="42" width="136" height="88" fill="#0a3b2c"/><rect x="131" y="58" width="98" height="47" fill="#f6f8f7"/><circle cx="180" cy="152" r="10" fill="#146b4a"/><rect x="142" y="180" width="76" height="12" fill="#e6f1eb" stroke="#146b4a"/><path d="M34 82h40m-40 12h25m222-12h35" stroke="#146b4a" stroke-width="2"/></svg>`;
  if (type === 'wearable') return `<svg viewBox="0 0 360 250" role="img" aria-label="GM Wearable wrist monitor illustration"><path d="M142 18h76l17 64v88l-17 62h-76l-17-62V82z" fill="#e6f1eb" stroke="#0a3b2c" stroke-width="2"/><rect x="135" y="76" width="90" height="98" fill="#0a3b2c"/><rect x="148" y="90" width="64" height="56" fill="#f6f8f7"/><path d="M157 120h12l8-14 11 24 8-11h9" fill="none" stroke="#146b4a" stroke-width="2"/><circle cx="180" cy="158" r="4" fill="#2e9e6b"/></svg>`;
  return `<svg viewBox="0 0 360 250" role="img" aria-label="GM Platform operations dashboard illustration"><rect x="20" y="30" width="320" height="190" fill="#f6f8f7" stroke="#0a3b2c"/><rect x="20" y="30" width="320" height="28" fill="#0a3b2c"/><circle cx="37" cy="44" r="3" fill="#2e9e6b"/><rect x="38" y="76" width="84" height="54" fill="#fff" stroke="#c8ceca"/><rect x="138" y="76" width="84" height="54" fill="#fff" stroke="#c8ceca"/><rect x="238" y="76" width="84" height="54" fill="#fff" stroke="#c8ceca"/><path d="M40 178h270M48 165l42-18 36 8 34-21 38 12 36-27 40 17" fill="none" stroke="#146b4a" stroke-width="2"/><path d="M45 157h260" stroke="#e6f1eb" stroke-width="20"/></svg>`;
}

function publicPage(path) {
  const page = pages[path] || pages['/'];
  document.title = `${path === '/' ? 'Overview' : page.eyebrow.split(' · ')[0]} | GM System`;
  return `${header(path)}<main id="main">${path === '/' ? overview(page) : detailPage(page, path)}</main>${footer()}`;
}

function status(tier) {
  const label = tier[0].toUpperCase() + tier.slice(1);
  return `<span class="tier ${tier}">${label} tier</span>`;
}

function consoleShell(path, content) {
  const active = path.startsWith('/console/contacts/') ? '/console/contacts' : path;
  const currentSession = session();
  document.body.classList.add('console-body');
  return `<a class="skip-link" href="#console-main">Skip to main content</a><header class="console-header"><div class="container header-row"><a class="brand" href="/console"><span class="brand-mark" aria-hidden="true">GM</span><span>GM OPERATIONS</span></a><div class="nav-links"><span class="mono">${currentSession.role}</span><button class="button small secondary" id="signout">Sign out</button></div></div></header><div class="console-layout"><nav class="console-nav" aria-label="Operations navigation">${linkList(consoleLinks, active)}</nav><main class="console-main" id="console-main">${content}</main></div>`;
}

function title(titleText, subtitle = '') {
  return `<div class="console-title"><div><span class="eyebrow">GM Operations · Kenya</span><h1 tabindex="-1">${titleText}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ''}</div><span class="sync">Synced 10:32 EAT</span></div>`;
}

function contactTable(rows = contacts) {
  return `<div class="table-wrap"><table class="console-table"><thead><tr><th scope="col">Patient ID</th><th scope="col">Status</th><th scope="col">Site</th><th scope="col">Day</th><th scope="col">Last reading</th><th scope="col">Signal quality</th><th scope="col">ADaM case</th></tr></thead><tbody>${rows.map(p => `<tr tabindex="0"><td><a href="/console/contacts/${p.id}">${p.id}</a></td><td>${status(p.tier)}<br>${p.status}</td><td>${p.site}</td><td>${p.day} of 21</td><td>${p.last}</td><td>${p.quality}</td><td>${p.adam}</td></tr>`).join('')}</tbody></table></div>`;
}

function dashboard() {
  const metrics = [['Contacts under follow-up','128','/console/contacts'],['Open tier 3 alerts','1','/console/alerts'],['Missed check-ins','1','/console/checkins'],['Specimens awaiting results','4','/console/labs'],['Checkpoint sites online','6','/console/sites'],['ADaM outbox','2 queued','/console/adam']];
  return `${title('Command overview','Operational summary · all times East Africa Time')}<div class="banner" role="status">Offline buffering is ready. Screening and monitoring summaries are queued locally when a connection is unavailable.</div><section class="console-cards" aria-label="Operational counts">${metrics.map(([label,value,url]) => `<a class="metric-card" href="${url}"><span>${label}</span><strong>${value}</strong><span>View records →</span></a>`).join('')}</section><section class="panel"><div class="panel-head"><h2>Recent alerts</h2><a class="text-link" href="/console/alerts">View alert queue</a></div>${alerts.slice(0,2).map(alertRow).join('')}</section><section class="panel"><div class="panel-head"><h2>Contact follow-up</h2><a class="text-link" href="/console/contacts">View all contacts</a></div>${contactTable(contacts.slice(0,3))}</section>`;
}

function contactsPage() {
  return `${title('Contacts','Pseudonymous records · personal details remain concealed by default')}<div class="panel"><div class="filters"><label class="sr-only" for="contact-search">Search contacts</label><input id="contact-search" type="search" placeholder="Search patient ID or site"/><label class="sr-only" for="status-filter">Filter by status</label><select id="status-filter"><option value="">All statuses</option><option>Monitoring</option><option>Review required</option><option>Health worker follow-up</option><option>Check-in missed</option></select><button class="button small" id="save-view">Save view</button></div><div id="contact-table">${contactTable()}</div></div>`;
}

function alertRow(alert) {
  return `<article class="alert-row"><span class="mono">${alert.id}</span>${status(alert.tier)}<div><h3>${alert.title}</h3><p>${alert.person} · ${alert.raised} · Raised by ${alert.actor}</p></div><p class="trigger">${alert.trigger}</p><button class="button small action" data-alert="${alert.id}">Review</button></article>`;
}

function alertsPage() {
  return `${title('Alert queue','Suggested actions require review by a health worker')}<div class="banner" aria-live="polite">New alerts are announced here. Each tier uses a label and glyph as well as colour.</div><section class="panel"><div class="filters"><label class="sr-only" for="alert-filter">Filter alerts</label><select id="alert-filter"><option value="">All tiers</option><option value="red">Tier 3 · red square</option><option value="amber">Tier 2 · amber triangle</option><option value="green">Tier 1 · green circle</option></select><select aria-label="Alert state"><option>Open alerts</option><option>Acknowledged</option><option>Resolved</option></select></div><div id="alert-list">${alerts.map(alertRow).join('')}</div></section><dialog id="alert-dialog"><h2>Review alert</h2><p id="dialog-summary" class="muted"></p><form method="dialog"><label for="action-reason">Reason for action</label><textarea id="action-reason" required></textarea><div class="dialog-actions"><button class="button small secondary" value="cancel">Cancel</button><button class="button small" value="acknowledge">Acknowledge</button><button class="button small" value="resolve">Resolve</button></div></form></dialog>`;
}

function personPage(id) {
  const person = contacts.find(item => item.id === id) || contacts[0];
  return `${title(person.id,'Pseudonymous patient record · personal details concealed')}<div class="panel"><div class="panel-head"><h2>${person.status}</h2>${status(person.tier)}</div><p>Site: ${person.site} · Monitoring day ${person.day} of 21 · ADaM: ${person.adam}</p><button class="button small mt-6" id="reveal-person">Reveal personal details</button><p id="revealed" aria-live="polite"></p><section class="timeline"><article class="timeline-item"><span class="data-label">10:42 EAT · Device WM-041 · Seq 1204 · Signal quality: good</span><h3>Wearable trend summary received</h3><p class="muted">Skin-temperature trend remains within this person’s recorded baseline band. No absolute temperature is displayed.</p><svg width="310" height="90" viewBox="0 0 310 90" role="img" aria-label="Trend summary against a shaded personal baseline band"><rect x="0" y="30" width="310" height="28" fill="#e6f1eb"/><path d="M0 45 L44 42 L88 49 L132 39 L176 43 L220 36 L264 41 L310 34" fill="none" stroke="#146b4a" stroke-width="2"/></svg></article><article class="timeline-item"><span class="data-label">Yesterday · GM Checkpoint · Screening encounter</span><h3>Green referral tier</h3><p class="muted">Screening inputs recorded and linked to the patient record.</p></article><article class="timeline-item"><span class="data-label">Day 1 · Monitoring enrolment</span><h3>Follow-up period started</h3><p class="muted">Planned monitoring period: 21 days.</p></article></section></div>`;
}

function checkinsPage() {
  const missed = contacts.filter(person => person.status === 'Check-in missed');
  return `${title('Missed check-ins','Sequence gaps, connectivity and device status')}<div class="panel"><div class="banner">A missed reading does not establish a clinical state. Review connectivity, device fit and the person’s ability to complete a check-in.</div>${contactTable(missed)}</div>`;
}

function labsPage() {
  return `${title('Laboratory results','Results are attributed to the specimen and laboratory')}<div class="panel"><div class="table-wrap"><table class="console-table"><thead><tr><th scope="col">Specimen</th><th scope="col">Patient ID</th><th scope="col">Collected</th><th scope="col">State</th><th scope="col">ADaM case</th><th scope="col">Action</th></tr></thead><tbody><tr><td>SP-2026-4182</td><td>GM-KEN-1072</td><td>28 Oct · 08:12 EAT</td><td>Awaiting result</td><td>AD-8846</td><td>—</td></tr><tr><td>SP-2026-4178</td><td>GM-KEN-1048</td><td>27 Oct · 15:42 EAT</td><td>Negative</td><td>AD-8821</td><td><button class="button small" data-release>Clinician review</button></td></tr><tr><td>SP-2026-4161</td><td>GM-KEN-1119</td><td>27 Oct · 11:05 EAT</td><td>Positive</td><td>Not linked</td><td><span class="tier red">Escalation prompt · human review</span></td></tr></tbody></table></div></div>`;
}

function sitesPage() {
  return `${title('Checkpoint sites','Site status and screening counts')}<div class="panel"><svg width="100%" height="170" viewBox="0 0 760 170" role="img" aria-label="Schematic of six checkpoint sites with screening counts"><path d="M90 85 H670 M180 85 V45 M350 85 V125 M520 85 V45" fill="none" stroke="#a5ada8"/><g fill="#146b4a"><circle cx="90" cy="85" r="10"/><circle cx="180" cy="45" r="10"/><circle cx="270" cy="85" r="10"/><circle cx="350" cy="125" r="10"/><circle cx="520" cy="45" r="10"/><circle cx="670" cy="85" r="10"/></g><g fill="#0b0d0c" font-family="IBM Plex Sans" font-size="12"><text x="55" y="118">Nairobi · 42</text><text x="142" y="25">Kisumu · 18</text><text x="235" y="118">Mombasa · 31</text><text x="320" y="158">Moi · 12</text><text x="490" y="25">JKIA · 56</text><text x="640" y="118">Port · 21</text></g></svg><div class="table-wrap"><table class="console-table"><thead><tr><th scope="col">Site</th><th scope="col">Status</th><th scope="col">Screenings today</th></tr></thead><tbody>${[['JKIA arrivals','Online',56],['Mombasa Port Health','Online',31],['Kisumu Border Health Unit','Online',18],['Moi International Airport','Online',12],['Nairobi Hospital Entrance','Online',24],['Nakuru Referral Centre','Online',17]].map(([site,state,count]) => `<tr><td>${site}</td><td>${state}</td><td>${count}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function adamPage() {
  return `${title('ADaM linkage','Active phase: standalone export · outbound notification is the next integration phase')}<div class="banner"><strong>ADaM owns the official case and its status.</strong> GM remains authoritative for device data. In standalone mode, the facility surveillance officer reviews the export and enters flagged cases in ADaM.</div><div class="panel"><div class="panel-head"><h2>Notification outbox</h2><button class="button small" id="export-outbox">Export flagged records</button></div><div class="table-wrap"><table class="console-table"><thead><tr><th scope="col">Idempotent message ID</th><th scope="col">Type</th><th scope="col">Patient ID</th><th scope="col">ADaM case ID</th><th scope="col">State</th><th scope="col">Retries</th><th scope="col">Last attempt</th></tr></thead><tbody>${outbox.map(item => `<tr><td>${item.message}</td><td>${item.type}</td><td>${item.patient}</td><td>${item.adam}</td><td>${item.state}</td><td>${item.attempts}</td><td>${item.last}</td></tr>`).join('')}</tbody></table></div></div><div class="panel"><h2>Minimum notification payload</h2><p class="muted">Patient ID, site, timestamp, syndrome and exposure flags, applied disease profile, and vital-sign summaries. Raw sensor streams are excluded. The patient and specimen identifiers must be agreed with the Ministry before integration.</p><ol class="mt-6"><li>Review the flagged screening and the rule inputs.</li><li>Have a nurse confirm whether the result matches the case definition.</li><li>Enter the suspected case in ADaM and retain the ADaM case ID for linked follow-up.</li><li>Use an idempotent message ID so a retry cannot be mistaken for a new case.</li></ol><p id="export-state" class="mt-6" aria-live="polite"></p></div><div class="panel"><h2>Open integration questions</h2><ul><li>ADaM interface documentation is not publicly available for this design.</li><li>The Ministry and ICAP need to confirm whether the accepted format is FHIR or another format.</li><li>The Ministry needs to agree the patient and specimen identifiers.</li><li>Consent, data protection impact assessment and ODPC registration requirements need confirmation.</li></ul><p class="muted mt-6">The next work is Ministry and ICAP integration outreach, a notification schema, a manual-entry procedure and the data protection impact assessment.</p></div>`;
}

function auditPage() {
  return `${title('Audit log','Exchanges, acknowledgements, reveals and exports')}<div class="panel"><div class="filters"><input type="search" aria-label="Filter audit records" placeholder="Actor, action or record"/><input type="date" aria-label="From date"/><input type="date" aria-label="To date"/><button class="button small" id="export-audit">Export log</button></div><p class="muted" role="status">Audit events are available through the authenticated audit API when the platform service is configured.</p></div>`;
}

function roleGate() {
  return `<main id="main" class="container"><section class="role-panel"><span class="eyebrow">GM Operations · Restricted workspace</span><h2>Operational access</h2><p class="muted">Sign in through the configured identity provider. Access and actions follow role and site claims on the authenticated session.</p><button class="button mt-6" id="signin">Continue to sign in</button><p class="data-label mt-6">Session credentials are held in a secure same-site service cookie.</p></section></main>`;
}

function consolePage(path) {
  document.title = `Operations | GM System`;
  document.body.classList.remove('console-body');
  if (!session()) return `${header('/console')}<main id="main">${roleGate()}</main>${footer()}`;
  const content = path === '/console' || path === '/console/' ? dashboard()
    : path === '/console/contacts' ? contactsPage()
    : path.startsWith('/console/contacts/') ? personPage(decodeURIComponent(path.split('/').at(-1)))
    : path === '/console/alerts' ? alertsPage()
    : path === '/console/checkins' ? checkinsPage()
    : path === '/console/labs' ? labsPage()
    : path === '/console/sites' ? sitesPage()
    : path === '/console/adam' ? adamPage()
    : path === '/console/audit' ? auditPage()
    : dashboard();
  return consoleShell(path, content);
}

async function render() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/console')) await hydrateSession();
  app.innerHTML = path.startsWith('/console') ? consolePage(path) : publicPage(path);
  bind(path);
  if (path.startsWith('/console') && session()) hydrateConsole(path);
}

async function hydrateConsole(path) {
  const tasks = [getContacts(), getAlerts(), getOutbox(), hydrateSession()];
  const results = await Promise.allSettled(tasks);
  [contacts, alerts, outbox] = results.slice(0, 3).map(result => result.status === 'fulfilled' ? result.value : []);
  if (results.some(result => result.status === 'rejected')) {
    const message = document.createElement('div');
    message.className = 'banner';
    message.setAttribute('role', 'alert');
    message.textContent = 'Operational data could not be refreshed. Check the connection and retry.';
    document.querySelector('.console-main')?.prepend(message);
    return;
  }
  if (path === '/console' || path === '/console/') app.querySelector('.console-main').innerHTML = dashboard();
  if (path === '/console/contacts') app.querySelector('.console-main').innerHTML = contactsPage();
  if (path === '/console/alerts') app.querySelector('.console-main').innerHTML = alertsPage();
  if (path === '/console/adam') app.querySelector('.console-main').innerHTML = adamPage();
  if (path === '/console/checkins') app.querySelector('.console-main').innerHTML = checkinsPage();
  bind(path);
  subscribeAlerts(alert => insertLiveAlert(alert));
}

function insertLiveAlert(alert) {
  alerts = [alert, ...alerts];
  const region = document.querySelector('[aria-live="polite"]');
  if (region) region.textContent = `New ${alert.tier} tier alert ${alert.id} for ${alert.person}.`;
  const list = document.querySelector('#alert-list');
  if (list) list.insertAdjacentHTML('afterbegin', alertRow(alert));
}

function navigate(url) {
  window.history.pushState({}, '', url);
  render();
  window.scrollTo(0, 0);
  document.querySelector('main h1')?.focus({ preventScroll: true });
}

function downloadCsv() {
  const fields = ['patient_id','site','timestamp','syndrome_flags','exposure_flags','disease_profile','vitals_summary','adam_case_id'];
  const lines = [fields.join(','), ...outbox.filter(message => message.state !== 'Acknowledged').map(message => [message.patient, message.site, message.timestamp, message.syndromeFlags.join('|'), message.exposureFlags.join('|'), message.diseaseProfile, JSON.stringify(message.vitalsSummary), message.adamCaseId].map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(','))];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gm-adam-notifications.csv';
  anchor.click();
  URL.revokeObjectURL(url);
  const state = document.querySelector('#export-state');
  if (state) state.textContent = 'Export completed. Manual entry in ADaM is required in standalone mode.';
}

function bind(path) {
  app.querySelectorAll('a[href]').forEach(anchor => anchor.addEventListener('click', event => {
    const url = new URL(anchor.href);
    if (url.origin === window.location.origin && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      navigate(url.pathname);
    }
  }));
  document.querySelector('#signin')?.addEventListener('click', () => login().catch(showRequestError));
  document.querySelector('#signout')?.addEventListener('click', () => logout().catch(showRequestError));
  document.querySelector('#contact-search')?.addEventListener('input', filterContacts);
  document.querySelector('#status-filter')?.addEventListener('change', filterContacts);
  document.querySelector('#save-view')?.addEventListener('click', event => {
    const view = { query: document.querySelector('#contact-search').value, status: document.querySelector('#status-filter').value };
    localStorage.setItem('gm-contact-view', JSON.stringify(view));
    event.currentTarget.textContent = 'View saved';
  });
  document.querySelector('#alert-filter')?.addEventListener('change', filterAlerts);
  document.querySelectorAll('[data-alert]').forEach(button => button.addEventListener('click', () => openAlert(button.dataset.alert)));
  document.querySelector('#alert-dialog')?.addEventListener('close', recordDialogAction);
  document.querySelector('#reveal-person')?.addEventListener('click', requestIdentityReveal);
  document.querySelector('[data-release]')?.addEventListener('click', () => window.alert('Clinician review is required before any release from monitoring.'));
  document.querySelector('#export-outbox')?.addEventListener('click', () => exportAdam().then(downloadExport).catch(showRequestError));
  document.querySelector('#export-audit')?.addEventListener('click', () => window.alert('Audit export prepared for authorised review.'));
  if (path === '/console/contacts') restoreView();
}

async function requestIdentityReveal(event) {
  const purpose = window.prompt('State the operational purpose for this identity reveal.');
  if (!purpose || purpose.trim().length < 10) return;
  try {
    const id = window.location.pathname.split('/').at(-1);
    const grant = await createRevealGrant(id, purpose.trim());
    const challenge = window.prompt('Complete the step-up challenge from the identity provider.');
    if (!challenge) return;
    const identity = await revealIdentity(id, grant.grant, challenge);
    document.querySelector('#revealed').textContent = `${identity.name} · ${identity.contactDetails}`;
    event.currentTarget.textContent = 'Details revealed · audit recorded';
  } catch {
    document.querySelector('#revealed').textContent = 'Identity details were not returned. Verify the grant and step-up challenge, then retry.';
  }
}

function downloadExport(result) {
  if (!result?.url) throw new Error('Export service did not provide a download link.');
  const anchor = document.createElement('a');
  anchor.href = result.url;
  anchor.download = result.filename || 'gm-adam-export.csv';
  anchor.click();
  const state = document.querySelector('#export-state');
  if (state) state.textContent = `Export ${result.exportId} prepared. Manual entry in ADaM is required in standalone mode.`;
}

function showRequestError() {
  const target = document.querySelector('.console-main') || document.querySelector('#main');
  if (!target) return;
  const message = document.createElement('div');
  message.className = 'banner';
  message.setAttribute('role', 'alert');
  message.textContent = 'The request could not be completed. Check the connection and retry.';
  target.prepend(message);
}

function filterContacts() {
  const query = document.querySelector('#contact-search').value.toLowerCase();
  const statusFilter = document.querySelector('#status-filter').value;
  const matches = contacts.filter(person => `${person.id} ${person.site}`.toLowerCase().includes(query) && (!statusFilter || person.status === statusFilter));
  document.querySelector('#contact-table').innerHTML = contactTable(matches);
  document.querySelectorAll('#contact-table a').forEach(anchor => anchor.addEventListener('click', event => { event.preventDefault(); navigate(anchor.pathname); }));
}

function restoreView() {
  const saved = JSON.parse(localStorage.getItem('gm-contact-view') || 'null');
  if (!saved) return;
  document.querySelector('#contact-search').value = saved.query;
  document.querySelector('#status-filter').value = saved.status;
  filterContacts();
}

function filterAlerts() {
  const tier = document.querySelector('#alert-filter').value;
  document.querySelector('#alert-list').innerHTML = alerts.filter(alert => !tier || alert.tier === tier).map(alertRow).join('');
  document.querySelectorAll('[data-alert]').forEach(button => button.addEventListener('click', () => openAlert(button.dataset.alert)));
}

function openAlert(id) {
  const alert = alerts.find(item => item.id === id);
  document.querySelector('#dialog-summary').textContent = `${alert.person} · ${alert.title}. Trigger: ${alert.trigger}. A health worker decides the next action.`;
  document.querySelector('#alert-dialog').dataset.alert = id;
  document.querySelector('#alert-dialog').showModal();
}

function recordDialogAction() {
  const dialog = document.querySelector('#alert-dialog');
  const reason = document.querySelector('#action-reason').value.trim();
  if (dialog.returnValue && dialog.returnValue !== 'cancel' && !reason) {
    document.querySelector('.banner[aria-live]').textContent = 'Enter a reason before recording this alert action.';
    dialog.returnValue = '';
    dialog.showModal();
    document.querySelector('#action-reason').focus();
    return;
  }
  if (dialog.returnValue && dialog.returnValue !== 'cancel') {
    const banner = document.querySelector('.banner[aria-live]');
    const action = dialog.returnValue === 'resolve' ? resolveAlert : acknowledgeAlert;
    action(dialog.dataset.alert, reason).then(() => { banner.textContent = `${dialog.returnValue === 'resolve' ? 'Resolved' : 'Acknowledged'} ${dialog.dataset.alert}. Reason recorded.`; }).catch(() => { banner.textContent = 'The action could not be saved. The alert remains open. Retry when the connection returns.'; });
  }
  document.querySelector('#action-reason').value = '';
}

window.addEventListener('popstate', () => { render(); });
render();
