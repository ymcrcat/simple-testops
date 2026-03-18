"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import RunSummary from "@/components/RunSummary";
import DropdownMenu from "@/components/DropdownMenu";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import type { Run } from "@/lib/types";

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
        <LoadingSkeleton count={3} height={76} />
      ) : runs.length === 0 ? (
        <EmptyState icon="&#9655;" message="No test runs yet. Upload JUnit XML results via the CLI." />
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
                  <DropdownMenu
                    name={r.name || ""}
                    onRename={async (newName) => {
                      await apiFetch(`/runs/${r.id}`, { method: "PUT", body: JSON.stringify({ name: newName }) });
                      loadRuns();
                    }}
                    onDelete={async () => {
                      await apiFetch(`/runs/${r.id}`, { method: "DELETE" });
                      loadRuns();
                    }}
                    onOpenChange={(open) => setMenuOpenId(open ? r.id : null)}
                    stopPropagation
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
