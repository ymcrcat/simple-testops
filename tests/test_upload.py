"""JUnit XML upload tests."""

import uuid

import pytest

from helpers import build_junit_xml


@pytest.mark.upload
@pytest.mark.feature("Upload")
@pytest.mark.story("XML Upload")
class TestUpload:
    @pytest.mark.test_case("Basic upload creates run")
    def test_basic_upload(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "test_one", "classname": "a.b", "status": "passed"}]
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        assert resp.status_code == 201
        run = resp.json()
        assert run["total"] == 1
        assert run["passed"] == 1

    @pytest.mark.test_case("Suite name becomes default run name")
    def test_suite_name_as_default_run_name(self, api, project):
        xml = build_junit_xml(
            suite_name="my-suite",
            test_cases=[{"name": "test_x", "classname": "a.b"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        assert resp.status_code == 201
        assert resp.json()["name"] == "my-suite"

    @pytest.mark.test_case("Custom run name overrides suite name")
    def test_custom_run_name(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "test_x", "classname": "a.b"}],
        )
        resp = api.post(
            "/runs/upload",
            json={"project_id": project["id"], "xml": xml, "name": "Custom Run"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Custom Run"

    @pytest.mark.test_case("Upload by project slug")
    def test_upload_by_slug(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "test_slug", "classname": "a.b"}],
        )
        resp = api.post(
            "/runs/upload", json={"project_id": project["slug"], "xml": xml}
        )
        assert resp.status_code == 201

    @pytest.mark.test_case("Results have status, error_message, duration_ms")
    def test_results_have_correct_fields(self, api, project):
        xml = build_junit_xml(
            test_cases=[
                {
                    "name": "test_fail",
                    "classname": "a.b",
                    "status": "failed",
                    "error_message": "bad assert",
                    "time": 1.5,
                },
            ],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results_resp = api.get(f"/runs/{run['id']}/results")
        results = results_resp.json()
        r = next(x for x in results if x["name"] == "test_fail")
        assert r["status"] == "failed"
        assert r["error_message"] is not None
        assert r["duration_ms"] is not None

    @pytest.mark.test_case("Failure element maps to failed status")
    def test_status_mapping_failure(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "t_fail", "classname": "a.b", "status": "failed"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        assert run["failed"] == 1

    @pytest.mark.test_case("Error element maps to broken status")
    def test_status_mapping_error(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "t_err", "classname": "a.b", "status": "broken"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        # "broken" counts under neither passed nor failed in totals — check results
        results = api.get(f"/runs/{run['id']}/results").json()
        assert any(r["status"] == "broken" for r in results)

    @pytest.mark.test_case("Skipped element maps to skipped status")
    def test_status_mapping_skipped(self, api, project):
        xml = build_junit_xml(
            test_cases=[{"name": "t_skip", "classname": "a.b", "status": "skipped"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        assert resp.json()["skipped"] == 1


@pytest.mark.edge
@pytest.mark.feature("Upload")
@pytest.mark.story("Edge Cases")
class TestUploadEdgeCases:
    @pytest.mark.test_case("Upload missing XML returns 400")
    def test_missing_fields(self, api):
        resp = api.post("/runs/upload", json={"project_id": 1})
        assert resp.status_code == 400

    @pytest.mark.test_case("Upload to nonexistent project returns 404")
    def test_nonexistent_project(self, api):
        xml = build_junit_xml(
            test_cases=[{"name": "test_x", "classname": "a.b"}],
        )
        resp = api.post("/runs/upload", json={"project_id": 999999, "xml": xml})
        assert resp.status_code == 404
