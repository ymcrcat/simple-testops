import { Command } from "commander";
import { loadConfig } from "../config";
import { readJUnitFile, findJUnitFiles } from "../junit-reader";
import http from "http";
import https from "https";
import url from "url";

function post(serverUrl: string, apiKey: string, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(serverUrl + "/api/runs/upload");
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
          "X-API-Key": apiKey,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data));
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
  .option("--url <url>", "Server URL (overrides config)")
  .option("--key <key>", "API key (overrides config)")
  .action(async (opts) => {
    const config = loadConfig();
    const serverUrl = opts.url || config?.url;
    const apiKey = opts.key || config?.key;

    if (!serverUrl) {
      console.error("Error: No server URL. Run 'testops login' first or pass --url");
      process.exit(1);
    }

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
        const result = await post(serverUrl, apiKey || "", {
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
