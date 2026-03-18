"""Tests for manual test result recording and status updates."""

import pytest

from helpers import build_junit_xml


@pytest.mark.crud
@pytest.mark.feature("Manual Results")
@pytest.mark.story("Create Manual Result")
class TestManualResultCreate:
    @pytest.mark.test_case("Mark not-run test case as passed")
    def test_mark_passed(self, api, project, test_case, uploaded_run):
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        assert resp.status_code == 201
        result = resp.json()
        assert result["status"] == "passed"
        assert result["test_case_id"] == test_case["id"]
        assert result["duration_ms"] == 0

    @pytest.mark.test_case("Mark not-run test case as failed")
    def test_mark_failed(self, api, project, test_case, uploaded_run):
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "failed"},
        )
        assert resp.status_code == 201
        assert resp.json()["status"] == "failed"

    @pytest.mark.test_case("Mark not-run test case as skipped")
    def test_mark_skipped(self, api, project, test_case, uploaded_run):
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "skipped"},
        )
        assert resp.status_code == 201
        assert resp.json()["status"] == "skipped"

    @pytest.mark.test_case("Run totals update after manual result")
    def test_totals_updated(self, api, project, test_case, uploaded_run):
        old_run = api.get(f"/runs/{uploaded_run['id']}").json()
        old_total = old_run["total"]
        old_passed = old_run["passed"]

        api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )

        new_run = api.get(f"/runs/{uploaded_run['id']}").json()
        assert new_run["total"] == old_total + 1
        assert new_run["passed"] == old_passed + 1

    @pytest.mark.test_case("Duplicate manual result returns 409")
    def test_duplicate_rejected(self, api, project, test_case, uploaded_run):
        api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        assert resp.status_code == 409


@pytest.mark.edge
@pytest.mark.feature("Manual Results")
@pytest.mark.story("Create Edge Cases")
class TestManualResultEdgeCases:
    @pytest.mark.test_case("Missing test_case_id returns 400")
    def test_missing_test_case_id(self, api, uploaded_run):
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"status": "passed"},
        )
        assert resp.status_code == 400

    @pytest.mark.test_case("Invalid status returns 400")
    def test_invalid_status(self, api, test_case, uploaded_run):
        resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "invalid"},
        )
        assert resp.status_code == 400

    @pytest.mark.test_case("Nonexistent run returns 404")
    def test_nonexistent_run(self, api, test_case):
        resp = api.post(
            "/runs/999999/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        assert resp.status_code == 404

    @pytest.mark.test_case("Test case from different project returns 404")
    def test_wrong_project(self, api, test_case):
        # Create a separate project and run
        p2 = api.post("/projects", json={"name": "Other Project"}).json()
        xml = build_junit_xml(test_cases=[{"name": "t", "classname": "c"}])
        run2 = api.post("/runs/upload", json={"project_id": p2["id"], "xml": xml}).json()

        resp = api.post(
            f"/runs/{run2['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        assert resp.status_code == 404
        api.delete(f"/projects/{p2['id']}")


@pytest.mark.crud
@pytest.mark.feature("Manual Results")
@pytest.mark.story("Update Result Status")
class TestResultStatusUpdate:
    @pytest.mark.test_case("Update result status from passed to failed")
    def test_update_status(self, api, project, test_case, uploaded_run):
        # Create a manual result first
        create_resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        result_id = create_resp.json()["id"]

        resp = api.put(f"/results/{result_id}", json={"status": "failed"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "failed"

    @pytest.mark.test_case("Run totals recalculated after status update")
    def test_totals_after_update(self, api, project, test_case, uploaded_run):
        create_resp = api.post(
            f"/runs/{uploaded_run['id']}/results",
            json={"test_case_id": test_case["id"], "status": "passed"},
        )
        result_id = create_resp.json()["id"]
        run_after_create = api.get(f"/runs/{uploaded_run['id']}").json()

        api.put(f"/results/{result_id}", json={"status": "failed"})
        run_after_update = api.get(f"/runs/{uploaded_run['id']}").json()

        assert run_after_update["passed"] == run_after_create["passed"] - 1
        assert run_after_update["failed"] == run_after_create["failed"] + 1
        assert run_after_update["total"] == run_after_create["total"]

    @pytest.mark.test_case("Update uploaded result status")
    def test_update_uploaded_result(self, api, uploaded_run):
        results = api.get(f"/runs/{uploaded_run['id']}/results").json()
        passed_result = next(r for r in results if r["status"] == "passed")

        resp = api.put(f"/results/{passed_result['id']}", json={"status": "skipped"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "skipped"


@pytest.mark.edge
@pytest.mark.feature("Manual Results")
@pytest.mark.story("Update Edge Cases")
class TestResultUpdateEdgeCases:
    @pytest.mark.test_case("Update nonexistent result returns 404")
    def test_nonexistent_result(self, api):
        resp = api.put("/results/999999", json={"status": "passed"})
        assert resp.status_code == 404

    @pytest.mark.test_case("Update with invalid status returns 400")
    def test_invalid_status(self, api, uploaded_run):
        results = api.get(f"/runs/{uploaded_run['id']}/results").json()
        resp = api.put(f"/results/{results[0]['id']}", json={"status": "bogus"})
        assert resp.status_code == 400
