# Simple TestOps

Test management service: organize test cases by features/stories, upload JUnit XML results, browse via web UI.

## Tech Stack

- **Monorepo**: npm workspaces — `packages/web` and `packages/cli`
- **Web + API**: Next.js 14 (App Router), React 18, SQLite (better-sqlite3, WAL mode)
- **CLI**: Commander.js, fast-xml-parser
- **Testing**: Vitest
- **No auth** — login/API keys were removed

## Commands

```bash
npm install          # install all deps
npm run dev          # start web on port 3001
npm run build        # build all packages
npm run test         # run tests in all packages
cd packages/web && npm run seed  # seed demo data
```

## Project Structure

```
packages/web/src/
  app/api/           # API routes (features, stories, testcases, runs, projects, health)
  app/projects/[id]/ # Project pages (overview, features, cases, runs)
  components/        # Sidebar, TestCaseTree, RunSummary, StatusBadge
  lib/db/            # SQLite connection, schema, migrations
  lib/services/      # junit-parser, result-matcher
  lib/api.ts         # Client-side fetch wrapper

packages/cli/src/
  index.ts           # CLI entry point
  commands/upload.ts # Upload JUnit XML command
```

## Key Files

- **Schema & migrations**: `packages/web/src/lib/db/schema.ts`
- **Result matcher**: `packages/web/src/lib/services/result-matcher.ts` (3-tier: key → class_name+name → auto-create)
- **Tree component**: `packages/web/src/components/TestCaseTree.tsx`
- **Sidebar + API Skill**: `packages/web/src/components/Sidebar.tsx`

## Database

SQLite in `packages/web/data/testops.db`. Tables: projects, features, stories, test_cases, test_runs, test_results. Foreign keys enabled, cascade deletes with nullification of test_results references before deleting specs.

## API Endpoints

All under `/api`. Hierarchy: projects → features → stories → test_cases. Runs are per-project with test_results linked to test_cases.

- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id`
- `GET/POST /api/features`, `GET/PUT/DELETE /api/features/:id`
- `GET/POST /api/stories`, `GET/PUT/DELETE /api/stories/:id`
- `GET/POST /api/testcases`, `GET/PUT/DELETE /api/testcases/:id`, `GET /api/testcases/:id/history`
- `GET /api/runs`, `GET/PUT/DELETE /api/runs/:id`, `GET /api/runs/:id/results`, `GET /api/runs/:id/coverage`
- `POST /api/runs/upload` — accepts JUnit XML, auto-matches to test cases

## Conventions

- No UI framework — custom CSS with CSS variables for theming
- Path alias: `@/*` → `./src/*` in the web package
- API routes return 204 for deletes, 201 for creates
- List endpoints filter by parent ID via query params (project_id, feature_id, story_id)

## Deployment

Deployed to GCE VM. See memory file `deployment.md` for details.

## Git

- Remote: `ymcrcat/simple-testops` on GitHub, branch: `main`
