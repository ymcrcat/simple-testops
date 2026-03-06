import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  const runs = db()
    .prepare("SELECT * FROM test_runs WHERE project_id = ? ORDER BY started_at DESC")
    .all(projectId);
  return NextResponse.json(runs);
}
