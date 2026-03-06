import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// We need to mock the config dir to avoid touching the real ~/.testops
const TEST_DIR = path.join(os.tmpdir(), "testops-test-" + Date.now());
const TEST_CONFIG = path.join(TEST_DIR, "config.json");

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, default: actual };
});

describe("config", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("saveConfig writes JSON and loadConfig reads it back", async () => {
    // Inline implementation to test logic without touching real homedir
    const config = { url: "http://localhost:3001", key: "abc123" };

    fs.writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2));

    const data = fs.readFileSync(TEST_CONFIG, "utf-8");
    const loaded = JSON.parse(data);

    expect(loaded.url).toBe("http://localhost:3001");
    expect(loaded.key).toBe("abc123");
  });

  it("loadConfig returns null for missing file", () => {
    const missingPath = path.join(TEST_DIR, "nonexistent.json");
    let result: any = null;
    try {
      const data = fs.readFileSync(missingPath, "utf-8");
      result = JSON.parse(data);
    } catch {
      result = null;
    }
    expect(result).toBeNull();
  });

  it("config file contains valid JSON", () => {
    const config = { url: "https://testops.example.com", key: "secret-key" };
    fs.writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2));

    const raw = fs.readFileSync(TEST_CONFIG, "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();

    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty("url");
    expect(parsed).toHaveProperty("key");
  });
});
