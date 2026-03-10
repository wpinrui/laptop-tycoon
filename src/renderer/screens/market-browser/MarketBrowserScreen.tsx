import { CSSProperties, useState } from "react";
import { Monitor, LayoutGrid, Table } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { ContentPanel } from "../../shell/ContentPanel";
import { ScreenHeader } from "../../shell/ScreenHeader";
import { StatusBar } from "../../shell/StatusBar";
import { CustomSelect, SelectOption, SelectGroup } from "../../shell/CustomSelect";
import { computeStatsForDesign } from "../../../simulation/statCalculation";
import { ALL_STATS, STAT_LABELS, LaptopStat } from "../../../data/types";
import {
  ViewMode,
  SortKey,
  MarketEntry,
  getMarketEntries,
  getLastQuarterSales,
  getMaxStatValue,
  TABLE_STATS,
  MAX_COMPARE,
  tokens,
} from "./types";
import { LaptopCard } from "./LaptopCard";
import { TableView } from "./TableView";
import { CompareView } from "./CompareView";

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: tokens.spacing.md,
  paddingBottom: tokens.spacing.lg,
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.md,
  alignItems: "center",
  paddingBottom: tokens.spacing.md,
  flexWrap: "wrap",
  flexShrink: 0,
};

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

export function MarketBrowserScreen() {
  const { state } = useGame();
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterScreenSize, setFilterScreenSize] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const allEntries = getMarketEntries(state);
  const maxStats = getMaxStatValue(allEntries, state.year);
  const playerCompanyId = state.companies.find((c) => c.isPlayer)?.id ?? "";

  // Build option lists for CustomSelect dropdowns
  const brands = Array.from(new Set(allEntries.map((e) => e.company.id)));

  const sortOptions: SelectGroup<SortKey>[] = [
    { label: "General", options: [
      { value: "price", label: "Price" },
      { value: "name", label: "Name" },
      { value: "brand", label: "Brand" },
      { value: "screenSize", label: "Screen Size" },
    ]},
    { label: "By Stat (best first)", options: ALL_STATS.map((stat) => ({ value: `stat:${stat}` as SortKey, label: STAT_LABELS[stat] })) },
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

  // Sort — precompute stats once to avoid repeated calls in comparator
  if (sortBy.startsWith("stat:")) {
    const stat = sortBy.slice(5) as LaptopStat;
    const statsCache = new Map(filtered.map((e) => [e.model.design.id, computeStatsForDesign(e.model.design, state.year)]));
    filtered.sort((a, b) => (statsCache.get(b.model.design.id)?.[stat] ?? 0) - (statsCache.get(a.model.design.id)?.[stat] ?? 0));
  } else {
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
      return 0;
    });
  }

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

        <CustomSelect<SortKey>
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
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
            statsToShow={TABLE_STATS}
          />
        ) : (
          <CompareView
            entries={compareEntries}
            year={state.year}
            playerCompanyId={playerCompanyId}
            allMarketEntries={allEntries}
            onAdd={(id) => setCompareIds((prev) => prev.length >= MAX_COMPARE ? prev : [...prev, id])}
            onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
            getLastQuarterSales={lookupSales}
          />
        )}
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
