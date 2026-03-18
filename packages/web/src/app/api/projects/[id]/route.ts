import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOr404, isResponse, deleteEntity, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = getOr404("projects", params.id, "Project");
  if (isResponse(result)) return result;
  return NextResponse.json(result);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { name } = await req.json();
  db().prepare("UPDATE projects SET name = ? WHERE id = ?").run(name, params.id);
  const project = db().prepare("SELECT * FROM projects WHERE id = ?").get(params.id);
  return NextResponse.json(project);
});

export const DELETE = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  return deleteEntity("projects", params.id);
});
