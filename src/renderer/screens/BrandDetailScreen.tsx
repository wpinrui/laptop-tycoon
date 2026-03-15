import { CSSProperties, useMemo, useState } from "react";
import { Sparkles, Plus, Pause, Play, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, MarketingCampaign } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { ProgressBar } from "./dashboard/ProgressBar";
import { formatPerception } from "./dashboard/utils";
import { DEMOGRAPHICS, GENERALISTS, NICHES } from "../../data/demographics";
import { Demographic, DemographicId, MarketingTier } from "../../data/types";
import { PerceptionChange } from "../../simulation/salesTypes";
import { SidebarHeading } from "../wizard/LaptopEstimateSidebar";
import { PERCEPTION_MEANINGFUL_DELTA, PERCEPTION_CONTRIBUTION_SCALE, PERCEPTION_MIN, PERCEPTION_MAX, TIER_ACQUISITIONS, SPILLOVER_PENALTY } from "../../simulation/tunables";
import {
  getMaxTier,
  getEffectiveReachCeiling,
  getCampaignCost,
  getAdjacencies,
  TIER_LABELS,
  CAMPAIGN_DESCRIPTIONS,
} from "../../data/marketingChannels";
import { getDemandPoolSize } from "../../simulation/demographicData";
import { STARTING_DEMAND_POOL } from "../../data/startingDemand";
import { formatCash } from "../utils/formatCash";
import { CustomSelect, SelectOption, SelectGroup } from "../shell/CustomSelect";

const tierColor: Record<MarketingTier, string> = {
  1: tokens.colors.success,
  2: tokens.colors.accent,
  3: "#c084fc",
  4: tokens.colors.warning,
  5: "#ef4444",
};

const nicheSectionHeadingStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  fontWeight: 700,
  color: tokens.colors.textMuted,
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  margin: `${tokens.spacing.sm}px 0 ${tokens.spacing.xs}px`,
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

const spilloverTagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
  padding: "2px 6px",
  marginRight: 4,
  marginTop: 4,
};

function getDemographicName(id: DemographicId): string {
  return DEMOGRAPHICS.find((d) => d.id === id)?.shortName ?? id;
}

// ==================== Campaign Card ====================

function CampaignCard({
  campaign,
  year,
  demographic,
  reach,
  onRemove,
  onTierChange,
  onTogglePause,
}: {
  campaign: MarketingCampaign;
  year: number;
  demographic: Demographic;
  reach: number;
  onRemove: () => void;
  onTierChange: (tier: MarketingTier) => void;
  onTogglePause: () => void;
}) {
  const maxTier = getMaxTier(demographic.permeability);
  const cost = getCampaignCost(campaign.tier, year);
  const description = CAMPAIGN_DESCRIPTIONS[campaign.demographicId]?.[campaign.tier] ?? "";
  const adjacencies = getAdjacencies(campaign.demographicId);
  const tColor = tierColor[campaign.tier];
  const poolSize = getDemandPoolSize(demographic.id, year, STARTING_DEMAND_POOL[demographic.id]);
  const ceiling = getEffectiveReachCeiling(campaign.tier, maxTier);

  const cardStyle: CSSProperties = {
    background: campaign.paused ? tokens.colors.surface : tokens.colors.interactiveAccentBg,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    border: campaign.paused
      ? `1px solid ${tokens.colors.panelBorder}`
      : `1px solid ${tokens.colors.accent}`,
    opacity: campaign.paused ? 0.7 : 1,
    transition: "border-color 0.15s, background 0.15s, opacity 0.15s",
  };

  return (
    <div style={cardStyle}>
      {/* Header: demographic name + tier + cost */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
          <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase }}>{demographic.name}</span>
          <span style={{ fontSize: tokens.font.sizeSmall, fontWeight: 600, color: tColor }}>
            Tier {campaign.tier}
          </span>
          {campaign.paused && (
            <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.warning, fontWeight: 600 }}>
              PAUSED
            </span>
          )}
        </div>
        <span style={{ fontWeight: 600, fontSize: tokens.font.sizeBase, color: campaign.paused ? tokens.colors.textMuted : tokens.colors.accent }}>
          {campaign.paused ? "—" : `${formatCash(cost)}/qtr`}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, margin: `0 0 ${tokens.spacing.xs}px` }}>{description}</p>

      {/* Reach + pool info */}
      <div style={{ display: "flex", gap: tokens.spacing.md, marginBottom: tokens.spacing.xs, fontSize: tokens.font.sizeSmall }}>
        <span style={{ color: tokens.colors.textMuted }}>
          Reach: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{Math.round(reach)}%</span>
          <span style={{ color: tokens.colors.textMuted }}> / {Math.round(ceiling)}% ceiling</span>
        </span>
        <span style={{ color: tokens.colors.textMuted }}>
          Pool: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{poolSize.toLocaleString()}</span>
        </span>
      </div>

      {/* Spillover demographics */}
      {adjacencies.length > 0 && (
        <div style={{ marginBottom: tokens.spacing.sm }}>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Also reaches: </span>
          {adjacencies.map(({ demographicId, weight }) => (
            <span key={demographicId} style={spilloverTagStyle}>
              {getDemographicName(demographicId)} ({Math.round(weight * TIER_ACQUISITIONS[campaign.tier] * SPILLOVER_PENALTY)})
            </span>
          ))}
        </div>
      )}

      {/* Actions: tier controls + pause + delete */}
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
        {/* Tier adjustment */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={() => campaign.tier > 1 && onTierChange((campaign.tier - 1) as MarketingTier)}
            disabled={campaign.tier <= 1}
            style={{
              background: "transparent",
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              color: campaign.tier <= 1 ? tokens.colors.panelBorder : tokens.colors.text,
              cursor: campaign.tier <= 1 ? "default" : "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronDown size={14} />
          </button>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, minWidth: 50, textAlign: "center" }}>
            Tier {campaign.tier}/{maxTier}
          </span>
          <button
            onClick={() => campaign.tier < maxTier && onTierChange((campaign.tier + 1) as MarketingTier)}
            disabled={campaign.tier >= maxTier}
            style={{
              background: "transparent",
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              color: campaign.tier >= maxTier ? tokens.colors.panelBorder : tokens.colors.text,
              cursor: campaign.tier >= maxTier ? "default" : "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronUp size={14} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Pause/Resume */}
        <button
          onClick={onTogglePause}
          title={campaign.paused ? "Resume campaign" : "Pause campaign"}
          style={{
            background: "transparent",
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            color: tokens.colors.text,
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: tokens.font.sizeSmall,
          }}
        >
          {campaign.paused ? <Play size={14} /> : <Pause size={14} />}
          {campaign.paused ? "Resume" : "Pause"}
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          title="Delete campaign"
          style={{
            background: "transparent",
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            color: tokens.colors.danger,
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: tokens.font.sizeSmall,
          }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

// ==================== Add Campaign UI ====================

function AddCampaignPanel({
  year,
  existingDemographicIds,
  onAdd,
  onCancel,
}: {
  year: number;
  existingDemographicIds: Set<DemographicId>;
  onAdd: (demographicId: DemographicId, tier: MarketingTier) => void;
  onCancel: () => void;
}) {
  // Find first available demographic
  const firstAvailable = DEMOGRAPHICS.find((d) => !existingDemographicIds.has(d.id));
  const [selectedDemId, setSelectedDemId] = useState<DemographicId>(firstAvailable?.id ?? "gamer");
  const [selectedTier, setSelectedTier] = useState<MarketingTier>(1);

  const selectedDem = DEMOGRAPHICS.find((d) => d.id === selectedDemId);
  const maxTier = selectedDem ? getMaxTier(selectedDem.permeability) : 5;
  const effectiveTier = Math.min(selectedTier, maxTier) as MarketingTier;
  const cost = getCampaignCost(effectiveTier, year);
  const description = CAMPAIGN_DESCRIPTIONS[selectedDemId]?.[effectiveTier] ?? "";
  const adjacencies = getAdjacencies(selectedDemId);
  const poolSize = getDemandPoolSize(selectedDemId, year, STARTING_DEMAND_POOL[selectedDemId]);
  const ceiling = getEffectiveReachCeiling(effectiveTier, maxTier);

  // Build grouped options for demographic selector, sorted by pool size descending
  const getPool = (d: Demographic) => getDemandPoolSize(d.id, year, STARTING_DEMAND_POOL[d.id]);
  const demOptions: SelectGroup<DemographicId>[] = [
    {
      label: "Generalist",
      options: GENERALISTS
        .filter((d) => !existingDemographicIds.has(d.id))
        .sort((a, b) => getPool(b) - getPool(a))
        .map((d) => ({ value: d.id, label: `${d.name} (${getPool(d).toLocaleString()})` })),
    },
    {
      label: "Niche",
      options: NICHES
        .filter((d) => !existingDemographicIds.has(d.id))
        .sort((a, b) => getPool(b) - getPool(a))
        .map((d) => ({ value: d.id, label: `${d.name} (${getPool(d).toLocaleString()})` })),
    },
  ].filter((g) => g.options.length > 0);

  // Build tier options
  const tierOptions: SelectOption<string>[] = [];
  for (let t = 1; t <= maxTier; t++) {
    const tier = t as MarketingTier;
    tierOptions.push({
      value: String(tier),
      label: `Tier ${tier} — ${TIER_LABELS[tier]} (${formatCash(getCampaignCost(tier, year))}/qtr)`,
    });
  }

  const handleDemChange = (newDemId: DemographicId) => {
    setSelectedDemId(newDemId);
    const newDem = DEMOGRAPHICS.find((d) => d.id === newDemId);
    const newMaxTier = newDem ? getMaxTier(newDem.permeability) : 5;
    if (selectedTier > newMaxTier) setSelectedTier(newMaxTier as MarketingTier);
  };

  return (
    <div style={{
      background: tokens.colors.cardBg,
      border: `1px solid ${tokens.colors.accent}`,
      borderRadius: tokens.borderRadius.md,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.md,
    }}>
      <div style={{ fontWeight: 600, fontSize: tokens.font.sizeBase, marginBottom: tokens.spacing.sm }}>
        New Campaign
      </div>

      {/* Demographic selector */}
      <div style={{ marginBottom: tokens.spacing.sm }}>
        <CustomSelect<DemographicId>
          value={selectedDemId}
          onChange={handleDemChange}
          options={demOptions}
          label="Target:"
          size="md"
        />
      </div>

      {/* Tier selector */}
      <div style={{ marginBottom: tokens.spacing.sm }}>
        <CustomSelect
          value={String(effectiveTier)}
          onChange={(v) => setSelectedTier(Number(v) as MarketingTier)}
          options={tierOptions}
          label="Tier:"
          size="md"
        />
      </div>

      {/* Preview */}
      <div style={{
        background: tokens.colors.surface,
        borderRadius: tokens.borderRadius.sm,
        padding: tokens.spacing.sm,
        marginBottom: tokens.spacing.sm,
      }}>
        <p style={{ margin: 0, fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted }}>
          {description}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            {TIER_ACQUISITIONS[effectiveTier].toLocaleString()} acquisitions/qtr
          </span>
          <span style={{ fontSize: tokens.font.sizeSmall, fontWeight: 600, color: tokens.colors.accent }}>
            {formatCash(cost)}/qtr
          </span>
        </div>
        <div style={{ display: "flex", gap: tokens.spacing.md, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeSmall }}>
          <span style={{ color: tokens.colors.textMuted }}>
            Pool: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{poolSize.toLocaleString()}</span>
          </span>
          <span style={{ color: tokens.colors.textMuted }}>
            Reach ceiling: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{Math.round(ceiling)}%</span>
          </span>
        </div>
        {adjacencies.length > 0 && (
          <div style={{ marginTop: tokens.spacing.xs }}>
            <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Also reaches: </span>
            {adjacencies.map(({ demographicId, weight }) => (
              <span key={demographicId} style={spilloverTagStyle}>
                {getDemographicName(demographicId)} ({Math.round(weight * TIER_ACQUISITIONS[effectiveTier] * SPILLOVER_PENALTY)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: tokens.spacing.sm }}>
        <MenuButton variant="accent" onClick={() => onAdd(selectedDemId, effectiveTier)}>
          Create Campaign
        </MenuButton>
        <MenuButton variant="surface" onClick={onCancel}>
          Cancel
        </MenuButton>
      </div>
    </div>
  );
}

// ==================== Reach & Perception Sidebar ====================

function ReachRow({ dem, reach }: { dem: Demographic; reach: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs, marginBottom: 6 }}>
      <span style={{ flex: 1, fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
      <ProgressBar value={reach} height={6} />
      <span style={{ minWidth: 32, textAlign: "right", fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{reach}%</span>
    </div>
  );
}

function computePerceptionTrajectory(history: number[]): number[] {
  if (history.length === 0) return [];
  const trajectory: number[] = [];
  let sum = 0;
  for (let i = 0; i < history.length; i++) {
    sum += history[i];
    const mean = sum / (i + 1);
    const perception = mean * PERCEPTION_CONTRIBUTION_SCALE;
    trajectory.push(Math.max(PERCEPTION_MIN, Math.min(PERCEPTION_MAX, perception)));
  }
  return trajectory;
}

function PerceptionSparkline({ trajectory }: { trajectory: number[] }) {
  if (trajectory.length < 2) return null;
  const width = 60;
  const height = 16;
  const padding = 1;
  const min = Math.min(...trajectory, -5);
  const max = Math.max(...trajectory, 5);
  const range = max - min || 1;

  const points = trajectory.map((v, i) => {
    const x = padding + (i / (trajectory.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const lastVal = trajectory[trajectory.length - 1];
  const color = lastVal > 1 ? tokens.colors.success : lastVal < -1 ? tokens.colors.danger : tokens.colors.textMuted;

  return (
    <svg width={width} height={height} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
      <line
        x1={padding} y1={padding + (1 - (0 - min) / range) * (height - 2 * padding)}
        x2={width - padding} y2={padding + (1 - (0 - min) / range) * (height - 2 * padding)}
        stroke={tokens.colors.panelBorder} strokeWidth={0.5}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
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
  const trajectory = useMemo(
    () => computePerceptionTrajectory(player.perceptionHistory?.[dem.id] ?? []),
    [player.perceptionHistory, dem.id],
  );

  return (
    <div style={{ marginBottom: hasMeaningfulChange ? 10 : 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{dem.name}</span>
        <span style={{ display: "flex", alignItems: "center" }}>
          {trajectory.length >= 2 && <PerceptionSparkline trajectory={trajectory} />}
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

// ==================== Main Screen ====================

export function BrandDetailScreen() {
  const { state, dispatch } = useGame();
  const player = getPlayerCompany(state);
  const [showAllNiches, setShowAllNiches] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const visibleNiches = useMemo(() =>
    showAllNiches
      ? NICHES
      : NICHES.filter((d) => (player.brandReach[d.id] ?? 0) > 0 || (player.brandPerception[d.id] ?? 0) !== 0),
    [showAllNiches, player.brandReach, player.brandPerception],
  );
  const hiddenNicheCount = NICHES.length - visibleNiches.length;

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
            insight: pc.insight ?? existing.insight,
          });
        } else {
          map.set(pc.demographicId, { ...pc });
        }
      }
    }
    return map;
  }, [state.quarterHistory, state.yearHistory]);

  // Existing campaign demographic IDs for validation
  const existingDemIds = useMemo(
    () => new Set(state.marketingCampaigns.map((c) => c.demographicId)),
    [state.marketingCampaigns],
  );

  // Total quarterly marketing spend (non-paused campaigns)
  const totalQuarterlySpend = useMemo(() => {
    let total = 0;
    for (const c of state.marketingCampaigns) {
      if (!c.paused) {
        total += getCampaignCost(c.tier, state.year);
      }
    }
    return total;
  }, [state.marketingCampaigns, state.year]);

  const handleAddCampaign = (demographicId: DemographicId, tier: MarketingTier) => {
    dispatch({ type: "ADD_CAMPAIGN", demographicId, tier });
    setShowAddPanel(false);
  };

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
        {/* Main content: Campaign cards */}
        <div className="content-panel hide-scrollbar" style={{ flex: 2, overflowY: "auto", minHeight: 0 }}>
          {/* Add Campaign panel */}
          {showAddPanel && (
            <AddCampaignPanel
              year={state.year}
              existingDemographicIds={existingDemIds}
              onAdd={handleAddCampaign}
              onCancel={() => setShowAddPanel(false)}
            />
          )}

          {/* Add Campaign button */}
          {!showAddPanel && existingDemIds.size < DEMOGRAPHICS.length && (
            <div style={{ marginBottom: tokens.spacing.md }}>
              <MenuButton
                variant="accent"
                onClick={() => setShowAddPanel(true)}
                style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}
              >
                <Plus size={16} />
                Add Campaign
              </MenuButton>
            </div>
          )}

          {/* Active campaigns */}
          {state.marketingCampaigns.length === 0 && !showAddPanel && (
            <div style={{
              textAlign: "center",
              padding: `${tokens.spacing.xl}px`,
              color: tokens.colors.textMuted,
              fontSize: tokens.font.sizeBase,
            }}>
              No marketing campaigns active. Add one to start growing your brand reach.
            </div>
          )}

          {state.marketingCampaigns.map((campaign) => {
            const dem = DEMOGRAPHICS.find((d) => d.id === campaign.demographicId);
            if (!dem) return null;
            return (
              <CampaignCard
                key={campaign.demographicId}
                campaign={campaign}
                year={state.year}
                demographic={dem}
                reach={player.brandReach[campaign.demographicId] ?? 0}
                onRemove={() => dispatch({ type: "REMOVE_CAMPAIGN", demographicId: campaign.demographicId })}
                onTierChange={(tier) => dispatch({ type: "UPDATE_CAMPAIGN_TIER", demographicId: campaign.demographicId, tier })}
                onTogglePause={() => dispatch({ type: "TOGGLE_CAMPAIGN_PAUSE", demographicId: campaign.demographicId })}
              />
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
