import { BarChart3 } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { getQuarterlyBuyers } from "../../../simulation/demographicData";

export function MarketCard() {
  const { state } = useGame();

  // Show total annual buyers across all demographics
  let totalBuyers = 0;
  for (const demo of DEMOGRAPHICS) {
    for (let q = 1; q <= 4; q++) {
      totalBuyers += getQuarterlyBuyers(demo.id, state.year, q as 1 | 2 | 3 | 4);
    }
  }

  return (
    <BentoCard title="Market" icon={BarChart3} screen="marketOverview">
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>Demographics</span>
          <span style={{ fontWeight: 600 }}>{DEMOGRAPHICS.length}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>Total buyers/yr</span>
          <span style={{ fontWeight: 600 }}>{totalBuyers.toLocaleString()}</span>
        </div>
      </div>
    </BentoCard>
  );
}
