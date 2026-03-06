import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = db().prepare("SELECT * FROM projects WHERE id = ? OR slug = ?").get(params.id, params.id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json();
  db().prepare("UPDATE projects SET name = ? WHERE id = ?").run(name, params.id);
  const project = db().prepare("SELECT * FROM projects WHERE id = ?").get(params.id);
  return NextResponse.json(project);
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare("DELETE FROM projects WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
