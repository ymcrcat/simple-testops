"""JUnit XML builders for blackbox tests."""


def build_junit_xml(
    suite_name: str = "pytest",
    test_cases: list[dict] | None = None,
) -> str:
    """Build a JUnit XML string from a list of test case dicts.

    Each test case dict supports:
        name (str): test function name (required)
        classname (str): dotted class path (optional)
        time (float): duration in seconds (optional, default 0.1)
        status (str): "passed" | "failed" | "broken" | "skipped" (default "passed")
        error_message (str): message for failed/broken (optional)
        properties (dict): key-value pairs for <properties> element (optional)
    """
    if test_cases is None:
        test_cases = [{"name": "test_example", "classname": "tests.test_example"}]

    tc_xmls = []
    for tc in test_cases:
        name = tc["name"]
        classname = tc.get("classname", "")
        time = tc.get("time", 0.1)
        status = tc.get("status", "passed")
        error_message = tc.get("error_message", "something went wrong")

        props_xml = ""
        if tc.get("properties"):
            prop_lines = []
            for k, v in tc["properties"].items():
                prop_lines.append(f'<property name="{k}" value="{v}"/>')
            props_xml = "<properties>" + "".join(prop_lines) + "</properties>"

        inner = props_xml
        if status == "failed":
            inner += f'<failure message="{error_message}">Traceback here</failure>'
        elif status == "broken":
            inner += f'<error message="{error_message}">Traceback here</error>'
        elif status == "skipped":
            inner += '<skipped message="skipped"/>'

        tc_xmls.append(
            f'<testcase name="{name}" classname="{classname}" time="{time}">'
            f"{inner}</testcase>"
        )

    tests_str = "".join(tc_xmls)
    return (
        f'<?xml version="1.0" encoding="utf-8"?>'
        f'<testsuites><testsuite name="{suite_name}" tests="{len(test_cases)}">'
        f"{tests_str}</testsuite></testsuites>"
    )
