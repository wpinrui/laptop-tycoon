import { CSSProperties, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { CustomSelect, SelectOption } from "../shell/CustomSelect";
import { DEMOGRAPHICS } from "../../data/demographics";
import { getPriceCeiling, getAnnualBuyers } from "../../simulation/demographicData";
import { Demographic, DemographicTier, STAT_LABELS } from "../../data/types";

type SortField = "buyers" | "priceCeiling" | "name";
type TierFilter = "all" | DemographicTier;
type PriceSensFilter = "all" | "veryHigh" | "high" | "moderate" | "low";

const SORT_OPTIONS: SelectOption<SortField>[] = [
  { value: "buyers", label: "Buyers" },
  { value: "priceCeiling", label: "Price Ceiling" },
  { value: "name", label: "Name" },
];

const TIER_OPTIONS: SelectOption<TierFilter>[] = [
  { value: "all", label: "All" },
  { value: "generalist", label: "Generalist" },
  { value: "niche", label: "Niche" },
];

const PRICE_SENS_OPTIONS: SelectOption<PriceSensFilter>[] = [
  { value: "all", label: "All" },
  { value: "veryHigh", label: "Very Price Sensitive" },
  { value: "high", label: "Price Sensitive" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Price Insensitive" },
];

function getPriceSensitivityLabel(priceWeight: number): { label: string; color: string; bucket: PriceSensFilter } {
  if (priceWeight >= 0.35) return { label: "Very price sensitive", color: tokens.colors.danger, bucket: "veryHigh" };
  if (priceWeight >= 0.25) return { label: "Price sensitive", color: tokens.colors.warning, bucket: "high" };
  if (priceWeight >= 0.15) return { label: "Moderate", color: tokens.colors.text, bucket: "moderate" };
  return { label: "Price insensitive", color: tokens.colors.success, bucket: "low" };
}

function getTopAndBottomStats(demo: Demographic): { top: string[]; bottom: string[] } {
  const entries = Object.entries(demo.statWeights)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a);

  const top = entries.slice(0, 3).map(([stat]) => STAT_LABELS[stat as keyof typeof STAT_LABELS] ?? stat);
  const bottom = entries.slice(-3).reverse().map(([stat]) => STAT_LABELS[stat as keyof typeof STAT_LABELS] ?? stat);

  return { top, bottom };
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: tokens.spacing.md,
  paddingBottom: tokens.spacing.lg,
};

const cardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.md,
};

const cardTitleStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  marginBottom: tokens.spacing.sm,
};

const descriptionStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.md,
  lineHeight: 1.4,
};

const labelStyle: CSSProperties = {
  fontSize: "0.6875rem",
  color: tokens.colors.textMuted,
  fontWeight: "bold",
  letterSpacing: "0.5px",
  marginBottom: tokens.spacing.xs,
};

const tagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: tokens.font.sizeSmall,
  borderRadius: tokens.borderRadius.sm,
  padding: "2px 8px",
  marginRight: 4,
  marginBottom: 4,
};

const topTagStyle: CSSProperties = {
  ...tagStyle,
  color: tokens.colors.accent,
  background: tokens.colors.accentBg,
};

const bottomTagStyle: CSSProperties = {
  ...tagStyle,
  color: tokens.colors.textMuted,
  background: tokens.colors.surface,
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: tokens.spacing.sm,
  marginTop: tokens.spacing.sm,
  paddingTop: tokens.spacing.sm,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
  fontSize: tokens.font.sizeSmall,
};

function DemographicCard({ demo, year }: { demo: Demographic; year: number }) {
  const { top, bottom } = getTopAndBottomStats(demo);
  const priceSensitivity = getPriceSensitivityLabel(demo.priceWeight);
  const ceiling = getPriceCeiling(demo.id, year);
  const annualBuyers = getAnnualBuyers(demo.id, year);
  const screenPref = demo.screenSizePreference;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>{demo.name}</div>
      <div style={descriptionStyle}>{demo.description}</div>

      <div style={{ marginBottom: tokens.spacing.sm }}>
        <div style={labelStyle}>PRIORITIES</div>
        {top.map((stat) => (
          <span key={stat} style={topTagStyle}>{stat}</span>
        ))}
      </div>

      <div style={{ marginBottom: tokens.spacing.sm }}>
        <div style={labelStyle}>LOW PRIORITY</div>
        {bottom.map((stat) => (
          <span key={stat} style={bottomTagStyle}>{stat}</span>
        ))}
      </div>

      <div style={metaRowStyle}>
        <div>
          <span style={{ color: tokens.colors.textMuted }}>Price: </span>
          <span style={{ color: priceSensitivity.color, fontWeight: 600 }}>{priceSensitivity.label}</span>
        </div>
        <div>
          <span style={{ color: tokens.colors.textMuted }}>Ceiling: </span>
          <span style={{ fontWeight: 600 }}>${ceiling.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ ...metaRowStyle, borderTop: "none", marginTop: 0, paddingTop: 0 }}>
        <div>
          <span style={{ color: tokens.colors.textMuted }}>Screen: </span>
          <span style={{ fontWeight: 600 }}>{screenPref.preferredMin}–{screenPref.preferredMax}"</span>
        </div>
        <div>
          <span style={{ color: tokens.colors.textMuted }}>Buyers/yr: </span>
          <span style={{ fontWeight: 600 }}>{annualBuyers.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
  flexWrap: "wrap",
  marginBottom: tokens.spacing.md,
};

export function MarketOverviewScreen() {
  const { state } = useGame();
  const [sortBy, setSortBy] = useState<SortField>("buyers");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [priceSensFilter, setPriceSensFilter] = useState<PriceSensFilter>("all");

  const sorted = useMemo(() => {
    const filtered = DEMOGRAPHICS.filter((d) => {
      if (tierFilter !== "all" && d.tier !== tierFilter) return false;
      if (priceSensFilter !== "all" && getPriceSensitivityLabel(d.priceWeight).bucket !== priceSensFilter) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "buyers":
          return getAnnualBuyers(b.id, state.year) - getAnnualBuyers(a.id, state.year);
        case "priceCeiling":
          return getPriceCeiling(b.id, state.year) - getPriceCeiling(a.id, state.year);
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
  }, [sortBy, tierFilter, priceSensFilter, state.year]);

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader title="Market Overview" icon={BarChart3} />
      <div className="content-panel hide-scrollbar" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={toolbarStyle}>
          <CustomSelect label="Sort:" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
          <CustomSelect label="Tier:" value={tierFilter} onChange={setTierFilter} options={TIER_OPTIONS} />
          <CustomSelect label="Price:" value={priceSensFilter} onChange={setPriceSensFilter} options={PRICE_SENS_OPTIONS} />
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            {sorted.length} demographic{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={gridStyle}>
          {sorted.map((demo) => (
            <DemographicCard key={demo.id} demo={demo} year={state.year} />
          ))}
        </div>
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
