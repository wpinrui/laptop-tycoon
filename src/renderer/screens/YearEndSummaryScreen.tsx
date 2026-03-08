import { useGame } from "../state/GameContext";
import { getPlayerCompany } from "../state/gameTypes";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { DEMOGRAPHICS } from "../../data/demographics";
import { formatCurrency, formatNumber } from "../utils/formatCash";
import { titleStyle, sectionStyle, tableStyle, thStyle, tdStyle, tdRight, summaryRowStyle, sectionHeadingStyle } from "./summaryStyles";
import { AwardsTable } from "./AwardsTable";
import { AWARD_PERCEPTION_BONUS, AWARD_REACH_BONUS } from "../../simulation/tunables";

export function YearEndSummaryScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  // Use the latest aggregated year result from yearHistory (built after Q4)
  const result = state.yearHistory[state.yearHistory.length - 1] ?? null;

  if (!result) {
    return (
      <ContentPanel maxWidth={800}>
        <h1 style={titleStyle}>No simulation results</h1>
        <MenuButton onClick={() => navigateTo("dashboard")}>Back to Dashboard</MenuButton>
      </ContentPanel>
    );
  }

  const playerResults = result.playerResults;
  const totalAvailable = playerResults.reduce((sum, r) => sum + r.unitsSold + r.unsoldUnits, 0);
  const totalSold = playerResults.reduce((sum, r) => sum + r.unitsSold, 0);
  const totalUnsold = playerResults.reduce((sum, r) => sum + r.unsoldUnits, 0);

  // Top demographics for each model
  const topDemographics = playerResults.map((r) => {
    const sorted = [...r.demographicBreakdown].sort((a, b) => b.unitsDemanded - a.unitsDemanded);
    return sorted.slice(0, 3);
  });

  return (
    <ContentPanel maxWidth={900}>
      <h1 style={titleStyle}>Year {result.year} Results</h1>

      {/* Per-model breakdown */}
      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>
          Sales by Model
        </h3>
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
                  <td style={tdStyle}>{model?.design.name ?? "Unknown"}</td>
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

      {/* Top demographics */}
      {playerResults.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>
            Top Buyers
          </h3>
          {playerResults.map((r, idx) => {
            const model = player.models.find((m) => m.design.id === r.laptopId);
            return (
              <div key={r.laptopId} style={{ marginBottom: tokens.spacing.sm }}>
                <p style={{ margin: 0, marginBottom: tokens.spacing.xs, fontWeight: 600 }}>
                  {model?.design.name}
                </p>
                {topDemographics[idx].map((d) => (
                  <div key={d.demographicId} style={{ ...summaryRowStyle, paddingLeft: tokens.spacing.md }}>
                    <span style={{ color: tokens.colors.textMuted }}>{DEMOGRAPHICS.find((dem) => dem.id === d.demographicId)?.name ?? d.demographicId}</span>
                    <span>{formatNumber(d.unitsDemanded)} units ({(d.marketShare * 100).toFixed(1)}% share)</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Perception changes */}
      {result.perceptionChanges && result.perceptionChanges.some((pc) => Math.abs(pc.delta) >= 0.1) && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>
            Brand Perception Changes
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Demographic</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Before</th>
                <th style={{ ...thStyle, textAlign: "right" }}>After</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {result.perceptionChanges
                .filter((pc) => Math.abs(pc.delta) >= 0.1)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((pc) => {
                  const demName = DEMOGRAPHICS.find((d) => d.id === pc.demographicId)?.name ?? pc.demographicId;
                  const deltaColor = pc.delta > 0 ? tokens.colors.success : pc.delta < 0 ? tokens.colors.danger : undefined;
                  const sign = pc.delta > 0 ? "+" : "";
                  return (
                    <tr key={pc.demographicId}>
                      <td style={tdStyle}>{demName}</td>
                      <td style={tdRight}>{pc.oldPerception.toFixed(1)}</td>
                      <td style={tdRight}>{pc.newPerception.toFixed(1)}</td>
                      <td style={{ ...tdRight, color: deltaColor, fontWeight: 600 }}>
                        {sign}{pc.delta.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Year-End Awards */}
      {state.currentYearAwards.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Year-End Awards</h3>
          <AwardsTable awards={state.currentYearAwards} />
          <p style={{ margin: 0, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}>
            Award winners receive +{AWARD_PERCEPTION_BONUS} brand perception and +{AWARD_REACH_BONUS}% brand reach across all demographics.
          </p>
        </div>
      )}

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

      <MenuButton
        variant="accent"
        onClick={() => {
          dispatch({ type: "ADVANCE_QUARTER" });
          navigateTo("dashboard");
        }}
        style={{ width: "100%", marginTop: tokens.spacing.md }}
      >
        Continue to Year {result.year + 1}
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
