import { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { ProgressBar } from "./dashboard/ProgressBar";
import { perceptionColor } from "./dashboard/utils";
import { DEMOGRAPHICS } from "../../data/demographics";
import { DemographicId } from "../../data/types";

const CAMPAIGN_COST = 1_000;
const CAMPAIGN_REACH_BOOST = 0.5;

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
  marginBottom: tokens.spacing.lg,
};

const sectionStyle: CSSProperties = {
  marginBottom: tokens.spacing.xl,
};

const headingStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 600,
  marginBottom: tokens.spacing.md,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  marginBottom: tokens.spacing.sm,
};

const labelStyle: CSSProperties = {
  minWidth: 160,
  flexShrink: 0,
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.text,
};

const valueStyle: CSSProperties = {
  minWidth: 40,
  textAlign: "right",
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.text,
};

const hintStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: tokens.spacing.xs,
};

export function BrandDetailScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();

  const canAfford = state.cash >= CAMPAIGN_COST;
  const perceptionValue = Math.round(state.brandPerception);
  const perceptionSign = perceptionValue > 0 ? "+" : "";

  return (
    <ContentPanel maxWidth={700}>
      <div style={headerStyle}>
        <Sparkles size={24} color={tokens.colors.accent} />
        <h2 style={{ margin: 0 }}>Brand Management</h2>
      </div>

      <div style={sectionStyle}>
        <p style={headingStyle}>Brand Reach</p>
        {DEMOGRAPHICS.map((dem) => {
          const reach = Math.round(state.brandReach[dem.id as DemographicId] ?? 0);
          return (
            <div key={dem.id} style={rowStyle}>
              <span style={labelStyle}>{dem.name}</span>
              <ProgressBar value={reach} height={8} />
              <span style={valueStyle}>{reach}%</span>
            </div>
          );
        })}
        <p style={hintStyle}>
          Percentage of each demographic that has heard of your company.
          Higher reach means more of that demographic's demand pool is addressable.
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={headingStyle}>Brand Perception</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.spacing.sm }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: perceptionColor(perceptionValue) }}>
            {perceptionSign}{perceptionValue}
          </span>
          <span style={{ color: tokens.colors.textMuted }}>/ 50</span>
        </div>
        <p style={hintStyle}>
          Accumulated sentiment from product quality and value-for-money. Decays 50% per year.
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, paddingTop: tokens.spacing.lg, ...sectionStyle }}>
        <p style={headingStyle}>Awareness Campaign</p>
        <p style={{ ...hintStyle, marginBottom: tokens.spacing.md }}>
          Run a small awareness campaign to boost brand reach across all demographics.
          This is a placeholder — full sponsorship and budget controls coming soon.
        </p>
        <MenuButton
          variant="accent"
          disabled={!canAfford}
          onClick={() => {
            dispatch({
              type: "RUN_AWARENESS_CAMPAIGN",
              cost: CAMPAIGN_COST,
              reachBoost: CAMPAIGN_REACH_BOOST,
            });
          }}
        >
          Run Awareness Campaign (${CAMPAIGN_COST.toLocaleString()})
        </MenuButton>
        {!canAfford && (
          <p style={{ ...hintStyle, color: tokens.colors.danger, marginTop: tokens.spacing.sm }}>
            Not enough cash
          </p>
        )}
      </div>

      <MenuButton onClick={() => navigateTo("dashboard")} style={{ marginTop: tokens.spacing.md }}>
        Back to Dashboard
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
