import { CSSProperties, useState, useMemo } from "react";
import { Monitor, LayoutGrid, Table, Search } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { modelDisplayName } from "../../state/gameTypes";
import { ContentPanel } from "../../shell/ContentPanel";
import { ScreenHeader } from "../../shell/ScreenHeader";
import { StatusBar } from "../../shell/StatusBar";
import { CustomSelect, SelectOption, SelectGroup } from "../../shell/CustomSelect";
import {
  ViewMode,
  SortKey,
  LaptopStat,
  MarketEntry,
  ALL_STATS,
  STAT_LABELS,
  computeStatsForDesign,
  getMarketEntries,
  getLastQuarterSales,
  TABLE_STATS,
  MAX_COMPARE,
  tokens,
} from "./types";
import { LaptopCard } from "./LaptopCard";
import { TableView } from "./TableView";
import { CompareView } from "./CompareView";

/** Pre-computed stats for a market entry, computed once and shared across all views. */
export interface EntryWithStats {
  entry: MarketEntry;
  stats: Partial<Record<LaptopStat, number>>;
}

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

const searchInputStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  color: tokens.colors.text,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  fontSize: tokens.font.sizeSmall,
  fontFamily: tokens.font.family,
  outline: "none",
  width: 160,
};

export function MarketBrowserScreen() {
  const { state } = useGame();
  const [sortBy, setSortBy] = useState<SortKey>("year");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterScreenSize, setFilterScreenSize] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<string>("all");
  const [filterPriceMin, setFilterPriceMin] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const allEntries = getMarketEntries(state);
  const playerCompanyId = state.companies.find((c) => c.isPlayer)?.id ?? "";

  // Centralized stat computation — computed once, shared by all views
  const allEntriesWithStats: EntryWithStats[] = useMemo(
    () => allEntries.map((entry) => ({
      entry,
      stats: computeStatsForDesign(entry.model.design, state.year),
    })),
    [allEntries, state.year],
  );

  // Max stats across entire market (for stat bar normalization)
  const maxStats = useMemo(() => {
    const maxes: Partial<Record<LaptopStat, number>> = {};
    for (const { stats } of allEntriesWithStats) {
      for (const stat of ALL_STATS) {
        const val = stats[stat] ?? 0;
        if (!maxes[stat] || val > maxes[stat]) maxes[stat] = val;
      }
    }
    return maxes;
  }, [allEntriesWithStats]);

  // Build option lists for CustomSelect dropdowns
  const brands = Array.from(new Set(allEntries.map((e) => e.company.id)));

  const sortOptions: SelectGroup<SortKey>[] = [
    { label: "General", options: [
      { value: "year", label: "Year (newest)" },
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
    ...priceBuckets.map((p) => ({ value: String(p), label: `≤ $${p.toLocaleString()}` })),
  ];

  const priceMinOptions: SelectOption[] = [
    { value: "all", label: "Any" },
    ...priceBuckets.map((p) => ({ value: String(p), label: `≥ $${p.toLocaleString()}` })),
  ];

  const years = Array.from(new Set(allEntries.map((e) => e.model.yearDesigned))).sort((a, b) => b - a);
  const yearOptions: SelectOption[] = [
    { value: "all", label: "All" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];

  const statusOptions: SelectOption[] = [
    { value: "all", label: "All" },
    { value: "onSale", label: "On Sale" },
    { value: "manufacturing", label: "Manufacturing" },
  ];

  // Filter
  let filtered = [...allEntriesWithStats];

  // Text search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((ews) =>
      modelDisplayName(ews.entry.company.name, ews.entry.model.design.name).toLowerCase().includes(q),
    );
  }

  if (filterBrand !== "all") {
    filtered = filtered.filter((ews) => ews.entry.company.id === filterBrand);
  }
  if (filterScreenSize !== "all") {
    const size = Number(filterScreenSize);
    filtered = filtered.filter((ews) => ews.entry.model.design.screenSize === size);
  }
  if (filterPriceMax !== "all") {
    const max = Number(filterPriceMax);
    filtered = filtered.filter((ews) => (ews.entry.model.retailPrice ?? 0) <= max);
  }
  if (filterPriceMin !== "all") {
    const min = Number(filterPriceMin);
    filtered = filtered.filter((ews) => (ews.entry.model.retailPrice ?? 0) >= min);
  }
  if (filterYear !== "all") {
    const y = Number(filterYear);
    filtered = filtered.filter((ews) => ews.entry.model.yearDesigned === y);
  }
  if (filterStatus !== "all") {
    filtered = filtered.filter((ews) => ews.entry.model.status === filterStatus);
  }

  // Sort — uses pre-computed stats (no redundant recomputation)
  if (sortBy.startsWith("stat:")) {
    const stat = sortBy.slice(5) as LaptopStat;
    filtered.sort((a, b) => (b.stats[stat] ?? 0) - (a.stats[stat] ?? 0));
  } else {
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "year":
          return b.entry.model.yearDesigned - a.entry.model.yearDesigned;
        case "price":
          return (a.entry.model.retailPrice ?? 0) - (b.entry.model.retailPrice ?? 0);
        case "name":
          return a.entry.model.design.name.localeCompare(b.entry.model.design.name);
        case "brand":
          return a.entry.company.name.localeCompare(b.entry.company.name);
        case "screenSize":
          return a.entry.model.design.screenSize - b.entry.model.design.screenSize;
      }
      return 0;
    });
  }

  const compareEntries = compareIds
    .map((id) => allEntriesWithStats.find((ews) => ews.entry.model.design.id === id))
    .filter(Boolean) as EntryWithStats[];

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE ? prev : [...prev, id],
    );
  };

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

        {/* Global search */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Search size={14} color={tokens.colors.textMuted} />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
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
          label="Min price"
          value={filterPriceMin}
          onChange={setFilterPriceMin}
          options={priceMinOptions}
        />
        <CustomSelect
          label="Max price"
          value={filterPriceMax}
          onChange={setFilterPriceMax}
          options={priceOptions}
        />
        <CustomSelect
          label="Year"
          value={filterYear}
          onChange={setFilterYear}
          options={yearOptions}
        />
        <CustomSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
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
            {allEntries.length === 0
              ? "No laptops on the market yet. Design and manufacture your first model!"
              : "No laptops match your filters."}
          </p>
        ) : viewMode === "cards" ? (
          <div style={gridStyle}>
            {filtered.map(({ entry, stats }) => (
              <LaptopCard
                key={entry.model.design.id}
                entry={entry}
                stats={stats}
                year={state.year}
                maxStats={maxStats}
                lastQuarterSales={getLastQuarterSales(state, entry.model.design.id)}
                isInCompare={compareIds.includes(entry.model.design.id)}
                onToggleCompare={() => toggleCompare(entry.model.design.id)}
                compareDisabled={!compareIds.includes(entry.model.design.id) && compareIds.length >= MAX_COMPARE}
              />
            ))}
          </div>
        ) : viewMode === "table" ? (
          <TableView
            entries={filtered}
            year={state.year}
            playerCompanyId={playerCompanyId}
            statsToShow={TABLE_STATS}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
          />
        ) : (
          <CompareView
            entries={compareEntries}
            year={state.year}
            playerCompanyId={playerCompanyId}
            allMarketEntries={allEntriesWithStats}
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
