import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-helpers";
import { recalcRunTotals } from "@/lib/services/run-stats";
import type { TestResultRow } from "@/lib/types";

/**
 * PUT /api/results/:id
 * Body: { status: 'passed' | 'failed' | 'skipped' }
 * Updates the status of an existing test result.
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const resultId = Number(params.id);
  const existing = db().prepare("SELECT * FROM test_results WHERE id = ?").get(resultId) as TestResultRow | undefined;
  if (!existing) return NextResponse.json({ error: "Result not found" }, { status: 404 });

  const { status } = await req.json();
  if (!["passed", "failed", "skipped"].includes(status)) {
    return NextResponse.json({ error: "Valid status required (passed, failed, skipped)" }, { status: 400 });
  }

  db().prepare("UPDATE test_results SET status = ? WHERE id = ?").run(status, resultId);

  // Recalculate run totals
  recalcRunTotals(existing.run_id);

  const updated = db().prepare("SELECT * FROM test_results WHERE id = ?").get(resultId);
  return NextResponse.json(updated);
});
