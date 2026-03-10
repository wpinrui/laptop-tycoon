import { tokens } from "./types";

export function RadarChart({
  datasets,
  labels,
}: {
  datasets: { name: string; values: number[]; color: string }[];
  labels: string[];
}) {
  const vb = 500;
  const cx = vb / 2;
  const cy = vb / 2;
  const radius = vb / 2 - 80;
  const n = labels.length;
  const angleStep = (2 * Math.PI) / n;

  // Per-axis max for normalisation (outer ring = max across compared laptops)
  const axisMax = labels.map((_, i) => {
    const max = Math.max(...datasets.map((ds) => ds.values[i]));
    return max > 0 ? max : 1;
  });

  function point(i: number, r: number): [number, number] {
    const angle = -Math.PI / 2 + i * angleStep;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} style={{ width: "100%", maxHeight: "100%" }}>
      {/* Grid rings */}
      {rings.map((frac) => (
        <polygon
          key={frac}
          points={Array.from({ length: n }, (_, i) => point(i, radius * frac).join(",")).join(" ")}
          fill="none"
          stroke={tokens.colors.panelBorder}
          strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {labels.map((_, i) => {
        const [px, py] = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke={tokens.colors.panelBorder} strokeWidth={1} />;
      })}
      {/* Data polygons */}
      {datasets.map((ds) => {
        const pts = ds.values.map((v, i) => point(i, radius * Math.min(v / axisMax[i], 1)).join(",")).join(" ");
        return (
          <g key={ds.name}>
            <polygon points={pts} fill={ds.color} fillOpacity={0.1} stroke={ds.color} strokeWidth={2} />
            {ds.values.map((v, i) => {
              const [px, py] = point(i, radius * Math.min(v / axisMax[i], 1));
              return <circle key={i} cx={px} cy={py} r={3} fill={ds.color} />;
            })}
          </g>
        );
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const [px, py] = point(i, radius + 20);
        const angle = -Math.PI / 2 + i * angleStep;
        const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={px}
            y={py}
            textAnchor={textAnchor}
            dominantBaseline="central"
            fill={tokens.colors.textMuted}
            fontSize={12}
            fontFamily={tokens.font.family}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
