import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const tc = db().prepare("SELECT * FROM test_cases WHERE id = ?").get(params.id);
  if (!tc) return NextResponse.json({ error: "Test case not found" }, { status: 404 });
  return NextResponse.json(tc);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, class_name, description, status, sort_order } = await req.json();
  if (sort_order !== undefined) {
    db().prepare("UPDATE test_cases SET sort_order = ? WHERE id = ?").run(sort_order, params.id);
  }
  if (name || class_name || description || status) {
    db().prepare(
      `UPDATE test_cases SET
        name = COALESCE(?, name),
        class_name = COALESCE(?, class_name),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
       WHERE id = ?`
    ).run(name || null, class_name || null, description || null, status || null, params.id);
  }
  const tc = db().prepare("SELECT * FROM test_cases WHERE id = ?").get(params.id);
  return NextResponse.json(tc);
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare("DELETE FROM test_cases WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
