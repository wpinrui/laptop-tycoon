import { CSSProperties, useState } from "react";
import { Monitor } from "lucide-react";
import { useGame } from "../state/GameContext";
import { CompanyState, LaptopModel } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { computeStatsForDesign } from "../../simulation/statCalculation";
import { ALL_STATS, STAT_LABELS, ComponentSlot } from "../../data/types";
import { PORT_TYPES } from "../../data/portTypes";

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

const COMPONENT_SLOT_LABELS: Record<ComponentSlot, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage",
  resolution: "Resolution",
  displayTech: "Display Tech",
  displaySurface: "Surface",
  wifi: "WiFi",
  webcam: "Webcam",
  speakers: "Speakers",
};

const SPEC_SLOTS: ComponentSlot[] = ["cpu", "gpu", "ram", "storage"];
const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];
const MEDIA_SLOTS: ComponentSlot[] = ["wifi", "webcam", "speakers"];

// --- Styles ---

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
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

const sectionStyle: CSSProperties = {
  marginTop: tokens.spacing.sm,
  paddingTop: tokens.spacing.sm,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.6875rem",
  color: tokens.colors.textMuted,
  fontWeight: "bold",
  letterSpacing: "0.5px",
  marginBottom: tokens.spacing.xs,
};

const specRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: tokens.font.sizeSmall,
  padding: `1px 0`,
};

const specLabelStyle: CSSProperties = {
  color: tokens.colors.textMuted,
  flexShrink: 0,
  marginRight: tokens.spacing.sm,
};

const specValueStyle: CSSProperties = {
  textAlign: "right" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
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

const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.md,
  alignItems: "center",
  paddingBottom: tokens.spacing.md,
  flexWrap: "wrap",
  flexShrink: 0,
};

const selectStyle: CSSProperties = {
  background: tokens.colors.surface,
  color: tokens.colors.text,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  fontSize: tokens.font.sizeSmall,
};

// --- Helpers ---

function getAllStats(model: LaptopModel, year: number): { stat: string; label: string; value: number }[] {
  const stats = computeStatsForDesign(model.design, year);
  return ALL_STATS
    .map((stat) => ({ stat, label: STAT_LABELS[stat], value: stats[stat] ?? 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
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

function getPortSummary(ports: Record<string, number>): string[] {
  const lines: string[] = [];
  for (const [portId, count] of Object.entries(ports)) {
    if (count <= 0) continue;
    const portDef = PORT_TYPES.find((p) => p.id === portId);
    const name = portDef?.name ?? portId;
    lines.push(count > 1 ? `${count}x ${name}` : name);
  }
  return lines;
}

// --- Components ---

function SpecSection({ title, slots, design }: {
  title: string;
  slots: ComponentSlot[];
  design: LaptopModel["design"];
}) {
  const items = slots
    .map((slot) => {
      const comp = design.components[slot];
      if (!comp) return null;
      return { label: COMPONENT_SLOT_LABELS[slot], value: comp.name };
    })
    .filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      {items.map(({ label, value }) => (
        <div key={label} style={specRowStyle}>
          <span style={specLabelStyle}>{label}</span>
          <span style={specValueStyle}>{value}</span>
        </div>
      ))}
    </div>
  );
}

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
  const { design } = model;
  const isPlayer = company.isPlayer;
  const allModelStats = getAllStats(model, year);
  const ports = getPortSummary(design.ports);

  return (
    <div style={isPlayer ? playerCardStyle : cardStyle}>
      {/* Header: name + price */}
      <div style={cardHeaderStyle}>
        <div>
          <div style={modelNameStyle}>{design.name}</div>
          <div style={brandNameStyle}>{company.name}</div>
        </div>
        <div style={priceStyle}>${model.retailPrice!.toLocaleString()}</div>
      </div>

      {/* Quick facts */}
      <div style={specRowStyle}>
        <span style={specLabelStyle}>Screen</span>
        <span style={specValueStyle}>{design.screenSize}"</span>
      </div>
      <div style={specRowStyle}>
        <span style={specLabelStyle}>Thickness</span>
        <span style={specValueStyle}>{design.thicknessCm.toFixed(1)} cm</span>
      </div>
      <div style={specRowStyle}>
        <span style={specLabelStyle}>Battery</span>
        <span style={specValueStyle}>{design.batteryCapacityWh} Wh</span>
      </div>
      <div style={specRowStyle}>
        <span style={specLabelStyle}>Colours</span>
        <span style={specValueStyle}>{design.selectedColours.length}</span>
      </div>
      {lastQuarterSales !== null && (
        <div style={specRowStyle}>
          <span style={specLabelStyle}>Last quarter sales</span>
          <span style={{ ...specValueStyle, fontWeight: 600 }}>
            {lastQuarterSales.toLocaleString()} units
          </span>
        </div>
      )}

      {/* Hardware specs */}
      <SpecSection title="PROCESSING" slots={SPEC_SLOTS} design={design} />
      <SpecSection title="DISPLAY" slots={DISPLAY_SLOTS} design={design} />
      <SpecSection title="MEDIA & CONNECTIVITY" slots={MEDIA_SLOTS} design={design} />

      {/* Chassis */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>CHASSIS</div>
        {design.chassis.material && (
          <div style={specRowStyle}>
            <span style={specLabelStyle}>Material</span>
            <span style={specValueStyle}>{design.chassis.material.name}</span>
          </div>
        )}
        {design.chassis.coolingSolution && (
          <div style={specRowStyle}>
            <span style={specLabelStyle}>Cooling</span>
            <span style={specValueStyle}>{design.chassis.coolingSolution.name}</span>
          </div>
        )}
        {design.chassis.keyboardFeature && (
          <div style={specRowStyle}>
            <span style={specLabelStyle}>Keyboard</span>
            <span style={specValueStyle}>{design.chassis.keyboardFeature.name}</span>
          </div>
        )}
        {design.chassis.trackpadFeature && (
          <div style={specRowStyle}>
            <span style={specLabelStyle}>Trackpad</span>
            <span style={specValueStyle}>{design.chassis.trackpadFeature.name}</span>
          </div>
        )}
      </div>

      {/* Ports */}
      {ports.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>PORTS</div>
          <div style={{ fontSize: tokens.font.sizeSmall, lineHeight: 1.5 }}>
            {ports.join(" · ")}
          </div>
        </div>
      )}

      {/* Stat bars */}
      <div style={statBarContainerStyle}>
        <div style={sectionTitleStyle}>RATINGS</div>
        {allModelStats.map(({ stat, label, value }) => {
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
  const [filterScreenSize, setFilterScreenSize] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<string>("all");

  const allEntries = getMarketEntries(state);
  const maxStats = getMaxStatValue(allEntries, state.year);

  // Brand filter options
  const brands = Array.from(new Set(allEntries.map((e) => e.company.id)));

  // Screen sizes present in market
  const screenSizes = Array.from(new Set(allEntries.map((e) => e.model.design.screenSize))).sort((a, b) => a - b);

  // Price range buckets
  const priceBuckets = [500, 1000, 1500, 2000, 3000, 5000];

  // Filter
  let filtered = allEntries;
  if (filterBrand !== "all") {
    filtered = filtered.filter((e) => e.company.id === filterBrand);
  }
  if (filterScreenSize !== "all") {
    const size = Number(filterScreenSize);
    filtered = filtered.filter((e) => e.model.design.screenSize === size);
  }
  if (filterPriceMax !== "all") {
    const max = Number(filterPriceMax);
    filtered = filtered.filter((e) => (e.model.retailPrice ?? 0) <= max);
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

  const labelStyle: CSSProperties = { fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted };

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

      {/* Fixed toolbar — does not scroll */}
      <div style={toolbarStyle}>
        <label style={labelStyle}>
          Sort:{" "}
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
        <label style={labelStyle}>
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
        <label style={labelStyle}>
          Screen:{" "}
          <select
            style={selectStyle}
            value={filterScreenSize}
            onChange={(e) => setFilterScreenSize(e.target.value)}
          >
            <option value="all">All</option>
            {screenSizes.map((size) => (
              <option key={size} value={size}>
                {size}"
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Max price:{" "}
          <select
            style={selectStyle}
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
          >
            <option value="all">Any</option>
            {priceBuckets.map((p) => (
              <option key={p} value={p}>
                ${p.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <span style={labelStyle}>
          {filtered.length} laptop{filtered.length !== 1 ? "s" : ""} on sale
        </span>
      </div>

      {/* Scrollable card grid */}
      <div
        className="content-panel hide-scrollbar"
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
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
