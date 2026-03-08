import { CSSProperties } from "react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany } from "../state/gameTypes";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: tokens.spacing.lg,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
};

const sectionStyle: CSSProperties = {
  marginBottom: tokens.spacing.lg,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: tokens.spacing.sm,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

const tdRight: CSSProperties = { ...tdStyle, textAlign: "right" };

const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.xs}px 0`,
};

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  marginBottom: tokens.spacing.sm,
  color: tokens.colors.accent,
};

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function QuarterlySummaryScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  const result = state.lastSimulationResult;

  if (!result) {
    return (
      <ContentPanel maxWidth={800}>
        <h1 style={titleStyle}>No simulation results</h1>
        <MenuButton onClick={() => navigateTo("dashboard")}>Back to Dashboard</MenuButton>
      </ContentPanel>
    );
  }

  const quarterLabel = QUARTER_LABELS[result.quarter - 1];

  // This quarter's results
  const playerResults = result.playerResults;

  // Cumulative YTD from quarterHistory
  const ytdByModel = new Map<string, { unitsSold: number; revenue: number }>();
  for (const qr of state.quarterHistory) {
    for (const pr of qr.playerResults) {
      const existing = ytdByModel.get(pr.laptopId);
      if (existing) {
        existing.unitsSold += pr.unitsSold;
        existing.revenue += pr.revenue;
      } else {
        ytdByModel.set(pr.laptopId, { unitsSold: pr.unitsSold, revenue: pr.revenue });
      }
    }
  }

  const ytdRevenue = Array.from(ytdByModel.values()).reduce((s, v) => s + v.revenue, 0);

  return (
    <ContentPanel maxWidth={900}>
      <h1 style={titleStyle}>{quarterLabel} {result.year} Results</h1>

      {/* Per-model breakdown */}
      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>
          Sales This Quarter
        </h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Model</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Sold (Q)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Sold (YTD)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Revenue (Q)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Remaining Stock</th>
            </tr>
          </thead>
          <tbody>
            {playerResults.map((r) => {
              const model = player.models.find((m) => m.design.id === r.laptopId);
              const ytd = ytdByModel.get(r.laptopId);
              return (
                <tr key={r.laptopId}>
                  <td style={tdStyle}>{model?.design.name ?? "Unknown"}</td>
                  <td style={tdRight}>{formatNumber(r.unitsSold)}</td>
                  <td style={tdRight}>{formatNumber(ytd?.unitsSold ?? r.unitsSold)}</td>
                  <td style={tdRight}>{formatCurrency(r.revenue)}</td>
                  <td style={{ ...tdRight, color: r.unsoldUnits > 0 ? tokens.colors.textMuted : tokens.colors.warning }}>
                    {formatNumber(r.unsoldUnits)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial summary */}
      <div style={{
        ...sectionStyle,
        padding: tokens.spacing.md,
        background: tokens.colors.surface,
        borderRadius: tokens.borderRadius.md,
      }}>
        <h3 style={sectionHeadingStyle}>
          Financial Summary
        </h3>
        <div style={summaryRowStyle}>
          <span>Revenue This Quarter</span>
          <span>{formatCurrency(result.totalRevenue)}</span>
        </div>
        <div style={summaryRowStyle}>
          <span>Revenue Year-to-Date</span>
          <span>{formatCurrency(ytdRevenue)}</span>
        </div>
        <div style={{ ...summaryRowStyle, borderTop: `1px solid ${tokens.colors.panelBorder}`, paddingTop: tokens.spacing.sm, fontWeight: 700 }}>
          <span>Cash Balance</span>
          <span style={{ color: result.cashAfterResolution >= 0 ? tokens.colors.success : tokens.colors.danger }}>
            {formatCurrency(result.cashAfterResolution)}
          </span>
        </div>
      </div>

      <MenuButton
        variant="accent"
        onClick={() => {
          dispatch({ type: "ADVANCE_QUARTER" });
          navigateTo("dashboard");
        }}
        style={{ width: "100%", marginTop: tokens.spacing.md }}
      >
        Continue to {result.quarter < 4 ? `${QUARTER_LABELS[result.quarter as 1 | 2 | 3]} ${result.year}` : `Year ${result.year + 1}`}
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
