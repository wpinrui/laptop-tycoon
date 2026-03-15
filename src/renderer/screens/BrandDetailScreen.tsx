import { CSSProperties, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { ProgressBar } from "./dashboard/ProgressBar";
import { formatPerception } from "./dashboard/utils";
import { GENERALISTS, NICHES } from "../../data/demographics";
import { Demographic, DemographicId } from "../../data/types";
import { PerceptionChange } from "../../simulation/salesTypes";
import { SidebarHeading } from "../wizard/LaptopEstimateSidebar";
import { PERCEPTION_MEANINGFUL_DELTA } from "../../simulation/tunables";

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
  const { state } = useGame();
  const player = getPlayerCompany(state);
  const [showAllNiches, setShowAllNiches] = useState(false);

  const visibleNiches = useMemo(() =>
    showAllNiches
      ? NICHES
      : NICHES.filter((d) => (player.brandReach[d.id] ?? 0) > 0 || (player.brandPerception[d.id] ?? 0) !== 0),
    [showAllNiches, player.brandReach, player.brandPerception],
  );
  const hiddenNicheCount = NICHES.length - visibleNiches.length;

  // Get the most recent perception changes: current year's quarters, or last completed year
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
          // Accumulate: keep first old, use latest new, sum deltas, keep latest reason
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

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader title="Brand Management" icon={Sparkles} />

      <div style={{ display: "flex", flex: 1, gap: tokens.spacing.lg, minHeight: 0 }}>
        {/* Main content: Marketing channels (coming soon) */}
        <div className="content-panel hide-scrollbar" style={{ flex: 2, overflowY: "auto", minHeight: 0 }}>
          <div style={{ marginBottom: tokens.spacing.xl }}>
            <p style={headingStyle}>Marketing Channels</p>
            <p style={hintStyle}>
              Marketing channel selection coming soon. Brand reach currently grows through word-of-mouth from sales.
            </p>
          </div>
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
