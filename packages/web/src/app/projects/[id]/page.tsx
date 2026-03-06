"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import RunSummary from "@/components/RunSummary";
import StatusBadge from "@/components/StatusBadge";

interface Project { id: number; name: string; slug: string; }
interface Run { id: number; name: string; started_at: string; total: number; passed: number; failed: number; skipped: number; }

function ProjectMenu({ project, onRename, onDelete }: { project: Project; onRename: (name: string) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setOpen(false); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleRename = () => {
    if (!newName.trim() || newName === project.name) { setRenaming(false); return; }
    onRename(newName);
    setRenaming(false);
    setOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
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
          onClick={(e) => e.stopPropagation()}
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
                onClick={() => { setOpen(false); onDelete(); }}
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

export default function ProjectOverview() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    apiFetch<Project>(`/projects/${params.id}`).then(setProject);
    apiFetch<Run[]>(`/runs?project_id=${params.id}`).then(setRuns);
  }, [params.id]);

  const handleRename = async (name: string) => {
    const updated = await apiFetch<Project>(`/projects/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    setProject(updated);
  };

  const handleDelete = async () => {
    await apiFetch(`/projects/${params.id}`, { method: "DELETE" });
    router.push("/");
  };

  if (!project) return <div className="page-loader">Loading...</div>;

  const latest = runs[0];
  const totalTests = runs.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = runs.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = runs.reduce((sum, r) => sum + r.failed, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}>
            {project.name}
          </h1>
          <ProjectMenu project={project} onRename={handleRename} onDelete={handleDelete} />
        </div>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 13 }}>/{project.slug}</span>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        {[
          { label: "Total Runs", value: runs.length, color: "var(--color-accent)" },
          { label: "Total Tests", value: totalTests, color: "var(--text-primary)" },
          { label: "Total Passed", value: totalPassed, color: "var(--color-passed)" },
          { label: "Total Failed", value: totalFailed, color: "var(--color-failed)" },
        ].map((stat, i) => (
          <div key={stat.label} className={`card-static animate-in stagger-${i + 1}`} style={{ padding: "16px 20px" }}>
            <div className="section-label" style={{ marginBottom: 6 }}>{stat.label}</div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 28,
              fontWeight: 700,
              color: stat.color,
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Latest run */}
      {latest ? (
        <div className="animate-in stagger-3" style={{ marginBottom: 32 }}>
          <div className="section-label">Latest Run</div>
          <Link href={`/projects/${params.id}/runs/${latest.id}`} className="card" style={{
            display: "block",
            padding: "20px 24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 4,
                }}>
                  {latest.name}
                </div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {latest.started_at}
                </div>
              </div>
              <RunSummary total={latest.total} passed={latest.passed} failed={latest.failed} skipped={latest.skipped} size="md" />
            </div>
          </Link>
        </div>
      ) : (
        <div className="empty-state animate-in stagger-3">
          <div className="icon">&#9655;</div>
          <p>No test runs yet. Upload results via the CLI to see them here.</p>
        </div>
      )}

      {/* Recent runs */}
      {runs.length > 1 && (
        <div className="animate-in stagger-4">
          <div className="section-label">Recent Runs</div>
          <div className="card-static" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Date</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/projects/${params.id}/runs/${r.id}`} style={{ color: "var(--color-accent)", fontWeight: 500 }}>
                        {r.name || `Run #${r.id}`}
                      </Link>
                    </td>
                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.started_at}</td>
                    <td className="mono" style={{ color: "var(--color-passed)" }}>{r.passed}</td>
                    <td className="mono" style={{ color: r.failed > 0 ? "var(--color-failed)" : "var(--text-muted)" }}>{r.failed}</td>
                    <td className="mono" style={{ color: "var(--text-secondary)" }}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
