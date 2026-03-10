import { Command } from "commander";
import { readJUnitFile, findJUnitFiles } from "../junit-reader";
import http from "http";
import https from "https";

function post(serverUrl: string, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const base = serverUrl.replace(/\/+$/, "");
    const parsed = new URL(base + "/api/runs/upload");
    const transport = parsed.protocol === "https:" ? https : http;
    const payload = JSON.stringify(body);

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Invalid JSON response (HTTP ${res.statusCode}): ${data}`));
            }
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export const uploadCommand = new Command("upload")
  .description("Upload JUnit XML results")
  .requiredOption("--project <slug>", "Project slug or ID")
  .option("--file <path>", "Path to JUnit XML file")
  .option("--dir <path>", "Directory containing JUnit XML files")
  .option("--name <name>", "Run name")
  .requiredOption("--url <url>", "Server URL")
  .action(async (opts) => {
    const serverUrl = opts.url;

    const files: string[] = [];
    if (opts.file) files.push(opts.file);
    if (opts.dir) files.push(...findJUnitFiles(opts.dir));

    if (files.length === 0) {
      console.error("Error: Provide --file or --dir");
      process.exit(1);
    }

    for (const file of files) {
      console.log(`Uploading ${file}...`);
      const xml = readJUnitFile(file);
      try {
        const result = await post(serverUrl, {
          project_id: opts.project,
          xml,
          name: opts.name,
        });
        console.log(
          `  Run #${result.id}: ${result.total} tests (${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped)`
        );
      } catch (e: any) {
        console.error(`  Error: ${e.message}`);
      }
    }
  });
