import { getDb } from "../db/connection";
import { JUnitTestCase } from "./junit-parser";

function getOrCreateFeature(projectId: number, name: string): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM features WHERE project_id = ? AND name = ?")
    .get(projectId, name) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare("INSERT INTO features (project_id, name) VALUES (?, ?)")
    .run(projectId, name);
  return Number(result.lastInsertRowid);
}

function getOrCreateStory(featureId: number, name: string): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM stories WHERE feature_id = ? AND name = ?")
    .get(featureId, name) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare("INSERT INTO stories (feature_id, name) VALUES (?, ?)")
    .run(featureId, name);
  return Number(result.lastInsertRowid);
}

function getOrCreateTestCase(storyId: number, name: string, className: string, key: string): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM test_cases WHERE story_id = ? AND name = ? AND class_name = ? AND status = 'active'")
    .get(storyId, name, className) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db
    .prepare("INSERT INTO test_cases (story_id, name, class_name, key) VALUES (?, ?, ?, ?)")
    .run(storyId, name, className, key);
  return Number(result.lastInsertRowid);
}

/**
 * Parse a JUnit classname like "tests.test_auth.TestLogin" into feature + story names.
 * Strategy: last segment = story (class name), second-to-last = feature (module name).
 * If only one segment, use it as both.
 */
function parseClassname(classname: string): { featureName: string; storyName: string } {
  const parts = classname.split(".");
  if (parts.length >= 2) {
    return {
      featureName: parts[parts.length - 2],
      storyName: parts[parts.length - 1],
    };
  }
  return {
    featureName: classname || "Default",
    storyName: classname || "Default",
  };
}

export function matchTestCase(
  projectId: number,
  tc: JUnitTestCase
): number {
  const db = getDb();

  // 1. Try match by key (pytest function name)
  const byKey = db
    .prepare(
      `SELECT tc.id FROM test_cases tc
       JOIN stories s ON tc.story_id = s.id
       JOIN features f ON s.feature_id = f.id
       WHERE f.project_id = ? AND tc.key = ? AND tc.status = 'active'`
    )
    .get(projectId, tc.key) as { id: number } | undefined;

  if (byKey) return byKey.id;

  // 2. Try exact match on class_name + key (function name)
  //    For predefined test cases with null class_name, derive it as "Feature.Story"
  const exact = db
    .prepare(
      `SELECT tc.id FROM test_cases tc
       JOIN stories s ON tc.story_id = s.id
       JOIN features f ON s.feature_id = f.id
       WHERE f.project_id = ? AND COALESCE(tc.class_name, f.name || '.' || s.name) = ? AND COALESCE(tc.key, tc.name) = ? AND tc.status = 'active'`
    )
    .get(projectId, tc.classname, tc.key) as { id: number } | undefined;

  if (exact) return exact.id;

  // 3. Fall back to auto-create from classname parsing or properties
  const { featureName, storyName } = tc.feature && tc.story
    ? { featureName: tc.feature, storyName: tc.story }
    : parseClassname(tc.classname);
  const featureId = getOrCreateFeature(projectId, featureName);
  const storyId = getOrCreateStory(featureId, storyName);
  return getOrCreateTestCase(storyId, tc.name, tc.classname, tc.key);
}
