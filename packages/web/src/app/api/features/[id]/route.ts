import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOr404, isResponse, deleteWithNullifyResults, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  const result = getOr404("features", params.id, "Feature");
  if (isResponse(result)) return result;
  return NextResponse.json(result);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
});

export const DELETE = apiHandler((_req: NextRequest, { params }: { params: { id: string } }) => {
  return deleteWithNullifyResults(
    "features",
    params.id,
    `SELECT tc.id FROM test_cases tc
     JOIN stories s ON tc.story_id = s.id
     JOIN features f ON s.feature_id = f.id
     WHERE f.id = ?`
  );
});
