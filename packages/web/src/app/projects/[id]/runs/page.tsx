"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import RunSummary from "@/components/RunSummary";

interface Run {
  id: number;
  name: string;
  started_at: string;
  finished_at: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  not_run: number;
}

function RunMenu({ run, onUpdate, onOpenChange }: { run: Run; onUpdate: () => void; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(run.name || "");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setOpen(false); onOpenChange?.(false); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleRename = async () => {
    if (!newName.trim() || newName === run.name) { setRenaming(false); return; }
    await apiFetch(`/runs/${run.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });
    setRenaming(false);
    setOpen(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await apiFetch(`/runs/${run.id}`, { method: "DELETE" });
    setOpen(false);
    onUpdate();
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = !open; setOpen(next); onOpenChange?.(next); }}
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
                  if (e.key === "Escape") { setRenaming(false); setNewName(run.name || ""); }
                }}
                style={{ fontSize: 13, padding: "6px 10px", marginBottom: 6 }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setRenaming(false); setNewName(run.name || ""); }}
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

export default function RunsPage() {
  const params = useParams();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const loadRuns = () => {
    apiFetch<Run[]>(`/runs?project_id=${params.id}`).then((r) => { setRuns(r); setLoading(false); });
  };

  useEffect(() => { loadRuns(); }, [params.id]);

  return (
    <div>
      <div className="responsive-row" style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}>
          Test Runs
        </h1>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {runs.length} runs
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 76 }} />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9655;</div>
          <p>No test runs yet. Upload JUnit XML results via the CLI.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {runs.map((r, i) => {
            const pct = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
            return (
              <div
                key={r.id}
                className={`card animate-in stagger-${Math.min(i + 1, 8)}`}
                style={{
                  position: "relative",
                  zIndex: menuOpenId === r.id ? 10 : 0,
                }}
              >
                <Link
                  href={`/projects/${params.id}/runs/${r.id}`}
                  style={{
                    display: "block",
                    padding: "18px 22px",
                  }}
                >
                  {/* Pass rate background bar */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${pct >= 80 ? "var(--color-passed-glow)" : pct >= 50 ? "var(--color-skipped-glow)" : "var(--color-failed-glow)"}, transparent)`,
                    transition: "width 0.6s ease-out",
                    borderRadius: "inherit",
                  }} />

                  <div className="responsive-row" style={{ position: "relative" }}>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 15,
                        marginBottom: 4,
                      }}>
                        {r.name || `Run #${r.id}`}
                      </div>
                      <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        {r.started_at}
                      </div>
                    </div>
                    <div style={{ marginRight: 32 }}>
                      <RunSummary
                        total={r.total}
                        passed={r.passed}
                        failed={r.failed}
                        skipped={r.skipped}
                        notRun={r.not_run}
                        size="sm"
                      />
                    </div>
                  </div>
                </Link>
                <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}>
                  <RunMenu run={r} onUpdate={loadRuns} onOpenChange={(open) => setMenuOpenId(open ? r.id : null)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
