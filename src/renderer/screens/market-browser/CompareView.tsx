import { CSSProperties, useState, useMemo, useRef, useEffect } from "react";
import { X } from "lucide-react";
import {
  MarketEntry,
  ALL_STATS,
  STAT_LABELS,
  computeStatsForDesign,
  scoreColor,
  RADAR_COLORS,
  MAX_COMPARE,
  tokens,
} from "./types";
import { RadarChart } from "./RadarChart";

export function CompareView({
  entries,
  year,
  playerCompanyId,
  allMarketEntries,
  onAdd,
  onRemove,
  getLastQuarterSales,
}: {
  entries: MarketEntry[];
  year: number;
  playerCompanyId: string;
  allMarketEntries: MarketEntry[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  getLastQuarterSales: (id: string) => number | null;
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const availableEntries = useMemo(() => {
    const selectedIds = new Set(entries.map((e) => e.model.design.id));
    let available = allMarketEntries.filter((e) => !selectedIds.has(e.model.design.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      available = available.filter((e) =>
        e.model.design.name.toLowerCase().includes(q) ||
        e.company.name.toLowerCase().includes(q),
      );
    }
    return available;
  }, [search, allMarketEntries, entries]);

  const allStats = useMemo(() =>
    entries.map((e) => ({
      entry: e,
      stats: computeStatsForDesign(e.model.design, year),
    })),
    [entries, year],
  );

  const thBase: CSSProperties = {
    textAlign: "right",
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    borderBottom: `1px solid ${tokens.colors.panelBorder}`,
    fontSize: tokens.font.sizeBase,
    fontWeight: 600,
    minWidth: 120,
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  const rowLabel: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    fontWeight: 600,
    fontSize: tokens.font.sizeBase,
    whiteSpace: "nowrap",
  };
  const tdR: CSSProperties = {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    borderBottom: `1px solid ${tokens.colors.surface}`,
    textAlign: "right",
    fontSize: tokens.font.sizeBase,
  };

  const priceVals = allStats.map((r) => r.entry.model.retailPrice ?? 0);

  function compareRow(label: string, vals: number[], higherIsBetter: boolean, format: (v: number) => string) {
    return (
      <tr>
        <td style={rowLabel}>{label}</td>
        {allStats.map(({ entry }, i) => (
          <td key={entry.model.design.id} style={{ ...tdR, color: scoreColor(vals[i], vals, higherIsBetter) }}>
            {format(vals[i])}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Searchable dropdown to add laptops */}
      {entries.length < MAX_COMPARE && (
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: tokens.spacing.md, display: "inline-block" }}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              if (!dropdownOpen) setTimeout(() => inputRef.current?.focus(), 0);
            }}
            style={{
              padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              fontSize: tokens.font.sizeSmall,
              background: tokens.colors.cardBg,
              color: dropdownOpen ? tokens.colors.text : tokens.colors.textMuted,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: tokens.spacing.xs,
              fontFamily: tokens.font.family,
              minWidth: 200,
            }}
          >
            + Add laptop
            <span style={{ fontSize: "0.6em", marginLeft: "auto" }}>{dropdownOpen ? "\u25B2" : "\u25BC"}</span>
          </button>
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              width: 340,
              background: tokens.colors.cardBg,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}>
              <div style={{ padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`, borderBottom: `1px solid ${tokens.colors.panelBorder}` }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Filter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: `${tokens.spacing.xs}px`,
                    fontSize: tokens.font.sizeSmall,
                    background: tokens.colors.surface,
                    color: tokens.colors.text,
                    border: `1px solid ${tokens.colors.panelBorder}`,
                    borderRadius: tokens.borderRadius.sm,
                    outline: "none",
                    fontFamily: tokens.font.family,
                  }}
                />
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {availableEntries.length === 0 ? (
                  <div style={{ padding: `${tokens.spacing.sm}px`, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall, textAlign: "center" }}>
                    No laptops found
                  </div>
                ) : availableEntries.map((e) => (
                  <button
                    key={e.model.design.id}
                    onClick={() => { onAdd(e.model.design.id); setSearch(""); setDropdownOpen(false); }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                      background: "transparent",
                      color: tokens.colors.text,
                      border: "none",
                      borderBottom: `1px solid ${tokens.colors.surface}`,
                      cursor: "pointer",
                      fontSize: tokens.font.sizeSmall,
                      textAlign: "left",
                      fontFamily: tokens.font.family,
                    }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = tokens.colors.surface; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                  >
                    <span>
                      <span style={{ fontWeight: 600 }}>{e.model.design.name}</span>
                      <span style={{ color: tokens.colors.textMuted, marginLeft: 6 }}>{e.company.name}</span>
                    </span>
                    <span style={{ color: tokens.colors.accent }}>${e.model.retailPrice!.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
          Add laptops to compare (up to {MAX_COMPARE}).
        </p>
      ) : (
        <div style={{ display: "flex", gap: tokens.spacing.lg, flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: "auto", minHeight: 0, background: tokens.colors.cardBg, borderRadius: tokens.borderRadius.md, border: `1px solid ${tokens.colors.panelBorder}`, padding: tokens.spacing.sm }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left" }}></th>
                  {allStats.map(({ entry }, idx) => {
                    const isPlayer = entry.company.id === playerCompanyId;
                    return (
                      <th key={entry.model.design.id} style={{ ...thBase, color: isPlayer ? tokens.colors.accent : tokens.colors.text }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: RADAR_COLORS[idx % RADAR_COLORS.length], display: "inline-block", flexShrink: 0 }} />
                          <span>{entry.model.design.name}</span>
                        </div>
                        <div style={{ fontWeight: 400, color: tokens.colors.textMuted, fontSize: 11 }}>{entry.company.name}</div>
                        <button
                          onClick={() => onRemove(entry.model.design.id)}
                          title="Remove"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: tokens.colors.danger,
                            cursor: "pointer",
                            padding: 0,
                            marginTop: 2,
                            display: "inline-flex",
                            alignItems: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={rowLabel}>Price</td>
                  {allStats.map(({ entry }) => (
                    <td key={entry.model.design.id} style={{ ...tdR, color: scoreColor(entry.model.retailPrice ?? 0, priceVals, false) }}>
                      ${entry.model.retailPrice!.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={rowLabel}>Screen</td>
                  {allStats.map(({ entry }) => (
                    <td key={entry.model.design.id} style={tdR}>{entry.model.design.screenSize}"</td>
                  ))}
                </tr>
                {compareRow("Battery", allStats.map((r) => r.entry.model.design.batteryCapacityWh), true, (v) => `${v} Wh`)}
                {compareRow("Thickness", allStats.map((r) => r.entry.model.design.thicknessCm), false, (v) => `${v.toFixed(1)} cm`)}
                {compareRow("Last Qtr Sales", allStats.map((r) => getLastQuarterSales(r.entry.model.design.id) ?? 0), true, (v) => v > 0 ? `${v.toLocaleString()} units` : "\u2014")}
                {/* Separator */}
                <tr><td colSpan={allStats.length + 1} style={{ padding: `${tokens.spacing.xs}px 0`, borderBottom: `1px solid ${tokens.colors.panelBorder}` }}></td></tr>
                {ALL_STATS.map((stat) => {
                  const vals = allStats.map((r) => Math.round(r.stats[stat] ?? 0));
                  return (
                    <tr key={stat}>
                      <td style={rowLabel}>{STAT_LABELS[stat]}</td>
                      {allStats.map(({ entry }, i) => (
                        <td key={entry.model.design.id} style={{ ...tdR, color: scoreColor(vals[i], vals, true) }}>
                          {vals[i]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            background: tokens.colors.cardBg,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.sm,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <RadarChart
              labels={ALL_STATS.map((s) => STAT_LABELS[s])}
              datasets={allStats.map(({ entry, stats }, idx) => ({
                name: entry.model.design.name,
                color: RADAR_COLORS[idx % RADAR_COLORS.length],
                values: ALL_STATS.map((s) => Math.round(stats[s] ?? 0)),
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
