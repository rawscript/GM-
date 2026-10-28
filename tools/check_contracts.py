import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "contracts" / "events"
REQUIRED_EVENTS = {
    "screening.recorded",
    "reading.summarised",
    "alert.raised",
    "alert.escalated",
    "specimen.collected",
    "lab.result.received",
    "adam.notification.queued",
    "adam.notification.acknowledged",
}
EVENT_TITLES = {
    "screening.recorded": "screeningrecorded",
    "reading.summarised": "readingsummarised",
    "alert.raised": "alertraised",
    "alert.escalated": "alertescalated",
    "specimen.collected": "specimencollected",
    "lab.result.received": "labresultreceived",
    "adam.notification.queued": "adamnotificationqueued",
    "adam.notification.acknowledged": "adamnotificationacknowledged",
}
FORBIDDEN_FIELDS = {"raw", "rawSensorStream", "sensorStream", "waveform"}


def walk(value: object) -> set[str]:
    fields: set[str] = set()
    if isinstance(value, dict):
        fields.update(str(key) for key in value)
        for child in value.values():
            fields.update(walk(child))
    if isinstance(value, list):
        for child in value:
            fields.update(walk(child))
    return fields


def main() -> None:
    found: set[str] = set()
    for path in EVENTS.glob("*.schema.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("additionalProperties") is not False:
            raise SystemExit(f"additional properties must be rejected: {path}")
        forbidden = walk(payload) & FORBIDDEN_FIELDS
        if forbidden:
            raise SystemExit(f"forbidden raw sensor fields in {path}: {sorted(forbidden)}")
        found.add("".join(character.lower() for character in str(payload.get("title", "")) if character.isalnum()))
    missing = {event for event, title in EVENT_TITLES.items() if title not in found}
    if missing:
        print(f"Event schemas still required: {', '.join(sorted(missing))}")
    adam = (ROOT / "contracts" / "openapi" / "console-v1.yaml").read_text(encoding="utf-8")
    if "rawSensor" in adam or "sensorStream" in adam:
        raise SystemExit("raw sensor stream fields cannot appear in the console API contract")


if __name__ == "__main__":
    main()
