export function formatCash(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;
