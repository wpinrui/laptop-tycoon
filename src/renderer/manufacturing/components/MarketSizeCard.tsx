import { CSSProperties, useState } from "react";
import { DemographicId } from "../../../data/types";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { getQuarterlyBuyers } from "../../../simulation/demographicData";
import { averageReach } from "../../../simulation/brandProgression";
import { tokens } from "../../shell/tokens";
import { CustomSelect } from "../../shell/CustomSelect";
import { Quarter, getPlayerCompany } from "../../state/gameTypes";
import { useGame } from "../../state/GameContext";

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

type DemoValue = DemographicId | "all";

const OPTIONS: { value: DemoValue; label: string }[] = [
  { value: "all", label: "All Demographics" },
  ...DEMOGRAPHICS.map((d) => ({ value: d.id as DemoValue, label: d.name })),
];


function ArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: `1px solid ${tokens.colors.panelBorder}`,
        borderRadius: tokens.borderRadius.sm,
        color: tokens.colors.textMuted,
        fontSize: tokens.font.sizeBase,
        width: 28,
        height: 28,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.accent;
        e.currentTarget.style.color = tokens.colors.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.panelBorder;
        e.currentTarget.style.color = tokens.colors.textMuted;
      }}
    >
      {direction === "left" ? "\u25C0" : "\u25B6"}
    </button>
  );
}

export function MarketSizeCard({ year, quarter }: { year: number; quarter: Quarter }) {
  const [selectedDemographic, setSelectedDemographic] = useState<DemoValue>("all");
  const { state: gameState } = useGame();
  const player = getPlayerCompany(gameState);

  const marketSize =
    selectedDemographic === "all"
      ? getTotalQuarterlyBuyers(year, quarter)
      : getQuarterlyBuyers(selectedDemographic, year, quarter);

  // Brand reach as a fraction (0–1): how much of this market the player can access
  const reachFraction = selectedDemographic === "all"
    ? averageReach(player.brandReach) / 100
    : (player.brandReach[selectedDemographic] ?? 0) / 100;
  const reachableBuyers = Math.round(marketSize * reachFraction);

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
      <div style={{
        fontSize: tokens.font.sizeSmall,
        color: tokens.colors.textMuted,
        marginBottom: tokens.spacing.sm,
      }}>
        Est. brand reach: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{reachableBuyers.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: tokens.spacing.xs }}>
        <ArrowButton direction="left" onClick={() => {
          const idx = OPTIONS.findIndex((o) => o.value === selectedDemographic);
          setSelectedDemographic(OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length].value);
        }} />
        <CustomSelect
          value={selectedDemographic}
          onChange={setSelectedDemographic}
          options={OPTIONS}
          size="md"
        />
        <ArrowButton direction="right" onClick={() => {
          const idx = OPTIONS.findIndex((o) => o.value === selectedDemographic);
          setSelectedDemographic(OPTIONS[(idx + 1) % OPTIONS.length].value);
        }} />
      </div>
    </div>
  );
}
