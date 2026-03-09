"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  projectId: string;
  projectName?: string;
}

function getApiSkill(projectId: string): string {
  return `# TestOps API Skill

Base URL: \${BASE_URL}/api (default: http://localhost:3000/api)
Content-Type: application/json
Current project ID: ${projectId}

## Projects

### List projects
GET /api/projects

### Create project
POST /api/projects
Body: { "name": "Project Name", "slug": "optional-slug" }

### Get project
GET /api/projects/:id (id can be numeric ID or slug)

### Update project
PUT /api/projects/:id
Body: { "name": "New Name" }

### Delete project
DELETE /api/projects/:id

## Features

### List features
GET /api/features?project_id=${projectId}

### Create feature
POST /api/features
Body: { "project_id": ${projectId}, "name": "Feature Name", "description": "optional" }

### Get feature
GET /api/features/:id

### Update feature
PUT /api/features/:id
Body: { "name": "New Name", "description": "New desc", "sort_order": 0 }

### Delete feature
DELETE /api/features/:id

## Stories

### List stories for a feature
GET /api/stories?feature_id=:featureId

### Create story
POST /api/stories
Body: { "feature_id": :featureId, "name": "Story Name", "description": "optional" }

### Get story
GET /api/stories/:id

### Update story
PUT /api/stories/:id
Body: { "name": "New Name", "description": "New desc", "priority": "optional", "sort_order": 0 }

### Delete story
DELETE /api/stories/:id

## Test Cases

### List test cases for a project
GET /api/testcases?project_id=${projectId}

### List test cases for a story
GET /api/testcases?story_id=:storyId

### Create test case
POST /api/testcases
Body: { "story_id": :storyId, "name": "Test Name", "class_name": "optional", "key": "optional (defaults to name)", "description": "optional" }

### Get test case
GET /api/testcases/:id

### Update test case
PUT /api/testcases/:id
Body: { "name": "New Name", "class_name": "cls", "key": "test_key", "description": "Test desc", "status": "active|deprecated", "sort_order": 0 }

### Delete test case
DELETE /api/testcases/:id

### Get test case history
GET /api/testcases/:id/history
Returns: last 50 results with run info

## Runs

### List runs
GET /api/runs?project_id=${projectId}

### Get run
GET /api/runs/:id

### Update run
PUT /api/runs/:id
Body: { "name": "New Name" }

### Delete run
DELETE /api/runs/:id

### Get run results
GET /api/runs/:id/results
GET /api/runs/:id/results?status=failed (filter by status)

### Get run coverage (full test spec vs results)
GET /api/runs/:id/coverage

### Upload JUnit XML results
POST /api/runs/upload
Body: { "project_id": ${projectId}, "xml": "<JUnit XML string>", "name": "optional run name" }
Note: project_id can be numeric ID or slug. Parses XML and auto-matches results to test cases.

## Example: Create a full hierarchy

\`\`\`bash
# 1. Create a feature
curl -X POST http://localhost:3000/api/features \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": ${projectId}, "name": "Authentication"}'
# Returns: { "id": 1, "name": "Authentication", ... }

# 2. Create a story under the feature
curl -X POST http://localhost:3000/api/stories \\
  -H "Content-Type: application/json" \\
  -d '{"feature_id": 1, "name": "Login"}'
# Returns: { "id": 1, "name": "Login", ... }

# 3. Create test cases under the story
curl -X POST http://localhost:3000/api/testcases \\
  -H "Content-Type: application/json" \\
  -d '{"story_id": 1, "name": "test_valid_credentials", "class_name": "auth.login"}'

# 4. Upload test results
curl -X POST http://localhost:3000/api/runs/upload \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": ${projectId}, "xml": "<testsuites>...</testsuites>"}'
\`\`\`
`;
}

const navItems = [
  { suffix: "", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { suffix: "/features", label: "Features", icon: "M4 6h16M4 12h8m-8 6h16" },
  { suffix: "/cases", label: "Test Cases", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { suffix: "/runs", label: "Runs", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { suffix: "/docs", label: "Docs", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

export default function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const base = `/projects/${projectId}`;

  return (
    <nav style={{
      width: 240,
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      overflow: "hidden",
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "linear-gradient(135deg, var(--color-accent), #a78bfa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "var(--font-display)",
          boxShadow: "0 0 16px var(--color-accent-dim)",
        }}>
          T
        </div>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}>
          Simple TestOps
        </span>
      </Link>

      {/* Project name */}
      <div style={{
        padding: "16px 20px 8px",
      }}>
        <div className="section-label">Project</div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {projectName || `#${projectId}`}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "12px 10px", flex: 1 }}>
        {navItems.map((item) => {
          const href = `${base}${item.suffix}`;
          const active = item.suffix === ""
            ? pathname === base
            : pathname.startsWith(href);

          return (
            <Link
              key={item.suffix}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 2,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-accent)" : "var(--text-secondary)",
                background: active ? "var(--color-accent-glow)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{
        padding: "12px 20px 16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(getApiSkill(projectId));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 10px",
            cursor: "pointer",
            fontSize: 12,
            color: copied ? "var(--color-passed)" : "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
            width: "100%",
          }}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
          {copied ? "Copied!" : "Copy API Skill"}
        </button>
        <Link
          href="/"
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "color 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All Projects
        </Link>
      </div>
    </nav>
  );
}
