export function formatCash(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Alias for formatCash — kept so existing imports don't break. */
export const formatCurrency = formatCash;

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;

/** Format a percentage change like "+12.3%" or "-5.0%". Returns null if prev is 0. */
export function pctChange(prev: number, curr: number, decimals = 1): string | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return decimals === 0
    ? `${sign}${Math.round(pct)}%`
    : `${sign}${pct.toFixed(decimals)}%`;
}
