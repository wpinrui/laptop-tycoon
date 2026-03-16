import { CSSProperties, useState, useMemo } from "react";
import { History } from "lucide-react";
import { useGame } from "../state/GameContext";
import {
  GameState,
  Milestone,
  MilestoneType,
  getPlayerCompany,
  STARTING_YEAR,
} from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { formatCash, profitColor, calcMargin, QUARTER_LABELS } from "../utils/formatCash";
import { DEMOGRAPHICS } from "../../data/demographics";
import { Award } from "../../simulation/reviewsAwards";

// ─── Event Type Colors ───────────────────────────────────────

const EVENT_COLORS: Record<MilestoneType, string> = {
  model: tokens.colors.accent,
  award: tokens.colors.statusCash,
  financial: tokens.colors.success,
  market: "#ce93d8",
};

const EVENT_BG: Record<MilestoneType, string> = {
  model: "rgba(79, 195, 247, 0.12)",
  award: "rgba(250, 204, 21, 0.12)",
  financial: "rgba(102, 187, 106, 0.12)",
  market: "rgba(206, 147, 216, 0.12)",
};

const EVENT_LABELS: Record<MilestoneType, string> = {
  model: "Model",
  award: "Award",
  financial: "Financial",
  market: "Market",
};

const ALL_TYPES: MilestoneType[] = ["model", "award", "financial", "market"];

// ─── Layout Styles ───────────────────────────────────────────

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  height: tokens.layout.panelHeight,
  width: tokens.layout.panelWidth,
};

const scrollBody: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
};

// ─── Stats Bar ───────────────────────────────────────────────

const statsBarStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.md,
  marginBottom: tokens.spacing.lg,
};

const statItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const statValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
};

const statLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

// ─── Filter Chips ────────────────────────────────────────────

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.sm,
  flexWrap: "wrap",
  marginBottom: tokens.spacing.md,
};

function chipStyle(active: boolean): CSSProperties {
  return {
    fontSize: tokens.font.sizeSmall,
    padding: "5px 12px",
    borderRadius: tokens.borderRadius.sm,
    border: `1px solid ${active ? tokens.colors.text : tokens.colors.panelBorder}`,
    background: active ? tokens.colors.surfaceHover : "transparent",
    color: active ? tokens.colors.text : tokens.colors.textMuted,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: tokens.font.family,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
}

const chipDotStyle = (color: string): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
  flexShrink: 0,
});

// ─── Year Group ──────────────────────────────────────────────

const yearLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  color: tokens.colors.text,
  marginBottom: tokens.spacing.md,
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
};

const yearLineStyle: CSSProperties = {
  flex: 1,
  height: 1,
  background: tokens.colors.panelBorder,
};

// ─── Timeline ────────────────────────────────────────────────

const timelineStyle: CSSProperties = {
  position: "relative",
  paddingLeft: 28,
  display: "flex",
  flexDirection: "column",
};

const timelineLineStyle: CSSProperties = {
  content: "''",
  position: "absolute",
  left: 7,
  top: 8,
  bottom: 8,
  width: 2,
  background: tokens.colors.panelBorder,
};

const timelineEventStyle: CSSProperties = {
  position: "relative",
  padding: "10px 0",
};

function timelineDotStyle(color: string): CSSProperties {
  return {
    width: 16,
    height: 16,
    borderRadius: "50%",
    position: "absolute",
    left: -28,
    top: 13,
    border: `3px solid ${tokens.colors.background}`,
    background: color,
    zIndex: 1,
  };
}

const timelineCardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  transition: "background 0.15s",
  cursor: "pointer",
};

const eventHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  marginBottom: 4,
};

function badgeStyle(type: MilestoneType): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "2px 8px",
    borderRadius: tokens.borderRadius.sm,
    background: EVENT_BG[type],
    color: EVENT_COLORS[type],
  };
}

const expandHintStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginLeft: 8,
  opacity: 0,
  transition: "opacity 0.15s",
};

const quarterStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginLeft: "auto",
};

const eventTitleStyle: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  fontWeight: 600,
  color: tokens.colors.text,
  lineHeight: 1.4,
};

const eventDetailStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: 4,
  lineHeight: 1.5,
};

// ─── Detail Panel ────────────────────────────────────────────

const detailPanelStyle: CSSProperties = {
  marginTop: tokens.spacing.md,
  paddingTop: tokens.spacing.md,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
  color: tokens.colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: `${tokens.spacing.md}px 0 ${tokens.spacing.sm}px`,
};

const specGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2px 24px",
};

const specRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0",
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

const specLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const specValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.text,
  fontWeight: 500,
  textAlign: "right",
};

const salesStatsStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  marginTop: tokens.spacing.md,
  padding: tokens.spacing.md,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
};

const salesStatStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  flex: 1,
};

function statusBadgeStyle(status: "onSale" | "discontinued"): CSSProperties {
  const isDisc = status === "discontinued";
  return {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "2px 8px",
    borderRadius: tokens.borderRadius.sm,
    marginLeft: 8,
    verticalAlign: "middle",
    background: isDisc ? tokens.colors.dangerBg : tokens.colors.successBg,
    color: isDisc ? tokens.colors.danger : tokens.colors.success,
  };
}

// ─── Quarter Table ───────────────────────────────────────────

const qTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: tokens.font.sizeSmall,
};

const qThStyle: CSSProperties = {
  textAlign: "left",
  color: tokens.colors.textMuted,
  fontWeight: 500,
  padding: "4px 8px 4px 0",
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
};

const qThRight: CSSProperties = { ...qThStyle, textAlign: "right" };

const qTdStyle: CSSProperties = {
  padding: "5px 8px 5px 0",
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

const qTdRight: CSSProperties = {
  ...qTdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

// ─── Demo Bar ────────────────────────────────────────────────

const demoBarRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  padding: "4px 0",
};

const demoBarLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  width: 120,
  flexShrink: 0,
};

const demoBarTrackStyle: CSSProperties = {
  flex: 1,
  height: 8,
  background: tokens.colors.surface,
  borderRadius: 4,
  overflow: "hidden",
};

const demoBarValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.text,
  width: 40,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

// ─── Runner-up ───────────────────────────────────────────────

const runnerUpStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: tokens.spacing.sm,
  padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
};

// ─── Margin Bar ──────────────────────────────────────────────

function MarginBar({ margin }: { margin: number }) {
  const pct = Math.min(Math.abs(margin) / 50 * 100, 100);
  const color = margin >= 20 ? tokens.colors.success : margin >= 0 ? tokens.colors.warning : tokens.colors.danger;
  return (
    <span style={{ display: "inline-block", width: 60, height: 6, background: tokens.colors.surface, borderRadius: 3, overflow: "hidden", verticalAlign: "middle", marginLeft: 6 }}>
      <span style={{ display: "block", width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────

export function HistoryScreen() {
  const { state } = useGame();
  const milestones = state.milestones;
  const [activeTypes, setActiveTypes] = useState<Set<MilestoneType>>(new Set(ALL_TYPES));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allActive = activeTypes.size === ALL_TYPES.length;

  const toggleType = (type: MilestoneType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filtered = useMemo(
    () =>
      allActive
        ? milestones
        : milestones.filter((m) => activeTypes.has(m.type)),
    [milestones, activeTypes, allActive],
  );

  // Group by year, reverse chronological
  const grouped = useMemo(() => {
    const map = new Map<number, Milestone[]>();
    for (const m of filtered) {
      const arr = map.get(m.year) ?? [];
      arr.push(m);
      map.set(m.year, arr);
    }
    // Sort milestones within each year: reverse quarter, then award > financial > market > model
    const typePriority: Record<MilestoneType, number> = { award: 0, financial: 1, market: 2, model: 3 };
    for (const arr of map.values()) {
      arr.sort((a, b) => b.quarter - a.quarter || typePriority[a.type] - typePriority[b.type]);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  // Stats
  const counts = useMemo(() => {
    const c = { model: 0, award: 0, financial: 0, market: 0 };
    for (const m of milestones) c[m.type]++;
    return c;
  }, [milestones]);
  const yearsInBusiness = state.year - STARTING_YEAR;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (milestones.length === 0) {
    return (
      <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
        <ScreenHeader title="Company History" icon={History} />
        <p style={{ color: tokens.colors.textMuted, fontStyle: "italic", fontSize: tokens.font.sizeBase }}>
          Your story begins when you launch your first model.
        </p>
        <StatusBar />
      </ContentPanel>
    );
  }

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
      <ScreenHeader title="Company History" icon={History} />
      <div className="content-panel hide-scrollbar" style={scrollBody}>
        {/* Stats bar */}
        <div style={statsBarStyle}>
          <div style={statItemStyle}>
            <div style={{ ...statValueStyle, color: EVENT_COLORS.model }}>{counts.model}</div>
            <div style={statLabelStyle}>Models launched</div>
          </div>
          <div style={statItemStyle}>
            <div style={{ ...statValueStyle, color: EVENT_COLORS.award }}>{counts.award}</div>
            <div style={statLabelStyle}>Awards won</div>
          </div>
          <div style={statItemStyle}>
            <div style={{ ...statValueStyle, color: EVENT_COLORS.financial }}>{counts.financial}</div>
            <div style={statLabelStyle}>Financial milestones</div>
          </div>
          <div style={statItemStyle}>
            <div style={{ ...statValueStyle, color: EVENT_COLORS.market }}>{counts.market}</div>
            <div style={statLabelStyle}>Market milestones</div>
          </div>
          <div style={statItemStyle}>
            <div style={{ ...statValueStyle, color: tokens.colors.text }}>{yearsInBusiness}</div>
            <div style={statLabelStyle}>Years in business</div>
          </div>
        </div>

        {/* Filter chips */}
        <div style={filterRowStyle}>
          <button style={chipStyle(allActive)} onClick={() => setActiveTypes(new Set(ALL_TYPES))}>All</button>
          {ALL_TYPES.map((t) => (
            <button key={t} style={chipStyle(activeTypes.has(t))} onClick={() => toggleType(t)}>
              <span style={chipDotStyle(EVENT_COLORS[t])} />
              {EVENT_LABELS[t] + "s"}
            </button>
          ))}
        </div>

        {/* Timeline by year */}
        {grouped.map(([year, events]) => (
          <div key={year} style={{ marginTop: tokens.spacing.lg }}>
            <div style={yearLabelStyle}>
              {year} <span style={yearLineStyle} />
            </div>
            <div style={timelineStyle}>
              <div style={timelineLineStyle} />
              {events.map((ms) => (
                <TimelineEvent
                  key={ms.id}
                  milestone={ms}
                  state={state}
                  isExpanded={expanded.has(ms.id)}
                  onToggle={() => toggleExpand(ms.id)}
                />
              ))}
            </div>
          </div>
        ))}

        <div style={{ height: tokens.spacing.xl }} />
      </div>
      <StatusBar />
    </ContentPanel>
  );
}

// ─── Timeline Event ──────────────────────────────────────────

function TimelineEvent({
  milestone: ms,
  state,
  isExpanded,
  onToggle,
}: {
  milestone: Milestone;
  state: GameState;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = EVENT_COLORS[ms.type];

  return (
    <div style={timelineEventStyle}>
      <div style={timelineDotStyle(color)} />
      <div
        style={timelineCardStyle}
        onClick={onToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = tokens.colors.cardBgHover;
          const hint = e.currentTarget.querySelector<HTMLElement>("[data-hint]");
          if (hint) hint.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = tokens.colors.cardBg;
          const hint = e.currentTarget.querySelector<HTMLElement>("[data-hint]");
          if (hint) hint.style.opacity = "0";
        }}
      >
        <div style={eventHeaderStyle}>
          <span style={badgeStyle(ms.type)}>{EVENT_LABELS[ms.type]}</span>
          <span data-hint style={expandHintStyle}>click to {isExpanded ? "collapse" : "expand"}</span>
          <span style={quarterStyle}>{QUARTER_LABELS[ms.quarter - 1]}</span>
        </div>
        <div style={eventTitleStyle}>{ms.title}</div>
        <div style={eventDetailStyle}>{ms.detail}</div>

        {isExpanded && (
          <div style={detailPanelStyle}>
            {ms.type === "model" && <ModelDetail milestone={ms} state={state} />}
            {ms.type === "award" && <AwardDetail milestone={ms} state={state} />}
            {ms.type === "financial" && <FinancialDetail milestone={ms} state={state} />}
            {ms.type === "market" && <MarketDetail milestone={ms} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Model Detail ────────────────────────────────────────────

function ModelDetail({ milestone: ms, state }: { milestone: Milestone; state: GameState }) {
  const player = getPlayerCompany(state);
  const model = player.models.find((m) => m.design.id === ms.modelId);
  if (!model) return <div style={eventDetailStyle}>Model data not available</div>;

  const design = model.design;
  const status = model.status;
  const unitCost = design.unitCost;
  const retailPrice = model.retailPrice ?? 0;
  const margin = calcMargin(retailPrice - unitCost, retailPrice);

  // Compute lifetime sales from yearHistory + quarterHistory
  const lifetime = computeLifetimeSales(state, ms.modelId!);

  // Quarterly sales breakdown
  const quarterlySales = computeQuarterlySales(state, ms.modelId!);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: EVENT_COLORS.model }}>
          {design.name}
        </span>
        {(status === "onSale" || status === "discontinued") && (
          <span style={statusBadgeStyle(status)}>
            {status === "onSale" ? "On Sale" : "Discontinued"}
          </span>
        )}
        <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginLeft: "auto" }}>
          Designed {model.yearDesigned}
        </span>
      </div>

      <div style={{ ...sectionHeadingStyle, marginTop: 0 }}>Specifications</div>
      <div style={specGridStyle}>
        <SpecRow label="Screen" value={`${design.screenSize}"`} />
        {design.components.displayTech && <SpecRow label="Display" value={design.components.displayTech.name} />}
        {design.components.resolution && <SpecRow label="Resolution" value={design.components.resolution.name} />}
        {design.components.cpu && <SpecRow label="CPU" value={design.components.cpu.name} />}
        {design.components.gpu && <SpecRow label="GPU" value={design.components.gpu.name} />}
        {design.components.ram && <SpecRow label="RAM" value={design.components.ram.name} />}
        {design.components.storage && <SpecRow label="Storage" value={design.components.storage.name} />}
        {design.components.wifi && <SpecRow label="WiFi" value={design.components.wifi.name} />}
        {design.components.webcam && <SpecRow label="Webcam" value={design.components.webcam.name} />}
        <SpecRow label="Battery" value={`${design.batteryCapacityWh} Wh`} />
        <SpecRow label="Thickness" value={`${design.thicknessCm} cm`} />
        {design.chassis.material && <SpecRow label="Chassis" value={design.chassis.material.name} />}
        {design.selectedColours.length > 0 && (
          <SpecRow label="Colours" value={design.selectedColours.join(", ")} />
        )}
        {Object.keys(design.ports).length > 0 && (
          <SpecRow
            label="Ports"
            value={Object.entries(design.ports)
              .map(([name, count]) => (count > 1 ? `${count}× ${name}` : name))
              .join(", ")}
          />
        )}
      </div>

      <div style={sectionHeadingStyle}>Pricing</div>
      <div style={{ display: "flex", gap: 24 }}>
        <div>
          <span style={specLabelStyle}>Unit Cost</span>
          <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: tokens.colors.text }}>
            {formatCash(unitCost)}
          </div>
        </div>
        <div>
          <span style={specLabelStyle}>Retail Price</span>
          <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: tokens.colors.statusCash }}>
            {formatCash(retailPrice)}
          </div>
        </div>
        <div>
          <span style={specLabelStyle}>Margin</span>
          <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: profitColor(margin) }}>
            {margin.toFixed(1)}%
          </div>
        </div>
      </div>

      {lifetime.unitsSold > 0 && (
        <>
          <div style={sectionHeadingStyle}>Sales Performance (Lifetime)</div>
          <div style={salesStatsStyle}>
            <div style={salesStatStyle}>
              <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 700, color: tokens.colors.text }}>
                {lifetime.unitsSold.toLocaleString()}
              </div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Units Sold</div>
            </div>
            <div style={salesStatStyle}>
              <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 700, color: tokens.colors.statusCash }}>
                {formatCash(lifetime.revenue)}
              </div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Revenue</div>
            </div>
            <div style={salesStatStyle}>
              <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 700, color: profitColor(lifetime.profit) }}>
                {formatCash(lifetime.profit)}
              </div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Profit</div>
            </div>
            <div style={salesStatStyle}>
              <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 700, color: tokens.colors.text }}>
                {model.unitsInStock.toLocaleString()}
              </div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Unsold</div>
            </div>
          </div>
        </>
      )}

      {quarterlySales.length > 0 && (
        <>
          <div style={sectionHeadingStyle}>Quarterly Sales</div>
          <table style={qTableStyle}>
            <thead>
              <tr>
                <th style={qThStyle}>Quarter</th>
                <th style={qThRight}>Sold</th>
                <th style={qThRight}>Revenue</th>
                <th style={qThRight}>Profit</th>
                <th style={qThRight}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {quarterlySales.map((qs, i) => {
                const qm = calcMargin(qs.profit, qs.revenue);
                return (
                  <tr key={i}>
                    <td style={qTdStyle}>{qs.label}</td>
                    <td style={qTdRight}>{qs.unitsSold.toLocaleString()}</td>
                    <td style={qTdRight}>{formatCash(qs.revenue)}</td>
                    <td style={{ ...qTdRight, color: profitColor(qs.profit) }}>
                      {qs.profit >= 0 ? "+" : ""}{formatCash(qs.profit)}
                    </td>
                    <td style={qTdRight}>
                      {qm.toFixed(1)}% <MarginBar margin={qm} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

// ─── Award Detail ────────────────────────────────────────────

function AwardDetail({ milestone: ms, state }: { milestone: Milestone; state: GameState }) {
  // Find the award data from yearHistory
  const yearResult = state.yearHistory.find((yr) => yr.year === ms.year);
  const award: Award | undefined = yearResult?.awards?.find((a) => a.category === ms.awardCategory);

  const player = getPlayerCompany(state);
  const winnerModel = player.models.find((m) => m.design.id === ms.modelId);

  return (
    <>
      <div style={{ ...sectionHeadingStyle, marginTop: 0 }}>Winning Model</div>
      {winnerModel ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: EVENT_COLORS.model }}>
              {winnerModel.design.name}
            </span>
            {(winnerModel.status === "onSale" || winnerModel.status === "discontinued") && (
              <span style={statusBadgeStyle(winnerModel.status)}>
                {winnerModel.status === "onSale" ? "On Sale" : "Discontinued"}
              </span>
            )}
          </div>
          <div style={specGridStyle}>
            <SpecRow label="Screen" value={`${winnerModel.design.screenSize}"`} />
            {winnerModel.design.components.cpu && <SpecRow label="CPU" value={winnerModel.design.components.cpu.name} />}
            {winnerModel.design.components.gpu && <SpecRow label="GPU" value={winnerModel.design.components.gpu.name} />}
            {winnerModel.design.components.ram && <SpecRow label="RAM" value={winnerModel.design.components.ram.name} />}
            {winnerModel.design.components.storage && <SpecRow label="Storage" value={winnerModel.design.components.storage.name} />}
            {winnerModel.design.chassis.material && <SpecRow label="Chassis" value={winnerModel.design.chassis.material.name} />}
          </div>
        </>
      ) : (
        <div style={eventDetailStyle}>Model data not available</div>
      )}

      {award?.runnerUpName && (
        <div style={runnerUpStyle}>
          <strong style={{ color: tokens.colors.textMuted }}>Runner-up:</strong> {award.runnerUpName}
          {award.runnerUpOwnerName ? ` (${award.runnerUpOwnerName})` : ""}
        </div>
      )}
    </>
  );
}

// ─── Financial Detail ────────────────────────────────────────

function FinancialDetail({ milestone: ms, state }: { milestone: Milestone; state: GameState }) {
  // Build revenue/profit trajectory from yearHistory
  const yearData = state.yearHistory.map((yr) => ({
    year: yr.year,
    revenue: yr.totalRevenue,
    profit: yr.totalProfit,
  }));

  // For cumulative revenue milestones, show cumulative column
  const isCumulative = ms.title.includes("revenue exceeded");

  if (yearData.length === 0) {
    return <div style={eventDetailStyle}>Financial data not yet available</div>;
  }

  // Pre-compute cumulative revenue for each year row
  const cumulativeByYear: number[] = [];
  let runningTotal = 0;
  for (const yr of yearData) {
    runningTotal += yr.revenue;
    cumulativeByYear.push(runningTotal);
  }

  return (
    <>
      <div style={{ ...sectionHeadingStyle, marginTop: 0 }}>
        {isCumulative ? "Revenue by Year" : "Annual Profit Trend"}
      </div>
      <table style={qTableStyle}>
        <thead>
          <tr>
            <th style={qThStyle}>Year</th>
            <th style={qThRight}>Revenue</th>
            <th style={qThRight}>Profit</th>
            {isCumulative && <th style={qThRight}>Cumulative</th>}
          </tr>
        </thead>
        <tbody>
          {yearData.map((yr, i) => {
            const isMilestoneYear = yr.year === ms.year;
            return (
              <tr key={yr.year}>
                <td style={{ ...qTdStyle, color: isMilestoneYear ? EVENT_COLORS.financial : undefined, fontWeight: isMilestoneYear ? 600 : undefined }}>
                  {yr.year}
                </td>
                <td style={qTdRight}>{formatCash(yr.revenue)}</td>
                <td style={{ ...qTdRight, color: profitColor(yr.profit) }}>
                  {yr.profit >= 0 ? "+" : ""}{formatCash(yr.profit)}
                </td>
                {isCumulative && (
                  <td style={{ ...qTdRight, color: isMilestoneYear ? EVENT_COLORS.financial : undefined, fontWeight: isMilestoneYear ? 600 : undefined }}>
                    {formatCash(cumulativeByYear[i])}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

// ─── Market Detail ───────────────────────────────────────────

function MarketDetail({ milestone: ms }: { milestone: Milestone }) {
  const snapshot = ms.marketShareSnapshot;
  if (!snapshot) return <div style={eventDetailStyle}>Market data not available</div>;

  // Sort by share descending, only show demographics with non-zero share
  const entries = DEMOGRAPHICS
    .filter((d) => (snapshot[d.id] ?? 0) > 0)
    .map((d) => ({ id: d.id, name: d.shortName, share: snapshot[d.id] ?? 0 }))
    .sort((a, b) => b.share - a.share);

  // Detect which demographic triggered the milestone
  const triggerMatch = ms.title.match(/in (.+)$/);
  const triggerName = triggerMatch?.[1];

  return (
    <>
      <div style={{ ...sectionHeadingStyle, marginTop: 0 }}>
        Market Share by Demographic ({ms.year} {QUARTER_LABELS[ms.quarter - 1]})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map((e) => {
          const isTrigger = e.name === triggerName;
          const barColor = isTrigger ? EVENT_COLORS.market : tokens.colors.accent;
          return (
            <div key={e.id} style={demoBarRowStyle}>
              <span style={{ ...demoBarLabelStyle, color: isTrigger ? EVENT_COLORS.market : undefined, fontWeight: isTrigger ? 600 : undefined }}>
                {e.name}
              </span>
              <div style={demoBarTrackStyle}>
                <div style={{ height: "100%", borderRadius: 4, width: `${Math.round(e.share * 100)}%`, background: barColor }} />
              </div>
              <span style={{ ...demoBarValueStyle, color: isTrigger ? EVENT_COLORS.market : undefined, fontWeight: isTrigger ? 600 : undefined }}>
                {Math.round(e.share * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Shared Helpers ──────────────────────────────────────────

function SpecRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={specRowStyle}>
      <span style={specLabelStyle}>{label}</span>
      <span style={{ ...specValueStyle, color: valueColor }}>{value}</span>
    </div>
  );
}

interface LifetimeSales {
  unitsSold: number;
  revenue: number;
  profit: number;
}

function computeLifetimeSales(state: GameState, modelId: string): LifetimeSales {
  let unitsSold = 0;
  let revenue = 0;
  let profit = 0;

  for (const yr of state.yearHistory) {
    const lr = yr.playerResults.find((r) => r.laptopId === modelId);
    if (lr) {
      unitsSold += lr.unitsSold;
      revenue += lr.revenue;
      profit += lr.profit;
    }
  }
  for (const q of state.quarterHistory) {
    const lr = q.playerResults.find((r) => r.laptopId === modelId);
    if (lr) {
      unitsSold += lr.unitsSold;
      revenue += lr.revenue;
      profit += lr.profit;
    }
  }

  return { unitsSold, revenue, profit };
}

interface QuarterlySalesEntry {
  label: string;
  unitsSold: number;
  revenue: number;
  profit: number;
}

function computeQuarterlySales(state: GameState, modelId: string): QuarterlySalesEntry[] {
  const entries: QuarterlySalesEntry[] = [];

  // Current year quarters
  for (const q of state.quarterHistory) {
    const lr = q.playerResults.find((r) => r.laptopId === modelId);
    if (lr) {
      entries.push({
        label: `${q.year} ${QUARTER_LABELS[q.quarter - 1]}`,
        unitsSold: lr.unitsSold,
        revenue: lr.revenue,
        profit: lr.profit,
      });
    }
  }

  return entries;
}
