"""Fixtures for blackbox API tests."""

import os
import uuid

import pytest
import requests

from helpers import build_junit_xml


def pytest_configure(config):
    config.addinivalue_line("markers", "feature(name): assign test to a feature")
    config.addinivalue_line("markers", "story(name): assign test to a story")
    config.addinivalue_line("markers", "test_case(name): human-readable test case name")


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Inject feature/story/test_case markers as JUnit XML properties."""
    if call.when == "call":
        for marker_name in ("feature", "story", "test_case"):
            marker = item.get_closest_marker(marker_name)
            if marker and marker.args:
                item.user_properties.append((marker_name, marker.args[0]))


@pytest.fixture(scope="session")
def base_url():
    return os.environ.get("TESTOPS_BASE_URL", "http://localhost:3001").rstrip("/")


@pytest.fixture(scope="session")
def api(base_url):
    """Thin wrapper around requests.Session that prepends /api."""

    class ApiClient:
        def __init__(self, base, session):
            self._base = base + "/api"
            self._s = session

        def get(self, path, **kwargs):
            return self._s.get(self._base + path, **kwargs)

        def post(self, path, **kwargs):
            return self._s.post(self._base + path, **kwargs)

        def put(self, path, **kwargs):
            return self._s.put(self._base + path, **kwargs)

        def delete(self, path, **kwargs):
            return self._s.delete(self._base + path, **kwargs)

    s = requests.Session()
    s.verify = False  # allow self-signed certs for deployed instance
    yield ApiClient(base_url, s)
    s.close()


@pytest.fixture()
def project(api):
    """Create a unique project, yield it, delete on teardown."""
    uid = uuid.uuid4().hex[:8]
    resp = api.post("/projects", json={"name": f"Test Project {uid}"})
    assert resp.status_code == 201
    p = resp.json()
    yield p
    api.delete(f"/projects/{p['id']}")


@pytest.fixture()
def feature(api, project):
    """Create a feature under the test project."""
    resp = api.post(
        "/features",
        json={"project_id": project["id"], "name": f"Feature {uuid.uuid4().hex[:8]}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture()
def story(api, feature):
    """Create a story under the test feature."""
    resp = api.post(
        "/stories",
        json={"feature_id": feature["id"], "name": f"Story {uuid.uuid4().hex[:8]}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture()
def test_case(api, story):
    """Create a test case under the test story."""
    resp = api.post(
        "/testcases",
        json={"story_id": story["id"], "name": f"test_{uuid.uuid4().hex[:8]}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture()
def uploaded_run(api, project):
    """Upload a sample JUnit XML and return the run object."""
    xml = build_junit_xml(
        suite_name="sample-suite",
        test_cases=[
            {"name": "test_alpha", "classname": "tests.test_alpha", "status": "passed"},
            {"name": "test_beta", "classname": "tests.test_beta", "status": "failed", "error_message": "assert 1 == 2"},
            {"name": "test_gamma", "classname": "tests.test_gamma", "status": "skipped"},
        ],
    )
    resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
    assert resp.status_code == 201
    return resp.json()
