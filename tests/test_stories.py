"""Story CRUD and edge-case tests."""

import uuid

import pytest


@pytest.mark.crud
@pytest.mark.feature("Stories")
@pytest.mark.story("CRUD")
class TestStoryCRUD:
    @pytest.mark.test_case("Create story")
    def test_create_story(self, api, feature):
        resp = api.post(
            "/stories",
            json={"feature_id": feature["id"], "name": "Login Story"},
        )
        assert resp.status_code == 201
        s = resp.json()
        assert s["name"] == "Login Story"
        assert s["feature_id"] == feature["id"]

    @pytest.mark.test_case("List stories by feature")
    def test_list_stories(self, api, feature, story):
        resp = api.get("/stories", params={"feature_id": feature["id"]})
        assert resp.status_code == 200
        assert any(s["id"] == story["id"] for s in resp.json())

    @pytest.mark.test_case("Get story by ID")
    def test_get_story(self, api, story):
        resp = api.get(f"/stories/{story['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == story["id"]

    @pytest.mark.test_case("Update story name")
    def test_update_story(self, api, story):
        resp = api.put(f"/stories/{story['id']}", json={"name": "Updated Story"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Story"

    @pytest.mark.test_case("Update story priority")
    def test_update_priority(self, api, story):
        resp = api.put(f"/stories/{story['id']}", json={"priority": "high"})
        assert resp.status_code == 200
        assert resp.json()["priority"] == "high"

    @pytest.mark.test_case("Delete story")
    def test_delete_story(self, api, feature):
        resp = api.post(
            "/stories",
            json={"feature_id": feature["id"], "name": f"Del {uuid.uuid4().hex[:8]}"},
        )
        sid = resp.json()["id"]
        resp = api.delete(f"/stories/{sid}")
        assert resp.status_code == 204

    @pytest.mark.test_case("Sort order auto-increments")
    def test_sort_order_auto_increments(self, api, feature):
        orders = []
        for i in range(3):
            resp = api.post(
                "/stories",
                json={"feature_id": feature["id"], "name": f"Story {i}"},
            )
            assert resp.status_code == 201
            orders.append(resp.json()["sort_order"])
        assert orders[0] < orders[1] < orders[2]


@pytest.mark.edge
@pytest.mark.feature("Stories")
@pytest.mark.story("Edge Cases")
class TestStoryEdgeCases:
    @pytest.mark.test_case("List stories missing feature_id returns 400")
    def test_list_missing_feature_id(self, api):
        resp = api.get("/stories")
        assert resp.status_code == 400

    @pytest.mark.test_case("Create story missing fields returns 400")
    def test_create_missing_fields(self, api):
        resp = api.post("/stories", json={"feature_id": 1})
        assert resp.status_code == 400

    @pytest.mark.test_case("Get nonexistent story returns 404")
    def test_not_found(self, api):
        resp = api.get("/stories/999999")
        assert resp.status_code == 404
