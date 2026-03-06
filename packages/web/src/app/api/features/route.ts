import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  const features = db()
    .prepare("SELECT * FROM features WHERE project_id = ? ORDER BY sort_order, id")
    .all(projectId);
  return NextResponse.json(features);
}

export async function POST(req: NextRequest) {
  const { project_id, name, description } = await req.json();
  if (!project_id || !name) return NextResponse.json({ error: "project_id and name are required" }, { status: 400 });
  const maxOrder = db()
    .prepare("SELECT COALESCE(MAX(sort_order), 0) as max_order FROM features WHERE project_id = ?")
    .get(project_id) as { max_order: number };
  const result = db()
    .prepare("INSERT INTO features (project_id, name, description, sort_order) VALUES (?, ?, ?, ?)")
    .run(project_id, name, description || null, maxOrder.max_order + 1);
  const feature = db().prepare("SELECT * FROM features WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(feature, { status: 201 });
}
