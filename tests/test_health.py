"""Health endpoint test."""

import pytest


@pytest.mark.smoke
@pytest.mark.feature("Health")
@pytest.mark.story("Health Check")
@pytest.mark.test_case("Health endpoint returns ok")
def test_health_returns_ok(api):
    resp = api.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
