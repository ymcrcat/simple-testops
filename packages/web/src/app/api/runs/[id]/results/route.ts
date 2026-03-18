import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-helpers";
import { recalcRunTotals } from "@/lib/services/run-stats";
import type { RunRow, TestCaseRow } from "@/lib/types";

/**
 * POST /api/runs/:id/results
 * Body: { test_case_id: number, status: 'passed' | 'failed' | 'skipped' }
 * Manually records a result for a test case in this run.
 */
export const POST = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const run = db().prepare("SELECT * FROM test_runs WHERE id = ?").get(params.id) as RunRow | undefined;
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const { test_case_id, status } = await req.json();
  if (!test_case_id || !["passed", "failed", "skipped"].includes(status)) {
    return NextResponse.json({ error: "test_case_id and valid status required" }, { status: 400 });
  }

  // Verify the test case exists and belongs to this project
  const tc = db().prepare(`
    SELECT tc.id, tc.name, tc.class_name, tc.key FROM test_cases tc
    JOIN stories s ON tc.story_id = s.id
    JOIN features f ON s.feature_id = f.id
    WHERE tc.id = ? AND f.project_id = ? AND tc.status = 'active'
  `).get(test_case_id, run.project_id) as Pick<TestCaseRow, "id" | "name" | "class_name" | "key"> | undefined;
  if (!tc) return NextResponse.json({ error: "Test case not found in this project" }, { status: 404 });

  // Check if a result already exists for this test case in this run
  const existing = db().prepare(
    "SELECT id FROM test_results WHERE run_id = ? AND test_case_id = ?"
  ).get(params.id, test_case_id) as { id: number } | undefined;
  if (existing) {
    return NextResponse.json({ error: "Result already exists for this test case in this run" }, { status: 409 });
  }

  // Insert the manual result
  const result = db().prepare(`
    INSERT INTO test_results (run_id, test_case_id, name, class_name, status, duration_ms)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(params.id, test_case_id, tc.name, tc.class_name || "", status);

  // Recalculate run totals
  recalcRunTotals(Number(params.id));

  const created = db().prepare("SELECT * FROM test_results WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(created, { status: 201 });
});

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const status = req.nextUrl.searchParams.get("status");
  let query = `SELECT tr.*, tc.name as case_name, tc.class_name as case_class_name,
    s.name as story_name, s.priority as story_priority, f.name as feature_name
    FROM test_results tr
    LEFT JOIN test_cases tc ON tr.test_case_id = tc.id
    LEFT JOIN stories s ON tc.story_id = s.id
    LEFT JOIN features f ON s.feature_id = f.id
    WHERE tr.run_id = ?`;
  const queryParams: (string | number)[] = [params.id];
  if (status) {
    query += " AND tr.status = ?";
    queryParams.push(status);
  }
  query += " ORDER BY f.sort_order, f.id, s.sort_order, s.id, tc.sort_order, tc.id";
  const results = db().prepare(query).all(...queryParams);
  return NextResponse.json(results);
}
