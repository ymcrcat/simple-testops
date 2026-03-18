import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireQueryParam, isResponse, createWithSortOrder, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((req: NextRequest) => {
  const projectId = requireQueryParam(req, "project_id");
  if (isResponse(projectId)) return projectId;
  const features = db()
    .prepare("SELECT * FROM features WHERE project_id = ? ORDER BY sort_order, id")
    .all(projectId);
  return NextResponse.json(features);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const { project_id, name, description } = await req.json();
  if (!project_id || !name) return NextResponse.json({ error: "project_id and name are required" }, { status: 400 });
  return createWithSortOrder("features", "project_id", project_id, {
    name,
    description: description || null,
  });
});
