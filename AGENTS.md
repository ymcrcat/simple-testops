# Agent Instructions

## Context

This is a monorepo with two packages: `packages/web` (Next.js 14 + SQLite) and `packages/cli` (Commander.js CLI).

The web package serves both the UI and REST API. No authentication. SQLite database in WAL mode at `packages/web/data/testops.db`.

## API Reference

All endpoints are under `/api`. Content-Type: application/json.

### Projects
- `GET /api/projects` — list all (includes run_count, last_passed/failed/total)
- `POST /api/projects` — create: `{ "name", "slug?" }`
- `GET /api/projects/:id` — get by ID or slug
- `PUT /api/projects/:id` — update: `{ "name" }`
- `DELETE /api/projects/:id` — 204

### Features
- `GET /api/features?project_id=X` — list for project
- `POST /api/features` — create: `{ "project_id", "name", "description?" }`
- `GET /api/features/:id`
- `PUT /api/features/:id` — update: `{ "name?", "description?", "sort_order?" }`
- `DELETE /api/features/:id` — 204

### Stories
- `GET /api/stories?feature_id=X` — list for feature
- `POST /api/stories` — create: `{ "feature_id", "name", "description?" }`
- `GET /api/stories/:id`
- `PUT /api/stories/:id` — update: `{ "name?", "description?", "priority?", "sort_order?" }`
- `DELETE /api/stories/:id` — 204

### Test Cases
- `GET /api/testcases?project_id=X` — list for project (includes story_name, feature_name)
- `GET /api/testcases?story_id=X` — list for story
- `POST /api/testcases` — create: `{ "story_id", "name", "class_name?", "key?", "description?" }` (key defaults to name)
- `GET /api/testcases/:id`
- `PUT /api/testcases/:id` — update: `{ "name?", "class_name?", "key?", "description?", "status?", "sort_order?" }`
- `DELETE /api/testcases/:id` — 204
- `GET /api/testcases/:id/history` — last 50 results with run info

### Runs
- `GET /api/runs?project_id=X` — list for project
- `GET /api/runs/:id`
- `PUT /api/runs/:id` — update: `{ "name" }`
- `DELETE /api/runs/:id` — 204
- `GET /api/runs/:id/results` — all results (optional `?status=failed` filter)
- `GET /api/runs/:id/coverage` — full test spec merged with run results
- `POST /api/runs/upload` — `{ "project_id", "xml", "name?" }` — project_id can be ID or slug

### Health
- `GET /api/health` — returns `{ "status": "ok" }`

## Data Hierarchy

projects → features → stories → test_cases (spec)
projects → test_runs → test_results (execution)

test_results link to test_cases via result-matcher (3-tier: key → class_name+name → auto-create).

## Key Patterns

- API routes are in `packages/web/src/app/api/[resource]/route.ts` and `[id]/route.ts`
- Components in `packages/web/src/components/`
- DB schema and migrations in `packages/web/src/lib/db/schema.ts`
- Client-side API wrapper in `packages/web/src/lib/api.ts`
- Tests use Vitest, co-located in `__tests__/` dirs
