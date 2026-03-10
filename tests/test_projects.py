"""Project CRUD and edge-case tests."""

import uuid

import pytest


@pytest.mark.crud
@pytest.mark.feature("Projects")
@pytest.mark.story("CRUD")
class TestProjectCRUD:
    @pytest.mark.test_case("Create project with auto-generated slug")
    def test_create_project_auto_slug(self, api, project):
        assert project["id"] is not None
        assert project["name"].startswith("Test Project")
        assert project["slug"]  # auto-generated

    @pytest.mark.test_case("Create project with custom slug")
    def test_create_project_custom_slug(self, api):
        slug = f"custom-{uuid.uuid4().hex[:8]}"
        resp = api.post("/projects", json={"name": "Custom Slug", "slug": slug})
        assert resp.status_code == 201
        p = resp.json()
        assert p["slug"] == slug
        api.delete(f"/projects/{p['id']}")

    @pytest.mark.test_case("List projects")
    def test_list_projects(self, api, project):
        resp = api.get("/projects")
        assert resp.status_code == 200
        projects = resp.json()
        assert any(p["id"] == project["id"] for p in projects)

    @pytest.mark.test_case("List projects includes stats")
    def test_list_projects_has_stats(self, api, project):
        resp = api.get("/projects")
        p = next(x for x in resp.json() if x["id"] == project["id"])
        assert "run_count" in p

    @pytest.mark.test_case("Get project by ID")
    def test_get_project_by_id(self, api, project):
        resp = api.get(f"/projects/{project['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == project["id"]

    @pytest.mark.test_case("Get project by slug")
    def test_get_project_by_slug(self, api, project):
        resp = api.get(f"/projects/{project['slug']}")
        assert resp.status_code == 200
        assert resp.json()["slug"] == project["slug"]

    @pytest.mark.test_case("Update project name")
    def test_update_project(self, api, project):
        resp = api.put(f"/projects/{project['id']}", json={"name": "Updated Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    @pytest.mark.test_case("Delete project")
    def test_delete_project(self, api):
        resp = api.post("/projects", json={"name": f"ToDelete {uuid.uuid4().hex[:8]}"})
        pid = resp.json()["id"]
        resp = api.delete(f"/projects/{pid}")
        assert resp.status_code == 204

    @pytest.mark.test_case("Stats are zero without runs")
    def test_stats_zero_without_runs(self, api, project):
        resp = api.get("/projects")
        p = next(x for x in resp.json() if x["id"] == project["id"])
        assert p["run_count"] == 0

    @pytest.mark.test_case("Stats update after upload")
    def test_stats_after_upload(self, api, project, uploaded_run):
        resp = api.get("/projects")
        p = next(x for x in resp.json() if x["id"] == project["id"])
        assert p["run_count"] >= 1


@pytest.mark.edge
@pytest.mark.feature("Projects")
@pytest.mark.story("Edge Cases")
class TestProjectEdgeCases:
    @pytest.mark.test_case("Create project missing name returns 400")
    def test_create_missing_name(self, api):
        resp = api.post("/projects", json={})
        assert resp.status_code == 400

    @pytest.mark.test_case("Duplicate slug returns 409")
    def test_duplicate_slug(self, api, project):
        resp = api.post(
            "/projects", json={"name": "Dup", "slug": project["slug"]}
        )
        assert resp.status_code == 409

    @pytest.mark.test_case("Get nonexistent project returns 404")
    def test_not_found(self, api):
        resp = api.get("/projects/999999")
        assert resp.status_code == 404
