import { CSSProperties, useMemo } from "react";
import { DollarSign } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { Sparkline } from "./Sparkline";
import { emptyStateStyle, sectionDividerStyle } from "./styles";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";
import { formatCash, pctChange, deltaColor, profitColor } from "../../utils/formatCash";

const heroStyle: CSSProperties = {
  fontSize: tokens.font.sizeHero,
  fontWeight: 700,
  color: tokens.colors.statusCash,
  margin: 0,
};

const heroLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.md,
};

const sparkRowStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
};

const sparkItemStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const sparkLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const sparkValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 600,
};

const deltaStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: tokens.font.sizeBase,
  padding: `${tokens.spacing.xs}px 0`,
};

export function FinancialsCard() {
  const { state } = useGame();

  const stats = useMemo(() => {
    const qh = state.quarterHistory;
    const yh = state.yearHistory;

    // Build revenue/profit timeline from yearly then quarterly
    const revenueTimeline: number[] = [];
    const profitTimeline: number[] = [];

    for (const yr of yh) {
      revenueTimeline.push(yr.totalRevenue);
      profitTimeline.push(yr.totalProfit);
    }

    // Current year: use quarterly data
    for (const q of qh) {
      revenueTimeline.push(q.totalRevenue);
      profitTimeline.push(q.totalProfit);
    }

    // Latest quarter
    const latestQ = qh.length > 0 ? qh[qh.length - 1] : null;
    const prevQ = qh.length > 1 ? qh[qh.length - 2] : null;

    // Year-to-date totals from current year quarters
    const ytdRevenue = qh.reduce((s, q) => s + q.totalRevenue, 0);
    const ytdProfit = qh.reduce((s, q) => s + q.totalProfit, 0);
    const ytdMargin = ytdRevenue > 0 ? (ytdProfit / ytdRevenue) * 100 : 0;

    // QoQ deltas
    const revDelta = latestQ && prevQ ? pctChange(prevQ.totalRevenue, latestQ.totalRevenue, 0) : null;
    const profitDelta = latestQ && prevQ ? pctChange(prevQ.totalProfit, latestQ.totalProfit, 0) : null;

    return {
      revenueTimeline,
      profitTimeline,
      latestQ,
      revDelta,
      profitDelta,
      ytdRevenue,
      ytdProfit,
      ytdMargin,
      hasData: latestQ !== null,
    };
  }, [state.quarterHistory, state.yearHistory]);

  return (
    <BentoCard title="Financials" icon={DollarSign} screen="financialHistory">
      {/* Cash hero */}
      <p style={heroStyle}>{formatCash(state.cash)}</p>
      <p style={heroLabelStyle}>Cash on hand</p>

      {!stats.hasData ? (
        <p style={emptyStateStyle}>
          Revenue data will appear after your first quarter
        </p>
      ) : (
        <>
          {/* Revenue & Profit sparklines */}
          <div style={sparkRowStyle}>
            <div style={sparkItemStyle}>
              <span style={sparkLabelStyle}>
                Revenue (Q{stats.latestQ!.quarter})
              </span>
              <span style={sparkValueStyle}>
                {formatCash(stats.latestQ!.totalRevenue)}
              </span>
              {stats.revenueTimeline.length >= 2 && (
                <Sparkline
                  data={stats.revenueTimeline}
                  color={tokens.colors.text}
                  width={140}
                  height={28}
                />
              )}
              {stats.revDelta && (
                <span
                  style={{
                    ...deltaStyle,
                    color: deltaColor(stats.revDelta),
                  }}
                >
                  {stats.revDelta} vs Q{stats.latestQ!.quarter - 1 || 4}
                </span>
              )}
            </div>
            <div style={sparkItemStyle}>
              <span style={sparkLabelStyle}>
                Profit (Q{stats.latestQ!.quarter})
              </span>
              <span
                style={{
                  ...sparkValueStyle,
                  color: profitColor(stats.latestQ!.totalProfit),
                }}
              >
                {formatCash(stats.latestQ!.totalProfit)}
              </span>
              {stats.profitTimeline.length >= 2 && (
                <Sparkline
                  data={stats.profitTimeline}
                  color={tokens.colors.success}
                  width={140}
                  height={28}
                />
              )}
              {stats.profitDelta && (
                <span
                  style={{
                    ...deltaStyle,
                    color: deltaColor(stats.profitDelta),
                  }}
                >
                  {stats.profitDelta} vs Q{stats.latestQ!.quarter - 1 || 4}
                </span>
              )}
            </div>
          </div>

          {/* Year-to-date summary */}
          <div style={sectionDividerStyle}>
            <div style={summaryRowStyle}>
              <span style={{ color: tokens.colors.textMuted }}>
                Year revenue
              </span>
              <span style={{ fontWeight: 600 }}>
                {formatCash(stats.ytdRevenue)}
              </span>
            </div>
            <div style={summaryRowStyle}>
              <span style={{ color: tokens.colors.textMuted }}>
                Year profit
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: profitColor(stats.ytdProfit),
                }}
              >
                {formatCash(stats.ytdProfit)}
              </span>
            </div>
            <div style={summaryRowStyle}>
              <span style={{ color: tokens.colors.textMuted }}>
                Profit margin
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: profitColor(stats.ytdMargin),
                }}
              >
                {stats.ytdMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </>
      )}
    </BentoCard>
  );
}
