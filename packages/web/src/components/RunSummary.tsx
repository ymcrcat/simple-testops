"use client";

interface RunSummaryProps {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  size?: "sm" | "md" | "lg";
}

export default function RunSummary({ total, passed, failed, skipped, size = "md" }: RunSummaryProps) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  const ringSize = size === "lg" ? 80 : size === "md" ? 56 : 40;
  const stroke = size === "lg" ? 5 : size === "md" ? 4 : 3;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const ringColor = pct >= 80 ? "var(--color-passed)" : pct >= 50 ? "var(--color-skipped)" : "var(--color-failed)";
  const fontSize = size === "lg" ? 18 : size === "md" ? 14 : 11;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "lg" ? 20 : 14 }}>
      <div style={{ position: "relative", width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 4px ${ringColor})`,
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}>
          {pct}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: size === "sm" ? 8 : 14,
        fontFamily: "var(--font-mono)",
        fontSize: size === "sm" ? 11 : 12,
      }}>
        <span style={{ color: "var(--color-passed)" }}>{passed}<span style={{ color: "var(--text-muted)", marginLeft: 2 }}>p</span></span>
        <span style={{ color: "var(--color-failed)" }}>{failed}<span style={{ color: "var(--text-muted)", marginLeft: 2 }}>f</span></span>
        <span style={{ color: "var(--color-skipped)" }}>{skipped}<span style={{ color: "var(--text-muted)", marginLeft: 2 }}>s</span></span>
        <span style={{ color: "var(--text-muted)" }}>{total}</span>
      </div>
    </div>
  );
}
