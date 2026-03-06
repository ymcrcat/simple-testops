import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const feature = db().prepare("SELECT * FROM features WHERE id = ?").get(params.id);
  if (!feature) return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  return NextResponse.json(feature);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, description, sort_order } = await req.json();
  if (sort_order !== undefined) {
    db().prepare("UPDATE features SET sort_order = ? WHERE id = ?").run(sort_order, params.id);
  }
  if (name || description) {
    db().prepare("UPDATE features SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?").run(
      name || null, description || null, params.id
    );
  }
  const feature = db().prepare("SELECT * FROM features WHERE id = ?").get(params.id);
  return NextResponse.json(feature);
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare("DELETE FROM features WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
