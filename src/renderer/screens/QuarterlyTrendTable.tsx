import { QuarterSimulationResult } from "../../simulation/salesTypes";
import { tokens } from "../shell/tokens";
import { formatNumber, formatCurrency, QUARTER_LABELS } from "../utils/formatCash";
import { tableStyle, thStyle, tdStyle, tdRight, sectionHeadingStyle } from "./summaryStyles";

interface QuarterlyTrendTableProps {
  quarters: QuarterSimulationResult[];
  year: number;
}

export function QuarterlyTrendTable({ quarters, year }: QuarterlyTrendTableProps) {
  if (quarters.length === 0) return null;

  // Build per-quarter aggregates for player
  const quarterData = quarters.map((q) => {
    const unitsSold = q.playerResults.reduce((s, r) => s + r.unitsSold, 0);
    const revenue = q.totalRevenue;
    const profit = q.totalProfit;
    return { quarter: q.quarter, unitsSold, revenue, profit };
  });

  const totalUnits = quarterData.reduce((s, q) => s + q.unitsSold, 0);
  const totalRevenue = quarterData.reduce((s, q) => s + q.revenue, 0);
  const totalProfit = quarterData.reduce((s, q) => s + q.profit, 0);

  // Simple ASCII-style bar chart for units sold
  const maxUnits = Math.max(...quarterData.map((q) => q.unitsSold), 1);

  return (
    <div>
      <h3 style={sectionHeadingStyle}>Quarterly Trend — {year}</h3>

      {/* Visual bar chart */}
      <div style={{ marginBottom: tokens.spacing.md }}>
        {quarterData.map((q) => {
          const barWidth = (q.unitsSold / maxUnits) * 100;
          return (
            <div key={q.quarter} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
              <span style={{ width: 24, textAlign: "right", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                {QUARTER_LABELS[q.quarter - 1]}
              </span>
              <div style={{
                flex: 1,
                height: 16,
                background: tokens.colors.surface,
                borderRadius: tokens.borderRadius.sm,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  background: tokens.colors.accent,
                  borderRadius: tokens.borderRadius.sm,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={{ width: 60, textAlign: "right", fontSize: tokens.font.sizeSmall }}>
                {formatNumber(q.unitsSold)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Data table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Quarter</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Units Sold</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Revenue</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Profit</th>
          </tr>
        </thead>
        <tbody>
          {quarterData.map((q) => (
            <tr key={q.quarter}>
              <td style={tdStyle}>{QUARTER_LABELS[q.quarter - 1]} {year}</td>
              <td style={tdRight}>{formatNumber(q.unitsSold)}</td>
              <td style={tdRight}>{formatCurrency(q.revenue)}</td>
              <td style={{ ...tdRight, color: q.profit >= 0 ? tokens.colors.success : tokens.colors.danger }}>
                {formatCurrency(q.profit)}
              </td>
            </tr>
          ))}
          {(() => {
            const totalBorder = { borderTop: `1px solid ${tokens.colors.panelBorder}` };
            return (
              <tr style={{ fontWeight: 700 }}>
                <td style={{ ...tdStyle, ...totalBorder }}>Total</td>
                <td style={{ ...tdRight, ...totalBorder }}>{formatNumber(totalUnits)}</td>
                <td style={{ ...tdRight, ...totalBorder }}>{formatCurrency(totalRevenue)}</td>
                <td style={{ ...tdRight, ...totalBorder, color: totalProfit >= 0 ? tokens.colors.success : tokens.colors.danger }}>
                  {formatCurrency(totalProfit)}
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}
