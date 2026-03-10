import { CSSProperties, useState, useMemo } from "react";
import { Monitor, LayoutGrid, Table } from "lucide-react";
import { useGame } from "../state/GameContext";
import { CompanyState, LaptopModel } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { CustomSelect, SelectOption, SelectGroup } from "../shell/CustomSelect";
import { computeStatsForDesign } from "../../simulation/statCalculation";
import { ALL_STATS, STAT_LABELS, LaptopStat, ComponentSlot } from "../../data/types";
import { DEMOGRAPHICS } from "../../data/demographics";
import { PORT_TYPES } from "../../data/portTypes";

type ViewMode = "cards" | "table" | "compare";

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

type SortKey = "name" | "price" | "brand" | "screenSize" | `stat:${string}`;

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
              <span style={{ fontSize: 11, color: tokens.colors.textMuted, minWidth: 24, textAlign: "right" }}>
                {Math.round(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- View mode button ---

const viewBtnStyle = (active: boolean): CSSProperties => ({
  background: active ? tokens.colors.surface : "transparent",
  color: active ? tokens.colors.accent : tokens.colors.textMuted,
  border: `1px solid ${active ? tokens.colors.accent : tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: tokens.font.sizeSmall,
});

// --- Table view ---

const TABLE_STATS: LaptopStat[] = ["performance", "gamingPerformance", "batteryLife", "display", "buildQuality", "thermals", "weight"];

function scoreColor(value: number, allValues: number[], higherIsBetter: boolean): string | undefined {
  if (allValues.length < 2) return undefined;
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  if (max === min) return undefined;
  if (higherIsBetter) {
    if (value === max) return tokens.colors.success;
    if (value === min) return tokens.colors.danger;
  } else {
    if (value === min) return tokens.colors.success;
    if (value === max) return tokens.colors.danger;
  }
  return undefined;
}

function TableView({
  entries,
  year,
  playerCompanyId,
  statsToShow,
}: {
  entries: MarketEntry[];
  year: number;
  playerCompanyId: string;
  statsToShow: LaptopStat[];
}) {
  const rows = useMemo(() =>
    entries.map((e) => ({
      entry: e,
      stats: computeStatsForDesign(e.model.design, year),
    })),
    [entries, year],
  );

  const thBase: CSSProperties = {
    textAlign: "left",
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.panelBorder}`,
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    background: tokens.colors.cardBg,
    zIndex: 1,
  };
  const thRight: CSSProperties = { ...thBase, textAlign: "right" };
  const td: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    fontSize: tokens.font.sizeSmall,
    whiteSpace: "nowrap",
  };
  const tdR: CSSProperties = { ...td, textAlign: "right" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thBase}>Model</th>
          <th style={thBase}>Brand</th>
          <th style={thRight}>Price</th>
          <th style={thRight}>Screen</th>
          {statsToShow.map((stat) => (
            <th key={stat} style={thRight}>{STAT_LABELS[stat]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ entry, stats }) => {
          const isPlayer = entry.company.id === playerCompanyId;
          const rowColor = isPlayer ? tokens.colors.accent : undefined;
          return (
            <tr key={entry.model.design.id}>
              <td style={{ ...td, fontWeight: 600, color: rowColor }}>
                {entry.model.design.name}
              </td>
              <td style={{ ...td, color: tokens.colors.textMuted }}>{entry.company.name}</td>
              <td style={tdR}>${entry.model.retailPrice!.toLocaleString()}</td>
              <td style={tdR}>{entry.model.design.screenSize}"</td>
              {statsToShow.map((stat) => {
                const val = Math.round(stats[stat] ?? 0);
                const allVals = rows.map((r) => Math.round(r.stats[stat] ?? 0));
                return (
                  <td key={stat} style={{ ...tdR, color: scoreColor(val, allVals, true) }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// --- Compare view ---

function CompareView({
  entries,
  year,
  playerCompanyId,
  allMarketEntries,
  onAdd,
  onRemove,
  getLastQuarterSales,
}: {
  entries: MarketEntry[];
  year: number;
  playerCompanyId: string;
  allMarketEntries: MarketEntry[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  getLastQuarterSales: (id: string) => number | null;
}) {
  const [search, setSearch] = useState("");

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const selectedIds = new Set(entries.map((e) => e.model.design.id));
    const q = search.toLowerCase();
    return allMarketEntries
      .filter((e) => !selectedIds.has(e.model.design.id))
      .filter((e) =>
        e.model.design.name.toLowerCase().includes(q) ||
        e.company.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [search, allMarketEntries, entries]);

  const allStats = useMemo(() =>
    entries.map((e) => ({
      entry: e,
      stats: computeStatsForDesign(e.model.design, year),
    })),
    [entries, year],
  );

  const thBase: CSSProperties = {
    textAlign: "right",
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.panelBorder}`,
    fontSize: tokens.font.sizeSmall,
    fontWeight: 600,
    minWidth: 100,
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  const rowLabel: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    fontWeight: 600,
    fontSize: tokens.font.sizeSmall,
    whiteSpace: "nowrap",
  };
  const tdR: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    textAlign: "right",
    fontSize: tokens.font.sizeSmall,
  };

  const priceVals = allStats.map((r) => r.entry.model.retailPrice ?? 0);

  return (
    <div>
      {/* Search to add laptops */}
      {entries.length < 4 && (
        <div style={{ position: "relative", marginBottom: tokens.spacing.md }}>
          <input
            type="text"
            placeholder="Search to add a laptop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              fontSize: tokens.font.sizeSmall,
              background: tokens.colors.surface,
              color: tokens.colors.text,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              width: 280,
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: 340,
              background: tokens.colors.cardBg,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              zIndex: 10,
              maxHeight: 240,
              overflowY: "auto",
            }}>
              {searchResults.map((e) => (
                <button
                  key={e.model.design.id}
                  onClick={() => { onAdd(e.model.design.id); setSearch(""); }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                    background: "transparent",
                    color: tokens.colors.text,
                    border: "none",
                    borderBottom: `1px solid ${tokens.colors.surface}`,
                    cursor: "pointer",
                    fontSize: tokens.font.sizeSmall,
                    textAlign: "left",
                  }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = tokens.colors.surface; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                >
                  <span>
                    <span style={{ fontWeight: 600 }}>{e.model.design.name}</span>
                    <span style={{ color: tokens.colors.textMuted, marginLeft: 6 }}>{e.company.name}</span>
                  </span>
                  <span style={{ color: tokens.colors.accent }}>${e.model.retailPrice!.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
          Search above to add laptops to compare (up to 4).
        </p>
      ) : (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ ...thBase, textAlign: "left" }}></th>
          {allStats.map(({ entry }) => {
            const isPlayer = entry.company.id === playerCompanyId;
            return (
              <th key={entry.model.design.id} style={{ ...thBase, color: isPlayer ? tokens.colors.accent : tokens.colors.text }}>
                <div>{entry.model.design.name}</div>
                <div style={{ fontWeight: 400, color: tokens.colors.textMuted, fontSize: 11 }}>{entry.company.name}</div>
                <button
                  onClick={() => onRemove(entry.model.design.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: tokens.colors.danger,
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                    marginTop: 2,
                  }}
                >
                  remove
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={rowLabel}>Price</td>
          {allStats.map(({ entry }) => (
            <td key={entry.model.design.id} style={{ ...tdR, color: scoreColor(entry.model.retailPrice ?? 0, priceVals, false) }}>
              ${entry.model.retailPrice!.toLocaleString()}
            </td>
          ))}
        </tr>
        <tr>
          <td style={rowLabel}>Screen</td>
          {allStats.map(({ entry }) => (
            <td key={entry.model.design.id} style={tdR}>{entry.model.design.screenSize}"</td>
          ))}
        </tr>
        <tr>
          <td style={rowLabel}>Battery</td>
          {allStats.map(({ entry }) => (
            <td key={entry.model.design.id} style={tdR}>{entry.model.design.batteryCapacityWh} Wh</td>
          ))}
        </tr>
        <tr>
          <td style={rowLabel}>Thickness</td>
          {allStats.map(({ entry }) => (
            <td key={entry.model.design.id} style={tdR}>{entry.model.design.thicknessCm.toFixed(1)} cm</td>
          ))}
        </tr>
        <tr>
          <td style={rowLabel}>Last Qtr Sales</td>
          {allStats.map(({ entry }) => {
            const sales = getLastQuarterSales(entry.model.design.id);
            return (
              <td key={entry.model.design.id} style={tdR}>
                {sales !== null ? `${sales.toLocaleString()} units` : "—"}
              </td>
            );
          })}
        </tr>
        {/* Separator */}
        <tr><td colSpan={allStats.length + 1} style={{ padding: `${tokens.spacing.xs}px 0`, borderBottom: `1px solid ${tokens.colors.panelBorder}` }}></td></tr>
        {ALL_STATS.map((stat) => {
          const vals = allStats.map((r) => Math.round(r.stats[stat] ?? 0));
          return (
            <tr key={stat}>
              <td style={rowLabel}>{STAT_LABELS[stat]}</td>
              {allStats.map(({ entry }, i) => (
                <td key={entry.model.design.id} style={{ ...tdR, color: scoreColor(vals[i], vals, true) }}>
                  {vals[i]}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
      )}
    </div>
  );
}

// --- Main screen ---

export function MarketBrowserScreen() {
  const { state } = useGame();
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterScreenSize, setFilterScreenSize] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [demographicFilter, setDemographicFilter] = useState<string>("all");

  const allEntries = getMarketEntries(state);
  const maxStats = getMaxStatValue(allEntries, state.year);
  const playerCompanyId = state.companies.find((c) => c.isPlayer)?.id ?? "";

  // Build option lists for CustomSelect dropdowns
  const brands = Array.from(new Set(allEntries.map((e) => e.company.id)));

  const sortOptions: SelectGroup[] = [
    { label: "General", options: [
      { value: "price", label: "Price" },
      { value: "name", label: "Name" },
      { value: "brand", label: "Brand" },
      { value: "screenSize", label: "Screen Size" },
    ]},
    { label: "By Stat (best first)", options: ALL_STATS.map((stat) => ({ value: `stat:${stat}`, label: STAT_LABELS[stat] })) },
  ];

  const brandOptions: SelectOption[] = [
    { value: "all", label: "All" },
    ...brands.map((id) => ({
      value: id,
      label: state.companies.find((c) => c.id === id)?.name ?? id,
    })),
  ];

  const screenSizes = Array.from(new Set(allEntries.map((e) => e.model.design.screenSize))).sort((a, b) => a - b);
  const screenOptions: SelectOption[] = [
    { value: "all", label: "All" },
    ...screenSizes.map((size) => ({ value: String(size), label: `${size}"` })),
  ];

  const priceBuckets = [500, 1000, 1500, 2000, 3000, 5000];
  const priceOptions: SelectOption[] = [
    { value: "all", label: "Any" },
    ...priceBuckets.map((p) => ({ value: String(p), label: `$${p.toLocaleString()}` })),
  ];

  const demographicOptions: SelectOption[] = [
    { value: "all", label: "All" },
    ...DEMOGRAPHICS.map((dem) => ({ value: dem.id, label: dem.name })),
  ];

  // Demographic-weighted stats to show in table
  const tableStats = useMemo(() => {
    if (demographicFilter === "all") return TABLE_STATS;
    const dem = DEMOGRAPHICS.find((d) => d.id === demographicFilter);
    if (!dem) return TABLE_STATS;
    return [...ALL_STATS]
      .sort((a, b) => (dem.statWeights[b] ?? 0) - (dem.statWeights[a] ?? 0))
      .slice(0, 7);
  }, [demographicFilter]);

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
    if (sortBy.startsWith("stat:")) {
      const stat = sortBy.slice(5) as LaptopStat;
      const aStats = computeStatsForDesign(a.model.design, state.year);
      const bStats = computeStatsForDesign(b.model.design, state.year);
      return (bStats[stat] ?? 0) - (aStats[stat] ?? 0); // descending
    }
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
    return 0;
  });

  const compareEntries = compareIds
    .map((id) => allEntries.find((e) => e.model.design.id === id))
    .filter(Boolean) as MarketEntry[];

  const lookupSales = (id: string) => getLastQuarterSales(state, id);

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
        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          <button style={viewBtnStyle(viewMode === "cards")} onClick={() => setViewMode("cards")}>
            <LayoutGrid size={14} /> Cards
          </button>
          <button style={viewBtnStyle(viewMode === "table")} onClick={() => setViewMode("table")}>
            <Table size={14} /> Table
          </button>
          <button
            style={viewBtnStyle(viewMode === "compare")}
            onClick={() => setViewMode("compare")}
          >
            Compare{compareIds.length > 0 && ` (${compareIds.length})`}
          </button>
        </div>

        <CustomSelect
          label="Sort"
          value={sortBy}
          onChange={(v) => setSortBy(v as SortKey)}
          options={sortOptions}
        />
        <CustomSelect
          label="Brand"
          value={filterBrand}
          onChange={setFilterBrand}
          options={brandOptions}
        />
        <CustomSelect
          label="Screen"
          value={filterScreenSize}
          onChange={setFilterScreenSize}
          options={screenOptions}
        />
        <CustomSelect
          label="Max price"
          value={filterPriceMax}
          onChange={setFilterPriceMax}
          options={priceOptions}
        />
        <CustomSelect
          label="Demographic"
          value={demographicFilter}
          onChange={setDemographicFilter}
          options={demographicOptions}
        />
        <span style={labelStyle}>
          {filtered.length} laptop{filtered.length !== 1 ? "s" : ""} on sale
        </span>
      </div>

      {/* Scrollable content area */}
      <div
        className="content-panel hide-scrollbar"
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        {filtered.length === 0 ? (
          <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
            No laptops on the market yet. Design and manufacture your first model!
          </p>
        ) : viewMode === "cards" ? (
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
        ) : viewMode === "table" ? (
          <TableView
            entries={filtered}
            year={state.year}
            playerCompanyId={playerCompanyId}
            statsToShow={tableStats}
          />
        ) : (
          <CompareView
            entries={compareEntries}
            year={state.year}
            playerCompanyId={playerCompanyId}
            allMarketEntries={allEntries}
            onAdd={(id) => setCompareIds((prev) => prev.length >= 4 ? prev : [...prev, id])}
            onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
            getLastQuarterSales={lookupSales}
          />
        )}
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
