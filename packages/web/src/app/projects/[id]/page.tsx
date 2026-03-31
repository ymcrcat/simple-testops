"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import RunSummary from "@/components/RunSummary";
import StatusBadge from "@/components/StatusBadge";
import DropdownMenu from "@/components/DropdownMenu";
import RunHistoryChart from "@/components/RunHistoryChart";
import type { Project, Run } from "@/lib/types";

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
        <div className="responsive-row" style={{ alignItems: "flex-start" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}>
            {project.name}
          </h1>
          <DropdownMenu name={project.name} onRename={handleRename} onDelete={handleDelete} />
        </div>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 13 }}>/{project.slug}</span>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
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

      {/* Run history chart */}
      {runs.length > 1 && (
        <div className="animate-in stagger-3" style={{ marginBottom: 32 }}>
          <RunHistoryChart runs={runs} />
        </div>
      )}

      {/* Latest run */}
      {latest ? (
        <div className="animate-in stagger-4" style={{ marginBottom: 32 }}>
          <div className="section-label">Latest Run</div>
          <Link href={`/projects/${params.id}/runs/${latest.id}`} className="card" style={{
            display: "block",
            padding: "20px 24px",
          }}>
            <div className="responsive-row">
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
              <RunSummary total={latest.total} passed={latest.passed} failed={latest.failed} skipped={latest.skipped} notRun={latest.not_run} size="md" />
            </div>
          </Link>
        </div>
      ) : (
        <div className="empty-state animate-in stagger-4">
          <div className="icon">&#9655;</div>
          <p>No test runs yet. Upload results via the CLI to see them here.</p>
        </div>
      )}

      {/* Recent runs */}
      {runs.length > 1 && (
        <div className="animate-in stagger-5">
          <div className="section-label">Recent Runs</div>
          <div className="card-static desktop-table" style={{ overflow: "hidden" }}>
            <div className="table-scroll">
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
          <div className="mobile-list">
            {runs.slice(0, 8).map((r) => (
              <Link key={r.id} href={`/projects/${params.id}/runs/${r.id}`} className="card-static" style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 4 }}>
                  {r.name || `Run #${r.id}`}
                </div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>{r.started_at}</div>
                <div className="wrap-row" style={{ fontSize: 12 }}>
                  <span className="mono" style={{ color: "var(--color-passed)" }}>{r.passed} passed</span>
                  <span className="mono" style={{ color: r.failed > 0 ? "var(--color-failed)" : "var(--text-muted)" }}>{r.failed} failed</span>
                  <span className="mono" style={{ color: "var(--text-secondary)" }}>{r.total} total</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
