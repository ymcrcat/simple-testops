import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-helpers";

export function GET() {
  const projects = db()
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM test_runs WHERE project_id = p.id) as run_count,
        (SELECT passed FROM test_runs WHERE project_id = p.id ORDER BY started_at DESC LIMIT 1) as last_passed,
        (SELECT failed FROM test_runs WHERE project_id = p.id ORDER BY started_at DESC LIMIT 1) as last_failed,
        (SELECT total FROM test_runs WHERE project_id = p.id ORDER BY started_at DESC LIMIT 1) as last_total
       FROM projects p ORDER BY p.created_at DESC`
    )
    .all();
  return NextResponse.json(projects);
}

export const POST = apiHandler(async (req: NextRequest) => {
  const { name, slug } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const projectSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const result = db()
      .prepare("INSERT INTO projects (name, slug) VALUES (?, ?)")
      .run(name, projectSlug);
    const project = db().prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(project, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "Project slug already exists" }, { status: 409 });
    }
    throw e;
  }
});
