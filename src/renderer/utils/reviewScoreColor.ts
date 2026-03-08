import { tokens } from "../shell/tokens";

/** Returns a color token based on a review score (1-10). */
export function reviewScoreColor(score: number): string {
  if (score >= 7) return tokens.colors.success;
  if (score >= 5) return tokens.colors.warning;
  return tokens.colors.danger;
}
