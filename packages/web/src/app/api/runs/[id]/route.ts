import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOr404, isResponse, deleteEntity, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = getOr404("test_runs", params.id, "Run");
  if (isResponse(result)) return result;
  return NextResponse.json(result);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { name } = await req.json();
  db().prepare("UPDATE test_runs SET name = ? WHERE id = ?").run(name, params.id);
  const run = db().prepare("SELECT * FROM test_runs WHERE id = ?").get(params.id);
  return NextResponse.json(run);
});

export const DELETE = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  return deleteEntity("test_runs", params.id);
});
