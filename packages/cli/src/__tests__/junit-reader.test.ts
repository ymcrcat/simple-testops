import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { readJUnitFile, findJUnitFiles } from "../junit-reader";

const TEST_DIR = path.join(os.tmpdir(), "testops-junit-test-" + Date.now());

describe("junit-reader", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("readJUnitFile", () => {
    it("reads an XML file and returns its contents", () => {
      const content = '<testsuite name="test"><testcase name="t1"/></testsuite>';
      const filePath = path.join(TEST_DIR, "results.xml");
      fs.writeFileSync(filePath, content);

      const result = readJUnitFile(filePath);
      expect(result).toBe(content);
    });

    it("throws for non-existent file", () => {
      expect(() => readJUnitFile(path.join(TEST_DIR, "missing.xml"))).toThrow();
    });
  });

  describe("findJUnitFiles", () => {
    it("finds all .xml files in a directory", () => {
      fs.writeFileSync(path.join(TEST_DIR, "results1.xml"), "<xml/>");
      fs.writeFileSync(path.join(TEST_DIR, "results2.xml"), "<xml/>");
      fs.writeFileSync(path.join(TEST_DIR, "readme.txt"), "not xml");
      fs.writeFileSync(path.join(TEST_DIR, "data.json"), "{}");

      const files = findJUnitFiles(TEST_DIR);

      expect(files).toHaveLength(2);
      expect(files.every((f) => f.endsWith(".xml"))).toBe(true);
    });

    it("returns empty array for directory with no XML files", () => {
      fs.writeFileSync(path.join(TEST_DIR, "readme.txt"), "text");

      const files = findJUnitFiles(TEST_DIR);
      expect(files).toHaveLength(0);
    });

    it("returns absolute paths", () => {
      fs.writeFileSync(path.join(TEST_DIR, "test.xml"), "<xml/>");

      const files = findJUnitFiles(TEST_DIR);
      expect(path.isAbsolute(files[0])).toBe(true);
    });

    it("returns empty array for empty directory", () => {
      const files = findJUnitFiles(TEST_DIR);
      expect(files).toHaveLength(0);
    });
  });
});
