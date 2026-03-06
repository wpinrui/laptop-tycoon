import { DollarSign } from "lucide-react";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle, sectionDividerStyle, sectionHeadingStyle, tableCellStyle } from "./styles";

export function FinancialsCard() {
  return (
    <BentoCard title="Financials" icon={DollarSign} screen="financialHistory">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["Revenue", "—"],
            ["COGS", "—"],
            ["Gross Profit", "—"],
            ["Marketing", "—"],
            ["R&D Overhead", "—"],
            ["Net Profit", "—"],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={tableCellStyle}>{label}</td>
              <td style={{ ...tableCellStyle, textAlign: "right" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Cash Flow Trend</p>
        <div style={{ display: "flex", gap: tokens.spacing.xs, marginTop: tokens.spacing.sm, height: 48, alignItems: "flex-end" }}>
          {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.65, 0.9].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: tokens.colors.accent, borderRadius: 2, opacity: 0.5 }} />
          ))}
        </div>
        <p style={{ ...emptyStateStyle, marginTop: tokens.spacing.sm }}>
          Quarterly data available after Year 1
        </p>
      </div>
    </BentoCard>
  );
}
