import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const results = db()
    .prepare(
      `SELECT tr.*, r.name as run_name, r.started_at as run_started_at
       FROM test_results tr
       JOIN test_runs r ON tr.run_id = r.id
       WHERE tr.test_case_id = ?
       ORDER BY r.started_at DESC
       LIMIT 50`
    )
    .all(params.id);
  return NextResponse.json(results);
}
