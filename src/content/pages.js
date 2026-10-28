export const pages = {
  "/": {
    eyebrow: "Gusmao–Mbaja · Kenya",
    title: "A connected pathway for outbreak screening and follow-up.",
    lead: "The GM System brings contactless screening, 21-day contact monitoring and a shared patient record into one operational pathway for health teams.",
    section: "Three stages. One continuous record.",
    body: "A pseudonymous patient identifier links the checkpoint encounter, wearable summaries, health-worker follow-up and laboratory results. The official case remains with ADaM.",
    points: [
      [
        "01",
        "GM Checkpoint",
        "Touch-free screening and a referral tier at points of entry.",
      ],
      [
        "02",
        "GM Wearable",
        "Trend monitoring against each person’s own baseline during follow-up.",
      ],
      [
        "03",
        "GM Platform",
        "A command-centre record for alerts, laboratory linkage and data exchange.",
      ],
    ],
    stats: [
      ["128", "contacts in one illustrative follow-up cohort"],
      ["21", "days in the monitoring period"],
      ["2,688", "contact-days of follow-up for a single index case"],
    ],
    note: "A screening, monitoring and triage aid. It does not diagnose. Laboratory confirmation remains with national laboratories.",
  },
  "/checkpoint": {
    eyebrow: "Stage 01 · Entry points",
    title: "A touch-free screening encounter.",
    lead: "GM Checkpoint combines a distance gate, forehead temperature measurement and hand-gesture exposure questions to return a referral decision for a health worker.",
    section: "A defined seven-step flow",
    body: "The encounter is designed to minimise shared-touch surfaces and record the inputs behind each referral tier.",
    points: [
      ["01", "Approach", "A distance gate confirms a person is in position."],
      ["02", "Identify", "A pseudonymous ID is created or retrieved."],
      ["03", "Measure", "A contactless sensor measures forehead temperature."],
      ["04", "Respond", "Exposure questions are answered using hand gestures."],
      [
        "05",
        "Review",
        "Rules combine the recorded inputs and applied disease profile.",
      ],
      [
        "06",
        "Refer",
        "The station returns a green, amber or red referral tier.",
      ],
      [
        "07",
        "Link",
        "The encounter is linked to the patient record for follow-up.",
      ],
    ],
    note: "The electronic-nose module is experimental and operates in shadow mode. It is not shown to the person screened and never changes a decision.",
    illustration: "checkpoint",
  },
  "/wearable": {
    eyebrow: "Stage 02 · 21-day follow-up",
    title: "A personal baseline, observed over time.",
    lead: "GM Wearable summarises skin-temperature trend, resting heart rate, SpO₂ trend and movement to help health workers identify when follow-up may be needed.",
    section: "Signals become a prompt for human review",
    body: "The sealed wrist monitor sends summaries through a phone application to the platform. SMS is a fallback for selected alerts; direct cellular connectivity is a later pathway.",
    points: [
      [
        "01",
        "Personal baseline",
        "Trend deviations are measured against that person’s own baseline.",
      ],
      [
        "02",
        "Signal quality",
        "Quality flags and sequence gaps provide context for each summary.",
      ],
      [
        "03",
        "Health-worker review",
        "A rule-based tier suggests a nudge, call or dispatch for a person to decide.",
      ],
    ],
    note: "Wrist temperature is skin temperature, not core temperature. The interface shows trends and never presents a wearable fever reading.",
    illustration: "wearable",
  },
  "/platform": {
    eyebrow: "GM Platform · Shared record",
    title: "One pseudonymous record across the pathway.",
    lead: "The platform brings screening, follow-up summaries, alerts and laboratory results together under one patient identifier.",
    section: "Information stays traceable",
    body: "Device summaries and specimens are linked to the patient ID. Laboratory results remain attributed to the specimen and reporting laboratory; the platform does not diagnose.",
    points: [
      [
        "01",
        "Patient record",
        "A timeline connects screening, enrolment, trend summaries, alerts and specimens.",
      ],
      [
        "02",
        "Decision support",
        "Rules surface a risk tier, a suggested action and the information that triggered it.",
      ],
      [
        "03",
        "Interoperability",
        "FHIR R4 resources support controlled exchange modes, with each exchange recorded.",
      ],
    ],
    note: "Laboratory confirmation remains with national laboratories. A negative result may support a clinician’s release decision; the platform does not make that decision.",
    illustration: "platform",
  },
  "/integration": {
    eyebrow: "Interoperability · ADaM",
    title: "GM screens and monitors. ADaM owns the case.",
    lead: "The Ministry of Health’s ADaM is the national outbreak tool. The GM System is designed to send suspected-case notifications and monitoring summaries linked to ADaM’s case ID, without creating a competing case file.",
    section: "A clear division of responsibility",
    body: "The GM Platform remains the source of truth for device data. ADaM remains the source of truth for the official case and case status. A single patient and specimen identifier must be agreed with the Ministry before integration.",
    points: [
      [
        "01",
        "GM System",
        "Screening at entry and continuous monitoring before case identification and during follow-up.",
      ],
      [
        "02",
        "ADaM",
        "The official case record, contact tracing and outbreak response from case identification onward.",
      ],
      [
        "03",
        "Minimum payload",
        "Patient ID, site and timestamp; syndrome and exposure flags; applied disease profile; vital-sign summaries.",
      ],
      [
        "04",
        "FHIR boundary",
        "A single adapter contains the exchange mapping. The adapter changes if the Ministry confirms a different accepted format.",
      ],
    ],
    note: "No public ADaM API documentation was found for this design. The integration route requires agreement with the Ministry of Health’s Division of Disease Surveillance and Response and ICAP. Accepted format, patient identifier, consent, impact-assessment and ODPC registration requirements need confirmation.",
  },
  "/assurance": {
    eyebrow: "Assurance · Pathway",
    title: "A staged plan for evidence, safety and oversight.",
    lead: "Each stage requires technical, clinical, privacy and regulatory review before any field use is considered.",
    section: "Approval status is authority-specific",
    body: "The pathway includes the Ministry of Health and national command, Pharmacy and Poisons Board, Communications Authority of Kenya, Office of the Data Protection Commissioner, Digital Health Agency, and research ethics and licensing bodies.",
    points: [
      [
        "01",
        "Checkpoint",
        "Assess measurement, usability, infection-control and rule behaviour.",
      ],
      [
        "02",
        "Wearable",
        "Assess trend quality, connectivity, battery and alert handling.",
      ],
      [
        "03",
        "Platform",
        "Assess security, auditability, interoperability and workflow fit.",
      ],
    ],
    note: "Validation and approval status is to be confirmed with each authority. The design does not claim clinical validation, regulatory approval or deployment.",
  },
  "/pilot": {
    eyebrow: "Pilot pathway · Gates",
    title: "A measured evaluation with clear decision gates.",
    lead: "A proposed evaluation would examine workflow fit, data completeness, alert handling and interoperability before any expansion.",
    section: "Scope follows approvals",
    body: "The evaluation depends on site selection, ethics and regulatory review, agreed operating procedures, partner interfaces and trained staff.",
    points: [
      [
        "01",
        "Prepare",
        "Confirm governance, approvals, site readiness and data-protection controls.",
      ],
      [
        "02",
        "Evaluate",
        "Measure workflow completion, signal availability and response times.",
      ],
      [
        "03",
        "Review",
        "Decide whether evidence supports refinement or a subsequent stage.",
      ],
    ],
    note: "This is a proposed pathway. No deployment, validation or approval is represented as having occurred.",
  },
  "/credits": {
    eyebrow: "Image credits",
    title: "Image and source acknowledgements.",
    lead: "The product pairs original device illustrations with Unsplash photography across the public, operations and account pages.",
    section: "Visual assets",
    body: "Photography is credited to its Unsplash contributors and shown for visual context; operational decisions still rely on verified records and clinical review.",
    points: [
      [
        "01",
        "Care team and medical technology",
        "Photos by Vitaly Gariev on Unsplash, used under the Unsplash License.",
      ],
      ["02", "Wearable and laboratory", "Photos by Ivett M and CDC on Unsplash, used under the Unsplash License."],
      ["03", "Operations corridor", "Photo by Tasha Kostyuk on Unsplash; device illustrations are original vectors."],
    ],
    note: "Photo source links and contributor names are listed in the image credits at src/content/image-credits.html.",
  },
};

export const publicLinks = [
  ["/", "Overview"],
  ["/checkpoint", "Checkpoint"],
  ["/wearable", "Wearable"],
  ["/platform", "Platform"],
  ["/integration", "ADaM integration"],
  ["/assurance", "Assurance"],
  ["/pilot", "Pilot pathway"],
  ["/credits", "Credits"],
];
