"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import RunSummary from "@/components/RunSummary";

interface Project {
  id: number;
  name: string;
  slug: string;
  run_count: number;
  last_passed: number | null;
  last_failed: number | null;
  last_total: number | null;
}

function ProjectMenu({ project, onUpdate, onOpenChange }: { project: Project; onUpdate: () => void; onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setOpen(false); onOpenChange(false); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleRename = async () => {
    if (!newName.trim() || newName === project.name) { setRenaming(false); return; }
    await apiFetch(`/projects/${project.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });
    setRenaming(false);
    setOpen(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await apiFetch(`/projects/${project.id}`, { method: "DELETE" });
    setOpen(false);
    onUpdate();
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = !open; setOpen(next); onOpenChange(next); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 6px",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            width: 200,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-active)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 50,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {renaming ? (
            <div style={{ padding: 10 }}>
              <input
                ref={inputRef}
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") { setRenaming(false); setNewName(project.name); }
                }}
                style={{ fontSize: 13, padding: "6px 10px", marginBottom: 6 }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setRenaming(false); setNewName(project.name); }}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRename}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setRenaming(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  transition: "all 0.1s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Rename
              </button>
              <div style={{ height: 1, background: "var(--border)" }} />
              <button
                onClick={handleDelete}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-failed)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  transition: "all 0.1s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-failed-glow)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
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
      </header>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* Create project */}
        <div className="animate-in" style={{ marginBottom: 40 }}>
          <div className="section-label">New Project</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              onKeyDown={(e) => e.key === "Enter" && createProject()}
              style={{ maxWidth: 400 }}
            />
            <button className="btn btn-primary" onClick={createProject}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create
            </button>
          </div>
        </div>

        {/* Projects */}
        <div className="animate-in stagger-1">
          <div className="section-label">Projects</div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80 }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state animate-in stagger-2">
            <div className="icon">&#9670;</div>
            <p>No projects yet. Create your first project above to get started.</p>
          </div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 4,
                      }}>
                        {p.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginRight: 32 }}>
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
                  <ProjectMenu project={p} onUpdate={loadProjects} onOpenChange={(open) => setMenuOpenId(open ? p.id : null)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
