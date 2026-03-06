import fs from "fs";
import path from "path";

export function readJUnitFile(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

export function findJUnitFiles(dirPath: string): string[] {
  const resolved = path.resolve(dirPath);
  const files = fs.readdirSync(resolved);
  return files
    .filter((f) => f.endsWith(".xml"))
    .map((f) => path.join(resolved, f));
}
