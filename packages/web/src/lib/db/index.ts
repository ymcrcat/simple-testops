import { ensureMigrated } from "./schema";
import { getDb } from "./connection";

export function db() {
  ensureMigrated();
  return getDb();
}
