import { CSSProperties, useState } from "react";
import { DemographicId } from "../../../data/types";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { STARTING_DEMAND_POOL } from "../../../data/startingDemand";
import { getDemandPoolSize } from "../../../simulation/demographicData";
import { REPLACEMENT_CYCLE, QUARTER_SHARES } from "../../../simulation/tunables";
import { tokens } from "../../shell/tokens";
import { Quarter } from "../../state/gameTypes";

function calculateMarketSize(
  demographicId: DemographicId,
  year: number,
  quarter: Quarter,
): number {
  const basePool = STARTING_DEMAND_POOL[demographicId];
  const population = getDemandPoolSize(demographicId, year, basePool);
  const replacementCycle = REPLACEMENT_CYCLE[demographicId];
  const quarterShare = QUARTER_SHARES[quarter - 1];
  return Math.round(population / replacementCycle * quarterShare / 15);
}

function calculateTotalMarketSize(year: number, quarter: Quarter): number {
  const allIds = DEMOGRAPHICS.map((d) => d.id);
  return allIds.reduce((sum, id) => sum + calculateMarketSize(id, year, quarter), 0);
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
      ? calculateTotalMarketSize(year, quarter)
      : calculateMarketSize(selectedDemographic, year, quarter);

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
        <option value="all">All Demographics</option>
        {DEMOGRAPHICS.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}
