import { CSSProperties } from "react";
import { tokens } from "../../shell/tokens";

interface DistributionChartProps {
  distribution: {
    mean: number;
    stdDev: number;
    skew: number;
    min: number;
    max: number;
  };
  width: number;
  height: number;
}

export function DistributionChart({ distribution, width, height }: DistributionChartProps) {
  const { mean, stdDev, skew, min, max } = distribution;
  if (stdDev === 0) return null;

  // Generate density curve points using approximate skew normal PDF
  const points: string[] = [];
  const steps = 40;
  const range = max - min;

  let maxDensity = 0;
  const densities: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = min + (range * i) / steps;
    const z = (x - mean) / stdDev;
    // Approximate skew normal: phi(z) * Phi(skew * z)
    const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const bigPhi = 0.5 * (1 + erf((skew * z) / Math.sqrt(2)));
    const density = 2 * phi * bigPhi;
    densities.push(density);
    if (density > maxDensity) maxDensity = density;
  }

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  for (let i = 0; i <= steps; i++) {
    const px = padding + (chartWidth * i) / steps;
    const py = height - padding - (chartHeight * densities[i]) / (maxDensity || 1);
    points.push(`${px},${py}`);
  }

  // Close the polygon
  const polygonPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ].join(" ");

  const containerStyle: CSSProperties = {
    width,
    height,
  };

  return (
    <div style={containerStyle}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polygon
          points={polygonPoints}
          fill={tokens.colors.accent}
          fillOpacity={0.2}
          stroke={tokens.colors.accent}
          strokeWidth={1.5}
        />
        {/* Mean line */}
        {(() => {
          const meanX = padding + (chartWidth * (mean - min)) / range;
          return (
            <line
              x1={meanX}
              y1={padding}
              x2={meanX}
              y2={height - padding}
              stroke={tokens.colors.accent}
              strokeWidth={1}
              strokeDasharray="3,2"
            />
          );
        })()}
        {/* Zero line if range spans negative */}
        {min < 0 && max > 0 && (() => {
          const zeroX = padding + (chartWidth * (0 - min)) / range;
          return (
            <line
              x1={zeroX}
              y1={padding}
              x2={zeroX}
              y2={height - padding}
              stroke={tokens.colors.danger}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          );
        })()}
      </svg>
    </div>
  );
}

// Approximation of the error function
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
