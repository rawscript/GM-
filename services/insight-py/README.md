# Insight service

Independent Python service for de-identified cohort summaries and FHIR validation. The initial API demonstrates small-cell suppression and has no learned scoring or clinical decision endpoint. Production setup should run `uv sync --locked`, `uv run pytest`, and `uv run uvicorn insight.api:app`. Analytics access must be limited to read-only aggregate views and must never include registry access.
