import { getDb } from "./connection";

let migrated = false;

export function ensureMigrated() {
  if (migrated) return;
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      class_name TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deprecated')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      total INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
      test_case_id INTEGER REFERENCES test_cases(id),
      name TEXT NOT NULL,
      class_name TEXT,
      status TEXT NOT NULL CHECK(status IN ('passed', 'failed', 'skipped', 'broken')),
      duration_ms REAL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add sort_order to features and stories
  const featureCols = db.prepare("PRAGMA table_info(features)").all() as { name: string }[];
  if (!featureCols.some((c) => c.name === "sort_order")) {
    db.exec("ALTER TABLE features ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
    db.exec("UPDATE features SET sort_order = id");
  }
  const storyCols = db.prepare("PRAGMA table_info(stories)").all() as { name: string }[];
  if (!storyCols.some((c) => c.name === "sort_order")) {
    db.exec("ALTER TABLE stories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
    db.exec("UPDATE stories SET sort_order = id");
  }
  const caseCols = db.prepare("PRAGMA table_info(test_cases)").all() as { name: string }[];
  if (!caseCols.some((c) => c.name === "sort_order")) {
    db.exec("ALTER TABLE test_cases ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
    db.exec("UPDATE test_cases SET sort_order = id");
  }

  migrated = true;
}
