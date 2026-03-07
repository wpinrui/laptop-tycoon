import { CSSProperties } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { AD_CAMPAIGNS, getCampaignCost, getRiskLabel } from "../data/campaigns";
import { tokens } from "../../shell/tokens";
import { DistributionChart } from "../components/DistributionChart";

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: tokens.spacing.lg,
};

const cardStyle = (isSelected: boolean): CSSProperties => ({
  background: isSelected ? "#1a3a5c" : "#2a2a2a",
  border: isSelected ? "2px solid #90caf9" : "2px solid #444",
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.xl,
  cursor: "pointer",
  textAlign: "left",
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  transition: "border-color 0.15s, background 0.15s",
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.md,
});

const riskColors: Record<string, string> = {
  "No Risk": tokens.colors.textMuted,
  "Low Risk": "#66bb6a",
  "Medium Risk": "#ffa726",
  "High Risk": "#ef5350",
  "Very High Risk": "#d32f2f",
};

const statRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: tokens.font.sizeBase,
  padding: `${tokens.spacing.xs}px 0`,
};

export function MarketingStep() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState } = useGame();
  const selectedId = state.campaignId;

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Ad Campaign
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Choose a marketing campaign. Riskier campaigns cost less but have unpredictable outcomes.
      </p>

      <div style={gridStyle}>
        {AD_CAMPAIGNS.map((campaign) => {
          const isSelected = selectedId === campaign.id;
          const cost = getCampaignCost(campaign, gameState.year);
          const risk = getRiskLabel(campaign);
          const { distribution: dist } = campaign;
          const isNoCampaign = campaign.id === "no_campaign";

          return (
            <button
              key={campaign.id}
              style={cardStyle(isSelected)}
              onClick={() => dispatch({ type: "SET_CAMPAIGN", campaignId: campaign.id })}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#888";
                  e.currentTarget.style.background = "#333";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isSelected ? "#90caf9" : "#444";
                e.currentTarget.style.background = isSelected ? "#1a3a5c" : "#2a2a2a";
              }}
            >
              {/* Name */}
              <div style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700 }}>
                {campaign.name}
              </div>

              {/* Risk label */}
              <div style={{
                fontSize: tokens.font.sizeBase,
                color: riskColors[risk] ?? tokens.colors.textMuted,
                fontWeight: 600,
              }}>
                {risk}
              </div>

              {/* Cost */}
              <div style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700, color: tokens.colors.accent }}>
                {cost === 0 ? "Free" : `$${cost.toLocaleString()}`}
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, lineHeight: 1.5 }}>
                {campaign.description}
              </p>

              {/* Distribution chart + stats */}
              {!isNoCampaign && (
                <>
                  <DistributionChart distribution={dist} width={300} height={80} />

                  <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, paddingTop: tokens.spacing.sm }}>
                    <div style={statRowStyle}>
                      <span style={{ color: tokens.colors.textMuted }}>Best case</span>
                      <span style={{ fontWeight: 600, color: "#66bb6a" }}>+{dist.max}% sales</span>
                    </div>
                    <div style={statRowStyle}>
                      <span style={{ color: tokens.colors.textMuted }}>Expected</span>
                      <span style={{ fontWeight: 600, color: tokens.colors.accent }}>+{dist.mean}% sales</span>
                    </div>
                    <div style={statRowStyle}>
                      <span style={{ color: tokens.colors.textMuted }}>Worst case</span>
                      <span style={{
                        fontWeight: 600,
                        color: dist.min < 0 ? tokens.colors.danger : tokens.colors.text,
                      }}>
                        {dist.min > 0 ? "+" : ""}{dist.min}% sales
                      </span>
                    </div>
                  </div>
                </>
              )}

              {isNoCampaign && (
                <div style={{
                  fontSize: tokens.font.sizeBase,
                  color: tokens.colors.textMuted,
                  fontStyle: "italic",
                  padding: `${tokens.spacing.md}px 0`,
                }}>
                  No sales impact — 0% bonus guaranteed.
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
