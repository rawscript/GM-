from hypothesis import given, strategies as st

from insight.domain import SiteCount, suppress_small_cells


@given(st.lists(st.tuples(st.text(min_size=1), st.integers(min_value=0, max_value=1000))), st.integers(min_value=1, max_value=50))
def test_suppression_never_returns_a_small_cell(values: list[tuple[str, int]], threshold: int) -> None:
    result = suppress_small_cells([SiteCount(site, count) for site, count in values], threshold)
    assert all(row.count >= threshold for row in result)
