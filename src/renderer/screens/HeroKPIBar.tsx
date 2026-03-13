import { tokens } from "../shell/tokens";
import { formatCurrency, formatNumber } from "../utils/formatCash";
import { kpiRowStyle, kpiCardStyle, kpiLabelStyle, kpiValueStyle, kpiDeltaStyle } from "./summaryStyles";

interface Delta {
  text: string;
  color: string;
}

function deltaIndicator(current: number, previous: number): Delta | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.1) return null;
  const sign = pct > 0 ? "▲" : "▼";
  const color = pct > 0 ? tokens.colors.success : tokens.colors.danger;
  return { text: `${sign} ${Math.abs(pct).toFixed(1)}%`, color };
}

interface KPI {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  delta: Delta | null;
}

export interface HeroKPIBarProps {
  unitsSold: number;
  totalAvailable: number;
  revenue: number;
  profit: number;
  cash: number;
  prevUnitsSold?: number | null;
  prevTotalAvailable?: number | null;
  prevRevenue?: number | null;
  prevProfit?: number | null;
  prevCash?: number | null;
}

export function HeroKPIBar({ unitsSold, totalAvailable, revenue, profit, cash, prevUnitsSold, prevTotalAvailable, prevRevenue, prevProfit, prevCash }: HeroKPIBarProps) {
  const sellThrough = totalAvailable > 0 ? (unitsSold / totalAvailable) * 100 : 0;
  const prevSellThrough = prevUnitsSold != null && prevTotalAvailable && prevTotalAvailable > 0
    ? (prevUnitsSold / prevTotalAvailable) * 100
    : null;

  let sellThroughDelta: Delta | null = null;
  if (prevSellThrough != null) {
    const diff = sellThrough - prevSellThrough;
    if (Math.abs(diff) >= 0.5) {
      const sign = diff > 0 ? "▲" : "▼";
      const color = diff > 0 ? tokens.colors.success : tokens.colors.danger;
      sellThroughDelta = { text: `${sign} ${Math.abs(diff).toFixed(0)}pp`, color };
    }
  }

  const kpis: KPI[] = [
    {
      label: "Sell-Through",
      value: totalAvailable > 0 ? `${Math.round(sellThrough)}%` : "—",
      subtitle: `${formatNumber(unitsSold)} of ${formatNumber(totalAvailable)} units`,
      delta: sellThroughDelta,
    },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      delta: prevRevenue != null ? deltaIndicator(revenue, prevRevenue) : null,
    },
    {
      label: "Profit",
      value: formatCurrency(profit),
      color: profit >= 0 ? tokens.colors.success : tokens.colors.danger,
      delta: prevProfit != null ? deltaIndicator(profit, prevProfit) : null,
    },
    {
      label: "Cash Balance",
      value: formatCurrency(cash),
      color: cash >= 0 ? tokens.colors.success : tokens.colors.danger,
      delta: prevCash != null ? deltaIndicator(cash, prevCash) : null,
    },
  ];

  return (
    <div style={kpiRowStyle}>
      {kpis.map((kpi) => (
        <div key={kpi.label} style={kpiCardStyle}>
          <p style={kpiLabelStyle}>{kpi.label}</p>
          <p style={{ ...kpiValueStyle, color: kpi.color }}>{kpi.value}</p>
          {kpi.subtitle && (
            <p style={{ margin: 0, marginTop: 2, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>{kpi.subtitle}</p>
          )}
          {kpi.delta && (
            <p style={{ ...kpiDeltaStyle, color: kpi.delta.color }}>{kpi.delta.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
