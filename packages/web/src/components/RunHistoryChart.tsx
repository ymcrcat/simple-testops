"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Run } from "@/lib/types";

interface RunHistoryChartProps {
  runs: Run[];
  maxBars?: number;
}

interface ChartDatum {
  label: string;
  passed: number;
  failed: number;
  skipped: number;
  name: string;
  date: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDatum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartDatum;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-active)",
      borderRadius: "var(--radius-md)",
      padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      fontFamily: "var(--font-mono)",
      fontSize: 12,
    }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "var(--text-primary)" }}>
        {d.name}
      </div>
      <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>{d.date}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ color: "#34d399" }}>{d.passed} passed</span>
        <span style={{ color: "#f87171" }}>{d.failed} failed</span>
        <span style={{ color: "#fbbf24" }}>{d.skipped} skipped</span>
      </div>
    </div>
  );
}

export default function RunHistoryChart({ runs, maxBars = 25 }: RunHistoryChartProps) {
  const display = runs
    .slice(0, maxBars)
    .reverse()
    .map((r): ChartDatum => ({
      label: formatDate(r.started_at),
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      name: r.name || `Run #${r.id}`,
      date: r.started_at,
    }));

  return (
    <div>
      <div className="section-label">Run History</div>
      <div className="card-static" style={{ padding: "20px 16px 12px 8px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={display} barCategoryGap="16%">
            <YAxis hide domain={[0, "auto"]} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#505872", fontFamily: "var(--font-mono)", fontSize: 10 }}
              axisLine={{ stroke: "#222840" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="passed" stackId="a" fill="#34d399" />
            <Bar dataKey="failed" stackId="a" fill="#f87171" />
            <Bar dataKey="skipped" stackId="a" fill="#fbbf24" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
