import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: { id: string } };
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<Response> | Response;

/**
 * Wraps an API route handler with try/catch error handling.
 */
export function apiHandler(fn: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Gets an entity by ID or returns a 404 JSON response.
 * For projects, also checks by slug.
 */
export function getOr404(table: string, id: string, entityName: string): Response | Record<string, unknown> {
  const query = table === "projects"
    ? `SELECT * FROM ${table} WHERE id = ? OR slug = ?`
    : `SELECT * FROM ${table} WHERE id = ?`;
  const params = table === "projects" ? [id, id] : [id];
  const entity = db().prepare(query).get(...params) as Record<string, unknown> | undefined;
  if (!entity) {
    return NextResponse.json({ error: `${entityName} not found` }, { status: 404 });
  }
  return entity;
}

/**
 * Checks if a value is a NextResponse (used after getOr404).
 */
export function isResponse(val: unknown): val is Response {
  return val instanceof Response;
}

/**
 * Gets a required query parameter or returns a 400 JSON response.
 */
export function requireQueryParam(req: NextRequest, name: string): string | Response {
  const value = req.nextUrl.searchParams.get(name);
  if (!value) {
    return NextResponse.json({ error: `${name} is required` }, { status: 400 });
  }
  return value;
}

/**
 * Creates an entity with auto-incrementing sort_order.
 * Returns the created entity as a 201 JSON response.
 */
export function createWithSortOrder(
  table: string,
  parentColumn: string,
  parentId: number,
  fields: Record<string, unknown>,
  extraColumns: string[] = [],
): Response {
  const maxOrder = db()
    .prepare(`SELECT COALESCE(MAX(sort_order), 0) as max_order FROM ${table} WHERE ${parentColumn} = ?`)
    .get(parentId) as { max_order: number };

  const allFields = { [parentColumn]: parentId, sort_order: maxOrder.max_order + 1, ...fields };
  const columns = Object.keys(allFields);
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((c) => allFields[c]);

  const result = db()
    .prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`)
    .run(...values);
  const entity = db().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
  return NextResponse.json(entity, { status: 201 });
}

/**
 * Deletes an entity and returns 204. Optionally nullifies test_results references first.
 */
export function deleteEntity(table: string, id: string): Response {
  db().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return new NextResponse(null, { status: 204 });
}

/**
 * Nullifies test_results.test_case_id for test cases matching the given SQL condition,
 * then deletes the entity.
 */
export function deleteWithNullifyResults(
  table: string,
  id: string,
  testCaseSubquery: string,
): Response {
  const d = db();
  d.prepare(`UPDATE test_results SET test_case_id = NULL WHERE test_case_id IN (${testCaseSubquery})`).run(id);
  d.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return new NextResponse(null, { status: 204 });
}
