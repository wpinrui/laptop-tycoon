import { useState } from "react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../state/gameTypes";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { formatCurrency, formatNumber } from "../utils/formatCash";
import { titleStyle, sectionHeadingStyle, tableStyle, thStyle, tdStyle, tdRight, summaryRowStyle, cardStyle, twoColumnLayout } from "./summaryStyles";
import { AwardsTable } from "./AwardsTable";
import { AWARD_PERCEPTION_BONUS, AWARD_REACH_BONUS } from "../../simulation/tunables";
import { DemographicDetailSection } from "./DemographicDetailSection";
import { QuarterlyTrendTable } from "./QuarterlyTrendTable";
import { HeroKPIBar } from "./HeroKPIBar";

type ViewMode = "annual" | "q4";

export function YearEndSummaryScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  const [viewMode, setViewMode] = useState<ViewMode>("annual");

  // Use the latest aggregated year result from yearHistory (built after Q4)
  const yearResult = state.yearHistory[state.yearHistory.length - 1] ?? null;
  const q4Result = state.quarterHistory[state.quarterHistory.length - 1] ?? null;

  const result = viewMode === "q4" && q4Result ? q4Result : yearResult;

  if (!result) {
    return (
      <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
        <h1 style={titleStyle}>No simulation results</h1>
        <MenuButton onClick={() => navigateTo("dashboard")}>Back to Dashboard</MenuButton>
      </ContentPanel>
    );
  }

  const playerResults = result.playerResults;
  const totalAvailable = playerResults.reduce((sum, r) => sum + r.unitsSold + r.unsoldUnits, 0);
  const totalSold = playerResults.reduce((sum, r) => sum + r.unitsSold, 0);
  const totalUnsold = playerResults.reduce((sum, r) => sum + r.unsoldUnits, 0);

  const isAnnual = viewMode === "annual";
  const periodLabel = isAnnual ? `Year ${yearResult!.year}` : `Q4 ${yearResult!.year}`;

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tokens.spacing.lg, flexShrink: 0 }}>
        <h1 style={{ ...titleStyle, marginBottom: 0 }}>{periodLabel} Results</h1>
        {q4Result && (
          <div style={{ display: "flex", gap: tokens.spacing.xs }}>
            {([["annual", "Full Year"], ["q4", "Q4 Only"]] as const).map(([mode, label]) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                    background: active ? tokens.colors.accent : tokens.colors.surface,
                    color: active ? tokens.colors.panelBg : tokens.colors.text,
                    border: `1px solid ${tokens.colors.panelBorder}`,
                    borderRadius: tokens.borderRadius.sm,
                    cursor: "pointer",
                    fontSize: tokens.font.sizeSmall,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
              <h3 style={sectionHeadingStyle}>Sales by Model</h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Model</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Available</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Sold</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Unsold</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Revenue</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {playerResults.map((r) => {
                    const model = player.models.find((m) => m.design.id === r.laptopId);
                    const profitColor = r.profit >= 0 ? tokens.colors.success : tokens.colors.danger;
                    const totalUnits = r.unitsSold + r.unsoldUnits;
                    return (
                      <tr key={r.laptopId}>
                        <td style={tdStyle}>{model ? modelDisplayName(player.name, model.design.name) : "Unknown"}</td>
                        <td style={tdRight}>{formatNumber(totalUnits)}</td>
                        <td style={tdRight}>{formatNumber(r.unitsSold)}</td>
                        <td style={{ ...tdRight, color: r.unsoldUnits > 0 ? tokens.colors.warning : undefined }}>
                          {formatNumber(r.unsoldUnits)}
                        </td>
                        <td style={tdRight}>{formatCurrency(r.revenue)}</td>
                        <td style={{ ...tdRight, color: profitColor }}>{formatCurrency(r.profit)}</td>
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

          {/* Right column: awards, trend, financials */}
          <div>
            {/* Year-End Awards */}
            {state.currentYearAwards.length > 0 && (
              <div style={cardStyle}>
                <h3 style={sectionHeadingStyle}>Year-End Awards</h3>
                <AwardsTable awards={state.currentYearAwards} />
                <p style={{ margin: 0, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}>
                  Award winners receive +{AWARD_PERCEPTION_BONUS} brand perception and +{AWARD_REACH_BONUS}% brand reach across all demographics.
                </p>
              </div>
            )}

            {/* Quarterly Trend (only in annual view) */}
            {isAnnual && state.quarterHistory.length > 0 && (
              <div style={cardStyle}>
                <QuarterlyTrendTable quarters={state.quarterHistory} year={yearResult!.year} />
              </div>
            )}

            {/* Financial detail */}
            <div style={cardStyle}>
              <h3 style={sectionHeadingStyle}>Financial Details</h3>
              <div style={summaryRowStyle}>
                <span>Total Units Available</span>
                <span>{formatNumber(totalAvailable)}</span>
              </div>
              <div style={summaryRowStyle}>
                <span>Total Units Sold</span>
                <span>{formatNumber(totalSold)}</span>
              </div>
              {totalUnsold > 0 && (
                <div style={summaryRowStyle}>
                  <span style={{ color: tokens.colors.warning }}>Unsold (carried to inventory)</span>
                  <span style={{ color: tokens.colors.warning }}>{formatNumber(totalUnsold)}</span>
                </div>
              )}
              <div style={{ ...summaryRowStyle, borderTop: `1px solid ${tokens.colors.panelBorder}`, paddingTop: tokens.spacing.sm }}>
                <span>Total Revenue</span>
                <span>{formatCurrency(result.totalRevenue)}</span>
              </div>
              <div style={summaryRowStyle}>
                <span>Total Profit</span>
                <span style={{ color: result.totalProfit >= 0 ? tokens.colors.success : tokens.colors.danger }}>
                  {formatCurrency(result.totalProfit)}
                </span>
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
        Continue to Year {yearResult!.year + 1}
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
