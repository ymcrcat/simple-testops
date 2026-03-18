import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PUT /api/results/:id
 * Body: { status: 'passed' | 'failed' | 'skipped' }
 * Updates the status of an existing test result.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const resultId = Number(params.id);
  const existing = db().prepare("SELECT * FROM test_results WHERE id = ?").get(resultId) as any;
  if (!existing) return NextResponse.json({ error: "Result not found" }, { status: 404 });

  const { status } = await req.json();
  if (!["passed", "failed", "skipped"].includes(status)) {
    return NextResponse.json({ error: "Valid status required (passed, failed, skipped)" }, { status: 400 });
  }

  db().prepare("UPDATE test_results SET status = ? WHERE id = ?").run(status, resultId);

  // Recalculate run totals
  const runId = existing.run_id;
  const counts = db().prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN status = 'failed' OR status = 'broken' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
    FROM test_results WHERE run_id = ?
  `).get(runId) as any;
  db().prepare(`
    UPDATE test_runs SET total = ?, passed = ?, failed = ?, skipped = ? WHERE id = ?
  `).run(counts.total, counts.passed, counts.failed, counts.skipped, runId);

  const updated = db().prepare("SELECT * FROM test_results WHERE id = ?").get(resultId);
  return NextResponse.json(updated);
}
