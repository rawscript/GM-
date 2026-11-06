import { describe, expect, it } from 'vitest';
import {
  COMPANION_STATES,
  evaluateCompanionState,
  evaluateCheckInResponse,
  filterSignalQuality,
  formatSmsMessage,
  withdrawConsent,
} from '../src/domain/companion.js';

describe('GM Patient Companion domain logic', () => {
  it('correctly identifies the 4 primary states', () => {
    // 1. Settled state
    const settledPatient = {
      id: 'GM-KEN-1048',
      monitoringDay: 6,
      baselineTemperature: 36.5,
      latestReading: { temperature: 36.6, heartRate: 68, oxygen: 98, signalQuality: 'good' },
    };
    expect(evaluateCompanionState(settledPatient).state).toBe(COMPANION_STATES.SETTLED);

    // 2. Keep watching state (single non-sustained slight shift)
    const watchingPatient = {
      id: 'GM-KEN-1052',
      monitoringDay: 9,
      latestReading: { temperature: 38.0, heartRate: 72, oxygen: 97, signalQuality: 'good' },
      sustainedElevationsCount: 1,
    };
    expect(evaluateCompanionState(watchingPatient).state).toBe(COMPANION_STATES.KEEP_WATCHING);

    // 3. Check-in state (sustained elevation or reported symptom)
    const checkInPatient = {
      id: 'GM-KEN-1072',
      monitoringDay: 12,
      latestReading: { temperature: 38.1, heartRate: 78, oxygen: 96, signalQuality: 'good' },
      sustainedElevationsCount: 2,
    };
    expect(evaluateCompanionState(checkInPatient).state).toBe(COMPANION_STATES.CHECK_IN);

    // 4. Contact care team state (severe fever >= 38.5 or severe symptom)
    const severePatient = {
      id: 'GM-KEN-1088',
      monitoringDay: 14,
      latestReading: { temperature: 38.7, heartRate: 112, oxygen: 91, signalQuality: 'good' },
      reportedSymptoms: ['vomiting'],
    };
    const severeEval = evaluateCompanionState(severePatient);
    expect(severeEval.state).toBe(COMPANION_STATES.CONTACT_CARE_TEAM);
    expect(severeEval.urgent).toBe(true);
  });

  it('handles arrival check: already unwell skips baseline learning', () => {
    const arrivalPatient = {
      id: 'GM-KEN-1104',
      monitoringDay: 2,
      alreadyUnwell: true,
      latestReading: { temperature: 38.2, heartRate: 85, oxygen: 95, signalQuality: 'good' },
    };
    const evalState = evaluateCompanionState(arrivalPatient);
    expect(evalState.state).toBe(COMPANION_STATES.ALREADY_UNWELL);
    expect(evalState.baselineLearning).toBe(false);
  });

  it('filters bad signal quality and loose strap to prevent false alarms', () => {
    const looseStrapReading = { temperature: 39.2, heartRate: 120, strapLoose: true };
    expect(filterSignalQuality(looseStrapReading).valid).toBe(false);

    const movementReading = { temperature: 38.9, movementLevel: 'high' };
    expect(filterSignalQuality(movementReading).valid).toBe(false);

    const loosePatient = {
      id: 'GM-KEN-1115',
      monitoringDay: 4,
      latestReading: { temperature: 39.0, strapLoose: true },
    };
    const evalState = evaluateCompanionState(loosePatient);
    expect(evalState.state).toBe(COMPANION_STATES.POOR_SIGNAL);
  });

  it('evaluates check-in responses with safety rule (treat Not sure as Yes)', () => {
    // All No answers
    const allNo = { q1: '2', q2: '2', q3: '2', q4: '2', q5: '2' };
    expect(evaluateCheckInResponse(allNo).alertStaff).toBe(false);

    // Answer with Yes (1)
    const hasYes = { q1: '1', q2: '2', q3: '2' };
    expect(evaluateCheckInResponse(hasYes).alertStaff).toBe(true);

    // Answer with Not sure (3) -> Safety rule treats 3 as 1
    const hasNotSure = { q1: '3', q2: '2' };
    expect(evaluateCheckInResponse(hasNotSure).alertStaff).toBe(true);

    // Kiswahili reply
    const swahiliYes = { q1: 'ndio', q2: 'hapana' };
    expect(evaluateCheckInResponse(swahiliYes).alertStaff).toBe(true);
  });

  it('formats SMS messages within 160-character limit and omitting sensitive identifiers', () => {
    const settledSmsEn = formatSmsMessage(COMPANION_STATES.SETTLED, 'en', 6);
    expect(settledSmsEn.fitsSingleSms).toBe(true);
    expect(settledSmsEn.content).not.toContain('Ebola');
    expect(settledSmsEn.content).not.toContain('GM-KEN');

    const settledSmsSw = formatSmsMessage(COMPANION_STATES.SETTLED, 'sw', 6);
    expect(settledSmsSw.fitsSingleSms).toBe(true);

    const checkInSmsEn = formatSmsMessage(COMPANION_STATES.CHECK_IN, 'en', 12);
    expect(checkInSmsEn.fitsSingleSms).toBe(true);

    const contactSmsSw = formatSmsMessage(COMPANION_STATES.CONTACT_CARE_TEAM, 'sw', 14);
    expect(contactSmsSw.fitsSingleSms).toBe(true);
  });

  it('purges patient identifiers upon consent withdrawal', () => {
    const patient = {
      id: 'GM-KEN-1048',
      name: 'Jane Doe',
      phone: '+254712345678',
      monitoringDay: 7,
    };
    const withdrawn = withdrawConsent(patient);
    expect(withdrawn.identifiersPurged).toBe(true);
    expect(withdrawn.linkKeyDestroyed).toBe(true);
    expect(withdrawn).not.toHaveProperty('name');
    expect(withdrawn).not.toHaveProperty('phone');
    expect(withdrawn.status).toBe('consent_withdrawn');
  });
});
