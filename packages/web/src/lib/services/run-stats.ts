import { db } from "@/lib/db";

/**
 * Recalculates the total/passed/failed/skipped counts on a test_run
 * from its test_results.
 */
export function recalcRunTotals(runId: number): void {
  const counts = db().prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN status = 'failed' OR status = 'broken' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
    FROM test_results WHERE run_id = ?
  `).get(runId) as { total: number; passed: number; failed: number; skipped: number };
  db().prepare(`
    UPDATE test_runs SET total = ?, passed = ?, failed = ?, skipped = ? WHERE id = ?
  `).run(counts.total, counts.passed, counts.failed, counts.skipped, runId);
}
