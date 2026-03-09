import { CSSProperties, useState } from "react";
import { DemographicId } from "../../../data/types";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { getQuarterlyBuyers } from "../../../simulation/demographicData";
import { tokens } from "../../shell/tokens";
import { Quarter } from "../../state/gameTypes";

function getTotalQuarterlyBuyers(year: number, quarter: Quarter): number {
  return DEMOGRAPHICS.reduce((sum, d) => sum + getQuarterlyBuyers(d.id, year, quarter), 0);
}

const cardStyle: CSSProperties = {
  background: tokens.colors.background,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  textAlign: "center",
};

const selectStyle: CSSProperties = {
  background: tokens.colors.surface,
  color: tokens.colors.text,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  fontSize: tokens.font.sizeBase,
  fontFamily: tokens.font.family,
  cursor: "pointer",
  outline: "none",
};

export function MarketSizeCard({ year, quarter }: { year: number; quarter: Quarter }) {
  const [selectedDemographic, setSelectedDemographic] = useState<DemographicId | "all">("all");

  const marketSize =
    selectedDemographic === "all"
      ? getTotalQuarterlyBuyers(year, quarter)
      : getQuarterlyBuyers(selectedDemographic, year, quarter);

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm }}>
        Projected market size for Q{quarter}
      </div>
      <div style={{
        fontSize: tokens.font.sizeHero,
        fontWeight: 700,
        color: tokens.colors.accent,
        margin: `${tokens.spacing.sm}px 0`,
      }}>
        {marketSize.toLocaleString()}
      </div>
      <select
        value={selectedDemographic}
        onChange={(e) => setSelectedDemographic(e.target.value as DemographicId | "all")}
        style={selectStyle}
      >
        <option value="all" style={{ background: tokens.colors.surface, color: tokens.colors.text }}>All Demographics</option>
        {DEMOGRAPHICS.map((d) => (
          <option key={d.id} value={d.id} style={{ background: tokens.colors.surface, color: tokens.colors.text }}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}
