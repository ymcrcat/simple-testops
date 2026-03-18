import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOr404, isResponse, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = getOr404("test_cases", params.id, "Test case");
  if (isResponse(result)) return result;
  return NextResponse.json(result);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  if (body.sort_order !== undefined) {
    db().prepare("UPDATE test_cases SET sort_order = ? WHERE id = ?").run(body.sort_order, params.id);
  }
  if ("description" in body) {
    db().prepare("UPDATE test_cases SET description = ? WHERE id = ?").run(body.description ?? null, params.id);
  }
  if (body.key !== undefined) {
    db().prepare("UPDATE test_cases SET key = ? WHERE id = ?").run(body.key || null, params.id);
  }
  if (body.name || body.class_name || body.status) {
    db().prepare(
      `UPDATE test_cases SET
        name = COALESCE(?, name),
        class_name = COALESCE(?, class_name),
        status = COALESCE(?, status)
       WHERE id = ?`
    ).run(body.name || null, body.class_name || null, body.status || null, params.id);
  }
  const tc = db().prepare("SELECT * FROM test_cases WHERE id = ?").get(params.id);
  return NextResponse.json(tc);
});

export const DELETE = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const d = db();
  d.prepare("UPDATE test_results SET test_case_id = NULL WHERE test_case_id = ?").run(params.id);
  d.prepare("DELETE FROM test_cases WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
});
