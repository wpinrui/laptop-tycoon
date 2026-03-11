import { CSSProperties, useMemo } from "react";
import { modelDisplayName } from "../../state/gameTypes";
import {
  MarketEntry,
  LaptopStat,
  STAT_LABELS,
  computeStatsForDesign,
  scoreColor,
  tokens,
} from "./types";

export function TableView({
  entries,
  year,
  playerCompanyId,
  statsToShow,
}: {
  entries: MarketEntry[];
  year: number;
  playerCompanyId: string;
  statsToShow: LaptopStat[];
}) {
  const rows = useMemo(() =>
    entries.map((e) => ({
      entry: e,
      stats: computeStatsForDesign(e.model.design, year),
    })),
    [entries, year],
  );

  const columnVals = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const stat of statsToShow) {
      result[stat] = rows.map((r) => Math.round(r.stats[stat] ?? 0));
    }
    return result;
  }, [rows, statsToShow]);

  const thBase: CSSProperties = {
    textAlign: "left",
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.panelBorder}`,
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    background: tokens.colors.cardBg,
    zIndex: 1,
  };
  const thRight: CSSProperties = { ...thBase, textAlign: "right" };
  const td: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    fontSize: tokens.font.sizeSmall,
    whiteSpace: "nowrap",
  };
  const tdR: CSSProperties = { ...td, textAlign: "right" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thBase}>Model</th>
          <th style={thRight}>Year</th>
          <th style={thRight}>Price</th>
          <th style={thRight}>Screen</th>
          {statsToShow.map((stat) => (
            <th key={stat} style={thRight}>{STAT_LABELS[stat]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ entry, stats }) => {
          const isPlayer = entry.company.id === playerCompanyId;
          const rowColor = isPlayer ? tokens.colors.accent : undefined;
          return (
            <tr key={entry.model.design.id}>
              <td style={{ ...td, fontWeight: 600, color: rowColor }}>
                {modelDisplayName(entry.company.name, entry.model.design.name)}
              </td>
              <td style={tdR}>{entry.model.yearDesigned}</td>
              <td style={tdR}>${entry.model.retailPrice!.toLocaleString()}</td>
              <td style={tdR}>{entry.model.design.screenSize}"</td>
              {statsToShow.map((stat) => {
                const val = Math.round(stats[stat] ?? 0);
                return (
                  <td key={stat} style={{ ...tdR, color: scoreColor(val, columnVals[stat], true) }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
