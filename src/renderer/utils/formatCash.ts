export function formatCash(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
