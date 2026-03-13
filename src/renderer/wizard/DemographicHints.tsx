import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { DEMOGRAPHICS } from "../../data/demographics";
import { ALL_STATS, DemographicId, STAT_LABELS } from "../../data/types";
import { Tooltip } from "./Tooltip";
import { SidebarDivider } from "./LaptopEstimateSidebar";
import { useWizard } from "./WizardContext";
import { computeStatTotals } from "./StatBar";
import { tokens } from "../shell/tokens";

const TOP_COUNT = 10;

interface RankedStat {
  label: string;
  weight: number;
}

function getTopAndBottom(demId: DemographicId): { top: RankedStat[]; bottom: RankedStat[] } {
  const dem = DEMOGRAPHICS.find((d) => d.id === demId)!;
  const entries: { label: string; weight: number }[] = Object.entries(dem.statWeights).map(
    ([stat, w]) => ({ label: STAT_LABELS[stat as keyof typeof STAT_LABELS], weight: w }),
  );
  entries.push({ label: "Price", weight: dem.priceWeight });
  entries.sort((a, b) => b.weight - a.weight);
  return {
    top: entries.slice(0, 3),
    bottom: entries.slice(-3).reverse(),
  };
}

function StatRankList({ title, color, stats }: { title: string; color: string; stats: RankedStat[] }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ color, fontSize: tokens.font.sizeSmall, fontWeight: "bold", marginBottom: 4 }}>
        {title}
      </div>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: tokens.font.sizeSmall,
            color: tokens.colors.text,
            marginBottom: 2,
            paddingLeft: 4,
          }}
        >
          <span>{s.label}</span>
          <span style={{ color: tokens.colors.textMuted }}>{Math.round(s.weight * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

interface RankedDemographic {
  id: DemographicId;
  name: string;
  shortName: string;
  score: number;
  normalizedScore: number;
}

export function DemographicHints() {
  const { state, gameYear } = useWizard();
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedDem, setSelectedDem] = useState<DemographicId | null>(null);

  const statTotals = useMemo(() => computeStatTotals(state, gameYear), [state, gameYear]);

  // Rank demographics by fit: weighted dot product of design stats × demographic weights
  const ranked: RankedDemographic[] = useMemo(() => {
    const scores = DEMOGRAPHICS.map((dem) => {
      let score = 0;
      for (const stat of ALL_STATS) {
        score += (dem.statWeights[stat] ?? 0) * (statTotals[stat] ?? 0);
      }
      return { id: dem.id, name: dem.name, shortName: dem.shortName, score, normalizedScore: 0 };
    });
    scores.sort((a, b) => b.score - a.score);
    const maxScore = scores[0]?.score || 1;
    for (const s of scores) {
      s.normalizedScore = maxScore > 0 ? s.score / maxScore : 0;
    }
    return scores;
  }, [statTotals]);

  const hasDesignStats = ALL_STATS.some((s) => (statTotals[s] ?? 0) > 0);
  const visible = showAll ? ranked : ranked.slice(0, TOP_COUNT);

  const detail = selectedDem ? getTopAndBottom(selectedDem) : null;

  return (
    <>
      <SidebarDivider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            color: tokens.colors.textMuted,
            fontSize: tokens.font.sizeSmall,
            fontWeight: "bold",
            letterSpacing: 0.5,
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: "0.5rem", display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>
            ▼
          </span>
          DEMOGRAPHIC FIT
        </div>
        <Tooltip content="Ranks demographics by how well your current design matches their priorities. Click a demographic to see what it values.">
          <Info size={12} color={tokens.colors.textMuted} style={{ cursor: "help" }} />
        </Tooltip>
      </div>

      {!collapsed && (
        <>
          {!hasDesignStats ? (
            <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              Add components to see demographic fit rankings.
            </div>
          ) : (
            <>
              {visible.map((dem, i) => {
                const isSelected = selectedDem === dem.id;
                return (
                  <div
                    key={dem.id}
                    onClick={() => setSelectedDem(isSelected ? null : dem.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: 4,
                      background: isSelected ? tokens.colors.surface : "transparent",
                    }}
                  >
                    <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, width: 14, textAlign: "right", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: tokens.font.sizeSmall, color: isSelected ? tokens.colors.accent : tokens.colors.text }}>
                      {dem.shortName}
                    </span>
                    <div style={{ width: 50, height: 4, background: "#333", borderRadius: 2, flexShrink: 0 }}>
                      <div style={{
                        width: `${Math.round(dem.normalizedScore * 100)}%`,
                        height: "100%",
                        background: i < 3 ? tokens.colors.success : i < 7 ? tokens.colors.accent : tokens.colors.textMuted,
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                );
              })}
              {ranked.length > TOP_COUNT && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    background: "none",
                    border: "none",
                    color: tokens.colors.accent,
                    fontSize: tokens.font.sizeSmall,
                    cursor: "pointer",
                    padding: "2px 0",
                    marginTop: 2,
                  }}
                >
                  {showAll ? "Show top 10" : `Show all ${ranked.length}`}
                </button>
              )}
            </>
          )}

          {detail && (
            <div style={{ marginTop: 8 }}>
              <StatRankList title="Prioritises" color={tokens.colors.success} stats={detail.top} />
              <StatRankList title="Ignores" color={tokens.colors.danger} stats={detail.bottom} />
            </div>
          )}
        </>
      )}
    </>
  );
}
