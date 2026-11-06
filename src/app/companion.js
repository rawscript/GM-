/**
 * GM Patient Companion Dashboard
 * Clean, calm patient-facing vitals dashboard displaying smartwatch telemetry,
 * 21-day personal baselines, check-ins, and direct care team contact.
 */

import { COMPANION_PROFILES, I18N } from '../data/companion-content.js';
import {
  COMPANION_STATES,
  evaluateCompanionState,
  evaluateCheckInResponse,
  formatSmsMessage,
  withdrawConsent,
} from '../domain/companion.js';
import { imageSource } from '../shared/image.js';

// App state
let currentProfileIndex = 0;
let currentLang = 'en';
let currentTextSize = 'normal'; // 'normal' | 'large' | 'extra'
let currentTab = 'home';
let checkInAnswers = {};
let checkInFeedback = null;
let callbackRequested = false;
let consentWithdrawn = false;

function t(key, params = {}) {
  const dict = I18N[currentLang] || I18N.en;
  const parts = key.split('.');
  let val = dict;
  for (const p of parts) {
    if (val && typeof val === 'object' && p in val) {
      val = val[p];
    } else {
      return key;
    }
  }
  if (typeof val === 'string') {
    return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
  }
  return val;
}

export function setCompanionScenario(index) {
  if (index >= 0 && index < COMPANION_PROFILES.length) {
    currentProfileIndex = index;
    checkInAnswers = {};
    checkInFeedback = null;
    callbackRequested = false;
    consentWithdrawn = false;
  }
}

export function setCompanionLanguage(lang) {
  if (lang === 'en' || lang === 'sw') {
    currentLang = lang;
  }
}

export function setCompanionTextSize(size) {
  if (['normal', 'large', 'extra'].includes(size)) {
    currentTextSize = size;
  }
}

export function setCompanionTab(tab) {
  currentTab = tab;
}

function renderStateIcon(stateKey) {
  switch (stateKey) {
    case COMPANION_STATES.SETTLED:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>`;
    case COMPANION_STATES.KEEP_WATCHING:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></svg>`;
    case COMPANION_STATES.CHECK_IN:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path d="M9 14l2 2 4-4" /></svg>`;
    case COMPANION_STATES.CONTACT_CARE_TEAM:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>`;
    case COMPANION_STATES.ALREADY_UNWELL:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>`;
    case COMPANION_STATES.POOR_SIGNAL:
    default:
      return `<svg class="state-glyph" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" /></svg>`;
  }
}

/**
 * Renders an accessible SVG trend chart with a shaded personal baseline band
 */
function renderVitalsChart({ title, values, minRange, maxRange, unit, currentVal, isSkinTemp }) {
  const width = 360;
  const height = 130;
  const paddingX = 35;
  const paddingY = 22;

  // Determine scale bounds
  const allNums = [...values, minRange, maxRange, currentVal || minRange];
  const chartMin = Math.min(...allNums) - (isSkinTemp ? 0.3 : 3);
  const chartMax = Math.max(...allNums) + (isSkinTemp ? 0.3 : 3);
  const rangeSpan = chartMax - chartMin || 1;

  const getX = (idx, total) => paddingX + (idx / Math.max(1, total - 1)) * (width - paddingX * 2);
  const getY = (val) => height - paddingY - ((val - chartMin) / rangeSpan) * (height - paddingY * 2);

  // Band coordinates
  const bandTopY = getY(maxRange);
  const bandBottomY = getY(minRange);
  const bandHeight = Math.max(8, bandBottomY - bandTopY);

  // Points path
  const points = values.map((val, idx) => ({
    x: getX(idx, values.length),
    y: getY(val),
    val,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const lastPoint = points[points.length - 1];

  return `
    <div class="vital-card">
      <div class="vital-head">
        <div>
          <h3>${title}</h3>
          <div class="vital-reading">
            <span class="vital-number">${currentVal !== null ? currentVal : '—'}</span>
            <span class="vital-unit">${unit}</span>
          </div>
        </div>
        <div class="vital-baseline-meta">
          <span class="baseline-tag">${t('vitals.typicalBand')}: ${minRange}–${maxRange} ${unit}</span>
        </div>
      </div>

      <div class="chart-wrapper">
        <svg viewBox="0 0 ${width} ${height}" class="vital-svg" role="img" aria-label="${title} trend line with personal baseline band">
          <!-- Baseline shaded band -->
          <rect x="${paddingX}" y="${bandTopY.toFixed(1)}" width="${width - paddingX * 2}" height="${bandHeight.toFixed(1)}" fill="var(--pale)" rx="4" />
          <text x="${width - paddingX - 4}" y="${(bandTopY + 12).toFixed(1)}" fill="var(--grey-600)" font-size="9" text-anchor="end" font-family="var(--sans)">Typical range</text>
          
          <!-- Grid reference lines -->
          <line x1="${paddingX}" y1="${getY(maxRange)}" x2="${width - paddingX}" y2="${getY(maxRange)}" stroke="var(--grey-300)" stroke-dasharray="3,3" stroke-width="1" />
          <line x1="${paddingX}" y1="${getY(minRange)}" x2="${width - paddingX}" y2="${getY(minRange)}" stroke="var(--grey-300)" stroke-dasharray="3,3" stroke-width="1" />

          <!-- Trend polyline -->
          <path d="${pathD}" fill="none" stroke="var(--mid)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Data dots -->
          ${points
            .map(
              (p, i) => `
            <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === points.length - 1 ? '4.5' : '3'}" fill="${i === points.length - 1 ? 'var(--deep)' : 'var(--mid)'}" stroke="var(--white)" stroke-width="1.5" />
          `,
            )
            .join('')}

          <!-- Current value indicator callout -->
          ${
            lastPoint && currentVal !== null
              ? `
            <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="7" fill="none" stroke="var(--mid)" stroke-width="1.5" opacity="0.6">
              <animate attributeName="r" values="5;9;5" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite"/>
            </circle>
          `
              : ''
          }

          <!-- X axis day markings -->
          ${points
            .map(
              (p, i) => `
            <text x="${p.x.toFixed(1)}" y="${height - 6}" font-size="9" fill="var(--grey-500)" text-anchor="middle" font-family="var(--mono)">D${i + 1}</text>
          `,
            )
            .join('')}
        </svg>
      </div>

      <div class="vital-legend">
        <span class="legend-item"><span class="legend-swatch band-swatch"></span> ${t('vitals.typicalBand')}</span>
        <span class="legend-item"><span class="legend-swatch line-swatch"></span> ${t('vitals.trendLine')}</span>
      </div>
    </div>
  `;
}

export function companionPage() {
  const profile = COMPANION_PROFILES[currentProfileIndex] || COMPANION_PROFILES[0];
  const evalResult = evaluateCompanionState(profile);
  const stateMeta = t(`states.${evalResult.state}`) || t('states.settled');
  const dayStr = t('dayCount', { day: profile.monitoringDay, total: profile.totalDays });
  const remainingStr = t('daysRemaining', { days: profile.totalDays - profile.monitoringDay });

  document.title = `${t('appTitle')} | GM System`;
  document.body.classList.remove('console-body');

  return `
    <a class="skip-link" href="#companion-main">Skip to main content</a>

    <!-- Top Companion Bar -->
    <header class="companion-header">
      <div class="container companion-bar-row">
        <div class="companion-brand-group">
          <a class="brand" href="/">
            <span class="brand-mark" aria-hidden="true">GM</span>
            <span class="brand-text">GM SYSTEM</span>
          </a>
          <span class="companion-tag">${t('appTitle')}</span>
        </div>

        <!-- Controls: Personas, Language, Text Size -->
        <div class="companion-controls">
          <div class="control-group persona-select-group">
            <label for="persona-select" class="sr-only">${t('simulatedPersonas')}</label>
            <select id="persona-select" class="select-pill" title="${t('simulatedPersonas')}">
              ${COMPANION_PROFILES.map(
                (p, idx) => `
                <option value="${idx}" ${idx === currentProfileIndex ? 'selected' : ''}>
                  ${p.name} · ${t(`states.${p.scenarioKey}.title`)} (${p.id})
                </option>
              `,
              ).join('')}
            </select>
          </div>

          <!-- Language toggle -->
          <div class="control-group lang-toggle">
            <button class="pill-btn ${currentLang === 'en' ? 'active' : ''}" id="lang-en" aria-label="English">EN</button>
            <button class="pill-btn ${currentLang === 'sw' ? 'active' : ''}" id="lang-sw" aria-label="Kiswahili">SW</button>
          </div>

          <!-- Font size toggle -->
          <div class="control-group size-toggle" title="${t('settings.textSize')}">
            <button class="pill-btn ${currentTextSize === 'normal' ? 'active' : ''}" id="size-normal" aria-label="Normal text">A</button>
            <button class="pill-btn ${currentTextSize === 'large' ? 'active' : ''}" id="size-large" aria-label="Large text">A+</button>
            <button class="pill-btn ${currentTextSize === 'extra' ? 'active' : ''}" id="size-extra" aria-label="Extra large text">A++</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Persistent Care Team Call Strip -->
    <aside class="emergency-strip ${evalResult.tier === 'red' ? 'strip-urgent' : ''}" role="region" aria-label="Care team emergency contact">
      <div class="container emergency-row">
        <div class="emergency-info">
          <span class="emergency-icon" aria-hidden="true">☎</span>
          <span class="emergency-text"><strong>${t('contactCareTeamBtn')}:</strong> ${profile.assignedClinic} · ${profile.careCoordinator}</span>
        </div>
        <a class="button emergency-call-btn" href="tel:${profile.careTeamPhone}">
          <span aria-hidden="true">📞</span> ${t('callNow')}
        </a>
      </div>
    </aside>

    <div class="companion-container size-${currentTextSize}">
      <!-- Patient Identity & Device Status Header -->
      <section class="patient-id-bar">
        <div class="container patient-id-grid">
          <div class="patient-meta">
            <span class="patient-pill">${profile.id}</span>
            <span class="day-badge">${dayStr} · ${remainingStr}</span>
            <span class="site-text">${profile.site}</span>
          </div>

          <div class="watch-status">
            <span class="watch-icon" aria-hidden="true">⌚</span>
            <span class="watch-detail">${profile.device.model}</span>
            <span class="status-dot ${profile.device.strapSnug ? 'dot-good' : 'dot-warn'}" aria-hidden="true"></span>
            <span>${profile.device.strapSnug ? t('strapSnug') : t('strapLoose')}</span>
            <span class="battery-tag">⚡ ${t('battery', { percent: profile.device.battery })}</span>
            <span class="sync-tag">🕒 ${t('lastSync', { time: profile.device.lastSync })}</span>
          </div>
        </div>
      </section>

      <!-- Main Tabs Navigation -->
      <nav class="companion-tabs-nav container" aria-label="Patient companion sections">
        <button class="tab-btn ${currentTab === 'home' ? 'active' : ''}" data-tab="home">
          ${t('tabs.home')}
        </button>
        <button class="tab-btn ${currentTab === 'readings' ? 'active' : ''}" data-tab="readings">
          ${t('tabs.readings')}
        </button>
        <button class="tab-btn ${currentTab === 'checkin' ? 'active' : ''}" data-tab="checkin">
          ${t('tabs.checkin')}
        </button>
        <button class="tab-btn ${currentTab === 'meaning' ? 'active' : ''}" data-tab="meaning">
          ${t('tabs.meaning')}
        </button>
        <button class="tab-btn ${currentTab === 'contact' ? 'active' : ''}" data-tab="contact">
          ${t('tabs.contact')}
        </button>
        <button class="tab-btn ${currentTab === 'sms' ? 'active' : ''}" data-tab="sms">
          ${t('tabs.sms')}
        </button>
        <button class="tab-btn ${currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
          ${t('tabs.settings')}
        </button>
      </nav>

      <!-- Tab Content Area -->
      <main id="companion-main" class="container companion-content-area">
        ${renderCurrentTabContent(profile, evalResult, stateMeta)}
      </main>
    </div>

    <!-- Calm Footer -->
    <footer class="companion-footer">
      <div class="container footer-content-row">
        <span>Gusmao–Mbaja Patient Companion · Ministry of Health Kenya / ADaM Outbreak Framework</span>
        <span>Informational decision aid. Laboratory verification conducted through national laboratories.</span>
      </div>
    </footer>
  `;
}

function renderCurrentTabContent(profile, evalResult, stateMeta) {
  switch (currentTab) {
    case 'readings':
      return renderReadingsTab(profile);
    case 'checkin':
      return renderCheckInTab(profile);
    case 'meaning':
      return renderMeaningTab();
    case 'contact':
      return renderContactTab(profile);
    case 'sms':
      return renderSmsTab(profile, evalResult.state);
    case 'settings':
      return renderSettingsTab(profile);
    case 'home':
    default:
      return renderHomeTab(profile, evalResult, stateMeta);
  }
}

/**
 * HOME / OVERVIEW TAB
 */
function renderHomeTab(profile, evalResult, stateMeta) {
  const dayStr = t('dayCount', { day: profile.monitoringDay, total: profile.totalDays });
  const remainingStr = t('daysRemaining', { days: profile.totalDays - profile.monitoringDay });

  return `
    <div class="home-tab-layout">
      <!-- Big Hero Status Card -->
      <section class="state-card state-${evalResult.tier} ${evalResult.state === COMPANION_STATES.POOR_SIGNAL ? 'state-sensor-warn' : ''}">
        <div class="state-header-row">
          <div class="state-badge-wrapper">
            ${renderStateIcon(evalResult.state)}
            <span class="state-title">${stateMeta.title}</span>
            <span class="state-pill">${stateMeta.badge}</span>
          </div>
          <span class="state-day">${dayStr}</span>
        </div>

        <h1 class="state-lead-sentence">${stateMeta.lead}</h1>
        <p class="state-action-desc">${stateMeta.action}</p>

        <div class="state-actions-bar">
          ${
            evalResult.tier === 'red' || evalResult.state === COMPANION_STATES.CONTACT_CARE_TEAM
              ? `
            <a class="button emergency-action-btn" href="tel:${profile.careTeamPhone}">
              <span aria-hidden="true">📞</span> ${t('callNow')}
            </a>
          `
              : ''
          }
          ${
            evalResult.state === COMPANION_STATES.CHECK_IN
              ? `
            <button class="button" id="start-checkin-btn">
              ${t('states.check_in.action')} →
            </button>
          `
              : ''
          }
          <button class="button secondary" id="view-vitals-btn">
            ${t('tabs.readings')} →
          </button>
        </div>
      </section>

      <!-- Grid: What is Happening & Quick Watch Summary -->
      <div class="home-grid-row">
        <!-- Permanent "What is Happening" Card -->
        <article class="panel happening-panel">
          <div class="panel-head">
            <span class="eyebrow">${t('whatIsHappening')}</span>
            <h2>${dayStr}</h2>
          </div>
          <p class="lead-text">${t('whatIsHappeningBody')}</p>
          <div class="progress-track-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${(profile.monitoringDay / profile.totalDays) * 100}%"></div>
            </div>
            <div class="progress-meta">
              <span>Day 1</span>
              <span><strong>${remainingStr}</strong></span>
              <span>Day 21</span>
            </div>
          </div>
          <div class="happening-steps">
            <div class="step-bullet ${profile.monitoringDay >= 1 ? 'bullet-done' : ''}">
              <span class="bullet-num">✓</span> Checkpoint Encounter
            </div>
            <div class="step-bullet bullet-active">
              <span class="bullet-num">●</span> 21-Day Trend Monitoring
            </div>
            <div class="step-bullet">
              <span class="bullet-num">○</span> Follow-Up Release
            </div>
          </div>
        </article>

        <!-- Smart Watch Overview Card with Image -->
        <article class="panel watch-summary-panel">
          <div class="panel-head">
            <span class="eyebrow">${profile.device.model}</span>
            <h2>Smartwatch Vitals</h2>
          </div>
          <div class="watch-photo-wrap">
            <img class="companion-watch-img" src="${imageSource('wearable-health')}" alt="Smartwatch displaying health telemetry on wrist" />
          </div>

          <div class="mini-vitals-list">
            <div class="mini-vital-item">
              <span class="mini-vital-label">${t('vitals.tempTitle')}</span>
              <strong class="mini-vital-value">${profile.baseline.temperature.current ? profile.baseline.temperature.current + ' °C' : '—'}</strong>
              <span class="mini-vital-status">Normal baseline: ${profile.baseline.temperature.min}–${profile.baseline.temperature.max} °C</span>
            </div>
            <div class="mini-vital-item">
              <span class="mini-vital-label">${t('vitals.heartTitle')}</span>
              <strong class="mini-vital-value">${profile.baseline.heartRate.current ? profile.baseline.heartRate.current + ' bpm' : '—'}</strong>
              <span class="mini-vital-status">Resting range: ${profile.baseline.heartRate.min}–${profile.baseline.heartRate.max} bpm</span>
            </div>
            <div class="mini-vital-item">
              <span class="mini-vital-label">${t('vitals.oxygenTitle')}</span>
              <strong class="mini-vital-value">${profile.baseline.oxygen.current ? profile.baseline.oxygen.current + ' %' : '—'}</strong>
              <span class="mini-vital-status">Oxygen range: ${profile.baseline.oxygen.min}–${profile.baseline.oxygen.max} %</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  `;
}

/**
 * READINGS TAB (SMART WATCH TELEMETRY)
 */
function renderReadingsTab(profile) {
  return `
    <div class="readings-tab-layout">
      <div class="section-heading-card panel">
        <span class="eyebrow">Smartwatch Telemetry · WM-041</span>
        <h1>${t('vitals.title')}</h1>
        <p class="lead-text">${t('vitals.subtitle')}</p>
        <div class="device-spec-bar">
          <span><strong>Device:</strong> ${profile.device.model}</span>
          <span><strong>Strap Fit:</strong> ${profile.device.strapSnug ? 'Snug contact' : 'Loose contact'}</span>
          <span><strong>Battery:</strong> ${profile.device.battery}%</span>
          <span><strong>Last Sync:</strong> ${profile.device.lastSync}</span>
        </div>
      </div>

      <div class="vitals-charts-grid">
        <!-- 1. Skin Temperature -->
        <div class="vital-chart-container">
          ${renderVitalsChart({
            title: t('vitals.tempTitle'),
            values: profile.history.temperature,
            minRange: profile.baseline.temperature.min,
            maxRange: profile.baseline.temperature.max,
            unit: profile.baseline.temperature.unit,
            currentVal: profile.baseline.temperature.current,
            isSkinTemp: true,
          })}
          <div class="chart-caption-notice">
            <span class="index">i</span>
            <p>${t('vitals.tempNote')}</p>
          </div>
        </div>

        <!-- 2. Resting Heart Rate -->
        <div class="vital-chart-container">
          ${renderVitalsChart({
            title: t('vitals.heartTitle'),
            values: profile.history.heartRate,
            minRange: profile.baseline.heartRate.min,
            maxRange: profile.baseline.heartRate.max,
            unit: profile.baseline.heartRate.unit,
            currentVal: profile.baseline.heartRate.current,
            isSkinTemp: false,
          })}
          <div class="chart-caption-notice">
            <span class="index">i</span>
            <p>${t('vitals.heartNote')}</p>
          </div>
        </div>

        <!-- 3. Blood Oxygen SpO2 -->
        <div class="vital-chart-container">
          ${renderVitalsChart({
            title: t('vitals.oxygenTitle'),
            values: profile.history.oxygen,
            minRange: profile.baseline.oxygen.min,
            maxRange: profile.baseline.oxygen.max,
            unit: profile.baseline.oxygen.unit,
            currentVal: profile.baseline.oxygen.current,
            isSkinTemp: false,
          })}
          <div class="chart-caption-notice">
            <span class="index">i</span>
            <p>${t('vitals.oxygenNote')}</p>
          </div>
        </div>
      </div>

      <!-- Historical Logs Table -->
      <section class="panel mt-6">
        <div class="panel-head">
          <h2>${t('vitals.recentLog')}</h2>
          <span class="muted">Continuous optical sensor readings</span>
        </div>
        <div class="table-wrap">
          <table class="console-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Skin Temp</th>
                <th scope="col">Resting Pulse</th>
                <th scope="col">SpO₂</th>
                <th scope="col">Signal Quality</th>
                <th scope="col">Assessment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Today, 10:42 EAT</td>
                <td>${profile.baseline.temperature.current || '—'} °C</td>
                <td>${profile.baseline.heartRate.current || '—'} bpm</td>
                <td>${profile.baseline.oxygen.current || '—'} %</td>
                <td><span class="tier green">${profile.device.signalQuality === 'good' ? 'High quality' : 'Signal noise'}</span></td>
                <td>${profile.device.strapSnug ? 'Within normal range' : 'Sensor loose'}</td>
              </tr>
              <tr>
                <td>Today, 06:15 EAT</td>
                <td>${profile.history.temperature.at(-1) || '—'} °C</td>
                <td>${profile.history.heartRate.at(-1) || '—'} bpm</td>
                <td>${profile.history.oxygen.at(-1) || '—'} %</td>
                <td><span class="tier green">High quality</span></td>
                <td>Resting rhythm consistent</td>
              </tr>
              <tr>
                <td>Yesterday, 22:30 EAT</td>
                <td>${profile.history.temperature.at(-2) || '—'} °C</td>
                <td>${profile.history.heartRate.at(-2) || '—'} bpm</td>
                <td>${profile.history.oxygen.at(-2) || '—'} %</td>
                <td><span class="tier green">High quality</span></td>
                <td>Sleep cycle baseline recorded</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

/**
 * CHECK-IN TAB
 */
function renderCheckInTab(profile) {
  const questions = [
    { id: 'q1', text: t('checkin.q1'), icon: '🌡️' },
    { id: 'q2', text: t('checkin.q2'), icon: '🫁' },
    { id: 'q3', text: t('checkin.q3'), icon: '🥣' },
    { id: 'q4', text: t('checkin.q4'), icon: '🩹' },
    { id: 'q5', text: t('checkin.q5'), icon: '🛌' },
  ];

  const hasFeedback = checkInFeedback !== null;

  return `
    <div class="checkin-tab-layout">
      <div class="panel checkin-card">
        <div class="panel-head">
          <span class="eyebrow">${t('dayCount', { day: profile.monitoringDay, total: profile.totalDays })}</span>
          <h1>${t('checkin.heading')}</h1>
        </div>
        <p class="lead-text">${t('checkin.intro')}</p>

        ${
          hasFeedback
            ? `
          <div class="checkin-result-banner banner ${checkInFeedback.alertStaff ? 'banner-alert' : 'banner-success'}" role="alert">
            <span class="banner-icon">${checkInFeedback.alertStaff ? '🔔' : '✓'}</span>
            <div>
              <strong>${checkInFeedback.alertStaff ? 'Care Team Notified' : 'Recorded'}</strong>
              <p>${currentLang === 'sw' ? checkInFeedback.messageSw : checkInFeedback.messageEn}</p>
            </div>
          </div>
        `
            : ''
        }

        <form id="checkin-form" class="checkin-form mt-6">
          <div class="questions-list">
            ${questions
              .map(
                (q, idx) => `
              <fieldset class="question-item" data-qid="${q.id}">
                <legend class="question-legend">
                  <span class="q-icon" aria-hidden="true">${q.icon}</span>
                  <span class="q-num">Q${idx + 1}.</span>
                  <span class="q-text">${q.text}</span>
                </legend>
                <div class="options-row">
                  <label class="option-pill ${checkInAnswers[q.id] === '1' ? 'selected' : ''}">
                    <input type="radio" name="${q.id}" value="1" ${checkInAnswers[q.id] === '1' ? 'checked' : ''} />
                    <span>${t('checkin.optYes')}</span>
                  </label>
                  <label class="option-pill ${checkInAnswers[q.id] === '2' ? 'selected' : ''}">
                    <input type="radio" name="${q.id}" value="2" ${checkInAnswers[q.id] === '2' ? 'checked' : ''} />
                    <span>${t('checkin.optNo')}</span>
                  </label>
                  <label class="option-pill ${checkInAnswers[q.id] === '3' ? 'selected' : ''}">
                    <input type="radio" name="${q.id}" value="3" ${checkInAnswers[q.id] === '3' ? 'checked' : ''} />
                    <span>${t('checkin.optNotSure')}</span>
                  </label>
                </div>
              </fieldset>
            `,
              )
              .join('')}
          </div>

          <div class="checkin-submit-bar">
            <button class="button" type="submit">${t('checkin.submitBtn')}</button>
            <span class="muted">Your responses are transmitted securely to ${profile.assignedClinic}.</span>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * WHAT THIS MEANS TAB (CLINICIAN EXPLAINER)
 */
function renderMeaningTab() {
  const articles = [
    { title: t('meaning.q1Title'), body: t('meaning.q1Body'), num: '01' },
    { title: t('meaning.q2Title'), body: t('meaning.q2Body'), num: '02' },
    { title: t('meaning.q3Title'), body: t('meaning.q3Body'), num: '03' },
    { title: t('meaning.q4Title'), body: t('meaning.q4Body'), num: '04' },
  ];

  return `
    <div class="meaning-tab-layout">
      <div class="panel">
        <span class="eyebrow">Clinician Guidance</span>
        <h1>${t('meaning.heading')}</h1>
        <p class="lead-text">${t('meaning.subtitle')}</p>
      </div>

      <div class="editorial-list mt-6">
        ${articles
          .map(
            (item) => `
          <article class="editorial-item panel">
            <span class="index">${item.num}</span>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
          </article>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * CARE TEAM CONTACT TAB
 */
function renderContactTab(profile) {
  return `
    <div class="contact-tab-layout">
      <div class="panel">
        <span class="eyebrow">24/7 Clinical Support</span>
        <h1>${t('contact.heading')}</h1>
        <p class="lead-text">${t('contact.subtitle')}</p>

        <!-- Big Emergency Call Button Card -->
        <div class="call-action-card">
          <div class="call-card-content">
            <span class="call-badge">Toll-Free National Outbreak Desk</span>
            <h2>Ministry of Health Kenya</h2>
            <p class="call-number">0800 721 000</p>
            <p class="muted">Toll-free across all Kenyan networks (Safaricom, Airtel, Telkom). Free of charge.</p>
          </div>
          <a class="button emergency-call-big-btn" href="tel:${profile.careTeamPhone}">
            <span aria-hidden="true">📞</span> ${t('callNow')}
          </a>
        </div>

        <div class="contact-grid-row mt-6">
          <!-- Facility Details Card -->
          <div class="panel facility-card">
            <h3>${t('contact.assignedSite')}</h3>
            <p class="facility-name"><strong>${profile.assignedClinic}</strong></p>
            <p>${profile.site}</p>
            <p class="facility-coordinator"><strong>${t('contact.officerInCharge')}:</strong> ${profile.careCoordinator}</p>
            <p class="facility-hours">Hours: 24 Hours Open</p>
          </div>

          <!-- Request Callback Form -->
          <form id="callback-form" class="panel callback-card">
            <h3>${t('contact.sendMsgLabel')}</h3>
            <p class="muted">If you cannot call right now, submit your question and an on-duty nurse will call your registered phone.</p>
            <label for="callback-msg" class="sr-only">${t('contact.sendMsgLabel')}</label>
            <textarea id="callback-msg" placeholder="${t('contact.sendMsgPlaceholder')}" required rows="3"></textarea>
            <button class="button small mt-4" type="submit">${t('contact.requestCallBtn')}</button>
            <p id="callback-status" class="data-label mt-2" role="status" aria-live="polite">
              ${callbackRequested ? t('contact.callbackSent') : ''}
            </p>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * SMS FALLBACK MODE TAB
 */
function renderSmsTab(profile, stateKey) {
  const smsObj = formatSmsMessage(stateKey, currentLang, profile.monitoringDay);

  return `
    <div class="sms-tab-layout">
      <div class="panel">
        <span class="eyebrow">Inclusive Access</span>
        <h1>${t('sms.heading')}</h1>
        <p class="lead-text">${t('sms.subtitle')}</p>
        <p>${t('sms.explainer')}</p>

        <!-- Simulated Mobile Phone SMS Screen -->
        <div class="sms-phone-mockup">
          <div class="phone-screen">
            <div class="phone-header">
              <span>MOH-SURVEILLANCE</span>
            </div>
            <div class="phone-messages-body">
              <div class="sms-bubble">
                <p class="sms-text">${smsObj.content}</p>
                <span class="sms-time">10:42 EAT · ${smsObj.length}/160 chars</span>
              </div>
            </div>
            <div class="phone-reply-bar">
              <span class="reply-hint">${t('sms.replyGuide')}</span>
            </div>
          </div>
        </div>

        <div class="sms-rules-card panel mt-6">
          <h3>SMS Safety & Compliance Rules</h3>
          <ul>
            <li><strong>Privacy on shared phones:</strong> Messages never contain patient names, fever figures, or disease names.</li>
            <li><strong>Action-oriented:</strong> Every text message concludes with a clear next step (even if "Nothing to do").</li>
            <li><strong>Single digit replies:</strong> 1 = Yes, 2 = No, 3 = Not sure. For safety, 3 is evaluated as 1 (Yes).</li>
            <li><strong>Reverse-billed:</strong> SMS responses cost the patient zero airtime.</li>
            <li><strong>${t('sms.withdrawSms')}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * SETTINGS & PRIVACY TAB
 */
function renderSettingsTab(profile) {
  return `
    <div class="settings-tab-layout">
      <div class="panel">
        <span class="eyebrow">Governance & Consent</span>
        <h1>${t('settings.heading')}</h1>
        <p class="lead-text">${t('settings.subtitle')}</p>

        <section class="settings-section">
          <h2>${t('settings.privacyTitle')}</h2>
          <p>${t('settings.privacyBody')}</p>
          <p class="muted mt-2">Active pseudonymous subject ID: <strong class="mono">${profile.id}</strong> (Enrolled via ${profile.site})</p>
          <div class="privacy-badges">
            <span class="tier green">ODPC Registered</span>
            <span class="tier green">Kenya Data Protection Act 2019</span>
            <span class="tier green">Pseudonymous Record</span>
          </div>
        </section>

        <!-- Withdrawal Card -->
        <section class="settings-section withdrawal-card panel">
          <h3>Consent Withdrawal</h3>
          <p class="muted">Under Kenya’s Data Protection Act, you may withdraw from monitoring at any moment without penalty.</p>
          ${
            consentWithdrawn
              ? `
            <div class="banner banner-alert mt-4">
              <strong>${t('settings.withdrawSuccess')}</strong>
              <p>Your records have been dissociated and your device de-linked.</p>
            </div>
          `
              : `
            <button class="button small secondary mt-4" id="withdraw-consent-btn">
              ${t('settings.withdrawBtn')}
            </button>
          `
          }
        </section>
      </div>
    </div>
  `;
}

/**
 * Event bindings for Companion
 */
export function bindCompanionEvents(renderFn) {
  // Scenario select
  document.querySelector('#persona-select')?.addEventListener('change', (e) => {
    setCompanionScenario(parseInt(e.target.value, 10));
    renderFn();
  });

  // Language buttons
  document.querySelector('#lang-en')?.addEventListener('click', () => {
    setCompanionLanguage('en');
    renderFn();
  });
  document.querySelector('#lang-sw')?.addEventListener('click', () => {
    setCompanionLanguage('sw');
    renderFn();
  });

  // Font size buttons
  document.querySelector('#size-normal')?.addEventListener('click', () => {
    setCompanionTextSize('normal');
    renderFn();
  });
  document.querySelector('#size-large')?.addEventListener('click', () => {
    setCompanionTextSize('large');
    renderFn();
  });
  document.querySelector('#size-extra')?.addEventListener('click', () => {
    setCompanionTextSize('extra');
    renderFn();
  });

  // Tab navigation buttons
  document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCompanionTab(btn.dataset.tab);
      renderFn();
    });
  });

  // Quick action buttons on Home tab
  document.querySelector('#start-checkin-btn')?.addEventListener('click', () => {
    setCompanionTab('checkin');
    renderFn();
  });
  document.querySelector('#view-vitals-btn')?.addEventListener('click', () => {
    setCompanionTab('readings');
    renderFn();
  });

  // Check-in form radio changes
  document.querySelectorAll('.checkin-form input[type="radio"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      checkInAnswers[e.target.name] = e.target.value;
      const parent = e.target.closest('.question-item');
      parent?.querySelectorAll('.option-pill').forEach((pill) => pill.classList.remove('selected'));
      e.target.closest('.option-pill')?.classList.add('selected');
    });
  });

  // Check-in submission
  document.querySelector('#checkin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    checkInFeedback = evaluateCheckInResponse(checkInAnswers);
    renderFn();
  });

  // Callback form
  document.querySelector('#callback-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    callbackRequested = true;
    const statusEl = document.querySelector('#callback-status');
    if (statusEl) statusEl.textContent = t('contact.callbackSent');
  });

  // Withdraw consent button
  document.querySelector('#withdraw-consent-btn')?.addEventListener('click', () => {
    const ok = window.confirm(t('settings.withdrawConfirm'));
    if (ok) {
      const profile = COMPANION_PROFILES[currentProfileIndex];
      withdrawConsent(profile);
      consentWithdrawn = true;
      renderFn();
    }
  });
}
