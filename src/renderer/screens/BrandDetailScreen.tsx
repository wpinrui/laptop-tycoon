import { CSSProperties, useMemo, useState } from "react";
import { Sparkles, Check, Zap, Crown } from "lucide-react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { ProgressBar } from "./dashboard/ProgressBar";
import { formatPerception } from "./dashboard/utils";
import { DEMOGRAPHICS, GENERALISTS, NICHES } from "../../data/demographics";
import { Demographic, DemographicId } from "../../data/types";
import { PerceptionChange } from "../../simulation/salesTypes";
import { SidebarHeading } from "../wizard/LaptopEstimateSidebar";
import { PERCEPTION_MEANINGFUL_DELTA } from "../../simulation/tunables";
import {
  MARKETING_CHANNELS,
  MarketingChannel,
  MarketingMode,
  getChannelCost,
  isChannelAvailable,
} from "../../data/marketingChannels";
import { formatCash } from "../utils/formatCash";

const tierLabel: Record<number, string> = { 1: "Grassroots", 2: "Professional", 3: "Mass Market" };
const tierColor: Record<number, string> = {
  1: tokens.colors.success,
  2: tokens.colors.accent,
  3: tokens.colors.warning,
};

const hintStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: tokens.spacing.xs,
};

const nicheLinkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: tokens.colors.accent,
  fontSize: tokens.font.sizeSmall,
  cursor: "pointer",
  padding: 0,
  marginTop: tokens.spacing.xs,
};

const nicheSectionHeadingStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  fontWeight: 700,
  color: tokens.colors.textMuted,
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  margin: `${tokens.spacing.sm}px 0 ${tokens.spacing.xs}px`,
};

const demographicTagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  color: tokens.colors.accent,
  background: tokens.colors.accentBg,
  borderRadius: tokens.borderRadius.sm,
  padding: "2px 6px",
  marginRight: 4,
  marginTop: 4,
};

function getDemographicName(id: DemographicId): string {
  return DEMOGRAPHICS.find((d) => d.id === id)?.shortName ?? id;
}

function ChannelCard({
  channel,
  year,
  isActive,
  mode,
  onToggle,
  onModeChange,
}: {
  channel: MarketingChannel;
  year: number;
  isActive: boolean;
  mode: MarketingMode;
  onToggle: () => void;
  onModeChange: (mode: MarketingMode) => void;
}) {
  const aggressiveCost = getChannelCost(channel, year, "aggressive");
  const premiumCost = getChannelCost(channel, year, "premium");
  const displayCost = isActive ? getChannelCost(channel, year, mode) : aggressiveCost;

  const cardStyle: CSSProperties = {
    background: isActive ? tokens.colors.interactiveAccentBg : tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    border: isActive ? `1px solid ${tokens.colors.accent}` : `1px solid ${tokens.colors.panelBorder}`,
    transition: "border-color 0.15s, background 0.15s",
  };

  return (
    <div style={cardStyle}>
      {/* Header: name + cost + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
          {isActive && <Check size={16} color={tokens.colors.accent} />}
          <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase }}>{channel.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
          <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase, color: isActive ? tokens.colors.accent : tokens.colors.text }}>
            {formatCash(displayCost)}/qtr
          </span>
          <MenuButton
            variant={isActive ? "accent" : "surface"}
            onClick={onToggle}
            style={{ fontSize: tokens.font.sizeSmall, padding: "4px 12px" }}
          >
            {isActive ? "Active" : "Activate"}
          </MenuButton>
        </div>
      </div>

      {/* Description */}
      <p style={{ ...hintStyle, margin: `0 0 ${tokens.spacing.xs}px` }}>{channel.description}</p>

      {/* Deprecation notice */}
      {channel.yearDeprecated !== null && (
        <p style={{ fontSize: 11, color: tokens.colors.warning, margin: `0 0 ${tokens.spacing.xs}px` }}>
          Available until {channel.yearDeprecated}
        </p>
      )}

      {/* Demographic tags */}
      <div style={{ marginBottom: isActive ? tokens.spacing.sm : 0 }}>
        {channel.targetDemographics.map((demId) => (
          <span key={demId} style={demographicTagStyle}>{getDemographicName(demId)}</span>
        ))}
      </div>

      {/* Mode selector — only when active */}
      {isActive && (
        <div style={{ display: "flex", gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }}>
          <ModeButton
            icon={<Zap size={14} />}
            label="Aggressive"
            sublabel={formatCash(aggressiveCost) + "/qtr"}
            description="Full reach, slight perception hit"
            active={mode === "aggressive"}
            onClick={() => onModeChange("aggressive")}
          />
          <ModeButton
            icon={<Crown size={14} />}
            label="Premium"
            sublabel={formatCash(premiumCost) + "/qtr"}
            description="0.7x reach, perception boost, WoM bonus"
            active={mode === "premium"}
            onClick={() => onModeChange("premium")}
          />
        </div>
      )}
    </div>
  );
}

function ModeButton({
  icon,
  label,
  sublabel,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? tokens.colors.interactiveAccentBg : "transparent",
        border: active ? `1px solid ${tokens.colors.accent}` : `1px solid ${tokens.colors.panelBorder}`,
        borderRadius: tokens.borderRadius.sm,
        padding: tokens.spacing.sm,
        cursor: "pointer",
        textAlign: "left",
        color: tokens.colors.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        {icon}
        <span style={{ fontWeight: 600, fontSize: tokens.font.sizeSmall }}>{label}</span>
        <span style={{ fontSize: 11, color: tokens.colors.textMuted, marginLeft: "auto" }}>{sublabel}</span>
      </div>
      <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{description}</div>
    </button>
  );
}

function ReachRow({ dem, reach }: { dem: Demographic; reach: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs, marginBottom: 6 }}>
      <span style={{ flex: 1, fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
      <ProgressBar value={reach} height={6} />
      <span style={{ minWidth: 32, textAlign: "right", fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{reach}%</span>
    </div>
  );
}

function PerceptionRow({ dem, player, latestPerceptionChanges }: {
  dem: Demographic;
  player: ReturnType<typeof getPlayerCompany>;
  latestPerceptionChanges: Map<DemographicId, PerceptionChange>;
}) {
  const perception = formatPerception(player.brandPerception[dem.id] ?? 0);
  const change = latestPerceptionChanges.get(dem.id);
  const hasMeaningfulChange = change && Math.abs(change.delta) >= PERCEPTION_MEANINGFUL_DELTA;
  return (
    <div style={{ marginBottom: hasMeaningfulChange ? 10 : 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
        <span>
          {hasMeaningfulChange && (
            <span style={{
              fontSize: tokens.font.sizeSmall,
              fontWeight: 600,
              color: change.delta > 0 ? tokens.colors.success : tokens.colors.danger,
              marginRight: 4,
            }}>
              {change.delta > 0 ? "+" : ""}{change.delta.toFixed(1)}
            </span>
          )}
          <span style={{ fontWeight: 600, fontSize: tokens.font.sizeSmall, color: perception.color }}>
            {perception.sign}{perception.value}
          </span>
          <span style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}> / 50</span>
        </span>
      </div>
      {hasMeaningfulChange && (
        <p style={{ margin: 0, marginTop: 2, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
          {change.reason}
        </p>
      )}
    </div>
  );
}

export function BrandDetailScreen() {
  const { state, dispatch } = useGame();
  const player = getPlayerCompany(state);
  const [showAllNiches, setShowAllNiches] = useState(false);

  const visibleNiches = useMemo(() =>
    showAllNiches
      ? NICHES
      : NICHES.filter((d) => (player.brandReach[d.id] ?? 0) > 0 || (player.brandPerception[d.id] ?? 0) !== 0),
    [showAllNiches, player.brandReach, player.brandPerception],
  );
  const hiddenNicheCount = NICHES.length - visibleNiches.length;

  // Get the most recent perception changes
  const latestPerceptionChanges = useMemo(() => {
    const map = new Map<DemographicId, PerceptionChange>();
    const source = state.quarterHistory.length > 0
      ? state.quarterHistory
      : state.yearHistory.length > 0
        ? [state.yearHistory[state.yearHistory.length - 1]]
        : [];
    for (const result of source) {
      for (const pc of result.perceptionChanges) {
        const existing = map.get(pc.demographicId);
        if (existing) {
          map.set(pc.demographicId, {
            ...existing,
            newPerception: pc.newPerception,
            delta: pc.newPerception - existing.oldPerception,
            reason: pc.reason,
          });
        } else {
          map.set(pc.demographicId, { ...pc });
        }
      }
    }
    return map;
  }, [state.quarterHistory, state.yearHistory]);

  // Filter channels available in the current year
  const availableChannels = useMemo(
    () => MARKETING_CHANNELS.filter((c) => isChannelAvailable(c, state.year)),
    [state.year],
  );

  // Group by tier
  const channelsByTier = useMemo(() => {
    const grouped: Record<number, MarketingChannel[]> = { 1: [], 2: [], 3: [] };
    for (const ch of availableChannels) {
      grouped[ch.tier].push(ch);
    }
    return grouped;
  }, [availableChannels]);

  // Active channel lookup
  const activeMap = useMemo(() => {
    const map = new Map<string, MarketingMode>();
    for (const ac of state.activeMarketingChannels) {
      map.set(ac.channelId, ac.mode);
    }
    return map;
  }, [state.activeMarketingChannels]);

  // Total quarterly marketing spend
  const totalQuarterlySpend = useMemo(() => {
    let total = 0;
    for (const ac of state.activeMarketingChannels) {
      const ch = MARKETING_CHANNELS.find((c) => c.id === ac.channelId);
      if (ch && isChannelAvailable(ch, state.year)) {
        total += getChannelCost(ch, state.year, ac.mode);
      }
    }
    return total;
  }, [state.activeMarketingChannels, state.year]);

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader
        title="Brand Management"
        icon={Sparkles}
        right={totalQuarterlySpend > 0 ? (
          <span style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted }}>
            Marketing: <span style={{ color: tokens.colors.warning, fontWeight: 600 }}>{formatCash(totalQuarterlySpend)}/qtr</span>
            {" "}({formatCash(totalQuarterlySpend * 4)}/yr)
          </span>
        ) : undefined}
      />

      <div style={{ display: "flex", flex: 1, gap: tokens.spacing.lg, minHeight: 0 }}>
        {/* Main content: Marketing channels */}
        <div className="content-panel hide-scrollbar" style={{ flex: 2, overflowY: "auto", minHeight: 0 }}>
          {([1, 2, 3] as const).map((tier) => {
            const channels = channelsByTier[tier];
            if (channels.length === 0) return null;
            return (
              <div key={tier} style={{ marginBottom: tokens.spacing.xl }}>
                <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: tierColor[tier],
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}>
                    TIER {tier}
                  </span>
                  <span style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}>{tierLabel[tier]}</span>
                  <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                    ({channels[0].targetDemographics.length}–{channels[channels.length - 1].targetDemographics.length} demographics)
                  </span>
                </div>
                {channels.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    year={state.year}
                    isActive={activeMap.has(ch.id)}
                    mode={activeMap.get(ch.id) ?? "aggressive"}
                    onToggle={() => dispatch({ type: "TOGGLE_MARKETING_CHANNEL", channelId: ch.id })}
                    onModeChange={(mode) => dispatch({ type: "SET_MARKETING_MODE", channelId: ch.id, mode })}
                  />
                ))}
              </div>
            );
          })}
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
          {GENERALISTS.map((dem) => (
            <ReachRow key={dem.id} dem={dem} reach={Math.round(player.brandReach[dem.id] ?? 0)} />
          ))}
          {visibleNiches.length > 0 && (
            <div style={nicheSectionHeadingStyle}>Niche</div>
          )}
          {visibleNiches.map((dem) => (
            <ReachRow key={dem.id} dem={dem} reach={Math.round(player.brandReach[dem.id] ?? 0)} />
          ))}
          {hiddenNicheCount > 0 && (
            <button onClick={() => setShowAllNiches(true)} style={nicheLinkButtonStyle}>
              Show {hiddenNicheCount} more niche segments
            </button>
          )}
          {showAllNiches && visibleNiches.length === NICHES.length && (
            <button onClick={() => setShowAllNiches(false)} style={nicheLinkButtonStyle}>
              Hide inactive niches
            </button>
          )}
          <p style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            % of each demographic that has heard of your company.
          </p>

          <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, margin: `${tokens.spacing.md}px 0` }} />

          <SidebarHeading>BRAND PERCEPTION</SidebarHeading>
          {GENERALISTS.map((dem) => (
            <PerceptionRow key={dem.id} dem={dem} player={player} latestPerceptionChanges={latestPerceptionChanges} />
          ))}
          {visibleNiches.length > 0 && (
            <div style={nicheSectionHeadingStyle}>Niche</div>
          )}
          {visibleNiches.map((dem) => (
            <PerceptionRow key={dem.id} dem={dem} player={player} latestPerceptionChanges={latestPerceptionChanges} />
          ))}
          <p style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            Sentiment from product quality &amp; value. Based on last 3 years of experience.
          </p>
        </div>
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
