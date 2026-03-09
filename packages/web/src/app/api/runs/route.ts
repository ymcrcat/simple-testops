import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  const runs = db()
    .prepare(`SELECT tr.*,
      (SELECT COUNT(*) FROM test_cases tc
       JOIN stories s ON tc.story_id = s.id
       JOIN features f ON s.feature_id = f.id
       WHERE f.project_id = tr.project_id AND tc.status = 'active'
         AND tc.id NOT IN (SELECT test_case_id FROM test_results WHERE run_id = tr.id AND test_case_id IS NOT NULL)
      ) as not_run
      FROM test_runs tr WHERE tr.project_id = ? ORDER BY tr.started_at DESC`)
    .all(projectId);
  return NextResponse.json(runs);
}
