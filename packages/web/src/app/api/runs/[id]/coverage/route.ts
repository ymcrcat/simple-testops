import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const run = db().prepare("SELECT * FROM test_runs WHERE id = ?").get(params.id) as { project_id: number } | undefined;
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  // All active test cases for the project, LEFT JOINed with results from this run
  const specResults = db().prepare(`
    SELECT tc.id as test_case_id, tc.name as case_name, tc.class_name as case_class_name, tc.key,
      s.name as story_name, s.priority as story_priority,
      f.name as feature_name,
      tr.id as id, tr.status, tr.duration_ms, tr.error_message, tr.name as name, tr.class_name as class_name
    FROM test_cases tc
    JOIN stories s ON tc.story_id = s.id
    JOIN features f ON s.feature_id = f.id
    LEFT JOIN test_results tr ON tr.test_case_id = tc.id AND tr.run_id = ?
    WHERE f.project_id = ? AND tc.status = 'active'
    ORDER BY f.sort_order, f.id, s.sort_order, s.id, tc.sort_order, tc.id
  `).all(params.id, run.project_id);

  // Also include unmatched results (test_case_id IS NULL) from this run
  const unmatchedResults = db().prepare(`
    SELECT tr.*, tc.name as case_name, tc.class_name as case_class_name,
      s.name as story_name, s.priority as story_priority, f.name as feature_name
    FROM test_results tr
    LEFT JOIN test_cases tc ON tr.test_case_id = tc.id
    LEFT JOIN stories s ON tc.story_id = s.id
    LEFT JOIN features f ON s.feature_id = f.id
    WHERE tr.run_id = ? AND tr.test_case_id IS NULL
    ORDER BY tr.id
  `).all(params.id);

  return NextResponse.json([...specResults, ...unmatchedResults]);
}
