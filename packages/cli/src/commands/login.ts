import { Command } from "commander";
import { saveConfig } from "../config";

export const loginCommand = new Command("login")
  .description("Save server URL and API key")
  .requiredOption("--url <url>", "TestOps server URL")
  .requiredOption("--key <key>", "API key")
  .action((opts) => {
    saveConfig({ url: opts.url.replace(/\/$/, ""), key: opts.key });
    console.log("Configuration saved to ~/.testops/config.json");
  });
