import { CSSProperties } from "react";
import { LaptopModel } from "../../state/gameTypes";
import {
  MarketEntry,
  LaptopStat,
  ComponentSlot,
  COMPONENT_SLOT_LABELS,
  SPEC_SLOTS,
  DISPLAY_SLOTS,
  MEDIA_SLOTS,
  getAllStats,
  getPortSummary,
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
  year,
  maxStats,
  lastQuarterSales,
}: {
  entry: MarketEntry;
  year: number;
  maxStats: Partial<Record<LaptopStat, number>>;
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
