import { tokens } from "../shell/tokens";
import { formatCurrency, formatNumber } from "../utils/formatCash";
import { kpiRowStyle, kpiCardStyle, kpiLabelStyle, kpiValueStyle, kpiDeltaStyle } from "./summaryStyles";

interface Delta {
  text: string;
  color: string;
}

function deltaIndicator(current: number, previous: number): Delta | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { text: "▲ New", color: tokens.colors.success };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.1) return null;
  const sign = pct > 0 ? "▲" : "▼";
  const color = pct > 0 ? tokens.colors.success : tokens.colors.danger;
  return { text: `${sign} ${Math.abs(pct).toFixed(1)}%`, color };
}

interface KPI {
  label: string;
  value: string;
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
  prevRevenue?: number | null;
  prevProfit?: number | null;
  prevCash?: number | null;
}

export function HeroKPIBar({ unitsSold, totalAvailable, revenue, profit, cash, prevUnitsSold, prevRevenue, prevProfit, prevCash }: HeroKPIBarProps) {
  const kpis: KPI[] = [
    {
      label: "Units Sold",
      value: `${formatNumber(unitsSold)} / ${formatNumber(totalAvailable)}`,
      delta: prevUnitsSold != null ? deltaIndicator(unitsSold, prevUnitsSold) : null,
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
          {kpi.delta && (
            <p style={{ ...kpiDeltaStyle, color: kpi.delta.color }}>{kpi.delta.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
