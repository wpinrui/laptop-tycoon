import { CSSProperties } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { tokens } from "../../shell/tokens";
import { AD_CAMPAIGNS } from "../data/campaigns";
import { buildCostBreakdown } from "../utils/economiesOfScale";
import { PRESS_RELEASE_PROMPTS } from "../data/pressReleasePrompts";

const sectionStyle: CSSProperties = {
  background: tokens.colors.surface,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.xs}px 0`,
};

export function ConfirmationStep() {
  const { state } = useMfgWizard();
  const { state: gameState } = useGame();

  const model = getPlayerCompany(gameState).models.find((m) => m.design.id === state.modelId);
  if (!model) return <p>Model not found.</p>;

  const campaign = AD_CAMPAIGNS.find((c) => c.id === state.campaignId) ?? AD_CAMPAIGNS[0];
  const { cost, campaignCost } = buildCostBreakdown(gameState, state);
  const cashAfter = gameState.cash - cost.totalManufacturingSpend;

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Confirm Manufacturing Plan
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Review your plan for {modelDisplayName(getPlayerCompany(gameState).name, model.design.name)}. You can edit this plan until you advance the year.
      </p>

      {/* Marketing */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, marginBottom: tokens.spacing.sm, fontSize: tokens.font.sizeLarge }}>
          Marketing
        </h3>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Campaign</span>
          <span style={{ fontWeight: 600 }}>{campaign.name}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Campaign cost</span>
          <span style={{ fontWeight: 600 }}>
            {campaignCost === 0 ? "Free" : `$${campaignCost.toLocaleString()}`}
          </span>
        </div>
        {campaign.distribution.stdDev > 0 && (
          <div style={rowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Perceived value modifier</span>
            <span style={{ fontWeight: 600 }}>
              {campaign.distribution.min > 0 ? "+" : ""}{campaign.distribution.min}% to +{campaign.distribution.max}%
            </span>
          </div>
        )}
      </div>

      {/* Manufacturing */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, marginBottom: tokens.spacing.sm, fontSize: tokens.font.sizeLarge }}>
          Manufacturing & Pricing
        </h3>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Retail price</span>
          <span style={{ fontWeight: 600 }}>${state.unitPrice.toLocaleString()}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Order quantity</span>
          <span style={{ fontWeight: 600 }}>{state.unitsOrdered.toLocaleString()} units</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Unit manufacturing cost</span>
          <span style={{ fontWeight: 600 }}>${Math.round(cost.manufacturingCostPerUnit).toLocaleString()}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: tokens.colors.textMuted }}>Total spend</span>
          <span style={{ fontWeight: 600 }}>${Math.round(cost.totalManufacturingSpend).toLocaleString()}</span>
        </div>
      </div>

      {/* Press Release */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, marginBottom: tokens.spacing.sm, fontSize: tokens.font.sizeLarge }}>
          Press Release
        </h3>
        {state.pressReleasePromptIds.map((promptId) => {
          const prompt = PRESS_RELEASE_PROMPTS.find((p) => p.id === promptId);
          const response = state.pressReleaseResponses[promptId];
          if (!prompt) return null;
          return (
            <div key={promptId} style={{ marginBottom: tokens.spacing.sm }}>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                {prompt.text}
              </div>
              <div style={{ fontStyle: "italic", marginTop: tokens.spacing.xs }}>
                "{response || "—"}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Financials summary */}
      <div style={{
        ...sectionStyle,
        background: cashAfter < 0 ? tokens.colors.dangerBg : tokens.colors.surface,
        borderColor: cashAfter < 0 ? tokens.colors.danger : tokens.colors.panelBorder,
      }}>
        <div style={rowStyle}>
          <span style={{ fontWeight: 600 }}>Total cost (manufacturing + fixed)</span>
          <span style={{ fontWeight: 700, fontSize: tokens.font.sizeLarge }}>
            ${Math.round(cost.totalManufacturingSpend).toLocaleString()}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontWeight: 600 }}>Cash after plan</span>
          <span style={{
            fontWeight: 700,
            fontSize: tokens.font.sizeLarge,
            color: cashAfter < 0 ? tokens.colors.danger : tokens.colors.success,
          }}>
            ${Math.round(cashAfter).toLocaleString()}
          </span>
        </div>
        {cashAfter < 0 && (
          <p style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger, margin: `${tokens.spacing.xs}px 0 0` }}>
            Warning: You will be in debt. Ending the year with negative cash means game over.
          </p>
        )}
      </div>
    </div>
  );
}
