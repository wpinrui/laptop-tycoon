import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { DEMOGRAPHICS } from "../../data/demographics";
import { DemographicId, STAT_LABELS } from "../../data/types";
import { CustomSelect, SelectOption } from "../shell/CustomSelect";
import { Tooltip } from "./Tooltip";
import { SidebarDivider } from "./LaptopEstimateSidebar";

const DEMOGRAPHIC_OPTIONS: SelectOption<DemographicId>[] = DEMOGRAPHICS
  .map((d) => ({ value: d.id, label: d.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface RankedStat {
  label: string;
  weight: number;
}

function getTopAndBottom(demId: DemographicId): { top: RankedStat[]; bottom: RankedStat[] } {
  const dem = DEMOGRAPHICS.find((d) => d.id === demId)!;

  // Combine stat weights + price into one list for ranking
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
    <div style={{ marginBottom: "6px" }}>
      <div style={{ color, fontSize: "0.6875rem", fontWeight: "bold", marginBottom: "4px" }}>
        {title}
      </div>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#e0e0e0",
            marginBottom: "2px",
            paddingLeft: "4px",
          }}
        >
          <span>{s.label}</span>
          <span style={{ color: "#888" }}>{Math.round(s.weight * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function DemographicHints() {
  const [selectedDem, setSelectedDem] = useState<DemographicId>(DEMOGRAPHIC_OPTIONS[0].value);
  const [collapsed, setCollapsed] = useState(false);

  const { top, bottom } = useMemo(() => getTopAndBottom(selectedDem), [selectedDem]);

  return (
    <>
      <SidebarDivider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: collapsed ? 0 : "10px",
        }}
      >
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            color: "#888",
            fontSize: "0.6875rem",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "0.5rem", display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>
            ▼
          </span>
          DEMOGRAPHIC HINTS
        </div>
        <Tooltip content="Shows which stats a demographic values most and least. Use this to tailor your laptop design to your target market.">
          <Info size={12} color="#888" style={{ cursor: "help" }} />
        </Tooltip>
      </div>

      {!collapsed && (
        <>
          <div style={{ marginBottom: "10px" }}>
            <CustomSelect
              value={selectedDem}
              onChange={setSelectedDem}
              options={DEMOGRAPHIC_OPTIONS}
              size="sm"
            />
          </div>

          <StatRankList title="Prioritises" color="#66bb6a" stats={top} />
          <StatRankList title="Ignores" color="#ef5350" stats={bottom} />
        </>
      )}
    </>
  );
}
