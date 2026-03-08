import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const story = db().prepare("SELECT * FROM stories WHERE id = ?").get(params.id);
  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });
  return NextResponse.json(story);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, description, sort_order, priority } = await req.json();
  if (sort_order !== undefined) {
    db().prepare("UPDATE stories SET sort_order = ? WHERE id = ?").run(sort_order, params.id);
  }
  if (priority !== undefined) {
    db().prepare("UPDATE stories SET priority = ? WHERE id = ?").run(priority, params.id);
  }
  if (name || description) {
    db().prepare("UPDATE stories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?").run(
      name || null, description || null, params.id
    );
  }
  const story = db().prepare("SELECT * FROM stories WHERE id = ?").get(params.id);
  return NextResponse.json(story);
}

export function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  d.prepare(`
    UPDATE test_results SET test_case_id = NULL
    WHERE test_case_id IN (
      SELECT tc.id FROM test_cases tc WHERE tc.story_id = ?
    )
  `).run(params.id);
  d.prepare("DELETE FROM stories WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
