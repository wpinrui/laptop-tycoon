import { CSSProperties, useMemo } from "react";
import { GitCompareArrows } from "lucide-react";
import { modelDisplayName } from "../../state/gameTypes";
import {
  LaptopStat,
  STAT_LABELS,
  scoreColor,
  getAgeLabel,
  getAgeColor,
  compareBtnStyle,
  tokens,
} from "./types";
import { EntryWithStats } from "./MarketBrowserScreen";

export function TableView({
  entries,
  year,
  playerCompanyId,
  statsToShow,
  compareIds,
  onToggleCompare,
  compareFull,
}: {
  entries: EntryWithStats[];
  year: number;
  playerCompanyId: string;
  statsToShow: LaptopStat[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  compareFull: boolean;
}) {
  const columnVals = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const stat of statsToShow) {
      result[stat] = entries.map((r) => Math.round(r.stats[stat] ?? 0));
    }
    return result;
  }, [entries, statsToShow]);

  const thBase: CSSProperties = {
    textAlign: "left",
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.panelBorder}`,
    color: tokens.colors.textMuted,
    fontSize: tokens.font.sizeSmall,
    fontWeight: 600,
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    background: tokens.colors.cardBg,
    zIndex: 1,
  };
  const thRight: CSSProperties = { ...thBase, textAlign: "right" };
  const thCenter: CSSProperties = { ...thBase, textAlign: "center", width: 32 };
  const td: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    fontSize: tokens.font.sizeSmall,
    whiteSpace: "nowrap",
  };
  const tdR: CSSProperties = { ...td, textAlign: "right" };
  const tdCenter: CSSProperties = { ...td, textAlign: "center" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thCenter}></th>
          <th style={thBase}>Model</th>
          <th style={thRight}>Year</th>
          <th style={thBase}>Age</th>
          <th style={thRight}>Price</th>
          <th style={thRight}>Screen</th>
          {statsToShow.map((stat) => (
            <th key={stat} style={thRight}>{STAT_LABELS[stat]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map(({ entry, stats }) => {
          const isPlayer = entry.company.id === playerCompanyId;
          const rowColor = isPlayer ? tokens.colors.accent : undefined;
          const designId = entry.model.design.id;
          const inCompare = compareIds.includes(designId);
          const disabled = compareFull && !inCompare;
          const ageLabel = getAgeLabel(entry.model.yearDesigned, year);
          const ageColor = getAgeColor(entry.model.yearDesigned, year);
          return (
            <tr key={designId}>
              <td style={tdCenter}>
                <button
                  onClick={() => onToggleCompare(designId)}
                  disabled={disabled}
                  title={inCompare ? "Remove from compare" : disabled ? "Compare full (max 3)" : "Add to compare"}
                  style={compareBtnStyle(inCompare, disabled, true)}
                >
                  <GitCompareArrows size={12} />
                </button>
              </td>
              <td style={{ ...td, fontWeight: 600, color: rowColor }}>
                {modelDisplayName(entry.company.name, entry.model.design.name)}
              </td>
              <td style={tdR}>{entry.model.yearDesigned}</td>
              <td style={{ ...td, color: ageColor, fontWeight: 600 }}>{ageLabel}</td>
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
