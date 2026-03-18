import type { TestResult } from "./types";

/**
 * Synthesizes not_run status for test cases with no result in coverage data.
 */
export function synthesizeNotRunResults(rows: TestResult[]): TestResult[] {
  return rows.map((r) =>
    r.id == null
      ? {
          ...r,
          id: -(r.test_case_id ?? 0),
          name: r.case_name ?? "",
          class_name: r.case_class_name ?? "",
          status: "not_run",
          duration_ms: 0,
          error_message: null,
        }
      : r
  );
}
