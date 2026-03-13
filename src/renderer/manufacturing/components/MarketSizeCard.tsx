import { CSSProperties, useState } from "react";
import { DemographicId } from "../../../data/types";
import { DEMOGRAPHICS, GENERALISTS, NICHES } from "../../../data/demographics";
import { getQuarterlyBuyers } from "../../../simulation/demographicData";
import { averageReach } from "../../../simulation/brandProgression";
import { tokens } from "../../shell/tokens";
import { CustomSelect, SelectGroup } from "../../shell/CustomSelect";
import { Quarter, getPlayerCompany } from "../../state/gameTypes";
import { useGame } from "../../state/GameContext";

function getBuyersForDemos(demoIds: DemographicId[], year: number, quarter: Quarter): number {
  return demoIds.reduce((sum, id) => sum + getQuarterlyBuyers(id, year, quarter), 0);
}

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

type DemoValue = DemographicId | "all" | "allGeneralist" | "allNiche";

const OPTIONS: SelectGroup<DemoValue>[] = [
  {
    label: "Aggregate",
    options: [
      { value: "all", label: "All Demographics" },
      { value: "allGeneralist", label: "All Generalist" },
      { value: "allNiche", label: "All Niche" },
    ],
  },
  {
    label: "Generalist",
    options: GENERALISTS.map((d) => ({ value: d.id as DemoValue, label: d.name })),
  },
  {
    label: "Niche",
    options: NICHES.map((d) => ({ value: d.id as DemoValue, label: d.name })),
  },
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
      : selectedDemographic === "allGeneralist"
        ? getBuyersForDemos(GENERALISTS.map((d) => d.id), year, quarter)
        : selectedDemographic === "allNiche"
          ? getBuyersForDemos(NICHES.map((d) => d.id), year, quarter)
          : getQuarterlyBuyers(selectedDemographic, year, quarter);

  // Brand reach as a fraction (0–1): how much of this market the player can access
  const reachFraction =
    selectedDemographic === "all"
      ? averageReach(player.brandReach) / 100
      : selectedDemographic === "allGeneralist"
        ? GENERALISTS.reduce((sum, d) => sum + (player.brandReach[d.id] ?? 0), 0) / GENERALISTS.length / 100
        : selectedDemographic === "allNiche"
          ? NICHES.reduce((sum, d) => sum + (player.brandReach[d.id] ?? 0), 0) / NICHES.length / 100
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
      {(() => {
        const flat = OPTIONS.flatMap((g) => g.options);
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: tokens.spacing.xs }}>
            <ArrowButton direction="left" onClick={() => {
              const idx = flat.findIndex((o) => o.value === selectedDemographic);
              setSelectedDemographic(flat[(idx - 1 + flat.length) % flat.length].value);
            }} />
            <CustomSelect
              value={selectedDemographic}
              onChange={setSelectedDemographic}
              options={OPTIONS}
              size="md"
            />
            <ArrowButton direction="right" onClick={() => {
              const idx = flat.findIndex((o) => o.value === selectedDemographic);
              setSelectedDemographic(flat[(idx + 1) % flat.length].value);
            }} />
          </div>
        );
      })()}
    </div>
  );
}
