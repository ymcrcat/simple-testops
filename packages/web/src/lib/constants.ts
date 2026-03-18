// Shared constants

export const priorityColors: Record<string, { bg: string; text: string }> = {
  P0: { bg: "var(--color-failed-glow)", text: "var(--color-failed)" },
  P1: { bg: "var(--color-skipped-glow)", text: "var(--color-skipped)" },
  P2: { bg: "var(--bg-elevated)", text: "var(--text-muted)" },
};
