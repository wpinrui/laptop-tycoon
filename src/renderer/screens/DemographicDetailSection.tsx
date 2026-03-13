import { CSSProperties, useState, useMemo } from "react";
import { DEMOGRAPHICS } from "../../data/demographics";
import { LaptopStat, ALL_STATS, DemographicId, Demographic, STAT_LABELS } from "../../data/types";
import { LaptopSalesResult, PerceptionChange } from "../../simulation/salesTypes";
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

const rowLabelStyle: CSSProperties = { ...tdStyle, fontWeight: 600, fontSize: tokens.font.sizeSmall };

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
          const playerUnits = playerResults.reduce((sum, lr) => {
            const db = lr.demographicBreakdown.find((b) => b.demographicId === dem.id);
            return sum + (db?.unitsDemanded ?? 0);
          }, 0);
          const totalUnits = allLaptopResults.reduce((sum, lr) => {
            const db = lr.demographicBreakdown.find((b) => b.demographicId === dem.id);
            return sum + (db?.unitsDemanded ?? 0);
          }, 0);
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
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Demographic</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Before</th>
                <th style={{ ...thStyle, textAlign: "right" }}>After</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Change</th>
                <th style={thStyle}>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {perceptionChanges
                .filter((pc) => Math.abs(pc.delta) >= 0.1)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((pc) => {
                  const demName = DEMOGRAPHICS.find((d) => d.id === pc.demographicId)?.name ?? pc.demographicId;
                  const deltaColor = pc.delta > 0 ? tokens.colors.success : pc.delta < 0 ? tokens.colors.danger : undefined;
                  const sign = pc.delta > 0 ? "+" : "";
                  return (
                    <tr key={pc.demographicId}>
                      <td style={tdStyle}>{demName}</td>
                      <td style={tdRight}>{pc.oldPerception.toFixed(1)}</td>
                      <td style={tdRight}>{pc.newPerception.toFixed(1)}</td>
                      <td style={{ ...tdRight, color: deltaColor, fontWeight: 600 }}>
                        {sign}{pc.delta.toFixed(1)}
                      </td>
                      <td style={{ ...tdStyle, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                        {pc.reason}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
