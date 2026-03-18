"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
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
}

interface TestResult {
  id: number;
  name: string;
  class_name: string;
  status: string;
  duration_ms: number;
  error_message: string | null;
  case_name: string | null;
  case_class_name: string | null;
  test_case_id: number | null;
  key: string | null;
  feature_name: string | null;
  story_name: string | null;
  story_priority: string | null;
}

interface TestCaseDetail {
  id: number;
  name: string;
  class_name: string | null;
  description: string | null;
  status: string;
}

interface StoryGroup {
  name: string;
  priority: string | null;
  results: TestResult[];
}

interface FeatureGroup {
  name: string;
  stories: StoryGroup[];
}

function groupByFeatureStory(results: TestResult[]): FeatureGroup[] {
  const map = new Map<string, Map<string, { priority: string | null; results: TestResult[] }>>();
  for (const r of results) {
    const feat = r.feature_name || "Ungrouped";
    const story = r.story_name || "Ungrouped";
    if (!map.has(feat)) map.set(feat, new Map());
    const storyMap = map.get(feat)!;
    if (!storyMap.has(story)) storyMap.set(story, { priority: r.story_priority, results: [] });
    storyMap.get(story)!.results.push(r);
  }
  const groups: FeatureGroup[] = [];
  for (const [featName, storyMap] of map) {
    const stories: StoryGroup[] = [];
    for (const [storyName, data] of storyMap) {
      stories.push({ name: storyName, priority: data.priority, results: data.results });
    }
    groups.push({ name: featName, stories });
  }
  return groups;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  P0: { bg: "var(--color-failed-glow)", text: "var(--color-failed)" },
  P1: { bg: "var(--color-skipped-glow)", text: "var(--color-skipped)" },
  P2: { bg: "var(--bg-elevated)", text: "var(--text-muted)" },
};

function PriorityTag({ priority }: { priority: string | null }) {
  if (!priority || !priorityColors[priority]) return null;
  const c = priorityColors[priority];
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 4,
      background: c.bg,
      color: c.text,
      fontWeight: 600,
      lineHeight: 1.2,
      marginLeft: 6,
    }}>
      {priority}
    </span>
  );
}

function statusCounts(results: TestResult[]) {
  let p = 0, f = 0, s = 0, nr = 0;
  for (const r of results) {
    if (r.status === "passed") p++;
    else if (r.status === "failed" || r.status === "broken") f++;
    else if (r.status === "skipped") s++;
    else if (r.status === "not_run") nr++;
  }
  return { p, f, s, nr };
}

function CountBadges({ results }: { results: TestResult[] }) {
  const { p, f, s, nr } = statusCounts(results);
  return (
    <span className="mono" style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>
      {p > 0 && <span style={{ color: "var(--color-passed)" }}>{p}p</span>}
      {f > 0 && <>{p > 0 && " "}<span style={{ color: "var(--color-failed)" }}>{f}f</span></>}
      {s > 0 && <>{(p > 0 || f > 0) && " "}<span style={{ color: "var(--color-skipped)" }}>{s}s</span></>}
      {nr > 0 && <>{(p > 0 || f > 0 || s > 0) && " "}<span style={{ color: "var(--text-muted)" }}>{nr}nr</span></>}
    </span>
  );
}

function RunMenu({ run, onRename, onDelete }: { run: Run; onRename: (name: string) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(run.name || "");
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
    if (!newName.trim() || newName === run.name) { setRenaming(false); return; }
    onRename(newName);
    setRenaming(false);
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete();
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

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [paneVisible, setPaneVisible] = useState(false);
  const [caseDetail, setCaseDetail] = useState<TestCaseDetail | null>(null);
  const [caseDescription, setCaseDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "saving" | "matched" | "no-match">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<Run>(`/runs/${params.runId}`).then(setRun);
    apiFetch<TestResult[]>(`/runs/${params.runId}/coverage`).then((rows) => {
      // Synthesize not_run status for test cases with no result
      setResults(rows.map((r) => r.id == null
        ? { ...r, id: -(r.test_case_id ?? 0), name: r.case_name ?? "", class_name: r.case_class_name ?? "", status: "not_run", duration_ms: 0, error_message: null }
        : r
      ));
    });
  }, [params.runId]);

  const handleRename = async (name: string) => {
    const updated = await apiFetch<Run>(`/runs/${params.runId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    setRun(updated);
  };

  const handleDelete = async () => {
    await apiFetch(`/runs/${params.runId}`, { method: "DELETE" });
    router.push(`/projects/${params.id}/runs`);
  };

  const handleSelectResult = async (r: TestResult) => {
    // Save pending description for previous selection
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (caseDetail && caseDescription !== (caseDetail.description || "")) {
      await apiFetch(`/testcases/${caseDetail.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: caseDescription }),
      });
    }
    if (keyTimeout.current) clearTimeout(keyTimeout.current);
    if (closingTimeout.current) { clearTimeout(closingTimeout.current); closingTimeout.current = null; }
    setSelectedResult(r);
    setPaneVisible(true);
    setKeyValue(r.key || "");
    setKeyStatus("idle");
    if (r.test_case_id) {
      const tc = await apiFetch<TestCaseDetail>(`/testcases/${r.test_case_id}`);
      setCaseDetail(tc);
      setCaseDescription(tc.description || "");
    } else {
      setCaseDetail(null);
      setCaseDescription("");
    }
  };

  const handleDescriptionChange = (value: string) => {
    setCaseDescription(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!caseDetail) return;
      setSaving(true);
      await apiFetch(`/testcases/${caseDetail.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: value }),
      });
      setCaseDetail((prev) => prev ? { ...prev, description: value } : null);
      setSaving(false);
    }, 600);
  };

  const handleKeyChange = (value: string) => {
    setKeyValue(value);
    setKeyStatus("saving");
    if (keyTimeout.current) clearTimeout(keyTimeout.current);
    keyTimeout.current = setTimeout(async () => {
      if (!selectedResult) return;
      const res = await apiFetch<{ matched: boolean; test_case_id: number | null }>(
        `/results/${selectedResult.id}/match`,
        { method: "PUT", body: JSON.stringify({ key: value }) }
      );
      if (res.matched && res.test_case_id) {
        setKeyStatus("matched");
        // Reload the result data to reflect the new link
        const updated = await apiFetch<TestResult[]>(`/runs/${params.runId}/coverage`);
        const rows = updated.map((r) => r.id == null
          ? { ...r, id: -(r.test_case_id ?? 0), name: r.case_name ?? "", class_name: r.case_class_name ?? "", status: "not_run", duration_ms: 0, error_message: null }
          : r
        );
        setResults(rows);
        const updatedResult = rows.find((r) => r.id === selectedResult.id);
        if (updatedResult) {
          setSelectedResult(updatedResult);
          if (updatedResult.test_case_id) {
            const tc = await apiFetch<TestCaseDetail>(`/testcases/${updatedResult.test_case_id}`);
            setCaseDetail(tc);
            setCaseDescription(tc.description || "");
          }
        }
      } else {
        setKeyStatus(value.trim() ? "no-match" : "idle");
        setCaseDetail(null);
        setCaseDescription("");
      }
    }, 600);
  };

  const handleClosePane = () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (keyTimeout.current) clearTimeout(keyTimeout.current);
    if (caseDetail && caseDescription !== (caseDetail.description || "")) {
      apiFetch(`/testcases/${caseDetail.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: caseDescription }),
      });
    }
    setPaneVisible(false);
    closingTimeout.current = setTimeout(() => {
      setSelectedResult(null);
      setCaseDetail(null);
      closingTimeout.current = null;
    }, 200);
  };

  const reloadCoverage = async () => {
    const updated = await apiFetch<TestResult[]>(`/runs/${params.runId}/coverage`);
    const rows = updated.map((r) => r.id == null
      ? { ...r, id: -(r.test_case_id ?? 0), name: r.case_name ?? "", class_name: r.case_class_name ?? "", status: "not_run", duration_ms: 0, error_message: null }
      : r
    );
    setResults(rows);
    const updatedRun = await apiFetch<Run>(`/runs/${params.runId}`);
    setRun(updatedRun);
    return rows;
  };

  const handleSetStatus = async (status: string) => {
    if (!selectedResult) return;

    if (selectedResult.status === "not_run") {
      // Create a new manual result
      await apiFetch(`/runs/${params.runId}/results`, {
        method: "POST",
        body: JSON.stringify({ test_case_id: selectedResult.test_case_id, status }),
      });
    } else {
      // Update existing result
      await apiFetch(`/results/${selectedResult.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    }

    const rows = await reloadCoverage();
    // Re-select the updated result
    const updatedResult = selectedResult.status === "not_run"
      ? rows.find((r) => r.test_case_id === selectedResult.test_case_id && r.status !== "not_run")
      : rows.find((r) => r.id === selectedResult.id);
    if (updatedResult) {
      setSelectedResult(updatedResult);
      if (updatedResult.test_case_id) {
        const tc = await apiFetch<TestCaseDetail>(`/testcases/${updatedResult.test_case_id}`);
        setCaseDetail(tc);
        setCaseDescription(tc.description || "");
      }
    }
  };

  if (!run) return <div className="page-loader">Loading run data...</div>;

  const filtered = filter ? results.filter((r) => r.status === filter) : results;
  const groups = groupByFeatureStory(filtered);
  const errors = filtered.filter((r) => r.error_message);

  const notRunCount = results.filter((r) => r.status === "not_run").length;

  const filterButtons = [
    { value: "", label: "All", count: results.length },
    { value: "passed", label: "Passed", count: results.filter((r) => r.status === "passed").length },
    { value: "failed", label: "Failed", count: results.filter((r) => r.status === "failed").length },
    { value: "skipped", label: "Skipped", count: results.filter((r) => r.status === "skipped").length },
    { value: "broken", label: "Broken", count: results.filter((r) => r.status === "broken").length },
    { value: "not_run", label: "Not Run", count: notRunCount },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 6,
          }}>
            {run.name || `Run #${run.id}`}
          </h1>
          <RunMenu run={run} onRename={handleRename} onDelete={handleDelete} />
        </div>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12, display: "flex", gap: 16 }}>
          <span>Started {run.started_at}</span>
          <span style={{ color: "var(--border-active)" }}>|</span>
          <span>Finished {run.finished_at}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="card-static animate-in" style={{ padding: "20px 24px", marginBottom: 28 }}>
        <RunSummary total={run.total} passed={run.passed} failed={run.failed} skipped={run.skipped} notRun={notRunCount} size="lg" />
      </div>

      {/* Filter */}
      <div className="animate-in stagger-1" style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {filterButtons.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-ghost ${filter === f.value ? "active" : ""}`}
            style={{ fontSize: 12 }}
          >
            {f.label}
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              opacity: 0.6,
              marginLeft: 2,
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results grouped by Feature → Story */}
      <div className="animate-in stagger-2" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {groups.map((feat) => {
          const allFeatResults = feat.stories.flatMap((s) => s.results);
          return (
            <details key={feat.name} open>
              <summary style={{
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "-0.02em",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                {feat.name}
                <CountBadges results={allFeatResults} />
              </summary>
              <div style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {feat.stories.map((story) => (
                  <details key={story.name} open>
                    <summary style={{
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      padding: "4px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      {story.name}
                      <PriorityTag priority={story.priority} />
                      <CountBadges results={story.results} />
                    </summary>
                    <div className="card-static" style={{ overflow: "hidden", marginTop: 4, marginBottom: 4 }}>
                      <table className="data-table">
                        <tbody>
                          {story.results.map((r) => (
                            <tr
                              key={r.id}
                              className="status-row"
                              data-status={r.status}
                              onClick={() => handleSelectResult(r)}
                              style={{
                                cursor: "pointer",
                                background: selectedResult?.id === r.id ? "var(--bg-elevated)" : undefined,
                                opacity: r.status === "not_run" ? 0.45 : undefined,
                              }}
                            >
                              <td style={{ padding: 0, width: 4 }}></td>
                              <td style={{ fontWeight: 500, fontSize: 13 }}>{r.case_name || r.name}</td>
                              <td style={{ width: 100, textAlign: "center" }}><StatusBadge status={r.status} /></td>
                              <td className="mono" style={{ width: 80, textAlign: "right", color: "var(--text-secondary)", fontSize: 12 }}>
                                {r.status === "not_run" ? <span style={{ color: "var(--text-muted)" }}>&mdash;</span> : <>{r.duration_ms}<span style={{ color: "var(--text-muted)" }}>ms</span></>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No results match this filter.
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="animate-in stagger-3">
          <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-failed)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Errors ({errors.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {errors.map((r) => (
              <div key={r.id} className="error-block">
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}>
                  {r.name}
                </div>
                <pre>{r.error_message}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating test case detail pane */}
      {selectedResult && createPortal(
        <>
        <div
          onClick={handleClosePane}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: 400,
            background: "var(--bg-surface)",
            borderLeft: "1px solid var(--border)",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            transform: paneVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.2s ease-out",
          }}
        >
          {/* Pane header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}>
              {selectedResult.case_name || selectedResult.name}
            </div>
            <button
              onClick={handleClosePane}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--radius-sm)",
                transition: "color 0.15s",
                flexShrink: 0,
                marginLeft: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Result info */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, fontSize: 12 }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Status </span>
                <StatusBadge status={selectedResult.status} />
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Duration </span>
                <span className="mono" style={{ color: "var(--text-secondary)" }}>
                  {selectedResult.duration_ms}ms
                </span>
              </div>
              {selectedResult.feature_name && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Feature </span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedResult.feature_name}</span>
                </div>
              )}
              {selectedResult.story_name && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Story </span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedResult.story_name}</span>
                </div>
              )}
              {selectedResult.class_name && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Class </span>
                  <span className="mono" style={{ color: "var(--text-secondary)" }}>{selectedResult.class_name}</span>
                </div>
              )}
            </div>

            {/* Manual status buttons */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-label">Set Status</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["passed", "failed", "skipped"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetStatus(s)}
                    className="btn btn-ghost"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      border: selectedResult.status === s ? `1.5px solid var(--color-${s === "failed" ? "failed" : s})` : "1px solid var(--border)",
                      background: selectedResult.status === s ? `var(--color-${s === "failed" ? "failed" : s}-glow)` : undefined,
                      color: selectedResult.status === s ? `var(--color-${s === "failed" ? "failed" : s})` : "var(--text-secondary)",
                      fontWeight: selectedResult.status === s ? 600 : 400,
                    }}
                  >
                    {s === "passed" ? "✓ Pass" : s === "failed" ? "✗ Fail" : "⊘ Skip"}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Key (only for real results, not synthesized not_run) */}
            {selectedResult.id > 0 && <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}>
                <div className="section-label" style={{ margin: 0 }}>Key</div>
                {keyStatus === "saving" && (
                  <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>Matching...</span>
                )}
                {keyStatus === "matched" && (
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-passed)" }}>Matched</span>
                )}
                {keyStatus === "no-match" && (
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-skipped)" }}>No match</span>
                )}
              </div>
              <input
                className="input mono"
                value={keyValue}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="Enter key to match a test case..."
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
              />
            </div>}

            {/* Error message */}
            {selectedResult.error_message && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">Error</div>
                <div className="error-block">
                  <pre>{selectedResult.error_message}</pre>
                </div>
              </div>
            )}

            {/* Test case description (if linked to a test case) */}
            {caseDetail ? (
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}>
                  <div className="section-label" style={{ margin: 0 }}>Description</div>
                  {saving && (
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      Saving...
                    </span>
                  )}
                </div>
                <textarea
                  className="input"
                  value={caseDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Add a description for this test case..."
                  style={{
                    width: "100%",
                    minHeight: 140,
                    resize: "vertical",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: "10px 12px",
                  }}
                />
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                This result is not linked to a test case.
              </div>
            )}
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  );
}
