import { CSSProperties } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { AD_CAMPAIGNS, getCampaignCost, getRiskLabel } from "../data/campaigns";
import { tokens } from "../../shell/tokens";
import { DistributionChart } from "../components/DistributionChart";

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: tokens.spacing.md,
};

const cardStyle = (isSelected: boolean): CSSProperties => ({
  background: isSelected ? "#1a3a5c" : "#2a2a2a",
  border: isSelected ? "2px solid #90caf9" : "2px solid #444",
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  cursor: "pointer",
  textAlign: "left",
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  transition: "border-color 0.15s, background 0.15s",
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.sm,
});

const riskColors: Record<string, string> = {
  "No Risk": tokens.colors.textMuted,
  "Low Risk": "#66bb6a",
  "Medium Risk": "#ffa726",
  "High Risk": "#ef5350",
  "Very High Risk": "#d32f2f",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
                  {campaign.name}
                </span>
                <span style={{
                  fontSize: tokens.font.sizeSmall,
                  color: riskColors[risk] ?? tokens.colors.textMuted,
                  fontWeight: 600,
                }}>
                  {risk}
                </span>
              </div>

              <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: tokens.colors.accent }}>
                {cost === 0 ? "Free" : `$${cost.toLocaleString()}`}
              </div>

              {dist.stdDev > 0 && (
                <>
                  <DistributionChart distribution={dist} width={240} height={50} />
                  <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                    Sales impact: {dist.min > 0 ? "+" : ""}{dist.min}% to +{dist.max}%
                    {" · "}Median: +{dist.mean}%
                  </div>
                </>
              )}

              <p style={{ margin: 0, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                {campaign.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
