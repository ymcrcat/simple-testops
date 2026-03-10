"""Result matching tests — auto-match during upload and manual match."""

import uuid

import pytest

from helpers import build_junit_xml


@pytest.mark.upload
@pytest.mark.feature("Result Matching")
@pytest.mark.story("Auto Match")
class TestAutoMatch:
    @pytest.mark.test_case("Auto-match by key")
    def test_match_by_key(self, api, project, feature, story):
        """Pre-create a test case with a known key, upload XML with same key."""
        key = f"test_match_key_{uuid.uuid4().hex[:8]}"
        api.post("/testcases", json={"story_id": story["id"], "name": key, "key": key})

        xml = build_junit_xml(
            test_cases=[{"name": key, "classname": "some.Class"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        matched = next(r for r in results if r["name"] == key)
        assert matched["test_case_id"] is not None

    @pytest.mark.test_case("Auto-match by classname and key")
    def test_match_by_classname_and_key(self, api, project, feature, story):
        """Pre-create test case with class_name, upload with matching classname+name."""
        key = f"test_cls_{uuid.uuid4().hex[:8]}"
        cn = f"tests.cls_{uuid.uuid4().hex[:8]}"
        api.post(
            "/testcases",
            json={"story_id": story["id"], "name": key, "key": key, "class_name": cn},
        )

        xml = build_junit_xml(
            test_cases=[{"name": key, "classname": cn}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        matched = next(r for r in results if r["name"] == key)
        assert matched["test_case_id"] is not None

    @pytest.mark.test_case("Auto-create from feature/story properties")
    def test_auto_create_from_properties(self, api, project):
        """Upload with feature/story properties should auto-create hierarchy."""
        uid = uuid.uuid4().hex[:8]
        xml = build_junit_xml(
            test_cases=[
                {
                    "name": f"test_prop_{uid}",
                    "classname": "any.thing",
                    "properties": {"feature": f"AutoFeat_{uid}", "story": f"AutoStory_{uid}"},
                },
            ],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        r = results[0]
        assert r["test_case_id"] is not None

    @pytest.mark.test_case("Auto-create from dotted classname")
    def test_auto_create_from_classname(self, api, project):
        """Upload with dotted classname auto-creates feature+story from segments."""
        uid = uuid.uuid4().hex[:8]
        xml = build_junit_xml(
            test_cases=[
                {"name": f"test_auto_{uid}", "classname": f"feat_{uid}.story_{uid}"},
            ],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        assert results[0]["test_case_id"] is not None


@pytest.mark.crud
@pytest.mark.feature("Result Matching")
@pytest.mark.story("Manual Match")
class TestManualMatch:
    @pytest.mark.test_case("Manually match result to test case")
    def test_manual_match_success(self, api, project, feature, story):
        """Manually match a result to a test case via PUT /api/results/:id/match."""
        key = f"test_manual_{uuid.uuid4().hex[:8]}"
        api.post("/testcases", json={"story_id": story["id"], "name": key, "key": key})

        # Upload an unrelated result (different key so it won't auto-match)
        xml = build_junit_xml(
            test_cases=[{"name": f"unrelated_{uuid.uuid4().hex[:8]}", "classname": "x.y"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        result_id = results[0]["id"]

        resp = api.put(f"/results/{result_id}/match", json={"key": key})
        assert resp.status_code == 200
        body = resp.json()
        assert body["matched"] is True
        assert body["test_case_id"] is not None

    @pytest.mark.test_case("Manual match with bad key returns matched=false")
    def test_manual_match_no_match(self, api, project):
        """Match with a non-existent key returns matched=false."""
        xml = build_junit_xml(
            test_cases=[{"name": "test_nomatch", "classname": "x.y"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        result_id = results[0]["id"]

        resp = api.put(
            f"/results/{result_id}/match",
            json={"key": f"nonexistent_{uuid.uuid4().hex[:8]}"},
        )
        assert resp.status_code == 200
        assert resp.json()["matched"] is False

    @pytest.mark.test_case("Clear match with empty key")
    def test_manual_match_clear(self, api, project, feature, story):
        """Passing empty key clears the match."""
        key = f"test_clear_{uuid.uuid4().hex[:8]}"
        api.post("/testcases", json={"story_id": story["id"], "name": key, "key": key})

        xml = build_junit_xml(
            test_cases=[{"name": key, "classname": "x.y"}],
        )
        resp = api.post("/runs/upload", json={"project_id": project["id"], "xml": xml})
        run = resp.json()
        results = api.get(f"/runs/{run['id']}/results").json()
        result_id = next(r for r in results if r["name"] == key)["id"]

        # Clear the match
        resp = api.put(f"/results/{result_id}/match", json={"key": ""})
        assert resp.status_code == 200
        assert resp.json()["test_case_id"] is None

    @pytest.mark.test_case("Match nonexistent result returns 404")
    def test_manual_match_result_not_found(self, api):
        resp = api.put("/results/999999/match", json={"key": "anything"})
        assert resp.status_code == 404
