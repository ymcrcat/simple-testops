"use client";

const config: Record<string, { color: string; bg: string; glow: string }> = {
  passed: { color: "var(--color-passed)", bg: "var(--color-passed-dim)", glow: "var(--color-passed-glow)" },
  failed: { color: "var(--color-failed)", bg: "var(--color-failed-dim)", glow: "var(--color-failed-glow)" },
  skipped: { color: "var(--color-skipped)", bg: "var(--color-skipped-dim)", glow: "var(--color-skipped-glow)" },
  broken: { color: "var(--color-broken)", bg: "var(--color-broken-dim)", glow: "var(--color-broken-glow)" },
  not_run: { color: "var(--text-muted)", bg: "var(--bg-elevated)", glow: "transparent" },
  active: { color: "var(--color-accent)", bg: "var(--color-accent-dim)", glow: "var(--color-accent-glow)" },
  deprecated: { color: "var(--text-muted)", bg: "var(--bg-elevated)", glow: "transparent" },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] || config.deprecated;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: c.color,
        background: c.bg,
        padding: "3px 10px",
        borderRadius: 4,
        boxShadow: `0 0 12px ${c.glow}`,
      }}
    >
      <span style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: c.color,
        boxShadow: `0 0 6px ${c.color}`,
      }} />
      {status === "not_run" ? "not run" : status}
    </span>
  );
}
