"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import TestCaseTree from "@/components/TestCaseTree";

export default function FeaturesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [featureName, setFeatureName] = useState("");
  const [refresh, setRefresh] = useState(0);

  const createFeature = async () => {
    if (!featureName.trim()) return;
    await apiFetch("/features", {
      method: "POST",
      body: JSON.stringify({ project_id: parseInt(projectId), name: featureName }),
    });
    setFeatureName("");
    setRefresh((r) => r + 1);
  };

  return (
    <div>
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
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            placeholder="New feature name..."
            onKeyDown={(e) => e.key === "Enter" && createFeature()}
            style={{ maxWidth: 320 }}
          />
          <button className="btn btn-primary" onClick={createFeature}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Feature
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="card-static animate-in stagger-1" style={{ padding: "8px 12px" }}>
        <TestCaseTree key={refresh} projectId={projectId} />
      </div>
    </div>
  );
}
