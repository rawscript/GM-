from dataclasses import dataclass


@dataclass(frozen=True)
class SiteCount:
    site: str
    count: int


def suppress_small_cells(rows: list[SiteCount], threshold: int) -> list[SiteCount]:
    if threshold < 1:
        raise ValueError("suppression threshold must be positive")
    return [row for row in rows if row.count >= threshold]
