"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  projectId: string;
  projectName?: string;
}

const navItems = [
  { suffix: "", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { suffix: "/features", label: "Features", icon: "M4 6h16M4 12h8m-8 6h16" },
  { suffix: "/cases", label: "Test Cases", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { suffix: "/runs", label: "Runs", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
];

export default function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav style={{
      width: 240,
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      position: "sticky",
      top: 0,
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
          TestOps
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
      }}>
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
