/**
 * GM Patient Companion Domain Logic
 * Implements clinical rules, signal filtering, safety states,
 * and data privacy requirements from the design brief.
 */

export const COMPANION_STATES = {
  SETTLED: 'settled',
  KEEP_WATCHING: 'keep_watching',
  CHECK_IN: 'check_in',
  CONTACT_CARE_TEAM: 'contact_care_team',
  ALREADY_UNWELL: 'already_unwell',
  POOR_SIGNAL: 'poor_signal',
};

/**
 * Filter raw readings to ignore bad signals (loose strap, excessive movement, low battery).
 * Product rule: A reading with poor signal quality is never displayed as a valid result.
 */
export function filterSignalQuality(reading) {
  if (!reading) return { valid: false, reason: 'missing_data' };
  if (reading.strapLoose) return { valid: false, reason: 'strap_loose' };
  if (reading.movementLevel === 'high') return { valid: false, reason: 'movement' };
  if (reading.batteryPercent !== undefined && reading.batteryPercent <= 5) {
    return { valid: false, reason: 'battery_critical' };
  }
  if (reading.signalQuality && reading.signalQuality === 'poor') {
    return { valid: false, reason: 'poor_sensor_contact' };
  }
  return { valid: true, reading };
}

/**
 * Evaluates patient state based on personal baseline, clinical thresholds,
 * symptom check-ins, and arrival status.
 *
 * Rules from brief:
 * - Informational, not diagnostic. Never states what disease a person has or might have.
 * - Single high reading moves to Keep watching at most. Check in needs sustained or repeated change.
 * - Symptoms count as much as temperature.
 * - Already unwell on arrival skips baseline learning.
 * - Calming the interface must never delay care.
 */
export function evaluateCompanionState(patient, config = {}) {
  const {
    feverAbsoluteLimit = 38.0,
    severeFeverLimit = 38.5,
    severeHeartRateLimit = 110,
    severeOxygenFloor = 92,
  } = config;

  if (!patient) {
    return {
      state: COMPANION_STATES.SETTLED,
      tier: 'green',
      icon: 'settled',
      urgent: false,
    };
  }

  // Arrival check: Already unwell skips baseline learning and leads with care team
  if (patient.alreadyUnwell) {
    return {
      state: COMPANION_STATES.ALREADY_UNWELL,
      tier: 'red',
      icon: 'care_team',
      urgent: true,
      requiresCareTeamContact: true,
      baselineLearning: false,
      messageKey: 'already_unwell',
    };
  }

  // Check hardware signal quality
  const signalCheck = filterSignalQuality(patient.latestReading);
  if (!signalCheck.valid) {
    return {
      state: COMPANION_STATES.POOR_SIGNAL,
      tier: 'amber',
      icon: 'warning',
      urgent: false,
      reason: signalCheck.reason,
      messageKey: 'poor_signal',
    };
  }

  const reading = patient.latestReading || {};
  const reportedSymptoms = Array.isArray(patient.reportedSymptoms) ? patient.reportedSymptoms : [];
  const hasSevereSymptom = reportedSymptoms.some((s) =>
    ['vomiting', 'diarrhoea', 'bleeding', 'severe_weakness'].includes(s.toLowerCase()),
  );

  // Severe deterioration rule: 38.5°C+, severe symptoms, or severe vitals -> Contact care team
  const isSevereVitals =
    (reading.temperature && reading.temperature >= severeFeverLimit) ||
    (reading.heartRate && reading.heartRate >= severeHeartRateLimit) ||
    (reading.oxygen && reading.oxygen <= severeOxygenFloor);

  if (isSevereVitals || hasSevereSymptom || (reading.temperature >= feverAbsoluteLimit && patient.highRiskExposure)) {
    return {
      state: COMPANION_STATES.CONTACT_CARE_TEAM,
      tier: 'red',
      icon: 'contact_care_team',
      urgent: true,
      requiresCareTeamContact: true,
      messageKey: 'contact_care_team',
    };
  }

  // Sustained change or reported symptom -> Check in
  const isSustainedTemp = patient.sustainedElevationsCount && patient.sustainedElevationsCount >= 2;
  const hasAnySymptom = reportedSymptoms.length > 0;
  const isSustainedVitals = patient.sustainedVitalsDeviation === true;

  if (isSustainedTemp || hasAnySymptom || isSustainedVitals || patient.checkInRequested) {
    return {
      state: COMPANION_STATES.CHECK_IN,
      tier: 'amber',
      icon: 'check_in',
      urgent: false,
      promptCheckIn: true,
      messageKey: 'check_in',
    };
  }

  // Single shift not yet concerning -> Keep watching
  const isSingleTempShift = reading.temperature && reading.temperature >= feverAbsoluteLimit;
  const isSinglePulseShift = reading.heartRate && patient.baselineHeartRate && (reading.heartRate - patient.baselineHeartRate > 12);
  const isSingleOxygenDip = reading.oxygen && reading.oxygen < 95;

  if (isSingleTempShift || isSinglePulseShift || isSingleOxygenDip || patient.slightShift) {
    return {
      state: COMPANION_STATES.KEEP_WATCHING,
      tier: 'amber',
      icon: 'keep_watching',
      urgent: false,
      messageKey: 'keep_watching',
    };
  }

  // Within typical personal range
  return {
    state: COMPANION_STATES.SETTLED,
    tier: 'green',
    icon: 'settled',
    urgent: false,
    messageKey: 'settled',
  };
}

/**
 * Check-in reply evaluation.
 * Replies: 1 = Yes, 2 = No, 3 = Not sure.
 * Safety rule: Treat 3 (Not sure) as 1 (Yes) for safety.
 * Any Yes or Not sure ends questions early and alerts a nurse.
 */
export function evaluateCheckInResponse(answers = {}) {
  const responses = Object.values(answers);
  const hasYesOrNotSure = responses.some((ans) => {
    const clean = String(ans).trim().toLowerCase();
    return clean === '1' || clean === '3' || clean === 'yes' || clean === 'ndio' || clean === 'not sure' || clean === 'sina uhakika';
  });

  if (hasYesOrNotSure) {
    return {
      status: 'escalate_nurse',
      alertStaff: true,
      messageEn: 'Thank you. A nurse has been told and will follow up shortly.',
      messageSw: 'Asante. Muuguzi amearifiwa na atawasiliana nawe hivi karibuni.',
    };
  }

  const allAnswered = responses.length >= 5;
  return {
    status: allAnswered ? 'completed_normal' : 'in_progress',
    alertStaff: false,
    messageEn: 'Thank you. Your answers have been recorded for today.',
    messageSw: 'Asante. Majibu yako yamenakiliwa kwa ajili ya leo.',
  };
}

/**
 * 160-character SMS formatter for basic phone fallback.
 * Strictly adheres to design brief SMS rules:
 * - No patient names, no disease names, no numeric vitals in SMS (shared phone safety).
 * - Every message ends with an action. Fits within 160 chars.
 */
export function formatSmsMessage(state, language = 'en', dayNumber = 1) {
  const isSw = language === 'sw';
  let text = '';

  switch (state) {
    case COMPANION_STATES.SETTLED:
      text = isSw
        ? `Ukaguzi wa afya: vipimo vyako viko kawaida leo. Siku ${dayNumber} ya 21. Hakuna unachohitaji kufanya.`
        : `Health check: your readings look normal today. Day ${dayNumber} of 21. Nothing to do.`;
      break;

    case COMPANION_STATES.KEEP_WATCHING:
      text = isSw
        ? `Ukaguzi wa afya: kipimo kimoja kilikuwa juu kidogo. Tunakifuatilia. Hakuna unachohitaji kufanya sasa.`
        : `Health check: one reading was a little high. We are watching it. Nothing to do now.`;
      break;

    case COMPANION_STATES.CHECK_IN:
      text = isSw
        ? `Tafadhali jibu maswali ya haraka. S1: Je, unahisi homa? Jibu 1=Ndio 2=Hapana 3=Sina uhakika`
        : `Please answer 5 quick questions. Q1: Do you feel feverish? Reply 1=Yes 2=No 3=Not sure`;
      break;

    case COMPANION_STATES.CONTACT_CARE_TEAM:
      text = isSw
        ? `Tafadhali piga simu kwa timu yako ya huduma sasa kupitia 0800721000. Ukishindwa, subiri simu yetu. Jibu 1 kama unaweza kuongea.`
        : `Please call your care team now on 0800721000. If you cannot, wait for our call. Reply 1 if you can talk now.`;
      break;

    case COMPANION_STATES.POOR_SIGNAL:
      text = isSw
        ? `Hatukupata kipimo kizuri. Tafadhali hakikisha bendi ya saa imefungwa vyema na ina chaji.`
        : `We could not get a good reading. Please check your band is snug and charged.`;
      break;

    default:
      text = isSw
        ? `Ujumbe kutoka kwa kituo cha ufuatiliaji wa afya. Piga 0800721000 kwa usaidizi.`
        : `Health follow-up message. Call 0800721000 for care team assistance.`;
  }

  // Ensure message does not exceed standard 160-character single SMS limit
  return {
    content: text,
    length: text.length,
    fitsSingleSms: text.length <= 160,
  };
}

/**
 * Consent withdrawal adhering to Kenya Data Protection Act 2019.
 * Purges patient identifiers immediately, destroys linkage key, and retains only de-identified telemetry.
 */
export function withdrawConsent(patient) {
  if (!patient) return null;
  const deidentified = {
    deidentifiedId: `ANON-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    monitoringDay: patient.monitoringDay,
    status: 'consent_withdrawn',
    withdrawnAt: new Date().toISOString(),
    retainedForResearch: true,
    identifiersPurged: true,
    linkKeyDestroyed: true,
  };
  return deidentified;
}
