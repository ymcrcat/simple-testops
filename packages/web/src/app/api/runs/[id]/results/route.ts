import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const status = req.nextUrl.searchParams.get("status");
  let query = `SELECT tr.*, tc.name as case_name, tc.class_name as case_class_name,
    s.name as story_name, s.priority as story_priority, f.name as feature_name
    FROM test_results tr
    LEFT JOIN test_cases tc ON tr.test_case_id = tc.id
    LEFT JOIN stories s ON tc.story_id = s.id
    LEFT JOIN features f ON s.feature_id = f.id
    WHERE tr.run_id = ?`;
  const queryParams: any[] = [params.id];
  if (status) {
    query += " AND tr.status = ?";
    queryParams.push(status);
  }
  query += " ORDER BY f.sort_order, f.id, s.sort_order, s.id, tc.sort_order, tc.id";
  const results = db().prepare(query).all(...queryParams);
  return NextResponse.json(results);
}
