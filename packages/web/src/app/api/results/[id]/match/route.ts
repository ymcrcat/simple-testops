import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-helpers";

/**
 * PUT /api/results/:id/match
 * Body: { key: string }
 * Sets or clears the test_case_id on a test result by matching the key
 * to an existing test case in the same project.
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { key } = await req.json() as { key: string };
  const resultId = Number(params.id);

  // Get the result and its run's project_id
  const result = db().prepare(`
    SELECT tr.id, tr.run_id, r.project_id
    FROM test_results tr
    JOIN test_runs r ON tr.run_id = r.id
    WHERE tr.id = ?
  `).get(resultId) as { id: number; run_id: number; project_id: number } | undefined;

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  if (!key || !key.trim()) {
    // Clear the link
    db().prepare("UPDATE test_results SET test_case_id = NULL WHERE id = ?").run(resultId);
    return NextResponse.json({ matched: false, test_case_id: null });
  }

  // Find a test case with this key in the project
  const tc = db().prepare(`
    SELECT tc.id FROM test_cases tc
    JOIN stories s ON tc.story_id = s.id
    JOIN features f ON s.feature_id = f.id
    WHERE f.project_id = ? AND tc.key = ? AND tc.status = 'active'
  `).get(result.project_id, key.trim()) as { id: number } | undefined;

  if (tc) {
    db().prepare("UPDATE test_results SET test_case_id = ? WHERE id = ?").run(tc.id, resultId);
    return NextResponse.json({ matched: true, test_case_id: tc.id });
  }

  // No match -- unlink
  db().prepare("UPDATE test_results SET test_case_id = NULL WHERE id = ?").run(resultId);
  return NextResponse.json({ matched: false, test_case_id: null });
});
