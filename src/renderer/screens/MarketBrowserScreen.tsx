import { CSSProperties, useState } from "react";
import { Monitor } from "lucide-react";
import { useGame } from "../state/GameContext";
import { CompanyState, LaptopModel } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { computeStatsForDesign } from "../../simulation/statCalculation";
import { ALL_STATS, STAT_LABELS } from "../../data/types";

interface MarketEntry {
  company: CompanyState;
  model: LaptopModel;
}

function getMarketEntries(state: ReturnType<typeof useGame>["state"]): MarketEntry[] {
  const entries: MarketEntry[] = [];
  for (const company of state.companies) {
    for (const model of company.models) {
      if (model.status !== "onSale" && model.status !== "manufacturing") continue;
      if (!model.retailPrice) continue;
      entries.push({ company, model });
    }
  }
  return entries;
}

type SortKey = "name" | "price" | "brand" | "screenSize";

function getLastQuarterSales(
  state: ReturnType<typeof useGame>["state"],
  laptopId: string,
): number | null {
  const lastSim = state.lastSimulationResult;
  if (!lastSim) return null;
  const result = lastSim.laptopResults.find((r) => r.laptopId === laptopId);
  return result ? result.unitsSold : null;
}

// --- Styles ---

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: tokens.spacing.md,
  paddingBottom: tokens.spacing.lg,
};

const cardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.md,
};

const playerCardStyle: CSSProperties = {
  ...cardStyle,
  border: `1px solid ${tokens.colors.accent}`,
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: tokens.spacing.sm,
};

const modelNameStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
};

const brandNameStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const priceStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  color: tokens.colors.accent,
  textAlign: "right" as const,
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.xs,
};

const statBarContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  marginTop: tokens.spacing.sm,
  paddingTop: tokens.spacing.sm,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
};

const statRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  fontSize: tokens.font.sizeSmall,
};

const statLabelStyle: CSSProperties = {
  width: 120,
  color: tokens.colors.textMuted,
  flexShrink: 0,
};

const statBarBgStyle: CSSProperties = {
  flex: 1,
  height: 6,
  background: tokens.colors.surface,
  borderRadius: 3,
  overflow: "hidden",
};

const controlsStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.md,
  alignItems: "center",
  marginBottom: tokens.spacing.md,
  flexWrap: "wrap",
};

const selectStyle: CSSProperties = {
  background: tokens.colors.surface,
  color: tokens.colors.text,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  fontSize: tokens.font.sizeSmall,
};

// --- Top stats for a model ---

function getTopStats(model: LaptopModel, year: number): { stat: string; label: string; value: number }[] {
  const stats = computeStatsForDesign(model.design, year);
  return ALL_STATS
    .map((stat) => ({ stat, label: STAT_LABELS[stat], value: stats[stat] ?? 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function getMaxStatValue(entries: MarketEntry[], year: number): Record<string, number> {
  const maxes: Record<string, number> = {};
  for (const { model } of entries) {
    const stats = computeStatsForDesign(model.design, year);
    for (const stat of ALL_STATS) {
      const val = stats[stat] ?? 0;
      if (!maxes[stat] || val > maxes[stat]) maxes[stat] = val;
    }
  }
  return maxes;
}

// --- Components ---

function LaptopCard({
  entry,
  year,
  maxStats,
  lastQuarterSales,
}: {
  entry: MarketEntry;
  year: number;
  maxStats: Record<string, number>;
  lastQuarterSales: number | null;
}) {
  const { company, model } = entry;
  const isPlayer = company.isPlayer;
  const topStats = getTopStats(model, year);

  return (
    <div style={isPlayer ? playerCardStyle : cardStyle}>
      <div style={cardHeaderStyle}>
        <div>
          <div style={modelNameStyle}>{model.design.name}</div>
          <div style={brandNameStyle}>{company.name}</div>
        </div>
        <div style={priceStyle}>${model.retailPrice!.toLocaleString()}</div>
      </div>

      <div style={metaRowStyle}>
        <span>{model.design.screenSize}" screen</span>
        <span>{model.design.selectedColours.length} colour{model.design.selectedColours.length !== 1 ? "s" : ""}</span>
      </div>

      {lastQuarterSales !== null && (
        <div style={metaRowStyle}>
          <span>Last quarter sales</span>
          <span style={{ fontWeight: 600, color: tokens.colors.text }}>
            {lastQuarterSales.toLocaleString()} units
          </span>
        </div>
      )}

      <div style={statBarContainerStyle}>
        {topStats.map(({ stat, label, value }) => {
          const max = maxStats[stat] || 1;
          const pct = Math.min(100, (value / max) * 100);
          return (
            <div key={stat} style={statRowStyle}>
              <span style={statLabelStyle}>{label}</span>
              <div style={statBarBgStyle}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: isPlayer ? tokens.colors.accent : tokens.colors.textMuted,
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketBrowserScreen() {
  const { state } = useGame();
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [filterBrand, setFilterBrand] = useState<string>("all");

  const allEntries = getMarketEntries(state);
  const maxStats = getMaxStatValue(allEntries, state.year);

  // Brand filter options
  const brands = Array.from(new Set(allEntries.map((e) => e.company.id)));

  // Filter
  let filtered = allEntries;
  if (filterBrand !== "all") {
    filtered = filtered.filter((e) => e.company.id === filterBrand);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "price":
        return (a.model.retailPrice ?? 0) - (b.model.retailPrice ?? 0);
      case "name":
        return a.model.design.name.localeCompare(b.model.design.name);
      case "brand":
        return a.company.name.localeCompare(b.company.name);
      case "screenSize":
        return a.model.design.screenSize - b.model.design.screenSize;
    }
  });

  return (
    <ContentPanel
      maxWidth={tokens.layout.panelMaxWidth}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: tokens.layout.panelHeight,
        width: tokens.layout.panelWidth,
      }}
    >
      <ScreenHeader title="Market Browser" icon={Monitor} />
      <div
        className="content-panel hide-scrollbar"
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        <div style={controlsStyle}>
          <label style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            Sort by:{" "}
            <select
              style={selectStyle}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="price">Price</option>
              <option value="name">Name</option>
              <option value="brand">Brand</option>
              <option value="screenSize">Screen Size</option>
            </select>
          </label>
          <label style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            Brand:{" "}
            <select
              style={selectStyle}
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              <option value="all">All</option>
              {brands.map((id) => {
                const name = state.companies.find((c) => c.id === id)?.name ?? id;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </label>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            {filtered.length} laptop{filtered.length !== 1 ? "s" : ""} on sale
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
            No laptops on the market yet. Design and manufacture your first model!
          </p>
        ) : (
          <div style={gridStyle}>
            {filtered.map((entry) => (
              <LaptopCard
                key={entry.model.design.id}
                entry={entry}
                year={state.year}
                maxStats={maxStats}
                lastQuarterSales={getLastQuarterSales(state, entry.model.design.id)}
              />
            ))}
          </div>
        )}
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
