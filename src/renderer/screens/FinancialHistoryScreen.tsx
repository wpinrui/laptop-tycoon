import { CSSProperties, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, LaptopModel } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { formatCash, pctChange, deltaColor, profitColor, calcMargin, sumCogs, QUARTER_LABELS } from "../utils/formatCash";
import { Sparkline } from "./dashboard/Sparkline";
import { LaptopSalesResult } from "../../simulation/salesTypes";

// ─── Layout ──────────────────────────────────────────────────

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

// ─── KPI Strip ───────────────────────────────────────────────

const kpiStripStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.md,
  marginBottom: tokens.spacing.lg,
};

const kpiBoxStyle: CSSProperties = {
  flex: 1,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
};

const kpiLabel: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginBottom: 6,
};

const kpiValue: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
};

const kpiDelta: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  marginTop: 4,
};

// ─── Tabs ────────────────────────────────────────────────────

type TabId = "quarterly" | "yearly" | "byModel";

const tabBarStyle: CSSProperties = {
  display: "flex",
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  marginBottom: tokens.spacing.lg,
};

function tabStyle(active: boolean): CSSProperties {
  return {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.lg}px`,
    fontSize: tokens.font.sizeBase,
    color: active ? tokens.colors.accent : tokens.colors.textMuted,
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    background: "none",
    border: "none",
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: active ? tokens.colors.accent : "transparent",
    transition: "color 0.15s, border-color 0.15s",
    fontFamily: tokens.font.family,
  };
}

// ─── Chart Section ───────────────────────────────────────────

const chartAreaStyle: CSSProperties = {
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.lg,
};

const chartTitleStyle: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  fontWeight: 600,
  marginBottom: tokens.spacing.md,
};

const legendStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  marginBottom: tokens.spacing.sm,
};

const legendItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

// ─── P&L Table ───────────────────────────────────────────────

const plTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: tokens.font.sizeBase,
};

const plThStyle: CSSProperties = {
  textAlign: "left",
  fontWeight: 600,
  color: tokens.colors.textMuted,
  padding: `${tokens.spacing.sm}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  fontSize: tokens.font.sizeSmall,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const plThRight: CSSProperties = { ...plThStyle, textAlign: "right" };

const plTdStyle: CSSProperties = {
  padding: `${tokens.spacing.sm}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

const plTdRight: CSSProperties = {
  ...plTdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

// ─── Model Breakdown ────────────────────────────────────────

const modelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
  padding: `${tokens.spacing.sm}px 0`,
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

const modelStatStyle: CSSProperties = {
  textAlign: "right" as const,
  minWidth: 100,
};

const modelStatLabel: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const modelStatValue: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
};

// ─── Helpers ─────────────────────────────────────────────────

interface QuarterEntry {
  label: string;
  year: number;
  quarter: number;
  revenue: number;
  profit: number;
  marketing: number;
  cogs: number;
  cash: number;
  playerResults: LaptopSalesResult[];
}

// ─── Component ───────────────────────────────────────────────

export function FinancialHistoryScreen() {
  const { state } = useGame();
  const player = getPlayerCompany(state);
  const [tab, setTab] = useState<TabId>("quarterly");

  // Current year quarterly data (past years only have yearly aggregates)
  const allQuarters = useMemo<QuarterEntry[]>(() => {
    const entries: QuarterEntry[] = [];

    for (const q of state.quarterHistory) {
      entries.push({
        label: `${QUARTER_LABELS[q.quarter - 1]} ${q.year}`,
        year: q.year,
        quarter: q.quarter,
        revenue: q.totalRevenue,
        profit: q.totalProfit,
        marketing: q.marketingCost,
        cogs: sumCogs(q.playerResults),
        cash: q.cashAfterResolution,
        playerResults: q.playerResults,
      });
    }

    return entries;
  }, [state.quarterHistory]);

  // Yearly aggregates
  const yearlyData = useMemo(() => {
    return state.yearHistory.map((yr) => ({
      year: yr.year,
      revenue: yr.totalRevenue,
      profit: yr.totalProfit,
      marketing: yr.marketingCost,
      cogs: sumCogs(yr.playerResults),
      cash: yr.cashAfterResolution,
      playerResults: yr.playerResults,
    }));
  }, [state.yearHistory]);

  // Latest quarter for KPI strip
  const latestQ =
    allQuarters.length > 0 ? allQuarters[allQuarters.length - 1] : null;
  const prevQ =
    allQuarters.length > 1 ? allQuarters[allQuarters.length - 2] : null;

  const revDelta =
    latestQ && prevQ ? pctChange(prevQ.revenue, latestQ.revenue) : null;
  const profitDelta =
    latestQ && prevQ ? pctChange(prevQ.profit, latestQ.profit) : null;
  const latestMargin = latestQ ? calcMargin(latestQ.profit, latestQ.revenue) : 0;
  const prevMargin = prevQ ? calcMargin(prevQ.profit, prevQ.revenue) : 0;
  const marginDelta =
    latestQ && prevQ
      ? `${latestMargin - prevMargin >= 0 ? "+" : ""}${(latestMargin - prevMargin).toFixed(1)}pp`
      : null;

  // Cash timeline: starting cash, then each quarter's cashAfterResolution
  const cashTimeline = useMemo(() => {
    const pts: number[] = [];
    // Add year-end cash for past years
    for (const yr of state.yearHistory) {
      pts.push(yr.cashAfterResolution);
    }
    // Add current year quarters
    for (const q of state.quarterHistory) {
      pts.push(q.cashAfterResolution);
    }
    return pts;
  }, [state.yearHistory, state.quarterHistory]);

  const hasData = latestQ !== null || yearlyData.length > 0;

  return (
    <ContentPanel
      maxWidth={tokens.layout.panelMaxWidth}
      style={panelStyle}
    >
      <ScreenHeader title="Financial History" icon={DollarSign} />

      <div className="content-panel hide-scrollbar" style={scrollBody}>
        {!hasData ? (
          <p
            style={{
              color: tokens.colors.textMuted,
              fontStyle: "italic",
              fontSize: tokens.font.sizeBase,
            }}
          >
            Financial data will appear after your first quarter is simulated.
          </p>
        ) : (
          <>
            {/* KPI Strip */}
            <div style={kpiStripStyle}>
              <div style={kpiBoxStyle}>
                <div style={kpiLabel}>Cash on Hand</div>
                <div style={{ ...kpiValue, color: tokens.colors.statusCash }}>
                  {formatCash(state.cash)}
                </div>
              </div>
              {latestQ && (
                <>
                  <div style={kpiBoxStyle}>
                    <div style={kpiLabel}>Last Quarter Revenue</div>
                    <div style={kpiValue}>
                      {formatCash(latestQ.revenue)}
                    </div>
                    {revDelta && (
                      <div style={{ ...kpiDelta, color: deltaColor(revDelta) }}>
                        {revDelta} vs {QUARTER_LABELS[(latestQ.quarter - 2 + 4) % 4]}
                      </div>
                    )}
                  </div>
                  <div style={kpiBoxStyle}>
                    <div style={kpiLabel}>Last Quarter Profit</div>
                    <div
                      style={{
                        ...kpiValue,
                        color: profitColor(latestQ.profit),
                      }}
                    >
                      {formatCash(latestQ.profit)}
                    </div>
                    {profitDelta && (
                      <div
                        style={{
                          ...kpiDelta,
                          color: deltaColor(profitDelta),
                        }}
                      >
                        {profitDelta} vs {QUARTER_LABELS[(latestQ.quarter - 2 + 4) % 4]}
                      </div>
                    )}
                  </div>
                  <div style={kpiBoxStyle}>
                    <div style={kpiLabel}>Profit Margin</div>
                    <div
                      style={{
                        ...kpiValue,
                        color: profitColor(latestMargin),
                      }}
                    >
                      {latestMargin.toFixed(1)}%
                    </div>
                    {marginDelta && (
                      <div
                        style={{
                          ...kpiDelta,
                          color: deltaColor(marginDelta),
                        }}
                      >
                        {marginDelta} vs {QUARTER_LABELS[(latestQ.quarter - 2 + 4) % 4]}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Tabs */}
            <div style={tabBarStyle}>
              {(
                [
                  ["quarterly", "Quarterly"],
                  ["yearly", "Yearly"],
                  ["byModel", "By Model"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  style={tabStyle(tab === id)}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "quarterly" && (
              <QuarterlyTab quarters={allQuarters} cashTimeline={cashTimeline} />
            )}
            {tab === "yearly" && <YearlyTab years={yearlyData} />}
            {tab === "byModel" && (
              <ByModelTab
                quarters={allQuarters}
                models={player.models}
              />
            )}
          </>
        )}
      </div>
      <StatusBar />
    </ContentPanel>
  );
}

// ─── Quarterly Tab ───────────────────────────────────────────

function BarChart({
  data,
}: {
  data: { label: string; revenue: number; profit: number }[];
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = 28;
  const gap = 16;
  const groupWidth = barWidth * 2 + gap;
  const chartWidth = data.length * groupWidth + gap;
  const chartHeight = 150;
  const labelHeight = 20;

  return (
    <svg
      width="100%"
      height={chartHeight + labelHeight}
      viewBox={`0 0 ${chartWidth} ${chartHeight + labelHeight}`}
      preserveAspectRatio="xMidYMax meet"
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={0}
          y1={chartHeight * (1 - frac)}
          x2={chartWidth}
          y2={chartHeight * (1 - frac)}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}

      {data.map((d, i) => {
        const x = i * groupWidth + gap;
        const revH = (d.revenue / maxVal) * chartHeight;
        const profitAbs = Math.abs(d.profit);
        const profH = (profitAbs / maxVal) * chartHeight;
        const isLoss = d.profit < 0;

        return (
          <g key={i}>
            {/* Revenue bar */}
            <rect
              x={x}
              y={chartHeight - revH}
              width={barWidth}
              height={revH}
              rx={3}
              fill={tokens.colors.text}
              opacity={0.8}
            />
            {/* Profit bar */}
            <rect
              x={x + barWidth + 4}
              y={chartHeight - profH}
              width={barWidth}
              height={profH}
              rx={3}
              fill={isLoss ? tokens.colors.danger : tokens.colors.success}
              opacity={isLoss ? 0.5 : 0.8}
            />
            {/* Label */}
            <text
              x={x + barWidth + 2}
              y={chartHeight + labelHeight - 2}
              fill={tokens.colors.textMuted}
              fontSize={tokens.font.sizeSmall}
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function QuarterlyTab({
  quarters,
  cashTimeline,
}: {
  quarters: QuarterEntry[];
  cashTimeline: number[];
}) {
  if (quarters.length === 0) {
    return (
      <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
        No quarterly data yet.
      </p>
    );
  }

  // Determine current year for the P&L table
  const currentYear = quarters[quarters.length - 1].year;
  const currentYearQuarters = quarters.filter((q) => q.year === currentYear);

  return (
    <>
      {/* Bar chart */}
      <div style={chartAreaStyle}>
        <div style={chartTitleStyle}>Revenue & Profit</div>
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: tokens.colors.text,
              }}
            />
            Revenue
          </div>
          <div style={legendItemStyle}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: tokens.colors.success,
              }}
            />
            Profit
          </div>
          <div style={legendItemStyle}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: tokens.colors.danger,
                opacity: 0.5,
              }}
            />
            Loss
          </div>
        </div>
        <BarChart
          data={quarters.map((q) => ({
            label: `${QUARTER_LABELS[q.quarter - 1]}${q.year !== currentYear ? ` ${q.year}` : ""}`,
            revenue: q.revenue,
            profit: q.profit,
          }))}
        />
      </div>

      {/* P&L Table */}
      <div style={{ ...chartTitleStyle, marginBottom: tokens.spacing.sm }}>
        Profit & Loss — {currentYear}
      </div>
      <table style={plTableStyle}>
        <thead>
          <tr>
            <th style={plThStyle}></th>
            {currentYearQuarters.map((q) => (
              <th key={q.quarter} style={plThRight}>
                {QUARTER_LABELS[q.quarter - 1]}
              </th>
            ))}
            {currentYearQuarters.length > 1 && (
              <th style={plThRight}>YTD</th>
            )}
          </tr>
        </thead>
        <tbody>
          <PLRow
            label="Revenue"
            values={currentYearQuarters.map((q) => q.revenue)}
            showTotal={currentYearQuarters.length > 1}
          />
          <PLRow
            label="Manufacturing (COGS)"
            values={currentYearQuarters.map((q) => -q.cogs)}
            showTotal={currentYearQuarters.length > 1}
            indent
            negative
          />
          <PLRow
            label="Gross Profit"
            values={currentYearQuarters.map((q) => q.revenue - q.cogs)}
            showTotal={currentYearQuarters.length > 1}
            bold
          />
          <PLRow
            label="Marketing"
            values={currentYearQuarters.map((q) => -q.marketing)}
            showTotal={currentYearQuarters.length > 1}
            indent
            negative
          />
          <PLRow
            label="Net Profit"
            values={currentYearQuarters.map((q) => q.profit)}
            showTotal={currentYearQuarters.length > 1}
            bold
            total
          />
        </tbody>
      </table>

      {/* Cash over time */}
      {cashTimeline.length >= 2 && (
        <div style={{ ...chartAreaStyle, marginTop: tokens.spacing.lg }}>
          <div style={chartTitleStyle}>Cash Over Time</div>
          <Sparkline
            data={cashTimeline}
            color={tokens.colors.statusCash}
            width={700}
            height={100}
            strokeWidth={2.5}
            fill
            style={{ width: "100%", height: 100 }}
          />
        </div>
      )}
    </>
  );
}

// ─── P&L Row Helper ──────────────────────────────────────────

function PLRow({
  label,
  values,
  showTotal,
  indent,
  negative,
  bold,
  total,
  cash,
}: {
  label: string;
  values: number[];
  showTotal?: boolean;
  indent?: boolean;
  negative?: boolean;
  bold?: boolean;
  total?: boolean;
  cash?: boolean;
}) {
  const sum = values.reduce((s, v) => s + v, 0);

  const rowBorder: CSSProperties = total
    ? { borderTop: `2px solid ${tokens.colors.panelBorder}` }
    : {};

  const totalCellOverride: CSSProperties = total
    ? { borderBottom: "none", paddingTop: 12 }
    : {};

  function cellColor(v: number): string {
    if (cash) return tokens.colors.statusCash;
    if (negative) return tokens.colors.danger;
    if (v < 0) return tokens.colors.danger;
    if (v > 0) return tokens.colors.success;
    return tokens.colors.text;
  }

  const cellContent = (v: number, key?: number) => (
    <td
      key={key}
      style={{
        ...plTdRight,
        color: cellColor(v),
        fontWeight: bold ? 700 : 400,
        ...totalCellOverride,
      }}
    >
      {formatCash(v)}
    </td>
  );

  return (
    <tr style={rowBorder}>
      <td
        style={{
          ...plTdStyle,
          color: tokens.colors.textMuted,
          paddingLeft: indent ? 28 : plTdStyle.padding,
          fontWeight: bold ? 700 : 400,
          ...totalCellOverride,
        }}
      >
        {label}
      </td>
      {values.map((v, i) => cellContent(v, i))}
      {showTotal && cellContent(sum)}
    </tr>
  );
}

// ─── Yearly Tab ──────────────────────────────────────────────

function YearlyTab({
  years,
}: {
  years: {
    year: number;
    revenue: number;
    profit: number;
    marketing: number;
    cogs: number;
    cash: number;
  }[];
}) {
  if (years.length === 0) {
    return (
      <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
        Yearly data will appear after your first full year.
      </p>
    );
  }

  return (
    <>
      <div style={{ ...chartTitleStyle, marginBottom: tokens.spacing.sm }}>
        Year-over-Year
      </div>
      <table style={plTableStyle}>
        <thead>
          <tr>
            <th style={plThStyle}></th>
            {years.map((yr) => (
              <th key={yr.year} style={plThRight}>
                {yr.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <PLRow
            label="Revenue"
            values={years.map((y) => y.revenue)}
          />
          <PLRow
            label="Manufacturing (COGS)"
            values={years.map((y) => -y.cogs)}
            indent
            negative
          />
          <PLRow
            label="Gross Profit"
            values={years.map((y) => y.revenue - y.cogs)}
            bold
          />
          <PLRow
            label="Marketing"
            values={years.map((y) => -y.marketing)}
            indent
            negative
          />
          <PLRow
            label="Net Profit"
            values={years.map((y) => y.profit)}
            bold
            total
          />
          <PLRow
            label="Cash at Year End"
            values={years.map((y) => y.cash)}
            bold
            cash
          />
        </tbody>
      </table>

      {/* YoY growth */}
      {years.length >= 2 && (
        <div
          style={{
            marginTop: tokens.spacing.lg,
            display: "flex",
            gap: tokens.spacing.md,
          }}
        >
          {years.slice(1).map((yr, i) => {
            const prev = years[i];
            const revGrowth = pctChange(prev.revenue, yr.revenue);
            const profGrowth = pctChange(prev.profit, yr.profit);
            return (
              <div
                key={yr.year}
                style={{
                  flex: 1,
                  background: tokens.colors.surface,
                  borderRadius: tokens.borderRadius.sm,
                  padding: tokens.spacing.md,
                }}
              >
                <div
                  style={{
                    fontSize: tokens.font.sizeSmall,
                    color: tokens.colors.textMuted,
                    marginBottom: 6,
                  }}
                >
                  {yr.year} vs {prev.year}
                </div>
                {revGrowth && (
                  <div
                    style={{
                      fontSize: tokens.font.sizeBase,
                      fontWeight: 600,
                      color: deltaColor(revGrowth),
                    }}
                  >
                    Revenue {revGrowth}
                  </div>
                )}
                {profGrowth && (
                  <div
                    style={{
                      fontSize: tokens.font.sizeBase,
                      fontWeight: 600,
                      color: deltaColor(profGrowth),
                      marginTop: 4,
                    }}
                  >
                    Profit {profGrowth}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── By Model Tab ────────────────────────────────────────────

function ByModelTab({
  quarters,
  models,
}: {
  quarters: QuarterEntry[];
  models: LaptopModel[];
}) {
  // Show latest quarter's per-model breakdown
  const latestQ =
    quarters.length > 0 ? quarters[quarters.length - 1] : null;

  if (!latestQ || latestQ.playerResults.length === 0) {
    return (
      <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
        No model sales data available.
      </p>
    );
  }

  const sorted = [...latestQ.playerResults].sort(
    (a, b) => b.revenue - a.revenue,
  );
  const maxMargin = Math.max(
    ...sorted.map((r) => Math.abs(calcMargin(r.profit, r.revenue))),
    1,
  );

  function resolveModelName(laptopId: string): string {
    const model = models.find((m) => m.design.id === laptopId);
    return model ? model.design.name : laptopId;
  }

  return (
    <>
      <div style={{ ...chartTitleStyle, marginBottom: tokens.spacing.md }}>
        Per-Model Breakdown — {QUARTER_LABELS[latestQ.quarter - 1]}{" "}
        {latestQ.year}
      </div>

      {sorted.map((r) => {
        const margin = calcMargin(r.profit, r.revenue);
        const barPct = Math.min(
          (Math.abs(margin) / Math.max(maxMargin, 50)) * 100,
          100,
        );
        const barColor =
          margin >= 20
            ? tokens.colors.success
            : margin >= 0
              ? tokens.colors.warning
              : tokens.colors.danger;

        return (
          <div key={r.laptopId} style={modelRowStyle}>
            <div style={{ flex: 1, fontWeight: 600, fontSize: tokens.font.sizeBase }}>
              {resolveModelName(r.laptopId)}
            </div>
            <div style={modelStatStyle}>
              <div style={modelStatLabel}>Units</div>
              <div style={modelStatValue}>
                {r.unitsSold.toLocaleString()}
              </div>
            </div>
            <div style={modelStatStyle}>
              <div style={modelStatLabel}>Revenue</div>
              <div style={modelStatValue}>{formatCash(r.revenue)}</div>
            </div>
            <div style={modelStatStyle}>
              <div style={modelStatLabel}>Profit</div>
              <div style={{ ...modelStatValue, color: profitColor(r.profit) }}>
                {formatCash(r.profit)}
              </div>
            </div>
            <div style={modelStatStyle}>
              <div style={modelStatLabel}>Margin</div>
              <div style={{ ...modelStatValue, color: profitColor(margin) }}>
                {margin.toFixed(1)}%
              </div>
            </div>
            <div>
              <div
                style={{
                  width: 60,
                  height: 6,
                  background: tokens.colors.surface,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: barColor,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
