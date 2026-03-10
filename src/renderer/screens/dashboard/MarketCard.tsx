import { BarChart3 } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { getAnnualBuyers } from "../../../simulation/demographicData";

export function MarketCard() {
  const { state } = useGame();

  const totalBuyers = DEMOGRAPHICS.reduce((sum, demo) => sum + getAnnualBuyers(demo.id, state.year), 0);

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
