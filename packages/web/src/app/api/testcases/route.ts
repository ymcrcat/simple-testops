import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createWithSortOrder, apiHandler } from "@/lib/api-helpers";

export function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get("story_id");
  const projectId = req.nextUrl.searchParams.get("project_id");

  if (projectId) {
    const cases = db()
      .prepare(
        `SELECT tc.*, s.name as story_name, s.priority as story_priority, f.name as feature_name
         FROM test_cases tc
         JOIN stories s ON tc.story_id = s.id
         JOIN features f ON s.feature_id = f.id
         WHERE f.project_id = ?
         ORDER BY f.sort_order, s.sort_order, tc.sort_order, tc.id`
      )
      .all(projectId);
    return NextResponse.json(cases);
  }

  if (!storyId) return NextResponse.json({ error: "story_id or project_id is required" }, { status: 400 });
  const cases = db()
    .prepare("SELECT * FROM test_cases WHERE story_id = ? ORDER BY sort_order, id")
    .all(storyId);
  return NextResponse.json(cases);
}

export const POST = apiHandler(async (req: NextRequest) => {
  const { story_id, name, class_name, description, key } = await req.json();
  if (!story_id || !name) return NextResponse.json({ error: "story_id and name are required" }, { status: 400 });
  return createWithSortOrder("test_cases", "story_id", story_id, {
    name,
    class_name: class_name || null,
    description: description || null,
    key: key || name,
  });
});
