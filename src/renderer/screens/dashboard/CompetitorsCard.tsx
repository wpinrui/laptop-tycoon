import { Monitor } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";

export function CompetitorsCard() {
  const { state } = useGame();

  const allOnSale = state.companies.flatMap((c) =>
    c.models
      .filter((m) => m.status === "onSale" || m.status === "manufacturing")
      .map((m) => ({ company: c, model: m })),
  );
  const playerCount = allOnSale.filter((e) => e.company.isPlayer).length;
  const competitorCount = allOnSale.filter((e) => !e.company.isPlayer).length;

  return (
    <BentoCard title="Competitors" icon={Monitor} screen="marketBrowser">
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>Your models on sale</span>
          <span style={{ fontWeight: 600 }}>{playerCount}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>Competitor models</span>
          <span style={{ fontWeight: 600 }}>{competitorCount}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>Total on market</span>
          <span style={{ fontWeight: 600 }}>{allOnSale.length}</span>
        </div>
      </div>
    </BentoCard>
  );
}
