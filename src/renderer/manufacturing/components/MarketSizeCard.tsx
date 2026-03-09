import { CSSProperties, useState, useRef, useEffect, useMemo } from "react";
import { DemographicId } from "../../../data/types";
import { DEMOGRAPHICS } from "../../../data/demographics";
import { getQuarterlyBuyers } from "../../../simulation/demographicData";
import { DEMAND_NOISE_MIN, DEMAND_NOISE_MAX } from "../../../simulation/tunables";
import { averageReach } from "../../../simulation/brandProgression";
import { tokens } from "../../shell/tokens";
import { Quarter, getPlayerCompany } from "../../state/gameTypes";
import { useGame } from "../../state/GameContext";

function getTotalQuarterlyBuyers(year: number, quarter: Quarter): number {
  return DEMOGRAPHICS.reduce((sum, d) => sum + getQuarterlyBuyers(d.id, year, quarter), 0);
}

const cardStyle: CSSProperties = {
  background: tokens.colors.background,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  textAlign: "center",
};

type DemoValue = DemographicId | "all";

const OPTIONS: { value: DemoValue; label: string }[] = [
  { value: "all", label: "All Demographics" },
  ...DEMOGRAPHICS.map((d) => ({ value: d.id as DemoValue, label: d.name })),
];

function CustomSelect({
  value,
  onChange,
}: {
  value: DemoValue;
  onChange: (v: DemoValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = OPTIONS.find((o) => o.value === value)!;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-grid" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          gridArea: "1 / 1",
          background: tokens.colors.surface,
          color: tokens.colors.text,
          border: `1px solid ${tokens.colors.panelBorder}`,
          borderRadius: tokens.borderRadius.sm,
          padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
          fontSize: tokens.font.sizeBase,
          fontFamily: tokens.font.family,
          cursor: "pointer",
          outline: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: tokens.spacing.xs,
        }}
      >
        {selected.label}
        <span style={{ fontSize: "0.6em", marginLeft: 2 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {/* Invisible sizer: mirrors button structure exactly to establish max width */}
      <div style={{ gridArea: "1 / 1", visibility: "hidden", pointerEvents: "none", padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`, fontSize: tokens.font.sizeBase, fontFamily: tokens.font.family, display: "flex", alignItems: "center", justifyContent: "center", gap: tokens.spacing.xs, border: "1px solid transparent" }}>
        {OPTIONS.reduce((a, b) => (a.length >= b.label.length ? a : b.label), "")}
        <span style={{ fontSize: "0.6em", marginLeft: 2 }}>{"\u25BC"}</span>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 4,
            background: "#1e1e1e",
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            overflow: "hidden",
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            minWidth: "100%",
            whiteSpace: "nowrap",
          }}
        >
          {OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: `${tokens.spacing.sm}px ${tokens.spacing.lg}px`,
                cursor: "pointer",
                fontSize: tokens.font.sizeBase,
                color: opt.value === value ? tokens.colors.accent : tokens.colors.text,
                fontWeight: opt.value === value ? 600 : 400,
                background: opt.value === value ? tokens.colors.background : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = tokens.colors.background;
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: `1px solid ${tokens.colors.panelBorder}`,
        borderRadius: tokens.borderRadius.sm,
        color: tokens.colors.textMuted,
        fontSize: tokens.font.sizeBase,
        width: 28,
        height: 28,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.accent;
        e.currentTarget.style.color = tokens.colors.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.panelBorder;
        e.currentTarget.style.color = tokens.colors.textMuted;
      }}
    >
      {direction === "left" ? "\u25C0" : "\u25B6"}
    </button>
  );
}

/** Simple seeded PRNG (mulberry32) for stable noise per demographic/quarter */
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function applyReachNoise(trueReach: number, seed: number): number {
  const rng = seededRandom(seed);
  const noisePercent = DEMAND_NOISE_MIN + rng * (DEMAND_NOISE_MAX - DEMAND_NOISE_MIN);
  const direction = seededRandom(seed + 1) < 0.5 ? -1 : 1;
  const noisy = trueReach * (1 + (direction * noisePercent) / 100);
  return Math.max(0, Math.min(100, noisy));
}

export function MarketSizeCard({ year, quarter }: { year: number; quarter: Quarter }) {
  const [selectedDemographic, setSelectedDemographic] = useState<DemoValue>("all");
  const { state: gameState } = useGame();
  const player = getPlayerCompany(gameState);

  const marketSize =
    selectedDemographic === "all"
      ? getTotalQuarterlyBuyers(year, quarter)
      : getQuarterlyBuyers(selectedDemographic, year, quarter);

  // Stable noisy reach estimate — noise is seeded so it doesn't flicker on re-render
  const noisyReach = useMemo(() => {
    const baseSeed = year * 100 + quarter;
    if (selectedDemographic === "all") {
      const avg = averageReach(player.brandReach);
      return applyReachNoise(avg, baseSeed);
    }
    const trueReach = player.brandReach[selectedDemographic] ?? 0;
    // Per-demographic seed uses charCode sum for variety
    const demSeed = baseSeed + selectedDemographic.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    return applyReachNoise(trueReach, demSeed);
  }, [year, quarter, selectedDemographic, player.brandReach]);

  const reachDisplay = noisyReach < 1
    ? "<1%"
    : `~${Math.round(noisyReach)}%`;

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm }}>
        Projected market size for Q{quarter}
      </div>
      <div style={{
        fontSize: tokens.font.sizeHero,
        fontWeight: 700,
        color: tokens.colors.accent,
        margin: `${tokens.spacing.sm}px 0`,
      }}>
        {marketSize.toLocaleString()}
      </div>
      <div style={{
        fontSize: tokens.font.sizeSmall,
        color: tokens.colors.textMuted,
        marginBottom: tokens.spacing.sm,
      }}>
        Est. brand reach: <span style={{ color: tokens.colors.text, fontWeight: 600 }}>{reachDisplay}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: tokens.spacing.xs }}>
        <ArrowButton direction="left" onClick={() => {
          const idx = OPTIONS.findIndex((o) => o.value === selectedDemographic);
          setSelectedDemographic(OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length].value);
        }} />
        <CustomSelect
          value={selectedDemographic}
          onChange={setSelectedDemographic}
        />
        <ArrowButton direction="right" onClick={() => {
          const idx = OPTIONS.findIndex((o) => o.value === selectedDemographic);
          setSelectedDemographic(OPTIONS[(idx + 1) % OPTIONS.length].value);
        }} />
      </div>
    </div>
  );
}
