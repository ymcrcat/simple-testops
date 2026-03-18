// Shared type definitions for the web package

// --- Database row types (used in API routes) ---

export interface ProjectRow {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface FeatureRow {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface StoryRow {
  id: number;
  feature_id: number;
  name: string;
  description: string | null;
  priority: string | null;
  sort_order: number;
  created_at: string;
}

export interface TestCaseRow {
  id: number;
  story_id: number;
  name: string;
  class_name: string | null;
  key: string | null;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface RunRow {
  id: number;
  project_id: number;
  name: string;
  started_at: string;
  finished_at: string | null;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestResultRow {
  id: number;
  run_id: number;
  test_case_id: number | null;
  name: string;
  class_name: string | null;
  status: string;
  duration_ms: number;
  error_message: string | null;
  created_at: string;
}

// --- Client-side types (used in page components) ---

export interface Project {
  id: number;
  name: string;
  slug: string;
  run_count?: number;
  last_passed?: number | null;
  last_failed?: number | null;
  last_total?: number | null;
}

export interface Run {
  id: number;
  name: string;
  started_at: string;
  finished_at?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  not_run?: number;
}

export interface TestResult {
  id: number;
  name: string;
  class_name: string;
  status: string;
  duration_ms: number;
  error_message: string | null;
  case_name: string | null;
  case_class_name: string | null;
  test_case_id: number | null;
  key: string | null;
  feature_name: string | null;
  story_name: string | null;
  story_priority: string | null;
}

export interface TestCaseDetail {
  id: number;
  name: string;
  class_name: string | null;
  description: string | null;
  status: string;
  key?: string | null;
}
