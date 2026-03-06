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
  status: string;
}

export default function CasesPage() {
  const params = useParams();
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TestCase[]>(`/testcases?project_id=${params.id}`).then((c) => { setCases(c); setLoading(false); });
  }, [params.id]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}>
          Test Cases
        </h1>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {cases.length} cases
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 48 }} />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9744;</div>
          <p>No test cases defined. Create features and stories first, then add test cases.</p>
        </div>
      ) : (
        <div className="card-static animate-in" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Feature</th>
                <th>Story</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((tc) => (
                <tr key={tc.id}>
                  <td style={{ fontWeight: 500 }}>{tc.name}</td>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{tc.class_name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{tc.feature_name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{tc.story_name}</td>
                  <td><StatusBadge status={tc.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
