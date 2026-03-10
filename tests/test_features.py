"""Feature CRUD and edge-case tests."""

import uuid

import pytest


@pytest.mark.crud
@pytest.mark.feature("Features")
@pytest.mark.story("CRUD")
class TestFeatureCRUD:
    @pytest.mark.test_case("Create feature")
    def test_create_feature(self, api, project):
        resp = api.post(
            "/features",
            json={"project_id": project["id"], "name": "Login Feature"},
        )
        assert resp.status_code == 201
        f = resp.json()
        assert f["name"] == "Login Feature"
        assert f["project_id"] == project["id"]

    @pytest.mark.test_case("List features by project")
    def test_list_features(self, api, project, feature):
        resp = api.get("/features", params={"project_id": project["id"]})
        assert resp.status_code == 200
        assert any(f["id"] == feature["id"] for f in resp.json())

    @pytest.mark.test_case("Get feature by ID")
    def test_get_feature(self, api, feature):
        resp = api.get(f"/features/{feature['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == feature["id"]

    @pytest.mark.test_case("Update feature name")
    def test_update_feature(self, api, feature):
        resp = api.put(
            f"/features/{feature['id']}", json={"name": "Updated Feature"}
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Feature"

    @pytest.mark.test_case("Delete feature")
    def test_delete_feature(self, api, project):
        resp = api.post(
            "/features",
            json={"project_id": project["id"], "name": f"Del {uuid.uuid4().hex[:8]}"},
        )
        fid = resp.json()["id"]
        resp = api.delete(f"/features/{fid}")
        assert resp.status_code == 204

    @pytest.mark.test_case("Sort order auto-increments")
    def test_sort_order_auto_increments(self, api, project):
        orders = []
        ids = []
        for i in range(3):
            resp = api.post(
                "/features",
                json={"project_id": project["id"], "name": f"Feat {i}"},
            )
            assert resp.status_code == 201
            f = resp.json()
            orders.append(f["sort_order"])
            ids.append(f["id"])
        # Each subsequent feature should have a higher sort_order
        assert orders[0] < orders[1] < orders[2]

    @pytest.mark.test_case("Update sort order")
    def test_update_sort_order(self, api, feature):
        resp = api.put(f"/features/{feature['id']}", json={"sort_order": 99})
        assert resp.status_code == 200
        assert resp.json()["sort_order"] == 99


@pytest.mark.edge
@pytest.mark.feature("Features")
@pytest.mark.story("Edge Cases")
class TestFeatureEdgeCases:
    @pytest.mark.test_case("List features missing project_id returns 400")
    def test_list_missing_project_id(self, api):
        resp = api.get("/features")
        assert resp.status_code == 400

    @pytest.mark.test_case("Create feature missing fields returns 400")
    def test_create_missing_fields(self, api):
        resp = api.post("/features", json={"project_id": 1})
        assert resp.status_code == 400

    @pytest.mark.test_case("Get nonexistent feature returns 404")
    def test_not_found(self, api):
        resp = api.get("/features/999999")
        assert resp.status_code == 404
