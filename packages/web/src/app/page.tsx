"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Project } from "@/lib/types";
import RunSummary from "@/components/RunSummary";
import DropdownMenu from "@/components/DropdownMenu";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { PlusIcon } from "@/components/icons";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const loadProjects = () => {
    apiFetch<Project[]>("/projects").then((p) => { setProjects(p); setLoading(false); });
  };

  useEffect(() => { loadProjects(); }, []);

  const createProject = async () => {
    if (!name.trim()) return;
    await apiFetch("/projects", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    loadProjects();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
      }}>
        <div style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "20px 16px",
        }}>
          <div className="responsive-row">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--color-accent), #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 24px var(--color-accent-dim)",
            }}>
              T
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}>
                TestOps
              </h1>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 2,
              }}>
                test management
              </div>
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 64px" }}>
        {/* Create project */}
        <div className="animate-in" style={{ marginBottom: 40 }}>
          <div className="section-label">New Project</div>
          <div className="responsive-input-row">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              onKeyDown={(e) => e.key === "Enter" && createProject()}
              style={{ maxWidth: 400, width: "100%" }}
            />
            <button className="btn btn-primary" onClick={createProject}>
              <PlusIcon />
              Create
            </button>
          </div>
        </div>

        {/* Projects */}
        <div className="animate-in stagger-1">
          <div className="section-label">Projects</div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="&#9670;"
            message="No projects yet. Create your first project above to get started."
            className="animate-in stagger-2"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map((p, i) => (
              <div
                key={p.id}
                className={`card animate-in stagger-${Math.min(i + 2, 8)}`}
                style={{ position: "relative", zIndex: menuOpenId === p.id ? 10 : 0 }}
              >
                <Link
                  href={`/projects/${p.id}`}
                  style={{
                    display: "block",
                    padding: "18px 22px",
                  }}
                >
                  <div className="responsive-row">
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 4,
                      }}>
                        {p.name}
                      </div>
                      <div className="wrap-row">
                        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          /{p.slug}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--text-muted)",
                          background: "var(--bg-elevated)",
                          padding: "2px 8px",
                          borderRadius: 3,
                        }}>
                          {p.run_count} runs
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginRight: 32, minWidth: 0 }}>
                      {p.last_total != null && (
                        <RunSummary
                          total={p.last_total}
                          passed={p.last_passed || 0}
                          failed={p.last_failed || 0}
                          skipped={p.last_total - (p.last_passed || 0) - (p.last_failed || 0)}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </Link>
                {/* Menu button positioned absolutely so it doesn't interfere with the link */}
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <DropdownMenu
                    name={p.name}
                    onRename={async (newName) => {
                      await apiFetch(`/projects/${p.id}`, { method: "PUT", body: JSON.stringify({ name: newName }) });
                      loadProjects();
                    }}
                    onDelete={async () => {
                      await apiFetch(`/projects/${p.id}`, { method: "DELETE" });
                      loadProjects();
                    }}
                    onOpenChange={(open) => setMenuOpenId(open ? p.id : null)}
                    stopPropagation
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
