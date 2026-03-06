import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJUnitXML } from "@/lib/services/junit-parser";
import { matchTestCase } from "@/lib/services/result-matcher";

export async function POST(req: NextRequest) {
  const { project_id, xml, name } = await req.json();

  if (!project_id || !xml) {
    return NextResponse.json({ error: "project_id and xml are required" }, { status: 400 });
  }

  const d = db();
  const project = d.prepare("SELECT * FROM projects WHERE id = ? OR slug = ?").get(project_id, project_id) as any;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const parsed = parseJUnitXML(xml);

  const insertRun = d.prepare(
    `INSERT INTO test_runs (project_id, name, finished_at, total, passed, failed, skipped)
     VALUES (?, ?, datetime('now'), ?, ?, ?, ?)`
  );

  const insertResult = d.prepare(
    `INSERT INTO test_results (run_id, test_case_id, name, class_name, status, duration_ms, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const runResult = insertRun.run(
    project.id,
    name || parsed.suiteName,
    parsed.total,
    parsed.passed,
    parsed.failed,
    parsed.skipped
  );
  const runId = runResult.lastInsertRowid;

  for (const tc of parsed.tests) {
    const testCaseId = matchTestCase(project.id, tc);
    insertResult.run(
      runId,
      testCaseId,
      tc.name,
      tc.classname,
      tc.status,
      Math.round(tc.time * 1000),
      tc.errorMessage || null
    );
  }

  const run = d.prepare("SELECT * FROM test_runs WHERE id = ?").get(runId);
  return NextResponse.json(run, { status: 201 });
}
