import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const TEST_DB = path.join(__dirname, "test-schema.db");

function createTestDb() {
  try { fs.unlinkSync(TEST_DB); } catch {}
  const db = new Database(TEST_DB);
  db.pragma("foreign_keys = ON");

  // Inline the schema here so we test the actual SQL
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
  `);
  return db;
}

function cleanup(db: Database.Database) {
  try { db.close(); } catch {}
  for (const suffix of ["", "-wal", "-shm"]) {
    try { fs.unlinkSync(TEST_DB + suffix); } catch {}
  }
}

describe("database schema", () => {
  let db: Database.Database;

  beforeEach(() => { db = createTestDb(); });
  afterEach(() => { cleanup(db); });

  it("creates all expected tables", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[];

    const names = tables.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining([
      "features", "projects", "stories", "test_cases", "test_results", "test_runs",
    ]));
  });

  it("enforces project slug uniqueness", () => {
    db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("A", "same");
    expect(() => {
      db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("B", "same");
    }).toThrow(/UNIQUE/);
  });

  it("cascades delete from project to features", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    db.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(proj.lastInsertRowid, "F");

    expect((db.prepare("SELECT COUNT(*) as c FROM features").get() as any).c).toBe(1);
    db.prepare("DELETE FROM projects WHERE id = ?").run(proj.lastInsertRowid);
    expect((db.prepare("SELECT COUNT(*) as c FROM features").get() as any).c).toBe(0);
  });

  it("cascades delete through features -> stories -> test_cases", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const feat = db.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(proj.lastInsertRowid, "F");
    const story = db.prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)").run(feat.lastInsertRowid, "S");
    db.prepare("INSERT INTO test_cases (story_id, name) VALUES (?, ?)").run(story.lastInsertRowid, "TC");

    db.prepare("DELETE FROM projects WHERE id = ?").run(proj.lastInsertRowid);

    expect((db.prepare("SELECT COUNT(*) as c FROM stories").get() as any).c).toBe(0);
    expect((db.prepare("SELECT COUNT(*) as c FROM test_cases").get() as any).c).toBe(0);
  });

  it("cascades delete from test_runs to test_results", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const run = db.prepare("INSERT INTO test_runs (project_id) VALUES (?)").run(proj.lastInsertRowid);
    db.prepare("INSERT INTO test_results (run_id, name, status) VALUES (?, ?, ?)").run(run.lastInsertRowid, "t", "passed");

    db.prepare("DELETE FROM test_runs WHERE id = ?").run(run.lastInsertRowid);
    expect((db.prepare("SELECT COUNT(*) as c FROM test_results").get() as any).c).toBe(0);
  });

  it("enforces test_case status check constraint", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const feat = db.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(proj.lastInsertRowid, "F");
    const story = db.prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)").run(feat.lastInsertRowid, "S");

    expect(() => {
      db.prepare("INSERT INTO test_cases (story_id, name, status) VALUES (?, ?, ?)").run(
        story.lastInsertRowid, "TC", "invalid"
      );
    }).toThrow();
  });

  it("enforces test_result status check constraint", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const run = db.prepare("INSERT INTO test_runs (project_id) VALUES (?)").run(proj.lastInsertRowid);

    expect(() => {
      db.prepare("INSERT INTO test_results (run_id, name, status) VALUES (?, ?, ?)").run(
        run.lastInsertRowid, "t", "invalid"
      );
    }).toThrow();
  });

  it("allows all valid test_result statuses", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const run = db.prepare("INSERT INTO test_runs (project_id) VALUES (?)").run(proj.lastInsertRowid);

    for (const status of ["passed", "failed", "skipped", "broken"]) {
      expect(() => {
        db.prepare("INSERT INTO test_results (run_id, name, status) VALUES (?, ?, ?)").run(
          run.lastInsertRowid, `test_${status}`, status
        );
      }).not.toThrow();
    }
  });

  it("defaults test_case status to active", () => {
    const proj = db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const feat = db.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(proj.lastInsertRowid, "F");
    const story = db.prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)").run(feat.lastInsertRowid, "S");
    db.prepare("INSERT INTO test_cases (story_id, name) VALUES (?, ?)").run(story.lastInsertRowid, "TC");

    const tc = db.prepare("SELECT status FROM test_cases WHERE name = 'TC'").get() as any;
    expect(tc.status).toBe("active");
  });

  it("auto-generates created_at timestamps", () => {
    db.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("P", "p");
    const proj = db.prepare("SELECT created_at FROM projects WHERE slug = 'p'").get() as any;
    expect(proj.created_at).toBeTruthy();
    expect(proj.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
