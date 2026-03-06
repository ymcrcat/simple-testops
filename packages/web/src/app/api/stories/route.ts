import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest) {
  const featureId = req.nextUrl.searchParams.get("feature_id");
  if (!featureId) return NextResponse.json({ error: "feature_id is required" }, { status: 400 });
  const stories = db()
    .prepare("SELECT * FROM stories WHERE feature_id = ? ORDER BY sort_order, id")
    .all(featureId);
  return NextResponse.json(stories);
}

export async function POST(req: NextRequest) {
  const { feature_id, name, description } = await req.json();
  if (!feature_id || !name) return NextResponse.json({ error: "feature_id and name are required" }, { status: 400 });
  const maxOrder = db()
    .prepare("SELECT COALESCE(MAX(sort_order), 0) as max_order FROM stories WHERE feature_id = ?")
    .get(feature_id) as { max_order: number };
  const result = db()
    .prepare("INSERT INTO stories (feature_id, name, description, sort_order) VALUES (?, ?, ?, ?)")
    .run(feature_id, name, description || null, maxOrder.max_order + 1);
  const story = db().prepare("SELECT * FROM stories WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(story, { status: 201 });
}
