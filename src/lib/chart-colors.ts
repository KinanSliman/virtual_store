// Dark-surface chart palette (validated against #171717 — see dataviz notes).
// Plain module so both server pages and client chart components can import it.
export const CHART_COLORS = {
  BLUE: "#3987e5",
  AQUA: "#199e70",
  YELLOW: "#c98500",
} as const;

export const CHART_CHROME = {
  GRID: "#2c2c2a",
  MUTED: "#898781",
  BASELINE: "#383835",
} as const;
