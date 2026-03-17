import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SkipForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { useNavigation } from "../../navigation/NavigationContext";
import { tokens } from "../../shell/tokens";
import { MenuButton } from "../../shell/MenuButton";
import { formatCash, formatNumber, QUARTER_LABELS } from "../../utils/formatCash";
import { LaptopSalesResult } from "../../../simulation/salesTypes";
import { generateTickerHeadlines, MAX_COMPETITOR_MODELS, TickerHeadline } from "./tickerHeadlines";

const DURATION_MS = 12_000;
const TOAST_DISPLAY_MS = 4_500;
const TOAST_EXIT_MS = 500;

/** Ease-out cubic: fast start, slow finish. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Animated Counter ────────────────────────────────────────

function AnimatedValue({ value, from = 0, progress, format }: { value: number; from?: number; progress: number; format: (n: number) => string }) {
  const current = from + (value - from) * easeOutCubic(progress);
  return <>{format(current)}</>;
}

// ─── Sales Bar ───────────────────────────────────────────────

interface SalesBarProps {
  label: string;
  unitsSold: number;
  maxUnits: number;
  unsoldUnits: number;
  progress: number;
  isPlayer: boolean;
}

function SalesBar({ label, unitsSold, maxUnits, unsoldUnits, progress, isPlayer }: SalesBarProps) {
  const easedProgress = easeOutCubic(progress);
  const currentUnits = Math.round(unitsSold * easedProgress);
  const pct = maxUnits > 0 ? (unitsSold / maxUnits) * easedProgress * 100 : 0;
  const nearSellout = unsoldUnits === 0 && unitsSold > 0 && progress > 0.7;

  return (
    <div style={{ marginBottom: tokens.spacing.sm }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 3,
      }}>
        <span style={{
          fontSize: tokens.font.sizeBase,
          fontWeight: isPlayer ? 600 : 400,
          color: isPlayer ? tokens.colors.text : tokens.colors.textMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "70%",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: tokens.font.sizeSmall,
          color: tokens.colors.textMuted,
          fontVariantNumeric: "tabular-nums",
        }}>
          {formatNumber(currentUnits)} units
        </span>
      </div>
      <div style={{
        height: isPlayer ? 18 : 10,
        background: tokens.colors.surface,
        borderRadius: tokens.borderRadius.sm,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${Math.min(pct, 100)}%`,
          background: nearSellout
            ? tokens.colors.warning
            : isPlayer
              ? tokens.colors.accent
              : "rgba(255, 255, 255, 0.2)",
          borderRadius: tokens.borderRadius.sm,
          transition: "background 0.3s",
        }} />
      </div>
    </div>
  );
}

// ─── Headline Toast ──────────────────────────────────────────

const HEADLINE_TYPE_COLOR: Record<TickerHeadline["type"], string> = {
  milestone: tokens.colors.accent,
  trend: tokens.colors.text,
  sellout: tokens.colors.warning,
  perception: tokens.colors.market,
};

function HeadlineToast({ headline, onDismiss }: { headline: TickerHeadline; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), TOAST_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(onDismiss, TOAST_EXIT_MS);
      return () => clearTimeout(timer);
    }
  }, [exiting, onDismiss]);

  return (
    <div style={{
      background: tokens.colors.cardBg,
      border: `1px solid ${tokens.colors.panelBorder}`,
      borderLeft: `3px solid ${HEADLINE_TYPE_COLOR[headline.type]}`,
      borderRadius: tokens.borderRadius.sm,
      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
      fontSize: tokens.font.sizeBase,
      color: tokens.colors.text,
      animation: exiting ? "toastSlideOut 0.5s ease-in forwards" : "toastSlideIn 0.4s ease-out",
      maxWidth: 480,
    }}>
      {headline.text}
    </div>
  );
}

// ─── Date Progress Bar ───────────────────────────────────────

function DateProgressBar({ progress, quarter, year }: { progress: number; quarter: number; year: number }) {
  const months = [
    ["Jan", "Feb", "Mar"],
    ["Apr", "May", "Jun"],
    ["Jul", "Aug", "Sep"],
    ["Oct", "Nov", "Dec"],
  ];
  const qMonths = months[quarter - 1];
  const monthIdx = Math.min(Math.floor(progress * 3), 2);

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: tokens.spacing.xs,
        fontSize: tokens.font.sizeSmall,
        color: tokens.colors.textMuted,
      }}>
        <span>{QUARTER_LABELS[quarter - 1]} {year}</span>
        <span>{qMonths[monthIdx]}</span>
      </div>
      <div style={{
        height: 6,
        background: tokens.colors.surface,
        borderRadius: 3,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: tokens.colors.accent,
          borderRadius: 3,
          transition: "width 0.1s linear",
        }} />
      </div>
    </div>
  );
}

// ─── KPI Counter ─────────────────────────────────────────────

function KpiCounter({ label, value, from, progress, format, color }: {
  label: string;
  value: number;
  from?: number;
  progress: number;
  format: (n: number) => string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: tokens.font.sizeTitle,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: color ?? tokens.colors.text,
      }}>
        <AnimatedValue value={value} from={from} progress={progress} format={format} />
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export function SimTickerScreen() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const result = state.lastSimulationResult;
  const player = getPlayerCompany(state);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibleHeadlines, setVisibleHeadlines] = useState<TickerHeadline[]>([]);
  const triggeredRef = useRef(new Set<number>());
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);
  const rafRef = useRef<number>(0);

  const headlines = useMemo(() => {
    if (!result) return [];
    return generateTickerHeadlines(state, result);
  }, [state, result]);

  // All sales results sorted: player first (by units desc), then competitors (by units desc)
  const sortedResults = useMemo(() => {
    if (!result) return [];
    const playerResults = result.playerResults.slice().sort((a, b) => b.unitsSold - a.unitsSold);
    const compResults = result.laptopResults
      .filter((lr) => lr.owner !== player.id)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, MAX_COMPETITOR_MODELS);
    return [...playerResults, ...compResults];
  }, [result, player.id]);

  const maxUnits = useMemo(() => {
    if (sortedResults.length === 0) return 1;
    return Math.max(...sortedResults.map((lr) => lr.unitsSold), 1);
  }, [sortedResults]);

  const getModelLabel = useCallback((lr: LaptopSalesResult) => {
    const company = state.companies.find((c) => c.id === lr.owner);
    if (!company) return lr.laptopId;
    const model = company.models.find((m) => m.design.id === lr.laptopId);
    if (!model) return lr.laptopId;
    return modelDisplayName(company.name, model.design.name);
  }, [state.companies]);

  // RAF animation loop
  useEffect(() => {
    if (done || paused || !result) return;

    function tick(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current;
      }
      const elapsed = timestamp - startTimeRef.current;
      const p = Math.min(elapsed / DURATION_MS, 1);
      setProgress(p);

      // Trigger headlines
      for (let i = 0; i < headlines.length; i++) {
        if (p >= headlines[i].triggerAt && !triggeredRef.current.has(i)) {
          triggeredRef.current.add(i);
          setVisibleHeadlines((prev) => [...prev, headlines[i]]);
        }
      }

      if (p >= 1) {
        setDone(true);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done, paused, result, headlines]);

  const handleSkip = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(1);
    setDone(true);
    setVisibleHeadlines([]);
  }, []);

  const handlePause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = progress * DURATION_MS;
    startTimeRef.current = null;
    setPaused(true);
  }, [progress]);

  const handleResume = useCallback(() => {
    setPaused(false);
  }, []);

  const proceed = useCallback(() => {
    if (!result) return;
    if (result.quarter === 4 && result.cashAfterResolution < 0) {
      navigateTo("gameOver");
    } else if (result.quarter === 4) {
      navigateTo("yearEndSummary");
    } else {
      navigateTo("quarterlySummary");
    }
  }, [result, navigateTo]);

  // Keyboard: Space to pause/resume, Enter/Escape to skip
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        if (done) {
          proceed();
        } else if (paused) {
          handleResume();
        } else {
          handlePause();
        }
      } else if (e.key === "Enter" || e.key === "Escape") {
        if (done) {
          proceed();
        } else {
          handleSkip();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [done, paused, handlePause, handleResume, handleSkip, proceed]);

  if (!result) return null;

  const totalUnits = result.playerResults.reduce((s, lr) => s + lr.unitsSold, 0);
  const cashBefore = result.cashAfterResolution - result.totalRevenue + result.marketingCost;

  return (
    <div style={screenStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
          {QUARTER_LABELS[result.quarter - 1]} {result.year} — Simulation
        </span>
        <div style={{ display: "flex", gap: tokens.spacing.md, alignItems: "center" }}>
          {paused && (
            <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.warning }}>
              PAUSED
            </span>
          )}
          {!done && (
            <button
              onClick={handleSkip}
              style={{
                background: "none",
                border: "none",
                color: tokens.colors.textMuted,
                cursor: "pointer",
                fontSize: tokens.font.sizeBase,
                fontFamily: tokens.font.family,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <SkipForward size={16} /> Skip
            </button>
          )}
        </div>
      </div>

      {/* Date progress */}
      <div style={{ padding: `0 ${tokens.spacing.xl}px`, marginBottom: tokens.spacing.lg }}>
        <DateProgressBar progress={progress} quarter={result.quarter} year={result.year} />
      </div>

      {/* Main content: sales bars + KPIs */}
      <div style={contentAreaStyle}>
        {/* Left: Sales bars */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <div style={{
            fontSize: tokens.font.sizeBase,
            fontWeight: 600,
            marginBottom: tokens.spacing.md,
            color: tokens.colors.text,
          }}>
            Sales
          </div>
          {sortedResults.map((lr) => (
            <SalesBar
              key={lr.laptopId}
              label={getModelLabel(lr)}
              unitsSold={lr.unitsSold}
              maxUnits={maxUnits}
              unsoldUnits={lr.unsoldUnits}
              progress={progress}
              isPlayer={lr.owner === player.id}
            />
          ))}
          {sortedResults.length === 0 && (
            <div style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase }}>
              No models on sale this quarter.
            </div>
          )}
        </div>

        {/* Right: KPIs + headlines */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: tokens.spacing.lg }}>
          {/* KPI counters */}
          <div style={{
            background: tokens.colors.cardBg,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.lg,
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing.md,
          }}>
            <KpiCounter
              label="Units Sold"
              value={totalUnits}
              progress={progress}
              format={(n) => formatNumber(Math.round(n))}
            />
            <KpiCounter
              label="Revenue"
              value={result.totalRevenue}
              progress={progress}
              format={(n) => formatCash(Math.round(n))}
              color={tokens.colors.success}
            />
            <KpiCounter
              label="Profit"
              value={result.totalProfit}
              progress={progress}
              format={(n) => formatCash(Math.round(n))}
              color={result.totalProfit >= 0 ? tokens.colors.success : tokens.colors.danger}
            />
            <KpiCounter
              label="Cash"
              value={result.cashAfterResolution}
              from={cashBefore}
              progress={progress}
              format={(n) => formatCash(Math.round(n))}
              color={tokens.colors.statusCash}
            />
          </div>

          {/* Headlines */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing.sm,
            minHeight: 80,
          }}>
            {visibleHeadlines.map((h) => (
              <HeadlineToast
                key={h.triggerAt}
                headline={h}
                onDismiss={() => setVisibleHeadlines((prev) => prev.filter((x) => x !== h))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        {done ? (
          <MenuButton variant="accent" onClick={proceed} style={{ minWidth: 200 }}>
            View Results
          </MenuButton>
        ) : (
          <button
            onClick={paused ? handleResume : handlePause}
            style={{
              background: "none",
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              color: tokens.colors.textMuted,
              cursor: "pointer",
              fontSize: tokens.font.sizeSmall,
              fontFamily: tokens.font.family,
              padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
            }}
          >
            {paused ? "Resume (Space)" : "Pause (Space)"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inject keyframe animations ──────────────────────────────

const KEYFRAME_CSS = `
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toastSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(40px); }
}
`;

(function injectKeyframes() {
  if (typeof document === "undefined") return;
  const id = "sim-ticker-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = KEYFRAME_CSS;
  document.head.appendChild(style);
})();

// ─── Layout Styles ───────────────────────────────────────────

const screenStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  background: tokens.colors.background,
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.spacing.lg}px ${tokens.spacing.xl}px`,
  flexShrink: 0,
};

const contentAreaStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  gap: tokens.spacing.xl,
  padding: `0 ${tokens.spacing.xl}px`,
  minHeight: 0,
  overflow: "hidden",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: `${tokens.spacing.md}px ${tokens.spacing.xl}px ${tokens.spacing.lg}px`,
  flexShrink: 0,
};
