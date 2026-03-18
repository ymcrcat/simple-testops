import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOr404, isResponse, deleteWithNullifyResults, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = getOr404("stories", params.id, "Story");
  if (isResponse(result)) return result;
  return NextResponse.json(result);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
});

export const DELETE = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  return deleteWithNullifyResults(
    "stories",
    params.id,
    `SELECT tc.id FROM test_cases tc WHERE tc.story_id = ?`
  );
});
