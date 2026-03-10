"""Test run CRUD, results, and coverage tests."""

import pytest

from helpers import build_junit_xml


@pytest.mark.crud
@pytest.mark.feature("Runs")
@pytest.mark.story("CRUD")
class TestRunCRUD:
    @pytest.mark.test_case("List runs by project")
    def test_list_runs(self, api, project, uploaded_run):
        resp = api.get("/runs", params={"project_id": project["id"]})
        assert resp.status_code == 200
        runs = resp.json()
        assert any(r["id"] == uploaded_run["id"] for r in runs)

    @pytest.mark.test_case("List runs includes not_run count")
    def test_list_runs_has_not_run(self, api, project, uploaded_run):
        resp = api.get("/runs", params={"project_id": project["id"]})
        run = next(r for r in resp.json() if r["id"] == uploaded_run["id"])
        assert "not_run" in run

    @pytest.mark.test_case("Get run by ID")
    def test_get_run(self, api, uploaded_run):
        resp = api.get(f"/runs/{uploaded_run['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == uploaded_run["id"]

    @pytest.mark.test_case("Update run name")
    def test_update_run_name(self, api, uploaded_run):
        resp = api.put(f"/runs/{uploaded_run['id']}", json={"name": "Renamed Run"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Run"

    @pytest.mark.test_case("Delete run")
    def test_delete_run(self, api, project):
        xml = build_junit_xml(test_cases=[{"name": "test_del", "classname": "c.d"}])
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        rid = resp.json()["id"]
        resp = api.delete(f"/runs/{rid}")
        assert resp.status_code == 204

    @pytest.mark.test_case("Get run results list")
    def test_results_list(self, api, uploaded_run):
        resp = api.get(f"/runs/{uploaded_run['id']}/results")
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 3

    @pytest.mark.test_case("Filter results by status")
    def test_results_filter_by_status(self, api, uploaded_run):
        resp = api.get(
            f"/runs/{uploaded_run['id']}/results", params={"status": "failed"}
        )
        assert resp.status_code == 200
        results = resp.json()
        assert all(r["status"] == "failed" for r in results)
        assert len(results) >= 1

    @pytest.mark.test_case("Coverage endpoint returns list")
    def test_coverage_endpoint(self, api, uploaded_run):
        resp = api.get(f"/runs/{uploaded_run['id']}/coverage")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.edge
@pytest.mark.feature("Runs")
@pytest.mark.story("Edge Cases")
class TestRunEdgeCases:
    @pytest.mark.test_case("List runs missing project_id returns 400")
    def test_list_missing_project_id(self, api):
        resp = api.get("/runs")
        assert resp.status_code == 400

    @pytest.mark.test_case("Get nonexistent run returns 404")
    def test_get_nonexistent_run(self, api):
        resp = api.get("/runs/999999")
        assert resp.status_code == 404
