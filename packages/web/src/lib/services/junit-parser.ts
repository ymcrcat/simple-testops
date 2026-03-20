import { XMLParser } from "fast-xml-parser";

export interface JUnitTestCase {
  name: string;
  key: string;
  classname: string;
  time: number;
  status: "passed" | "failed" | "skipped" | "broken";
  errorMessage?: string;
  feature?: string;
  story?: string;
}

export interface JUnitResult {
  suiteName: string;
  tests: JUnitTestCase[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export function parseJUnitXML(xml: string): JUnitResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "testcase" || name === "testsuite" || name === "property",
  });

  const parsed = parser.parse(xml);

  const tests: JUnitTestCase[] = [];
  let suiteName = "Unknown";

  const suites = parsed.testsuites?.testsuite || parsed.testsuite;
  if (!suites) {
    return { suiteName, tests, total: 0, passed: 0, failed: 0, skipped: 0 };
  }

  const suiteList = Array.isArray(suites) ? suites : [suites];

  for (const suite of suiteList) {
    suiteName = suite["@_name"] || suiteName;
    const cases = suite.testcase;
    if (!cases) continue;

    const caseList = Array.isArray(cases) ? cases : [cases];

    for (const tc of caseList) {
      let status: JUnitTestCase["status"] = "passed";
      let errorMessage: string | undefined;

      if (tc.failure) {
        status = "failed";
        errorMessage =
          typeof tc.failure === "string"
            ? tc.failure
            : tc.failure["@_message"] || tc.failure["#text"] || "Test failed";
      } else if (tc.error) {
        status = "broken";
        errorMessage =
          typeof tc.error === "string"
            ? tc.error
            : tc.error["@_message"] || tc.error["#text"] || "Test error";
      } else if (tc.skipped !== undefined) {
        status = "skipped";
        if (tc.skipped && typeof tc.skipped !== "boolean") {
          errorMessage =
            typeof tc.skipped === "string"
              ? tc.skipped
              : tc.skipped["@_message"] || tc.skipped["#text"] || undefined;
        }
      }

      // Extract feature/story/test_case_name from <properties>
      let feature: string | undefined;
      let story: string | undefined;
      let displayName: string | undefined;
      const props = tc.properties?.property;
      if (props) {
        const propList = Array.isArray(props) ? props : [props];
        for (const p of propList) {
          if (p["@_name"] === "feature") feature = p["@_value"];
          if (p["@_name"] === "story") story = p["@_value"];
          if (p["@_name"] === "test_case") displayName = p["@_value"];
        }
      }

      const funcName = tc["@_name"] || "unknown";
      tests.push({
        name: displayName || funcName,
        key: funcName,
        classname: tc["@_classname"] || "",
        time: parseFloat(tc["@_time"] || "0"),
        status,
        errorMessage,
        feature,
        story,
      });
    }
  }

  const total = tests.length;
  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return { suiteName, tests, total, passed, failed, skipped };
}
