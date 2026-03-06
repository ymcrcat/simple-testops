import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import path from "path";

const CLI_PATH = path.resolve(__dirname, "../index.ts");

// tsx is hoisted to the workspace root node_modules
const TSX = path.resolve(__dirname, "../../../../node_modules/.bin/tsx");

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync(TSX, [CLI_PATH, ...args], {
      encoding: "utf-8",
      timeout: 10000,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout || "",
      stderr: e.stderr || "",
      exitCode: e.status ?? 1,
    };
  }
}

describe("CLI", () => {
  it("shows help with --help", () => {
    const { stdout } = runCli(["--help"]);
    expect(stdout).toContain("TestOps CLI");
    expect(stdout).toContain("upload");
    expect(stdout).toContain("login");
  });

  it("shows version with --version", () => {
    const { stdout } = runCli(["--version"]);
    expect(stdout.trim()).toBe("0.1.0");
  });

  it("shows upload subcommand help", () => {
    const { stdout } = runCli(["upload", "--help"]);
    expect(stdout).toContain("--project");
    expect(stdout).toContain("--file");
    expect(stdout).toContain("--dir");
  });

  it("shows login subcommand help", () => {
    const { stdout } = runCli(["login", "--help"]);
    expect(stdout).toContain("--url");
    expect(stdout).toContain("--key");
  });

  it("upload fails without required --project option", () => {
    const { stderr, exitCode } = runCli(["upload", "--file", "test.xml"]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("project");
  });

  it("login fails without required options", () => {
    const { exitCode } = runCli(["login"]);
    expect(exitCode).not.toBe(0);
  });
});
