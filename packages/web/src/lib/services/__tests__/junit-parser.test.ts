import { describe, it, expect } from "vitest";
import { parseJUnitXML } from "../junit-parser";

describe("parseJUnitXML", () => {
  it("parses a basic testsuite with mixed results", () => {
    const xml = `<?xml version="1.0"?>
      <testsuite name="my-suite" tests="4" failures="1" skipped="1">
        <testcase classname="tests.TestAuth" name="test_login" time="0.5"/>
        <testcase classname="tests.TestAuth" name="test_logout" time="0.3"/>
        <testcase classname="tests.TestAuth" name="test_register" time="0.8">
          <failure message="assert failed">Expected 200, got 500</failure>
        </testcase>
        <testcase classname="tests.TestAuth" name="test_forgot_pw" time="0.0">
          <skipped message="not implemented"/>
        </testcase>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.suiteName).toBe("my-suite");
    expect(result.total).toBe(4);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("parses testsuites wrapper (multiple suites)", () => {
    const xml = `<?xml version="1.0"?>
      <testsuites>
        <testsuite name="suite-a" tests="1">
          <testcase classname="a.Test" name="test_one" time="0.1"/>
        </testsuite>
        <testsuite name="suite-b" tests="1">
          <testcase classname="b.Test" name="test_two" time="0.2"/>
        </testsuite>
      </testsuites>`;

    const result = parseJUnitXML(xml);

    expect(result.total).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[0].name).toBe("test_one");
    expect(result.tests[1].name).toBe("test_two");
  });

  it("extracts error messages from failure elements", () => {
    const xml = `
      <testsuite name="s">
        <testcase classname="c" name="t" time="1.0">
          <failure message="short msg">Full stack trace here</failure>
        </testcase>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.tests[0].status).toBe("failed");
    expect(result.tests[0].errorMessage).toBe("short msg");
  });

  it("marks error elements as broken", () => {
    const xml = `
      <testsuite name="s">
        <testcase classname="c" name="t" time="0.5">
          <error message="RuntimeError">Something blew up</error>
        </testcase>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.tests[0].status).toBe("broken");
    expect(result.tests[0].errorMessage).toBe("RuntimeError");
  });

  it("parses time as float seconds", () => {
    const xml = `
      <testsuite name="s">
        <testcase classname="c" name="t" time="1.234"/>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.tests[0].time).toBeCloseTo(1.234);
  });

  it("handles empty testsuite", () => {
    const xml = `<testsuite name="empty"></testsuite>`;
    const result = parseJUnitXML(xml);

    expect(result.total).toBe(0);
    expect(result.tests).toHaveLength(0);
    expect(result.suiteName).toBe("empty");
  });

  it("handles missing testsuite entirely", () => {
    const xml = `<root><something/></root>`;
    const result = parseJUnitXML(xml);

    expect(result.total).toBe(0);
    expect(result.suiteName).toBe("Unknown");
  });

  it("handles single testcase (not array)", () => {
    const xml = `
      <testsuite name="s">
        <testcase classname="c" name="only_one" time="0.1"/>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.total).toBe(1);
    expect(result.tests[0].name).toBe("only_one");
  });

  it("defaults classname to empty string if missing", () => {
    const xml = `
      <testsuite name="s">
        <testcase name="no_class" time="0.1"/>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.tests[0].classname).toBe("");
  });

  it("parses pytest-style JUnit XML", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
      <testsuite name="pytest" tests="3" errors="0" failures="1" skipped="0" time="2.5">
        <testcase classname="tests.test_api.TestAPI" name="test_health" time="0.01"/>
        <testcase classname="tests.test_api.TestAPI" name="test_create" time="0.5"/>
        <testcase classname="tests.test_api.TestAPI" name="test_delete" time="0.8">
          <failure message="AssertionError">assert 204 == 200</failure>
        </testcase>
      </testsuite>`;

    const result = parseJUnitXML(xml);

    expect(result.suiteName).toBe("pytest");
    expect(result.total).toBe(3);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.tests[2].errorMessage).toBe("AssertionError");
  });
});
