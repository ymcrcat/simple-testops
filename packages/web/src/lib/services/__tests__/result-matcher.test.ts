import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { JUnitTestCase } from "../junit-parser";

const TEST_DB = path.join(__dirname, "test-matcher.db");

const SCHEMA = `
  CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, slug TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE features (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER REFERENCES projects(id), name TEXT, description TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE stories (id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER REFERENCES features(id), name TEXT, description TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE test_cases (id INTEGER PRIMARY KEY AUTOINCREMENT, story_id INTEGER REFERENCES stories(id), name TEXT, class_name TEXT, description TEXT, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
`;

function createTestDb() {
  try { fs.unlinkSync(TEST_DB); } catch {}
  const tdb = new Database(TEST_DB);
  tdb.pragma("foreign_keys = ON");
  tdb.exec(SCHEMA);
  return tdb;
}

function seedTestData(tdb: Database.Database) {
  const proj = tdb.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("Test", "test");
  const feat = tdb.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(proj.lastInsertRowid, "test_auth");
  const story = tdb.prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)").run(feat.lastInsertRowid, "TestLogin");
  tdb.prepare("INSERT INTO test_cases (story_id, name, class_name) VALUES (?, ?, ?)").run(story.lastInsertRowid, "test_login", "tests.test_auth.TestLogin");
  tdb.prepare("INSERT INTO test_cases (story_id, name, class_name) VALUES (?, ?, ?)").run(story.lastInsertRowid, "test_logout", "tests.test_auth.TestLogin");
  tdb.prepare("INSERT INTO test_cases (story_id, name, class_name, status) VALUES (?, ?, ?, ?)").run(story.lastInsertRowid, "test_old", "tests.test_auth.TestLogin", "deprecated");
  return Number(proj.lastInsertRowid);
}

function cleanup(tdb: Database.Database) {
  try { tdb.close(); } catch {}
  for (const suffix of ["", "-wal", "-shm"]) {
    try { fs.unlinkSync(TEST_DB + suffix); } catch {}
  }
}

// Mirror the actual result-matcher logic for testing
function parseClassname(classname: string): { featureName: string; storyName: string } {
  const parts = classname.split(".");
  if (parts.length >= 2) {
    return { featureName: parts[parts.length - 2], storyName: parts[parts.length - 1] };
  }
  return { featureName: classname || "Default", storyName: classname || "Default" };
}

function findOrCreateTestCase(tdb: Database.Database, projectId: number, tc: JUnitTestCase): number {
  // Try exact match first
  const exact = tdb
    .prepare(
      `SELECT tc.id FROM test_cases tc
       JOIN stories s ON tc.story_id = s.id
       JOIN features f ON s.feature_id = f.id
       WHERE f.project_id = ? AND tc.class_name = ? AND tc.name = ? AND tc.status = 'active'`
    )
    .get(projectId, tc.classname, tc.name) as { id: number } | undefined;
  if (exact) return exact.id;

  // Auto-create
  const { featureName, storyName } = parseClassname(tc.classname);

  let featureId: number;
  const existingFeature = tdb.prepare("SELECT id FROM features WHERE project_id = ? AND name = ?").get(projectId, featureName) as { id: number } | undefined;
  if (existingFeature) { featureId = existingFeature.id; }
  else { featureId = Number(tdb.prepare("INSERT INTO features (project_id, name) VALUES (?, ?)").run(projectId, featureName).lastInsertRowid); }

  let storyId: number;
  const existingStory = tdb.prepare("SELECT id FROM stories WHERE feature_id = ? AND name = ?").get(featureId, storyName) as { id: number } | undefined;
  if (existingStory) { storyId = existingStory.id; }
  else { storyId = Number(tdb.prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)").run(featureId, storyName).lastInsertRowid); }

  const existingCase = tdb.prepare("SELECT id FROM test_cases WHERE story_id = ? AND name = ? AND class_name = ? AND status = 'active'").get(storyId, tc.name, tc.classname) as { id: number } | undefined;
  if (existingCase) return existingCase.id;

  return Number(tdb.prepare("INSERT INTO test_cases (story_id, name, class_name) VALUES (?, ?, ?)").run(storyId, tc.name, tc.classname).lastInsertRowid);
}

describe("findOrCreateTestCase", () => {
  let tdb: Database.Database;
  let projectId: number;

  beforeEach(() => {
    tdb = createTestDb();
    projectId = seedTestData(tdb);
  });
  afterEach(() => cleanup(tdb));

  it("matches existing test case by exact class_name + name", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_login", classname: "tests.test_auth.TestLogin", time: 0.1, status: "passed",
    });
    expect(id).toBe(1);
  });

  it("auto-creates test case for new test in existing feature/story", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_new_case", classname: "tests.test_auth.TestLogin", time: 0.1, status: "passed",
    });
    // Should create a new test case (id > 3 since 3 already exist)
    expect(id).toBeGreaterThan(3);

    // Verify it was created under the existing feature/story
    const tc = tdb.prepare("SELECT * FROM test_cases WHERE id = ?").get(id) as any;
    expect(tc.name).toBe("test_new_case");
    expect(tc.class_name).toBe("tests.test_auth.TestLogin");
    expect(tc.story_id).toBe(1); // existing story
  });

  it("auto-creates feature and story for entirely new classname", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_payment", classname: "tests.test_billing.TestPayment", time: 0.2, status: "passed",
    });
    expect(id).toBeGreaterThan(0);

    // Verify new feature was created
    const feature = tdb.prepare("SELECT * FROM features WHERE name = 'test_billing' AND project_id = ?").get(projectId) as any;
    expect(feature).toBeTruthy();

    // Verify new story was created
    const story = tdb.prepare("SELECT * FROM stories WHERE name = 'TestPayment' AND feature_id = ?").get(feature.id) as any;
    expect(story).toBeTruthy();

    // Verify test case linked correctly
    const tc = tdb.prepare("SELECT * FROM test_cases WHERE id = ?").get(id) as any;
    expect(tc.story_id).toBe(story.id);
  });

  it("reuses existing feature when creating new story", () => {
    findOrCreateTestCase(tdb, projectId, {
      name: "test_something", classname: "tests.test_auth.TestRegistration", time: 0.1, status: "passed",
    });

    // Should reuse existing test_auth feature, but create new TestRegistration story
    const features = tdb.prepare("SELECT * FROM features WHERE project_id = ? AND name = 'test_auth'").all(projectId);
    expect(features).toHaveLength(1); // not duplicated

    const story = tdb.prepare("SELECT * FROM stories WHERE name = 'TestRegistration'").get() as any;
    expect(story).toBeTruthy();
  });

  it("is idempotent - calling twice returns same id", () => {
    const tc: JUnitTestCase = { name: "test_idempotent", classname: "tests.test_new.TestNew", time: 0.1, status: "passed" };
    const id1 = findOrCreateTestCase(tdb, projectId, tc);
    const id2 = findOrCreateTestCase(tdb, projectId, tc);
    expect(id1).toBe(id2);
  });

  it("skips deprecated test cases and creates new one", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_old", classname: "tests.test_auth.TestLogin", time: 0.1, status: "passed",
    });
    // Should NOT match the deprecated test_old (id=3), should create a new one
    expect(id).not.toBe(3);
    expect(id).toBeGreaterThan(3);
  });

  it("handles single-segment classname", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_simple", classname: "SimpleTest", time: 0.1, status: "passed",
    });
    expect(id).toBeGreaterThan(0);

    const feature = tdb.prepare("SELECT * FROM features WHERE name = 'SimpleTest' AND project_id = ?").get(projectId) as any;
    expect(feature).toBeTruthy();
  });

  it("handles empty classname", () => {
    const id = findOrCreateTestCase(tdb, projectId, {
      name: "test_no_class", classname: "", time: 0.1, status: "passed",
    });
    expect(id).toBeGreaterThan(0);

    const feature = tdb.prepare("SELECT * FROM features WHERE name = 'Default' AND project_id = ?").get(projectId) as any;
    expect(feature).toBeTruthy();
  });
});
