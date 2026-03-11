import { CSSProperties, useState, useMemo, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { modelDisplayName } from "../../state/gameTypes";
import {
  ALL_STATS,
  STAT_LABELS,
  scoreColor,
  RADAR_COLORS,
  MAX_COMPARE,
  getAgeLabel,
  getAgeColor,
  tokens,
} from "./types";
import { EntryWithStats } from "./MarketBrowserScreen";
import { RadarChart } from "./RadarChart";
import { useClickOutside } from "../../hooks/useClickOutside";

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

export function CompareView({
  entries,
  year,
  playerCompanyId,
  allMarketEntries,
  onAdd,
  onRemove,
  getLastQuarterSales,
}: {
  entries: EntryWithStats[];
  year: number;
  playerCompanyId: string;
  allMarketEntries: EntryWithStats[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  getLastQuarterSales: (id: string) => number | null;
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeDropdown = useCallback(() => { setDropdownOpen(false); setSearch(""); }, []);
  useClickOutside(dropdownRef, closeDropdown, dropdownOpen);

  const availableEntries = useMemo(() => {
    const selectedIds = new Set(entries.map((ews) => ews.entry.model.design.id));
    let available = allMarketEntries.filter((ews) => !selectedIds.has(ews.entry.model.design.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      available = available.filter((ews) =>
        modelDisplayName(ews.entry.company.name, ews.entry.model.design.name).toLowerCase().includes(q),
      );
    }
    return available;
  }, [search, allMarketEntries, entries]);

  const priceVals = entries.map((ews) => ews.entry.model.retailPrice ?? 0);

  function compareRow(label: string, vals: number[], higherIsBetter: boolean, format: (v: number) => string) {
    return (
      <tr>
        <td style={rowLabel}>{label}</td>
        {entries.map((ews, i) => (
          <td key={ews.entry.model.design.id} style={{ ...tdR, color: scoreColor(vals[i], vals, higherIsBetter) }}>
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
                ) : availableEntries.map((ews) => {
                  const e = ews.entry;
                  const ageColor = getAgeColor(e.model.yearDesigned, year);
                  return (
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
                        <span style={{ fontWeight: 600 }}>{modelDisplayName(e.company.name, e.model.design.name)}</span>
                        <span style={{ color: ageColor, marginLeft: 6, fontWeight: 600 }}>{getAgeLabel(e.model.yearDesigned, year)}</span>
                      </span>
                      <span style={{ color: tokens.colors.accent }}>${e.model.retailPrice!.toLocaleString()}</span>
                    </button>
                  );
                })}
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
                  {entries.map((ews, idx) => {
                    const { entry } = ews;
                    const isPlayer = entry.company.id === playerCompanyId;
                    const ageColor = getAgeColor(entry.model.yearDesigned, year);
                    return (
                      <th key={entry.model.design.id} style={{ ...thBase, color: isPlayer ? tokens.colors.accent : tokens.colors.text }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: RADAR_COLORS[idx % RADAR_COLORS.length], display: "inline-block", flexShrink: 0 }} />
                          <span>{modelDisplayName(entry.company.name, entry.model.design.name)}</span>
                        </div>
                        <div style={{ fontWeight: 600, color: ageColor, fontSize: tokens.font.sizeSmall }}>
                          {entry.model.yearDesigned} · {getAgeLabel(entry.model.yearDesigned, year)}
                        </div>
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
                {compareRow("Price", priceVals, false, (v) => `$${v.toLocaleString()}`)}
                <tr>
                  <td style={rowLabel}>Year</td>
                  {entries.map((ews) => (
                    <td key={ews.entry.model.design.id} style={tdR}>{ews.entry.model.yearDesigned}</td>
                  ))}
                </tr>
                <tr>
                  <td style={rowLabel}>Screen</td>
                  {entries.map((ews) => (
                    <td key={ews.entry.model.design.id} style={tdR}>{ews.entry.model.design.screenSize}"</td>
                  ))}
                </tr>
                {compareRow("Battery", entries.map((ews) => ews.entry.model.design.batteryCapacityWh), true, (v) => `${v} Wh`)}
                {compareRow("Thickness", entries.map((ews) => ews.entry.model.design.thicknessCm), false, (v) => `${v.toFixed(1)} cm`)}
                {compareRow("Last Qtr Sales", entries.map((ews) => getLastQuarterSales(ews.entry.model.design.id) ?? 0), true, (v) => v > 0 ? `${v.toLocaleString()} units` : "\u2014")}
                {/* Separator */}
                <tr><td colSpan={entries.length + 1} style={{ padding: `${tokens.spacing.xs}px 0`, borderBottom: `1px solid ${tokens.colors.panelBorder}` }}></td></tr>
                {ALL_STATS.map((stat) => {
                  const vals = entries.map((ews) => Math.round(ews.stats[stat] ?? 0));
                  return (
                    <tr key={stat}>
                      <td style={rowLabel}>{STAT_LABELS[stat]}</td>
                      {entries.map((ews, i) => (
                        <td key={ews.entry.model.design.id} style={{ ...tdR, color: scoreColor(vals[i], vals, true) }}>
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
              datasets={entries.map((ews, idx) => ({
                name: modelDisplayName(ews.entry.company.name, ews.entry.model.design.name),
                color: RADAR_COLORS[idx % RADAR_COLORS.length],
                values: ALL_STATS.map((s) => Math.round(ews.stats[s] ?? 0)),
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
