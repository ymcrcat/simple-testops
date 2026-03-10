"""Cascade delete behavior tests."""

import uuid

import pytest

from helpers import build_junit_xml


@pytest.mark.cascade
@pytest.mark.feature("Cascade Delete")
@pytest.mark.story("Cascade Behaviour")
class TestCascadeDelete:
    @pytest.mark.test_case("Delete project cascades to features")
    def test_delete_project_cascades_features(self, api):
        """Deleting a project removes its features."""
        resp = api.post("/projects", json={"name": f"Cascade {uuid.uuid4().hex[:8]}"})
        p = resp.json()
        resp = api.post(
            "/features", json={"project_id": p["id"], "name": "CascadeFeat"}
        )
        fid = resp.json()["id"]

        api.delete(f"/projects/{p['id']}")

        resp = api.get(f"/features/{fid}")
        assert resp.status_code == 404

    @pytest.mark.test_case("Delete project cascades to runs")
    def test_delete_project_cascades_runs(self, api):
        """Deleting a project removes its runs."""
        resp = api.post("/projects", json={"name": f"Cascade {uuid.uuid4().hex[:8]}"})
        p = resp.json()
        xml = build_junit_xml(
            test_cases=[{"name": "test_x", "classname": "a.b"}],
        )
        run_resp = api.post(
            "/runs/upload", json={"project_id": p["id"], "xml": xml}
        )
        rid = run_resp.json()["id"]

        api.delete(f"/projects/{p['id']}")

        resp = api.get(f"/runs/{rid}")
        assert resp.status_code == 404

    @pytest.mark.test_case("Delete feature cascades to stories")
    def test_delete_feature_cascades_stories(self, api, project):
        """Deleting a feature removes its stories."""
        resp = api.post(
            "/features", json={"project_id": project["id"], "name": "F1"}
        )
        f = resp.json()
        resp = api.post("/stories", json={"feature_id": f["id"], "name": "S1"})
        sid = resp.json()["id"]

        api.delete(f"/features/{f['id']}")

        resp = api.get(f"/stories/{sid}")
        assert resp.status_code == 404

    @pytest.mark.test_case("Delete feature nullifies result test_case_id")
    def test_delete_feature_nullifies_results(self, api, project):
        """Deleting a feature nullifies test_case_id on results under it."""
        resp = api.post(
            "/features", json={"project_id": project["id"], "name": "FNull"}
        )
        f = resp.json()
        resp = api.post("/stories", json={"feature_id": f["id"], "name": "SNull"})
        s = resp.json()
        key = f"test_fnull_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases", json={"story_id": s["id"], "name": key, "key": key}
        )

        xml = build_junit_xml(test_cases=[{"name": key, "classname": "x.y"}])
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        # Verify result is matched
        results = api.get(f"/runs/{run['id']}/results").json()
        matched = next(r for r in results if r["name"] == key)
        assert matched["test_case_id"] is not None

        # Delete feature
        api.delete(f"/features/{f['id']}")

        # Result should still exist but test_case_id should be null
        results = api.get(f"/runs/{run['id']}/results").json()
        r = next(r for r in results if r["name"] == key)
        assert r["test_case_id"] is None

    @pytest.mark.test_case("Delete story nullifies result test_case_id")
    def test_delete_story_nullifies_results(self, api, project, feature):
        """Deleting a story nullifies test_case_id on results under it."""
        resp = api.post(
            "/stories", json={"feature_id": feature["id"], "name": "SNullify"}
        )
        s = resp.json()
        key = f"test_snull_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases", json={"story_id": s["id"], "name": key, "key": key}
        )

        xml = build_junit_xml(test_cases=[{"name": key, "classname": "x.y"}])
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        api.delete(f"/stories/{s['id']}")

        results = api.get(f"/runs/{run['id']}/results").json()
        r = next(r for r in results if r["name"] == key)
        assert r["test_case_id"] is None

    @pytest.mark.test_case("Delete test case nullifies result test_case_id")
    def test_delete_test_case_nullifies_results(self, api, project, feature, story):
        """Deleting a test case nullifies test_case_id on its results."""
        key = f"test_tcnull_{uuid.uuid4().hex[:8]}"
        tc = api.post(
            "/testcases", json={"story_id": story["id"], "name": key, "key": key}
        ).json()

        xml = build_junit_xml(test_cases=[{"name": key, "classname": "x.y"}])
        run = api.post(
            "/runs/upload", json={"project_id": project["id"], "xml": xml}
        ).json()

        api.delete(f"/testcases/{tc['id']}")

        results = api.get(f"/runs/{run['id']}/results").json()
        r = next(r for r in results if r["name"] == key)
        assert r["test_case_id"] is None
