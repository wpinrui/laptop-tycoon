import { tokens } from "../shell/tokens";
import { formatCurrency, formatNumber } from "../utils/formatCash";
import { kpiRowStyle, kpiCardStyle, kpiLabelStyle, kpiValueStyle } from "./summaryStyles";

interface KPI {
  label: string;
  value: string;
  color?: string;
}

interface HeroKPIBarProps {
  unitsSold: number;
  totalAvailable: number;
  revenue: number;
  profit: number;
  cash: number;
}

export function HeroKPIBar({ unitsSold, totalAvailable, revenue, profit, cash }: HeroKPIBarProps) {
  const kpis: KPI[] = [
    {
      label: "Units Sold",
      value: `${formatNumber(unitsSold)} / ${formatNumber(totalAvailable)}`,
    },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
    },
    {
      label: "Profit",
      value: formatCurrency(profit),
      color: profit >= 0 ? tokens.colors.success : tokens.colors.danger,
    },
    {
      label: "Cash Balance",
      value: formatCurrency(cash),
      color: cash >= 0 ? tokens.colors.success : tokens.colors.danger,
    },
  ];

  return (
    <div style={kpiRowStyle}>
      {kpis.map((kpi) => (
        <div key={kpi.label} style={kpiCardStyle}>
          <p style={kpiLabelStyle}>{kpi.label}</p>
          <p style={{ ...kpiValueStyle, color: kpi.color }}>{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
