import { CSSProperties, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { ProgressBar } from "./dashboard/ProgressBar";
import { formatPerception } from "./dashboard/utils";
import { DEMOGRAPHICS } from "../../data/demographics";
import { SPONSORSHIPS, getSponsorshipCost } from "../../data/sponsorships";

const BUDGET_PRESETS = [0, 100_000, 250_000, 500_000, 1_000_000, 2_000_000];


const sectionStyle: CSSProperties = {
  marginBottom: tokens.spacing.xl,
};

const headingStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 600,
  marginBottom: tokens.spacing.md,
};


const hintStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: tokens.spacing.xs,
};

const sponsorshipCardStyle: CSSProperties = {
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.md,
  marginBottom: tokens.spacing.sm,
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s",
  border: `1px solid ${tokens.colors.panelBorder}`,
};

const sponsorshipActiveStyle: CSSProperties = {
  ...sponsorshipCardStyle,
  border: `1px solid ${tokens.colors.accent}`,
  background: tokens.colors.interactiveAccentBg,
};

const demographicTagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.accent,
  background: tokens.colors.accentBg,
  borderRadius: tokens.borderRadius.sm,
  padding: "2px 6px",
  marginRight: 4,
  marginTop: 4,
};

export function BrandDetailScreen() {
  const { state, dispatch } = useGame();
  const player = getPlayerCompany(state);
  const [hoveredSponsorship, setHoveredSponsorship] = useState<string | null>(null);

  const totalSponsorshipCost = state.sponsorships.reduce((sum, id) => {
    const s = SPONSORSHIPS.find((sp) => sp.id === id);
    return sum + (s ? getSponsorshipCost(s, state.year) : 0);
  }, 0);

  const totalAnnualSpend = state.brandAwarenessBudget + totalSponsorshipCost;

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader
        title="Brand Management"
        icon={Sparkles}
        right={
          <span style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted }}>
            Annual spend: <span style={{ color: tokens.colors.warning, fontWeight: 600 }}>${totalAnnualSpend.toLocaleString()}</span>
          </span>
        }
      />

      <div style={{ display: "flex", flex: 1, gap: tokens.spacing.lg, minHeight: 0 }}>
        {/* Main content: Budget + Sponsorships */}
        <div className="content-panel hide-scrollbar" style={{ flex: 2, overflowY: "auto", minHeight: 0 }}>
          {/* Awareness Budget */}
          <div style={sectionStyle}>
            <p style={headingStyle}>Awareness Budget</p>
            <p style={{ ...hintStyle, marginBottom: tokens.spacing.md, marginTop: 0 }}>
              Annual general spend that feeds a small amount of brand reach into all demographics.
              Cost is deducted upfront for the year.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: tokens.spacing.sm }}>
              {BUDGET_PRESETS.map((preset) => {
                const isSelected = state.brandAwarenessBudget === preset;
                const canAfford = state.cash >= preset - state.brandAwarenessBudget;
                return (
                  <MenuButton
                    key={preset}
                    variant={isSelected ? "accent" : "surface"}
                    disabled={!isSelected && !canAfford}
                    onClick={() => dispatch({ type: "SET_AWARENESS_BUDGET", budget: preset })}
                    style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
                  >
                    {preset === 0 ? "None" : preset >= 1_000_000 ? `$${(preset / 1_000_000).toFixed(0)}M` : `$${(preset / 1000).toFixed(0)}K`}
                  </MenuButton>
                );
              })}
            </div>
          </div>

          {/* Sponsorships */}
          <div style={sectionStyle}>
            <p style={headingStyle}>Sponsorships & Partnerships</p>
            <p style={{ ...hintStyle, marginBottom: tokens.spacing.md, marginTop: 0 }}>
              Discrete annual deals that target specific demographics. Toggle to purchase or cancel.
              Costs are adjusted for inflation.
            </p>
            {SPONSORSHIPS.map((sponsorship) => {
              const isActive = state.sponsorships.includes(sponsorship.id);
              const cost = getSponsorshipCost(sponsorship, state.year);
              const canAfford = state.cash >= cost;
              const isHovered = hoveredSponsorship === sponsorship.id;
              const targetedDemos = DEMOGRAPHICS.filter((d) => (sponsorship.reachBonus[d.id] ?? 0) > 0);

              return (
                <div
                  key={sponsorship.id}
                  style={{
                    ...(isActive ? sponsorshipActiveStyle : sponsorshipCardStyle),
                    ...(isHovered && !isActive ? { background: tokens.colors.surfaceHover } : {}),
                    ...((!canAfford && !isActive) ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                  }}
                  onClick={() => {
                    if (!canAfford && !isActive) return;
                    dispatch({ type: "TOGGLE_SPONSORSHIP", sponsorshipId: sponsorship.id });
                  }}
                  onMouseEnter={() => setHoveredSponsorship(sponsorship.id)}
                  onMouseLeave={() => setHoveredSponsorship(null)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
                      {isActive && <Check size={16} color={tokens.colors.accent} />}
                      <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase }}>{sponsorship.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase, color: isActive ? tokens.colors.accent : tokens.colors.text }}>
                      ${cost.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ ...hintStyle, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.xs }}>
                    {sponsorship.description}
                  </p>
                  <div>
                    {targetedDemos.map((dem) => (
                      <span key={dem.id} style={demographicTagStyle}>
                        {dem.name} +{sponsorship.reachBonus[dem.id]}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
        </div>

        {/* Sidebar: Brand Reach + Perception */}
        <div
          style={{
            flex: 1,
            background: tokens.colors.cardBg,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.md,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          <SidebarHeading>BRAND REACH</SidebarHeading>
          {DEMOGRAPHICS.map((dem) => {
            const reach = Math.round(player.brandReach[dem.id] ?? 0);
            return (
              <div key={dem.id} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs, marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
                <ProgressBar value={reach} height={6} />
                <span style={{ minWidth: 32, textAlign: "right", fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{reach}%</span>
              </div>
            );
          })}
          <p style={{ fontSize: "0.6875rem", color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            % of each demographic that has heard of your company.
          </p>

          <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, margin: `${tokens.spacing.md}px 0` }} />

          <SidebarHeading>BRAND PERCEPTION</SidebarHeading>
          {DEMOGRAPHICS.map((dem) => {
            const perception = formatPerception(player.brandPerception[dem.id] ?? 0);
            return (
              <div key={dem.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
                <span>
                  <span style={{ fontWeight: 600, fontSize: tokens.font.sizeSmall, color: perception.color }}>
                    {perception.sign}{perception.value}
                  </span>
                  <span style={{ color: tokens.colors.textMuted, fontSize: "0.6875rem" }}> / 50</span>
                </span>
              </div>
            );
          })}
          <p style={{ fontSize: "0.6875rem", color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            Sentiment from quality &amp; value. Decays 50%/yr.
          </p>
        </div>
      </div>
      <StatusBar />
    </ContentPanel>
  );
}

function SidebarHeading({ children }: { children: string }) {
  return (
    <div style={{ color: tokens.colors.textMuted, fontSize: "0.6875rem", marginBottom: 10, fontWeight: "bold", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}
