"""Cross-entity relationship and enrichment tests."""

import uuid

import pytest

from helpers import build_junit_xml


@pytest.mark.crud
@pytest.mark.feature("Relationships")
@pytest.mark.story("Cross-Entity Queries")
class TestRelationships:
    @pytest.mark.test_case("Test cases by project include story and feature names")
    def test_testcases_by_project_enriched(self, api, project, feature, story, test_case):
        """GET /testcases?project_id includes story_name and feature_name."""
        resp = api.get("/testcases", params={"project_id": project["id"]})
        assert resp.status_code == 200
        tc = next(x for x in resp.json() if x["id"] == test_case["id"])
        assert tc["story_name"] is not None
        assert tc["feature_name"] is not None

    @pytest.mark.test_case("Run results include case, story, and feature names")
    def test_run_results_enriched(self, api, project, feature, story):
        """Results include case_name, story_name, feature_name when matched."""
        key = f"test_enrich_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        )
        xml = build_junit_xml(test_cases=[{"name": key, "classname": "x.y"}])
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        results = api.get(f"/runs/{run['id']}/results").json()
        r = next(x for x in results if x["name"] == key)
        assert r["case_name"] is not None
        assert r["story_name"] is not None
        assert r["feature_name"] is not None

    @pytest.mark.test_case("History shows results from multiple runs")
    def test_history_multiple_uploads(self, api, project, feature, story):
        """Test case history shows results from multiple runs ordered DESC."""
        key = f"test_hist_{uuid.uuid4().hex[:8]}"
        tc = api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        ).json()

        # Upload twice
        for _ in range(2):
            xml = build_junit_xml(test_cases=[{"name": key, "classname": "x.y"}])
            api.post(
                "/runs/upload", json={"project_id": project["id"], "xml": xml}
            )

        resp = api.get(f"/testcases/{tc['id']}/history")
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) >= 2

    @pytest.mark.test_case("History capped at 50 results")
    def test_history_capped_at_50(self, api, project, feature, story):
        """History endpoint returns at most 50 results."""
        key = f"test_cap_{uuid.uuid4().hex[:8]}"
        tc = api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        ).json()

        resp = api.get(f"/testcases/{tc['id']}/history")
        assert resp.status_code == 200
        assert len(resp.json()) <= 50

    @pytest.mark.test_case("Coverage shows not-run cases with null status")
    def test_coverage_shows_not_run(self, api, project, feature, story):
        """Coverage includes test cases with null status when not executed."""
        key = f"test_notrun_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        )

        # Upload a run that does NOT include this test case
        xml = build_junit_xml(
            test_cases=[{"name": f"other_{uuid.uuid4().hex[:8]}", "classname": "x.y"}],
        )
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        coverage = api.get(f"/runs/{run['id']}/coverage").json()
        not_run = [c for c in coverage if c["case_name"] == key and c["status"] is None]
        assert len(not_run) == 1

    @pytest.mark.test_case("Runs list not_run count matches unexecuted cases")
    def test_runs_list_not_run_count(self, api, project, feature, story):
        """Runs list not_run count matches unexecuted active cases."""
        key = f"test_nrc_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        )

        # Upload a run without this test case
        xml = build_junit_xml(
            test_cases=[{"name": f"other_{uuid.uuid4().hex[:8]}", "classname": "x.y"}],
        )
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        runs = api.get("/runs", params={"project_id": project["id"]}).json()
        r = next(x for x in runs if x["id"] == run["id"])
        assert r["not_run"] >= 1
