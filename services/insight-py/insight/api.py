from fastapi import FastAPI
from pydantic import BaseModel, Field

from insight.domain import SiteCount, suppress_small_cells

app = FastAPI(title="GM Insight API", version="1.0.0")


class SiteCountInput(BaseModel):
    site: str = Field(min_length=1, max_length=120)
    count: int = Field(ge=0)


class AggregateInput(BaseModel):
    rows: list[SiteCountInput]
    threshold: int = Field(default=5, ge=1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ready"}


@app.post("/v1/aggregate/suppress")
def aggregate(payload: AggregateInput) -> dict[str, list[dict[str, int | str]]]:
    rows = [SiteCount(row.site, row.count) for row in payload.rows]
    return {"rows": [row.__dict__ for row in suppress_small_cells(rows, payload.threshold)]}
