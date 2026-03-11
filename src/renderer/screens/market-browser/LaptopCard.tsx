import { CSSProperties, useState } from "react";
import { ChevronDown, ChevronUp, GitCompareArrows } from "lucide-react";
import { LaptopModel, modelDisplayName } from "../../state/gameTypes";
import {
  MarketEntry,
  LaptopStat,
  ComponentSlot,
  COMPONENT_SLOT_LABELS,
  SPEC_SLOTS,
  DISPLAY_SLOTS,
  MEDIA_SLOTS,
  getPortSummary,
  getAgeLabel,
  getAgeColor,
  ALL_STATS,
  STAT_LABELS,
  tokens,
  cardStyle,
  playerCardStyle,
  cardHeaderStyle,
  modelNameStyle,
  brandNameStyle,
  priceStyle,
  sectionStyle,
  sectionTitleStyle,
  specRowStyle,
  specLabelStyle,
  specValueStyle,
} from "./types";

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

const ageBadgeStyle = (color: string): CSSProperties => ({
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
  color,
  padding: `1px ${tokens.spacing.xs}px`,
  borderRadius: tokens.borderRadius.sm,
  border: `1px solid ${color}`,
  lineHeight: 1.3,
});

const expandBtnStyle: CSSProperties = {
  background: "transparent",
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  color: tokens.colors.textMuted,
  cursor: "pointer",
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  fontSize: tokens.font.sizeSmall,
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: tokens.font.family,
  width: "100%",
  justifyContent: "center",
  marginTop: tokens.spacing.sm,
};

const compareBtnStyle = (active: boolean, disabled: boolean): CSSProperties => ({
  background: active ? tokens.colors.accentBg : "transparent",
  border: `1px solid ${active ? tokens.colors.accent : tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  color: disabled ? tokens.colors.textMuted : active ? tokens.colors.accent : tokens.colors.textMuted,
  cursor: disabled ? "default" : "pointer",
  padding: `${tokens.spacing.xs}px`,
  display: "flex",
  alignItems: "center",
  opacity: disabled ? 0.4 : 1,
  fontFamily: tokens.font.family,
});

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

export function LaptopCard({
  entry,
  stats,
  year,
  maxStats,
  lastQuarterSales,
  isInCompare,
  onToggleCompare,
  compareDisabled,
}: {
  entry: MarketEntry;
  stats: Partial<Record<LaptopStat, number>>;
  year: number;
  maxStats: Partial<Record<LaptopStat, number>>;
  lastQuarterSales: number | null;
  isInCompare: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const { company, model } = entry;
  const { design } = model;
  const isPlayer = company.isPlayer;
  const ports = getPortSummary(design.ports);
  const [expanded, setExpanded] = useState(false);

  const ageLabel = getAgeLabel(model.yearDesigned, year);
  const ageColor = getAgeColor(model.yearDesigned, year);

  const allModelStats = ALL_STATS
    .map((stat) => ({ stat, label: STAT_LABELS[stat], value: stats[stat] ?? 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div style={isPlayer ? playerCardStyle : cardStyle}>
      {/* Header: name + price + age */}
      <div style={cardHeaderStyle}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={modelNameStyle}>{modelDisplayName(company.name, design.name)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: 2 }}>
            <span style={brandNameStyle}>{company.name} · {model.yearDesigned}</span>
            <span style={ageBadgeStyle(ageColor)}>{ageLabel}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: tokens.spacing.sm, flexShrink: 0 }}>
          <div style={priceStyle}>${model.retailPrice!.toLocaleString()}</div>
          <button
            style={compareBtnStyle(isInCompare, compareDisabled && !isInCompare)}
            onClick={onToggleCompare}
            disabled={compareDisabled && !isInCompare}
            title={isInCompare ? "Remove from compare" : compareDisabled ? "Compare full (max 3)" : "Add to compare"}
          >
            <GitCompareArrows size={14} />
          </button>
        </div>
      </div>

      {/* Quick facts — always visible */}
      {[
        { label: "Screen", value: `${design.screenSize}"` },
        { label: "Thickness", value: `${design.thicknessCm.toFixed(1)} cm` },
        { label: "Battery", value: `${design.batteryCapacityWh} Wh` },
        { label: "Colours", value: String(design.selectedColours.length) },
        ...(lastQuarterSales !== null
          ? [{ label: "Last quarter sales", value: `${lastQuarterSales.toLocaleString()} units`, bold: true }]
          : []),
      ].map(({ label, value, bold }) => (
        <div key={label} style={specRowStyle}>
          <span style={specLabelStyle}>{label}</span>
          <span style={bold ? { ...specValueStyle, fontWeight: 600 } : specValueStyle}>{value}</span>
        </div>
      ))}

      {/* Stat bars — always visible */}
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
              <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, minWidth: 24, textAlign: "right" }}>
                {Math.round(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Expandable detail section */}
      <button style={expandBtnStyle} onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide specs" : "Show full specs"}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <>
          {/* Hardware specs */}
          <SpecSection title="PROCESSING" slots={SPEC_SLOTS} design={design} />
          <SpecSection title="DISPLAY" slots={DISPLAY_SLOTS} design={design} />
          <SpecSection title="MEDIA & CONNECTIVITY" slots={MEDIA_SLOTS} design={design} />

          {/* Chassis */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>CHASSIS</div>
            {[
              { label: "Material", value: design.chassis.material?.name },
              { label: "Cooling", value: design.chassis.coolingSolution?.name },
              { label: "Keyboard", value: design.chassis.keyboardFeature?.name },
              { label: "Trackpad", value: design.chassis.trackpadFeature?.name },
            ]
              .filter((r): r is { label: string; value: string } => !!r.value)
              .map(({ label, value }) => (
                <div key={label} style={specRowStyle}>
                  <span style={specLabelStyle}>{label}</span>
                  <span style={specValueStyle}>{value}</span>
                </div>
              ))}
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
        </>
      )}
    </div>
  );
}
