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

  const steps = 40;
  const range = max - min;
  const labelHeight = 16;
  const chartTop = 4;
  const chartBottom = height - labelHeight;
  const chartHeight = chartBottom - chartTop;
  const padX = 4;
  const chartWidth = width - padX * 2;

  let maxDensity = 0;
  const densities: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = min + (range * i) / steps;
    const z = (x - mean) / stdDev;
    const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const bigPhi = 0.5 * (1 + erf((skew * z) / Math.sqrt(2)));
    const density = 2 * phi * bigPhi;
    densities.push(density);
    if (density > maxDensity) maxDensity = density;
  }

  const curvePoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const px = padX + (chartWidth * i) / steps;
    const py = chartBottom - (chartHeight * densities[i]) / (maxDensity || 1);
    curvePoints.push(`${px},${py}`);
  }

  const polygonPoints = [
    `${padX},${chartBottom}`,
    ...curvePoints,
    `${width - padX},${chartBottom}`,
  ].join(" ");

  const xForValue = (val: number) => padX + (chartWidth * (val - min)) / range;
  const meanX = xForValue(mean);
  const hasNegative = min < 0 && max > 0;
  const zeroX = hasNegative ? xForValue(0) : 0;

  const containerStyle: CSSProperties = {
    width,
    height,
  };

  return (
    <div style={containerStyle}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Fill area */}
        <polygon
          points={polygonPoints}
          fill={tokens.colors.accent}
          fillOpacity={0.15}
          stroke={tokens.colors.accent}
          strokeWidth={1.5}
        />

        {/* Negative zone shading */}
        {hasNegative && (
          <rect
            x={padX}
            y={chartTop}
            width={zeroX - padX}
            height={chartHeight}
            fill={tokens.colors.danger}
            fillOpacity={0.08}
          />
        )}

        {/* Zero line */}
        {hasNegative && (
          <>
            <line
              x1={zeroX} y1={chartTop}
              x2={zeroX} y2={chartBottom}
              stroke={tokens.colors.danger}
              strokeWidth={1}
              strokeOpacity={0.6}
            />
            <text
              x={zeroX}
              y={height - 2}
              textAnchor="middle"
              fill={tokens.colors.danger}
              fontSize={10}
              fontFamily={tokens.font.family}
              opacity={0.8}
            >
              0%
            </text>
          </>
        )}

        {/* Mean line */}
        <line
          x1={meanX} y1={chartTop}
          x2={meanX} y2={chartBottom}
          stroke={tokens.colors.accent}
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />
        <text
          x={meanX}
          y={height - 2}
          textAnchor="middle"
          fill={tokens.colors.accent}
          fontSize={10}
          fontFamily={tokens.font.family}
        >
          +{mean}%
        </text>

        {/* Min label */}
        <text
          x={padX}
          y={height - 2}
          textAnchor="start"
          fill={tokens.colors.textMuted}
          fontSize={10}
          fontFamily={tokens.font.family}
        >
          {min > 0 ? "+" : ""}{min}%
        </text>

        {/* Max label */}
        <text
          x={width - padX}
          y={height - 2}
          textAnchor="end"
          fill={tokens.colors.textMuted}
          fontSize={10}
          fontFamily={tokens.font.family}
        >
          +{max}%
        </text>
      </svg>
    </div>
  );
}

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
