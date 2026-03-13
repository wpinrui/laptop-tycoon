import { useGame } from "../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../state/gameTypes";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { formatCurrency, formatNumber, QUARTER_LABELS } from "../utils/formatCash";
import { titleStyle, sectionHeadingStyle, tableStyle, thStyle, tdStyle, tdRight, summaryRowStyle, cardStyle, twoColumnLayout } from "./summaryStyles";
import { reviewScoreColor } from "../utils/reviewScoreColor";
import { DemographicDetailSection } from "./DemographicDetailSection";
import { HeroKPIBar } from "./HeroKPIBar";

export function QuarterlySummaryScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  const result = state.lastSimulationResult;

  if (!result) {
    return (
      <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
        <h1 style={titleStyle}>No simulation results</h1>
        <MenuButton onClick={() => navigateTo("dashboard")}>Back to Dashboard</MenuButton>
      </ContentPanel>
    );
  }

  const quarterLabel = QUARTER_LABELS[result.quarter - 1];

  // This quarter's results
  const playerResults = result.playerResults;
  const totalSold = playerResults.reduce((s, r) => s + r.unitsSold, 0);
  const totalAvailable = playerResults.reduce((s, r) => s + r.unitsSold + r.unsoldUnits, 0);

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
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <h1 style={{ ...titleStyle, flexShrink: 0 }}>{quarterLabel} {result.year} Results</h1>

      <div className="content-panel hide-scrollbar" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* Hero KPI bar */}
        <HeroKPIBar
          unitsSold={totalSold}
          totalAvailable={totalAvailable}
          revenue={result.totalRevenue}
          profit={result.totalProfit}
          cash={result.cashAfterResolution}
        />

        {/* Two-column layout */}
        <div style={twoColumnLayout}>
          {/* Left column: detailed tables */}
          <div>
            {/* Per-model breakdown */}
            <div style={cardStyle}>
              <h3 style={sectionHeadingStyle}>Sales This Quarter</h3>
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
                        <td style={tdStyle}>{model ? modelDisplayName(player.name, model.design.name) : "Unknown"}</td>
                        <td style={tdRight}>{formatNumber(r.unitsSold)}</td>
                        <td style={tdRight}>{formatNumber(ytd?.unitsSold ?? r.unitsSold)}</td>
                        <td style={tdRight}>{formatCurrency(r.revenue)}</td>
                        <td style={{ ...tdRight, color: r.unsoldUnits > 0 ? tokens.colors.warning : undefined }}>
                          {formatNumber(r.unsoldUnits)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Demographic detail: comparison tables, perception */}
            <DemographicDetailSection
              allLaptopResults={result.laptopResults}
              playerResults={result.playerResults}
              perceptionChanges={result.perceptionChanges}
            />
          </div>

          {/* Right column: summaries */}
          <div>
            {/* Reviews published after Q1 */}
            {result.quarter === 1 && state.currentYearReviews.length > 0 && (
              <div style={cardStyle}>
                <h3 style={sectionHeadingStyle}>Reviews Published</h3>
                {state.currentYearReviews
                  .filter((r) => r.owner === "player")
                  .map((r) => (
                    <div key={`${r.laptopId}-${r.outlet}`} style={summaryRowStyle}>
                      <span>{r.outletName}: {r.laptopName}</span>
                      <span style={{ fontWeight: 700, color: reviewScoreColor(r.score) }}>
                        {r.score}/10
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Financial detail */}
            <div style={cardStyle}>
              <h3 style={sectionHeadingStyle}>Financial Details</h3>
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
          </div>
        </div>

        <div style={{ height: tokens.spacing.lg }} />
      </div>
      <MenuButton
        variant="accent"
        onClick={() => {
          dispatch({ type: "ADVANCE_QUARTER" });
          navigateTo("dashboard");
        }}
        style={{ width: "100%", marginTop: tokens.spacing.md, marginBottom: tokens.spacing.lg, flexShrink: 0 }}
      >
        Continue to {result.quarter < 4 ? `${QUARTER_LABELS[result.quarter as 1 | 2 | 3]} ${result.year}` : `Year ${result.year + 1}`}
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
