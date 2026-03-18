"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import TestCaseTree, { TestCase } from "@/components/TestCaseTree";

export default function FeaturesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [featureName, setFeatureName] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [description, setDescription] = useState("");
  const [testKey, setTestKey] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createFeature = async () => {
    if (!featureName.trim()) return;
    await apiFetch("/features", {
      method: "POST",
      body: JSON.stringify({ project_id: parseInt(projectId), name: featureName }),
    });
    setFeatureName("");
    setRefresh((r) => r + 1);
  };

  const handleSelectCase = async (tc: TestCase) => {
    // Save pending changes for previous case
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (selectedCase) {
      const updates: Record<string, string> = {};
      if (description !== (selectedCase.description || "")) updates.description = description;
      if (testKey !== (selectedCase.key || "")) updates.key = testKey;
      if (Object.keys(updates).length > 0) {
        await apiFetch(`/testcases/${selectedCase.id}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });
      }
    }
    // Fetch latest from API to get up-to-date fields
    const fresh = await apiFetch<TestCase>(`/testcases/${tc.id}`);
    setSelectedCase(fresh);
    setDescription(fresh.description || "");
    setTestKey(fresh.key || "");
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!selectedCase) return;
      setSaving(true);
      await apiFetch(`/testcases/${selectedCase.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: value }),
      });
      setSelectedCase((prev) => prev ? { ...prev, description: value } : null);
      setSaving(false);
    }, 600);
  };

  const handleKeyChange = (value: string) => {
    setTestKey(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!selectedCase) return;
      setSaving(true);
      await apiFetch(`/testcases/${selectedCase.id}`, {
        method: "PUT",
        body: JSON.stringify({ key: value }),
      });
      setSelectedCase((prev) => prev ? { ...prev, key: value } : null);
      setSaving(false);
    }, 600);
  };

  const handleClosePane = () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (selectedCase) {
      const updates: Record<string, string> = {};
      if (description !== (selectedCase.description || "")) updates.description = description;
      if (testKey !== (selectedCase.key || "")) updates.key = testKey;
      if (Object.keys(updates).length > 0) {
        apiFetch(`/testcases/${selectedCase.id}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });
      }
    }
    setSelectedCase(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ flexShrink: 0 }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 24,
        }}>
          Features & Stories
        </h1>

        {/* Add feature */}
        <div className="animate-in" style={{ marginBottom: 28 }}>
          <div className="responsive-input-row">
            <input
              className="input"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="New feature name..."
              onKeyDown={(e) => e.key === "Enter" && createFeature()}
              style={{ maxWidth: 320, width: "100%" }}
            />
            <button className="btn btn-primary" onClick={createFeature}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Feature
            </button>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0, flexWrap: "wrap" }}>
        {/* Tree */}
        <div
          className="card-static animate-in stagger-1"
          style={{
            padding: "8px 12px",
            flex: 1,
            width: "100%",
            minWidth: 0,
            overflowY: "auto",
            minHeight: 320,
          }}
        >
          <TestCaseTree
            key={refresh}
            projectId={projectId}
            selectedCaseId={selectedCase?.id}
            onSelectCase={handleSelectCase}
          />
        </div>

        {/* Detail pane */}
        {selectedCase && (
          <div
            className="card-static animate-in"
            style={{
              width: "100%",
              maxWidth: 360,
              flexShrink: 0,
              padding: 0,
              overflowY: "auto",
            }}
          >
            {/* Pane header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
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
                {selectedCase.name}
              </div>
              <button
                onClick={handleClosePane}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px",
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

            {/* Status & class */}
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Status </span>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    color: selectedCase.status === "active" ? "var(--color-accent)" : "var(--text-muted)",
                  }}>
                    {selectedCase.status}
                  </span>
                </div>
                {selectedCase.class_name && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Class </span>
                    <span className="mono" style={{ color: "var(--text-secondary)" }}>
                      {selectedCase.class_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pytest Key */}
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
              <div className="section-label" style={{ margin: 0, marginBottom: 6 }}>Pytest Key</div>
              <input
                className="input"
                value={testKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="e.g. test_login_valid_credentials"
                style={{
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  padding: "8px 10px",
                }}
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Matches pytest function name in JUnit XML results
              </div>
            </div>

            {/* Description */}
            <div style={{ padding: "14px 18px" }}>
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
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add a description for this test case..."
                style={{
                  width: "100%",
                  minHeight: 160,
                  resize: "vertical",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: "10px 12px",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
