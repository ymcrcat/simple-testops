import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const keys = db()
    .prepare("SELECT id, name, created_at FROM api_keys WHERE project_id = ?")
    .all(params.id);
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  db().prepare("INSERT INTO api_keys (project_id, key_hash, name) VALUES (?, ?, ?)").run(
    params.id,
    keyHash,
    name
  );

  return NextResponse.json({ key: rawKey, name }, { status: 201 });
}
