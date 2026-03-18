"use client";

import { useParams } from "next/navigation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        marginBottom: 12,
        color: "var(--text-primary)",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mono" style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      padding: "14px 16px",
      fontSize: 12,
      lineHeight: 1.6,
      overflowX: "auto",
      color: "var(--text-secondary)",
      marginTop: 8,
      marginBottom: 16,
    }}>
      {children}
    </pre>
  );
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: "rgba(34,197,94,0.12)", text: "var(--color-passed)" },
    POST: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
    PUT: { bg: "rgba(234,179,8,0.12)", text: "var(--color-skipped)" },
    DELETE: { bg: "rgba(239,68,68,0.12)", text: "var(--color-failed)" },
  };
  const c = methodColors[method] || { bg: "var(--bg-elevated)", text: "var(--text-muted)" };
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap",
      padding: "8px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 4,
        background: c.bg,
        color: c.text,
        letterSpacing: "0.05em",
        fontFamily: "var(--font-mono)",
        width: 52,
        textAlign: "center",
        flexShrink: 0,
      }}>
        {method}
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, overflowWrap: "anywhere" }}>{path}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", minWidth: 180 }}>{description}</span>
    </div>
  );
}

export default function DocsPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        marginBottom: 8,
      }}>
        Documentation
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>
        API reference, data model, and usage guide for Simple TestOps.
      </p>

      {/* Concepts */}
      <Section title="Concepts">
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
          Simple TestOps organizes testing around a hierarchy:
        </p>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          padding: "12px 16px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 500,
        }}>
          <span style={{ color: "var(--text-primary)" }}>Project</span>
          <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
          <span style={{ color: "var(--text-primary)" }}>Feature</span>
          <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
          <span style={{ color: "var(--text-primary)" }}>Story</span>
          <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
          <span style={{ color: "var(--text-primary)" }}>Test Case</span>
        </div>
        <ul style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 8 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>Projects</strong> are top-level containers (e.g. a product or service).</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Features</strong> group related stories (e.g. &quot;Authentication&quot;).</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Stories</strong> describe specific behaviors or scenarios. Stories can have a <strong>priority</strong> (P0, P1, P2).</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Test Cases</strong> are individual tests linked to a story, identified by a unique <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>key</code>.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Runs</strong> are uploaded JUnit XML results. Each run contains <strong>test results</strong> that are auto-matched to test cases.</li>
        </ul>
      </Section>

      {/* Result Matching */}
      <Section title="Result Matching">
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
          When JUnit XML results are uploaded, each test result is matched to an existing test case using a 3-tier strategy:
        </p>
        <ol style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>Key match</strong> &mdash; the test case <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>key</code> field matches the test name from the XML.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Class + name match</strong> &mdash; both <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>class_name</code> and <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>name</code> match.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Auto-create</strong> &mdash; if no match is found, a new test case is created under an auto-generated story/feature derived from the class name.</li>
        </ol>
      </Section>

      {/* CLI Usage */}
      <Section title="CLI Usage">
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
          Upload JUnit XML results from the command line:
        </p>
        <Code>{`# Install the CLI
npm install -g @testops/cli

# Upload a JUnit XML file
testops upload --project ${projectId} --file results.xml

# Upload with a custom run name
testops upload --project ${projectId} --file results.xml --name "Nightly build #42"

# Specify a custom server URL (default: http://localhost:3001)
testops upload --project ${projectId} --file results.xml --url https://testops.example.com`}</Code>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          All endpoints are under <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>/api</code>. Responses use JSON. Creates return <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>201</code>, deletes return <code className="mono" style={{ fontSize: 12, background: "var(--bg-elevated)", padding: "1px 5px", borderRadius: 3 }}>204</code>.
        </p>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20, color: "var(--text-primary)" }}>Projects</h3>
        <div style={{ marginBottom: 16 }}>
          <Endpoint method="GET" path="/api/projects" description="List all projects" />
          <Endpoint method="POST" path="/api/projects" description="Create a project" />
          <Endpoint method="GET" path="/api/projects/:id" description="Get project (id or slug)" />
          <Endpoint method="PUT" path="/api/projects/:id" description="Update project" />
          <Endpoint method="DELETE" path="/api/projects/:id" description="Delete project" />
        </div>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20, color: "var(--text-primary)" }}>Features</h3>
        <div style={{ marginBottom: 16 }}>
          <Endpoint method="GET" path="/api/features?project_id=:id" description="List features for a project" />
          <Endpoint method="POST" path="/api/features" description="Create a feature" />
          <Endpoint method="GET" path="/api/features/:id" description="Get feature" />
          <Endpoint method="PUT" path="/api/features/:id" description="Update feature" />
          <Endpoint method="DELETE" path="/api/features/:id" description="Delete feature" />
        </div>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20, color: "var(--text-primary)" }}>Stories</h3>
        <div style={{ marginBottom: 16 }}>
          <Endpoint method="GET" path="/api/stories?feature_id=:id" description="List stories for a feature" />
          <Endpoint method="POST" path="/api/stories" description="Create a story" />
          <Endpoint method="GET" path="/api/stories/:id" description="Get story" />
          <Endpoint method="PUT" path="/api/stories/:id" description="Update story (name, description, priority, sort_order)" />
          <Endpoint method="DELETE" path="/api/stories/:id" description="Delete story" />
        </div>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20, color: "var(--text-primary)" }}>Test Cases</h3>
        <div style={{ marginBottom: 16 }}>
          <Endpoint method="GET" path="/api/testcases?project_id=:id" description="List all test cases in a project" />
          <Endpoint method="GET" path="/api/testcases?story_id=:id" description="List test cases for a story" />
          <Endpoint method="POST" path="/api/testcases" description="Create a test case" />
          <Endpoint method="GET" path="/api/testcases/:id" description="Get test case" />
          <Endpoint method="PUT" path="/api/testcases/:id" description="Update test case" />
          <Endpoint method="DELETE" path="/api/testcases/:id" description="Delete test case" />
          <Endpoint method="GET" path="/api/testcases/:id/history" description="Last 50 results with run info" />
        </div>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20, color: "var(--text-primary)" }}>Runs</h3>
        <div style={{ marginBottom: 16 }}>
          <Endpoint method="GET" path="/api/runs?project_id=:id" description="List runs for a project" />
          <Endpoint method="GET" path="/api/runs/:id" description="Get run details" />
          <Endpoint method="PUT" path="/api/runs/:id" description="Update run name" />
          <Endpoint method="DELETE" path="/api/runs/:id" description="Delete run" />
          <Endpoint method="GET" path="/api/runs/:id/results" description="Get run results (filter: ?status=failed)" />
          <Endpoint method="GET" path="/api/runs/:id/coverage" description="Full test spec vs results" />
          <Endpoint method="POST" path="/api/runs/upload" description="Upload JUnit XML results" />
        </div>
      </Section>

      {/* Upload Example */}
      <Section title="Upload Example">
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
          Upload JUnit XML results via the API:
        </p>
        <Code>{`curl -X POST http://localhost:3001/api/runs/upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": ${projectId},
    "xml": "<testsuites><testsuite name=\\"suite\\"><testcase classname=\\"auth.login\\" name=\\"test_valid_creds\\" time=\\"0.5\\"/></testsuite></testsuites>",
    "name": "CI Build #42"
  }'`}</Code>
      </Section>

      {/* Create Hierarchy Example */}
      <Section title="Creating a Test Hierarchy">
        <Code>{`# 1. Create a feature
curl -X POST http://localhost:3001/api/features \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": ${projectId}, "name": "Authentication"}'

# 2. Create a story under the feature
curl -X POST http://localhost:3001/api/stories \\
  -H "Content-Type: application/json" \\
  -d '{"feature_id": FEATURE_ID, "name": "Login flow"}'

# 3. Create a test case under the story
curl -X POST http://localhost:3001/api/testcases \\
  -H "Content-Type: application/json" \\
  -d '{"story_id": STORY_ID, "name": "test_valid_credentials", "class_name": "auth.login"}'`}</Code>
      </Section>
    </div>
  );
}
