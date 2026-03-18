"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

interface TestCase {
  id: number;
  name: string;
  class_name: string;
  feature_name: string;
  story_name: string;
  story_priority: string | null;
  status: string;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  P0: { bg: "var(--color-failed-glow)", text: "var(--color-failed)" },
  P1: { bg: "var(--color-skipped-glow)", text: "var(--color-skipped)" },
  P2: { bg: "var(--bg-elevated)", text: "var(--text-muted)" },
};

const PRIORITY_OPTIONS = ["P0", "P1", "P2"];

export default function CasesPage() {
  const params = useParams();
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    apiFetch<TestCase[]>(`/testcases?project_id=${params.id}`).then((c) => { setCases(c); setLoading(false); });
  }, [params.id]);

  const filtered = priorityFilter === "all"
    ? cases
    : priorityFilter === "none"
      ? cases.filter((tc) => !tc.story_priority)
      : cases.filter((tc) => tc.story_priority === priorityFilter);

  return (
    <div>
      <div className="responsive-row" style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}>
          Test Cases
        </h1>
        <div className="wrap-row" style={{ justifyContent: "space-between" }}>
          <div className="wrap-row" style={{ gap: 6 }}>
            <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>Priority:</span>
            {["all", ...PRIORITY_OPTIONS, "none"].map((opt) => {
              const active = priorityFilter === opt;
              const colors = opt !== "all" && opt !== "none" ? priorityColors[opt] : null;
              return (
                <button
                  key={opt}
                  onClick={() => setPriorityFilter(opt)}
                  style={{
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: active
                      ? colors ? colors.text : "var(--border-active)"
                      : "var(--border)",
                    background: active
                      ? colors ? colors.bg : "var(--bg-elevated)"
                      : "transparent",
                    color: active
                      ? colors ? colors.text : "var(--text-primary)"
                      : "var(--text-muted)",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {opt === "none" ? "No priority" : opt === "all" ? "All" : opt}
                </button>
              );
            })}
          </div>
          <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {filtered.length} cases
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 48 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9744;</div>
          <p>{cases.length === 0 ? "No test cases defined. Create features and stories first, then add test cases." : "No test cases match the selected priority filter."}</p>
        </div>
      ) : (
        <>
        <div className="card-static animate-in desktop-table" style={{ overflow: "hidden" }}>
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Feature</th>
                <th>Story</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tc) => {
                const p = tc.story_priority;
                const colors = p ? priorityColors[p] : null;
                return (
                  <tr key={tc.id}>
                    <td style={{ fontWeight: 500 }}>{tc.name}</td>
                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{tc.class_name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{tc.feature_name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{tc.story_name}</td>
                    <td>
                      {p && colors ? (
                        <span style={{
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 6,
                          background: colors.bg,
                          color: colors.text,
                          letterSpacing: "0.05em",
                        }}>
                          {p}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>&mdash;</span>
                      )}
                    </td>
                    <td><StatusBadge status={tc.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        <div className="mobile-list animate-in">
          {filtered.map((tc) => {
            const p = tc.story_priority;
            const colors = p ? priorityColors[p] : null;
            return (
              <div key={tc.id} className="card-static" style={{ padding: "14px 16px" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{tc.name}</div>
                {tc.class_name && (
                  <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>{tc.class_name}</div>
                )}
                <div className="wrap-row" style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
                  <span>{tc.feature_name}</span>
                  <span style={{ color: "var(--text-muted)" }}>/</span>
                  <span>{tc.story_name}</span>
                </div>
                <div className="wrap-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    {p && colors ? (
                      <span style={{
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        background: colors.bg,
                        color: colors.text,
                        letterSpacing: "0.05em",
                      }}>
                        {p}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No priority</span>
                    )}
                  </div>
                  <StatusBadge status={tc.status} />
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
