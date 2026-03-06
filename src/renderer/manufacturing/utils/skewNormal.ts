function randomNormal(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleSkewNormal(mean: number, stdDev: number, skew: number): number {
  if (stdDev === 0) return mean;
  const u0 = randomNormal();
  const v = randomNormal();
  const delta = skew / Math.sqrt(1 + skew * skew);
  const u1 = delta * Math.abs(u0) + Math.sqrt(1 - delta * delta) * v;
  return mean + stdDev * u1;
}

export function sampleCampaignOutcome(
  mean: number,
  stdDev: number,
  skew: number,
  min: number,
  max: number,
): number {
  const raw = sampleSkewNormal(mean, stdDev, skew);
  return Math.max(min, Math.min(max, raw));
}

/** Approximate percentile of a skew normal distribution using normal approximation. */
export function approxPercentile(
  mean: number,
  stdDev: number,
  _skew: number,
  min: number,
  max: number,
  p: number,
): number {
  if (stdDev === 0) return mean;
  // z-scores for common percentiles
  const z = p === 0.25 ? -0.6745 : p === 0.75 ? 0.6745 : p === 0.5 ? 0 : 0;
  const val = mean + stdDev * z;
  return Math.max(min, Math.min(max, val));
}
