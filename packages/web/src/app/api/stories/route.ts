import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireQueryParam, isResponse, createWithSortOrder, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler((req: NextRequest) => {
  const featureId = requireQueryParam(req, "feature_id");
  if (isResponse(featureId)) return featureId;
  const stories = db()
    .prepare("SELECT * FROM stories WHERE feature_id = ? ORDER BY sort_order, id")
    .all(featureId);
  return NextResponse.json(stories);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const { feature_id, name, description } = await req.json();
  if (!feature_id || !name) return NextResponse.json({ error: "feature_id and name are required" }, { status: 400 });
  return createWithSortOrder("stories", "feature_id", feature_id, {
    name,
    description: description || null,
  });
});
