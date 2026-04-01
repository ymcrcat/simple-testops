"use client";

import { useState, useRef } from "react";
import type { Run } from "@/lib/types";

interface RunHistoryChartProps {
  runs: Run[];
  maxBars?: number;
}

interface BarData {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  name: string;
  date: string;
  label: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RunHistoryChart({ runs, maxBars = 25 }: RunHistoryChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const bars: BarData[] = runs
    .slice(0, maxBars)
    .reverse()
    .map((r) => ({
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      total: r.passed + r.failed + r.skipped,
      name: r.name || `Run #${r.id}`,
      date: r.started_at,
      label: formatDate(r.started_at),
    }));

  const maxTotal = Math.max(...bars.map((b) => b.total), 1);
  const chartHeight = 180;
  const barGap = 3;

  const handleMouseMove = (e: React.MouseEvent, i: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const tt = tooltipRef.current;
    const ttW = tt?.offsetWidth || 160;
    const ttH = tt?.offsetHeight || 120;
    let x = e.clientX - rect.left + 12;
    let y = e.clientY - rect.top - 10;
    // Keep tooltip within container bounds
    if (x + ttW > rect.width) x = e.clientX - rect.left - ttW - 12;
    if (y + ttH > rect.height) y = rect.height - ttH;
    if (y < 0) y = 0;
    setTooltipPos({ x, y });
    setHovered(i);
  };

  const hoveredBar = hovered !== null ? bars[hovered] : null;

  return (
    <div>
      <div className="section-label">Run History</div>
      <div className="card-static" style={{ padding: "20px 16px 12px 16px", position: "relative", overflow: "hidden" }} ref={containerRef}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: barGap, height: chartHeight }}>
          {bars.map((bar, i) => {
            const barHeight = (bar.total / maxTotal) * chartHeight;
            const passedH = (bar.passed / bar.total) * barHeight;
            const failedH = (bar.failed / bar.total) * barHeight;
            const skippedH = (bar.skipped / bar.total) * barHeight;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: barHeight,
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  opacity: hovered !== null && hovered !== i ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => setHovered(null)}
              >
                {skippedH > 0 && (
                  <div style={{ height: skippedH, background: "#fbbf24", minHeight: skippedH > 0 ? 1 : 0 }} />
                )}
                {failedH > 0 && (
                  <div style={{ height: failedH, background: "#f87171", minHeight: failedH > 0 ? 1 : 0 }} />
                )}
                <div style={{ flex: 1, background: "#34d399" }} />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: "flex", gap: barGap, marginTop: 8 }}>
          {bars.map((bar, i) => {
            // Show label for first, last, and roughly evenly spaced bars
            const showLabel = i === 0 || i === bars.length - 1 || (bars.length > 5 && i % Math.ceil(bars.length / 5) === 0);
            return (
              <div key={i} style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#505872",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}>
                {showLabel ? bar.label : ""}
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredBar && hovered !== null && (
          <div ref={tooltipRef} style={{
            position: "absolute",
            left: tooltipPos.x,
            top: tooltipPos.y,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-active)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 10,
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "var(--text-primary)" }}>
              {hoveredBar.name}
            </div>
            <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>{hoveredBar.date}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ color: "#34d399" }}>{hoveredBar.passed} passed</span>
              <span style={{ color: "#f87171" }}>{hoveredBar.failed} failed</span>
              <span style={{ color: "#fbbf24" }}>{hoveredBar.skipped} skipped</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
