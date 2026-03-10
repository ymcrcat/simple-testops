"""Test case CRUD and edge-case tests."""

import uuid

import pytest


@pytest.mark.crud
@pytest.mark.feature("Test Cases")
@pytest.mark.story("CRUD")
class TestTestCaseCRUD:
    @pytest.mark.test_case("Create test case defaults key to name")
    def test_create_defaults_key_to_name(self, api, story):
        name = f"test_{uuid.uuid4().hex[:8]}"
        resp = api.post("/testcases", json={"story_id": story["id"], "name": name})
        assert resp.status_code == 201
        tc = resp.json()
        assert tc["key"] == name

    @pytest.mark.test_case("Create test case with explicit key")
    def test_create_explicit_key(self, api, story):
        resp = api.post(
            "/testcases",
            json={"story_id": story["id"], "name": "My Test", "key": "test_custom_key"},
        )
        assert resp.status_code == 201
        assert resp.json()["key"] == "test_custom_key"

    @pytest.mark.test_case("Create test case with class name")
    def test_create_with_class_name(self, api, story):
        resp = api.post(
            "/testcases",
            json={
                "story_id": story["id"],
                "name": "test_cls",
                "class_name": "tests.auth.TestLogin",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["class_name"] == "tests.auth.TestLogin"

    @pytest.mark.test_case("List test cases by story")
    def test_list_by_story(self, api, story, test_case):
        resp = api.get("/testcases", params={"story_id": story["id"]})
        assert resp.status_code == 200
        assert any(tc["id"] == test_case["id"] for tc in resp.json())

    @pytest.mark.test_case("List test cases by project with enriched fields")
    def test_list_by_project_enriched(self, api, project, feature, story, test_case):
        resp = api.get("/testcases", params={"project_id": project["id"]})
        assert resp.status_code == 200
        items = resp.json()
        tc = next(x for x in items if x["id"] == test_case["id"])
        assert "story_name" in tc
        assert "feature_name" in tc

    @pytest.mark.test_case("Get test case by ID")
    def test_get_test_case(self, api, test_case):
        resp = api.get(f"/testcases/{test_case['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == test_case["id"]

    @pytest.mark.test_case("Update test case name")
    def test_update_name(self, api, test_case):
        resp = api.put(
            f"/testcases/{test_case['id']}", json={"name": "Renamed Test"}
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Test"

    @pytest.mark.test_case("Update test case status to deprecated")
    def test_update_status_deprecated(self, api, test_case):
        resp = api.put(
            f"/testcases/{test_case['id']}", json={"status": "deprecated"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "deprecated"

    @pytest.mark.test_case("Update test case key")
    def test_update_key(self, api, test_case):
        resp = api.put(
            f"/testcases/{test_case['id']}", json={"key": "new_key"}
        )
        assert resp.status_code == 200
        assert resp.json()["key"] == "new_key"

    @pytest.mark.test_case("Update test case description")
    def test_update_description(self, api, test_case):
        resp = api.put(
            f"/testcases/{test_case['id']}", json={"description": "A description"}
        )
        assert resp.status_code == 200
        assert resp.json()["description"] == "A description"

    @pytest.mark.test_case("Delete test case")
    def test_delete_test_case(self, api, story):
        resp = api.post(
            "/testcases",
            json={"story_id": story["id"], "name": f"del_{uuid.uuid4().hex[:8]}"},
        )
        tcid = resp.json()["id"]
        resp = api.delete(f"/testcases/{tcid}")
        assert resp.status_code == 204


@pytest.mark.edge
@pytest.mark.feature("Test Cases")
@pytest.mark.story("Edge Cases")
class TestTestCaseEdgeCases:
    @pytest.mark.test_case("Create test case missing story_id returns 400")
    def test_create_missing_story_id(self, api):
        resp = api.post("/testcases", json={"name": "orphan"})
        assert resp.status_code == 400

    @pytest.mark.test_case("Create test case missing name returns 400")
    def test_create_missing_name(self, api, story):
        resp = api.post("/testcases", json={"story_id": story["id"]})
        assert resp.status_code == 400

    @pytest.mark.test_case("Get nonexistent test case returns 404")
    def test_not_found(self, api):
        resp = api.get("/testcases/999999")
        assert resp.status_code == 404
