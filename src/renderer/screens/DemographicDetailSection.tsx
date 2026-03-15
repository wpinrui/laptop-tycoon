import { CSSProperties, useState, useMemo } from "react";
import { DEMOGRAPHICS } from "../../data/demographics";
import { LaptopStat, ALL_STATS, DemographicId, Demographic, STAT_LABELS } from "../../data/types";
import { LaptopSalesResult, PerceptionChange, StatContributor } from "../../simulation/salesTypes";
import { tokens } from "../shell/tokens";
import { formatNumber } from "../utils/formatCash";
import { tableStyle, thStyle, tdStyle, tdRight, sectionHeadingStyle, cardStyle } from "./summaryStyles";
import { useGame } from "../state/GameContext";
import { CompanyState, modelDisplayName } from "../state/gameTypes";

/** Get top N stats by weight for a demographic */
function getTopStats(demographic: Demographic, count: number): LaptopStat[] {
  return [...ALL_STATS]
    .sort((a, b) => {
      const diff = (demographic.statWeights[b] ?? 0) - (demographic.statWeights[a] ?? 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    })
    .slice(0, count);
}

/** Resolve a laptop's display name from game state companies */
function resolveLaptopName(
  laptopId: string,
  owner: string,
  companies: CompanyState[],
): string {
  const company = companies.find((c) => c.id === owner);
  if (!company) return laptopId;
  const model = company.models.find((m) => m.design.id === laptopId);
  return model ? modelDisplayName(company.name, model.design.name) : `${company.name} (${laptopId.slice(0, 6)})`;
}

interface ComparisonEntry {
  laptopId: string;
  owner: string;
  retailPrice: number;
  unitsSold: number;
  marketShare: number;
  normalizedStats: Record<LaptopStat, number>;
}

/** Build comparison entries for a demographic from all laptop results */
function buildComparisonEntries(
  allResults: LaptopSalesResult[],
  demId: DemographicId,
): ComparisonEntry[] {
  const entries: ComparisonEntry[] = [];
  for (const lr of allResults) {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (!db) continue;
    entries.push({
      laptopId: lr.laptopId,
      owner: lr.owner,
      retailPrice: lr.retailPrice,
      unitsSold: db.unitsDemanded,
      marketShare: db.marketShare,
      normalizedStats: db.normalizedStats,
    });
  }
  entries.sort((a, b) => b.marketShare - a.marketShare);
  return entries;
}

/** Color a score cell: green if best, red if worst, neutral otherwise */
function scoreColor(value: number, allValues: number[], higherIsBetter: boolean): string | undefined {
  if (allValues.length < 2) return undefined;
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  if (max === min) return undefined;
  if (higherIsBetter) {
    if (value === max) return tokens.colors.success;
    if (value === min) return tokens.colors.danger;
  } else {
    if (value === min) return tokens.colors.success;
    if (value === max) return tokens.colors.danger;
  }
  return undefined;
}

const MAX_COLUMNS = 5;
const TOP_STATS_COUNT = 5;
const TOP_DEMOGRAPHICS_COUNT = 3;

function sumUnitsForDemographic(results: LaptopSalesResult[], demId: DemographicId): number {
  return results.reduce((sum, lr) => {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    return sum + (db?.unitsDemanded ?? 0);
  }, 0);
}

function OtherSegmentsSummary({
  otherDemos,
  playerResults,
  allLaptopResults,
}: {
  otherDemos: Demographic[];
  playerResults: LaptopSalesResult[];
  allLaptopResults: LaptopSalesResult[];
}) {
  const otherUnits = otherDemos.reduce((sum, dem) => sum + sumUnitsForDemographic(playerResults, dem.id), 0);
  const otherTotalUnits = otherDemos.reduce((sum, dem) => sum + sumUnitsForDemographic(allLaptopResults, dem.id), 0);
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
      border: `1px solid ${tokens.colors.panelBorder}`,
      borderRadius: tokens.borderRadius.sm,
      marginBottom: tokens.spacing.xs,
      fontSize: tokens.font.sizeBase,
      color: tokens.colors.textMuted,
    }}>
      <span>Other segments ({otherDemos.length})</span>
      <span style={{ fontSize: tokens.font.sizeSmall }}>
        {formatNumber(otherUnits)} sold · {otherTotalUnits > 0 ? (otherUnits / otherTotalUnits * 100).toFixed(1) : "0.0"}% share
      </span>
    </div>
  );
}

const rowLabelStyle: CSSProperties = { ...tdStyle, fontWeight: 600, fontSize: tokens.font.sizeSmall };

function StatImpactBar({ contributor }: { contributor: StatContributor }) {
  const diff = contributor.playerScore - contributor.marketLeaderScore;
  const color = contributor.impact === "helping" ? tokens.colors.success : contributor.impact === "hurting" ? tokens.colors.danger : tokens.colors.textMuted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs, marginBottom: 3 }}>
      <span style={{ flex: "0 0 100px", fontSize: tokens.font.sizeSmall, color: tokens.colors.text }}>{STAT_LABELS[contributor.stat]}</span>
      <span style={{ flex: "0 0 30px", fontSize: tokens.font.sizeSmall, textAlign: "right" }}>{contributor.playerScore}</span>
      <div style={{ flex: 1, height: 4, background: tokens.colors.surface, borderRadius: 2, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          left: diff >= 0 ? `${contributor.marketLeaderScore}%` : `${contributor.playerScore}%`,
          width: `${Math.abs(diff)}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
        }} />
      </div>
      <span style={{ flex: "0 0 30px", fontSize: tokens.font.sizeSmall, textAlign: "right", color: tokens.colors.textMuted }}>{contributor.marketLeaderScore}</span>
    </div>
  );
}

function PerceptionChangeCard({ change }: { change: PerceptionChange }) {
  const [expanded, setExpanded] = useState(false);
  const demName = DEMOGRAPHICS.find((d) => d.id === change.demographicId)?.name ?? change.demographicId;
  const deltaColor = change.delta > 0 ? tokens.colors.success : change.delta < 0 ? tokens.colors.danger : undefined;
  const sign = change.delta > 0 ? "+" : "";
  const insight = change.insight;

  return (
    <div style={{ marginBottom: tokens.spacing.xs }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
          background: expanded ? tokens.colors.surface : "transparent",
          color: tokens.colors.text,
          border: `1px solid ${tokens.colors.panelBorder}`,
          borderRadius: tokens.borderRadius.sm,
          cursor: "pointer",
          fontSize: tokens.font.sizeBase,
          textAlign: "left",
        }}
      >
        <span>
          <span style={{ marginRight: 6 }}>{expanded ? "▾" : "▸"}</span>
          <span style={{ fontWeight: 600 }}>{demName}</span>
        </span>
        <span>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginRight: tokens.spacing.sm }}>
            {change.oldPerception.toFixed(1)} → {change.newPerception.toFixed(1)}
          </span>
          <span style={{ fontWeight: 600, color: deltaColor }}>{sign}{change.delta.toFixed(1)}</span>
        </span>
      </button>
      {expanded && (
        <div style={{ padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`, borderLeft: `2px solid ${deltaColor ?? tokens.colors.panelBorder}` }}>
          {!insight ? (
            <p style={{ margin: 0, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>{change.reason}</p>
          ) : (
            <>
              {/* VP comparison */}
              <div style={{ display: "flex", gap: tokens.spacing.lg, marginBottom: tokens.spacing.sm }}>
                <div>
                  <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Your Value</div>
                  <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}>{insight.playerAvgVP.toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Market Avg</div>
                  <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}>{insight.marketAvgVP.toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Gap</div>
                  <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: insight.vpGap >= 0 ? tokens.colors.success : tokens.colors.danger }}>
                    {insight.vpGap >= 0 ? "+" : ""}{(insight.vpGap / insight.marketAvgVP * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Stat contributors */}
              {insight.topStats.length > 0 && (
                <div style={{ marginBottom: tokens.spacing.sm }}>
                  <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: 4 }}>
                    Key stats (you vs top competitor)
                  </div>
                  {insight.topStats.map((sc) => (
                    <StatImpactBar key={sc.stat} contributor={sc} />
                  ))}
                </div>
              )}

              {/* Price comparison */}
              <div style={{ display: "flex", gap: tokens.spacing.lg, marginBottom: insight.topCompetitor ? tokens.spacing.sm : 0 }}>
                <div>
                  <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>Price score: </span>
                  <span style={{ fontSize: tokens.font.sizeSmall, fontWeight: 600 }}>{(insight.priceScore.player * 100).toFixed(0)}</span>
                  <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}> vs market avg </span>
                  <span style={{ fontSize: tokens.font.sizeSmall, fontWeight: 600 }}>{(insight.priceScore.marketAvg * 100).toFixed(0)}</span>
                  {insight.priceScore.player < insight.priceScore.marketAvg * 0.85 && (
                    <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger, marginLeft: 4 }}>
                      — overpriced for this segment
                    </span>
                  )}
                  {insight.priceScore.player > insight.priceScore.marketAvg * 1.15 && (
                    <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.success, marginLeft: 4 }}>
                      — competitively priced
                    </span>
                  )}
                </div>
              </div>

              {/* Top competitor */}
              {insight.topCompetitor && (
                <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                  Top competitor: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{insight.topCompetitor.name}</span>
                  {" "}(VP: {insight.topCompetitor.rawVP.toFixed(3)})
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface DemographicDetailProps {
  allLaptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  perceptionChanges: PerceptionChange[];
}

function DemographicComparisonTable({
  demographic,
  allResults,
  companies,
}: {
  demographic: Demographic;
  allResults: LaptopSalesResult[];
  companies: CompanyState[];
}) {
  const entries = useMemo(() => buildComparisonEntries(allResults, demographic.id), [allResults, demographic.id]);
  const topStats = useMemo(() => getTopStats(demographic, TOP_STATS_COUNT), [demographic]);
  const [filterText, setFilterText] = useState("");

  if (entries.length === 0) return null;

  const filtered = filterText
    ? entries.filter((e) =>
        resolveLaptopName(e.laptopId, e.owner, companies).toLowerCase().includes(filterText.toLowerCase()),
      )
    : entries;

  const visible = filtered.slice(0, MAX_COLUMNS);

  const priceValues = visible.map((e) => e.retailPrice);
  const unitValues = visible.map((e) => e.unitsSold);

  return (
    <div style={{ marginBottom: tokens.spacing.md }}>
      {entries.length > MAX_COLUMNS && (
        <input
          type="text"
          placeholder="Filter models..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
            fontSize: tokens.font.sizeSmall,
            background: tokens.colors.surface,
            color: tokens.colors.text,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            width: 140,
            marginBottom: tokens.spacing.xs,
          }}
        />
      )}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            {visible.map((e) => (
              <th key={e.laptopId} style={{ ...thStyle, textAlign: "right", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {resolveLaptopName(e.laptopId, e.owner, companies)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topStats.map((stat) => {
            const scores = visible.map((e) => Math.round((e.normalizedStats[stat] ?? 0) * 100));
            return (
              <tr key={stat}>
                <td style={rowLabelStyle}>{STAT_LABELS[stat]}</td>
                {visible.map((e, i) => (
                  <td key={e.laptopId} style={{ ...tdRight, color: scoreColor(scores[i], scores, true) }}>
                    {scores[i]}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr>
            <td style={rowLabelStyle}>Price</td>
            {visible.map((e) => (
              <td key={e.laptopId} style={{ ...tdRight, color: scoreColor(e.retailPrice, priceValues, false) }}>
                ${formatNumber(e.retailPrice)}
              </td>
            ))}
          </tr>
          <tr>
            <td style={rowLabelStyle}>Units Sold</td>
            {visible.map((e) => (
              <td key={e.laptopId} style={{ ...tdRight, color: scoreColor(e.unitsSold, unitValues, true) }}>
                {formatNumber(e.unitsSold)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function DemographicDetailSection({ allLaptopResults, playerResults, perceptionChanges }: DemographicDetailProps) {
  const { state } = useGame();
  const [expandedDem, setExpandedDem] = useState<DemographicId | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sort active demographics by player market share (descending) so the most relevant are first
  const sortedDemographics = useMemo(() => {
    const active = DEMOGRAPHICS.filter((dem) =>
      allLaptopResults.some((lr) =>
        lr.demographicBreakdown.some((b) => b.demographicId === dem.id && b.unitsDemanded > 0),
      ),
    );
    return active.sort((a, b) => {
      const shareA = playerResults.reduce((sum, lr) => {
        const db = lr.demographicBreakdown.find((d) => d.demographicId === a.id);
        return sum + (db?.marketShare ?? 0);
      }, 0);
      const shareB = playerResults.reduce((sum, lr) => {
        const db = lr.demographicBreakdown.find((d) => d.demographicId === b.id);
        return sum + (db?.marketShare ?? 0);
      }, 0);
      return shareB - shareA;
    });
  }, [allLaptopResults, playerResults]);

  if (playerResults.length === 0) return null;

  const hasMore = sortedDemographics.length > TOP_DEMOGRAPHICS_COUNT;
  const visibleDemographics = showAll ? sortedDemographics : sortedDemographics.slice(0, TOP_DEMOGRAPHICS_COUNT);

  return (
    <>
      {/* Per-Demographic Comparison Tables */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>Demographic Comparison</h3>
        <p style={{ margin: 0, marginBottom: tokens.spacing.sm, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}>
          Scores are market-relative (1–100). Click a demographic to expand.
        </p>
        {visibleDemographics.map((dem) => {
          const isExpanded = expandedDem === dem.id;
          const playerUnits = sumUnitsForDemographic(playerResults, dem.id);
          const totalUnits = sumUnitsForDemographic(allLaptopResults, dem.id);
          const share = totalUnits > 0 ? (playerUnits / totalUnits * 100).toFixed(1) : "0.0";

          return (
            <div key={dem.id}>
              <button
                onClick={() => setExpandedDem(isExpanded ? null : dem.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                  background: isExpanded ? tokens.colors.surface : "transparent",
                  color: tokens.colors.text,
                  border: `1px solid ${tokens.colors.panelBorder}`,
                  borderRadius: tokens.borderRadius.sm,
                  cursor: "pointer",
                  marginBottom: tokens.spacing.xs,
                  fontSize: tokens.font.sizeBase,
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span>{isExpanded ? "▾" : "▸"} {dem.name}</span>
                <span style={{ color: tokens.colors.textMuted, fontWeight: 400, fontSize: tokens.font.sizeSmall }}>
                  {formatNumber(playerUnits)} sold · {share}% share
                </span>
              </button>
              {isExpanded && (
                <div style={{ padding: `${tokens.spacing.xs}px 0`, paddingLeft: tokens.spacing.sm }}>
                  <DemographicComparisonTable
                    demographic={dem}
                    allResults={allLaptopResults}
                    companies={state.companies}
                  />
                </div>
              )}
            </div>
          );
        })}
        {hasMore && !showAll && (
          <OtherSegmentsSummary
            otherDemos={sortedDemographics.slice(TOP_DEMOGRAPHICS_COUNT)}
            playerResults={playerResults}
            allLaptopResults={allLaptopResults}
          />
        )}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              display: "block",
              width: "100%",
              padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              background: "transparent",
              color: tokens.colors.accent,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              cursor: "pointer",
              fontSize: tokens.font.sizeSmall,
              fontWeight: 600,
              marginTop: tokens.spacing.xs,
            }}
          >
            {showAll ? "Show fewer" : `Show all ${sortedDemographics.length} demographics`}
          </button>
        )}
      </div>

      {/* Perception Changes */}
      {perceptionChanges && perceptionChanges.some((pc) => Math.abs(pc.delta) >= 0.1) && (
        <div style={cardStyle}>
          <h3 style={sectionHeadingStyle}>Brand Perception Changes</h3>
          {perceptionChanges
            .filter((pc) => Math.abs(pc.delta) >= 0.1)
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .map((pc) => (
              <PerceptionChangeCard key={pc.demographicId} change={pc} />
            ))}
        </div>
      )}
    </>
  );
}
