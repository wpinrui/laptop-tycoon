import { CSSProperties } from "react";
import { BarChart3 } from "lucide-react";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { DEMOGRAPHICS } from "../../data/demographics";
import { getPriceCeiling, getAnnualBuyers } from "../../simulation/demographicData";
import { Demographic, STAT_LABELS } from "../../data/types";

function getPriceSensitivityLabel(priceWeight: number): { label: string; color: string } {
  if (priceWeight >= 0.35) return { label: "Very price sensitive", color: tokens.colors.danger };
  if (priceWeight >= 0.25) return { label: "Price sensitive", color: tokens.colors.warning };
  if (priceWeight >= 0.15) return { label: "Moderate", color: tokens.colors.text };
  return { label: "Price insensitive", color: tokens.colors.success };
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

export function MarketOverviewScreen() {
  const { state } = useGame();

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader title="Market Overview" icon={BarChart3} />
      <div className="content-panel hide-scrollbar" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={gridStyle}>
          {DEMOGRAPHICS.map((demo) => (
            <DemographicCard key={demo.id} demo={demo} year={state.year} />
          ))}
        </div>
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
