import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const run = db().prepare("SELECT * FROM test_runs WHERE id = ?").get(params.id);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json(run);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json();
  db().prepare("UPDATE test_runs SET name = ? WHERE id = ?").run(name, params.id);
  const run = db().prepare("SELECT * FROM test_runs WHERE id = ?").get(params.id);
  return NextResponse.json(run);
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare("DELETE FROM test_runs WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
