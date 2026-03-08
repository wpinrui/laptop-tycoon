export function formatCash(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Alias for formatCash — kept so existing imports don't break. */
export const formatCurrency = formatCash;

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;
