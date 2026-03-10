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

  const rows = [
    { label: "Your models on sale", value: playerCount },
    { label: "Competitor models", value: competitorCount },
    { label: "Total on market", value: allOnSale.length },
  ];

  return (
    <BentoCard title="Competitors" icon={Monitor} screen="marketBrowser">
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall }}>
            <span style={{ color: tokens.colors.textMuted }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
