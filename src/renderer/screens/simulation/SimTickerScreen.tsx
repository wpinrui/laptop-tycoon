import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SkipForward, X } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { useNavigation } from "../../navigation/NavigationContext";
import { tokens } from "../../shell/tokens";
import { MenuButton } from "../../shell/MenuButton";
import { formatCash, formatNumber, QUARTER_LABELS } from "../../utils/formatCash";
import { LaptopSalesResult, QuarterSimulationResult } from "../../../simulation/salesTypes";
import { determineAwards } from "../../../simulation/reviewsAwards";
import { generateTickerHeadlines, MAX_COMPETITOR_MODELS, TickerHeadline } from "./tickerHeadlines";

/** Aggregate laptop sales results across all quarters for award determination. */
function aggregateLaptopResults(quarters: QuarterSimulationResult[]): LaptopSalesResult[] {
  const map = new Map<string, LaptopSalesResult>();
  for (const q of quarters) {
    for (const lr of q.laptopResults) {
      const existing = map.get(lr.laptopId);
      if (existing) {
        map.set(lr.laptopId, {
          ...existing,
          unitsDemanded: existing.unitsDemanded + lr.unitsDemanded,
          unitsSold: existing.unitsSold + lr.unitsSold,
          revenue: existing.revenue + lr.revenue,
          profit: existing.profit + lr.profit,
          unsoldUnits: lr.unsoldUnits,
        });
      } else {
        map.set(lr.laptopId, { ...lr });
      }
    }
  }
  return Array.from(map.values());
}

const DURATION_MS = 12_000;

/** Ease-out cubic: fast start, slow finish. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Convert (year, quarter, progress 0–1) to a full calendar date string like "January 22, 2027". */
function quarterProgressToDate(year: number, quarter: number, progress: number): string {
  const quarterStartMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
  const startMonth = quarterStartMonths[quarter - 1];
  const startDate = new Date(year, startMonth, 1);
  const dayOffset = Math.round(progress * 90);
  const current = new Date(startDate.getTime() + dayOffset * 86_400_000);
  return current.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Outlet name by headline type ────────────────────────────

const HEADLINE_OUTLET: Record<TickerHeadline["type"], string> = {
  milestone: "TechBuzz",
  sellout: "TechBuzz",
  trend: "The Silicon Standard",
  perception: "Consumer Weekly",
};

// ─── Animated Counter ────────────────────────────────────────

function AnimatedValue({ value, from = 0, progress, format }: { value: number; from?: number; progress: number; format: (n: number) => string }) {
  const current = from + (value - from) * easeOutCubic(progress);
  return <>{format(current)}</>;
}

// ─── Sales Bar ───────────────────────────────────────────────

interface SalesBarProps {
  label: string;
  retailPrice: number;
  unitsSold: number;
  capacity: number;
  maxUnits: number;
  unsoldUnits: number;
  progress: number;
  isPlayer: boolean;
}

function SalesBar({ label, retailPrice, unitsSold, capacity, maxUnits, unsoldUnits, progress, isPlayer }: SalesBarProps) {
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
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.spacing.sm, minWidth: 0 }}>
          <span style={{
            fontSize: tokens.font.sizeBase,
            fontWeight: isPlayer ? 600 : 400,
            color: isPlayer ? tokens.colors.text : tokens.colors.textMuted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {label}
          </span>
          <span style={{
            fontSize: tokens.font.sizeSmall,
            color: tokens.colors.textMuted,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {formatCash(retailPrice)}
          </span>
        </div>
        <span style={{
          fontSize: tokens.font.sizeSmall,
          color: tokens.colors.textMuted,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          flexShrink: 0,
          marginLeft: tokens.spacing.sm,
        }}>
          {formatNumber(currentUnits)} / {formatNumber(capacity)} sold
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

function HeadlineToast({
  headline,
  onClick,
}: {
  headline: TickerHeadline;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.colors.cardBg,
        border: `1px solid ${tokens.colors.panelBorder}`,
        borderLeft: `3px solid ${HEADLINE_TYPE_COLOR[headline.type]}`,
        borderRadius: tokens.borderRadius.sm,
        padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
        fontSize: tokens.font.sizeBase,
        color: tokens.colors.text,
        animation: "toastSlideIn 0.4s ease-out",
        cursor: "pointer",
      }}
    >
      {headline.text}
    </div>
  );
}

// ─── Headline Article Overlay ─────────────────────────────────

function HeadlineOverlay({ headline, onClose }: { headline: TickerHeadline; onClose: () => void }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    }}>
      <div style={{
        background: tokens.colors.cardBg,
        border: `1px solid ${tokens.colors.panelBorder}`,
        borderRadius: tokens.borderRadius.md,
        padding: tokens.spacing.xl,
        maxWidth: 560,
        width: "90%",
        position: "relative",
      }}>
        {/* Outlet header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: tokens.spacing.md,
        }}>
          <span style={{
            fontSize: tokens.font.sizeSmall,
            fontWeight: 600,
            color: HEADLINE_TYPE_COLOR[headline.type],
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}>
            {HEADLINE_OUTLET[headline.type]}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: tokens.colors.textMuted,
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Headline */}
        <h2 style={{
          margin: 0,
          fontSize: tokens.font.sizeLarge,
          fontWeight: 700,
          color: tokens.colors.text,
          lineHeight: 1.35,
          marginBottom: tokens.spacing.md,
        }}>
          {headline.text}
        </h2>

        {/* Body */}
        <p style={{
          margin: 0,
          fontSize: tokens.font.sizeBase,
          color: tokens.colors.textMuted,
          lineHeight: 1.6,
        }}>
          {overlayBodyText(headline)}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: tokens.spacing.lg,
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
          Close (resume)
        </button>
      </div>
    </div>
  );
}

function overlayBodyText(h: TickerHeadline): string {
  switch (h.type) {
    case "milestone":
      return "Sales momentum continues to build as the quarter progresses. Analysts note strong consumer interest and healthy inventory turnover. The numbers tell a compelling story.";
    case "sellout":
      return "Demand outpaced supply this quarter. Retailers report empty shelves and frustrated buyers, a clear sign that production targets may need to be revisited heading into next quarter.";
    case "trend":
      return "Market data reveals clear winner-take-most dynamics across buyer segments this quarter. Brands that aligned their value proposition with this segment's priorities saw outsized returns.";
    case "perception":
      return "Brand sentiment tracking shows a measurable shift in how consumers view the company. Word of mouth, review coverage, and product availability all play a role in shaping perception over time.";
  }
}

// ─── Date Progress Bar ───────────────────────────────────────

function DateProgressBar({ progress, quarter, year }: { progress: number; quarter: number; year: number }) {
  const dateLabel = quarterProgressToDate(year, quarter, progress);

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: tokens.spacing.xs,
        fontSize: tokens.font.sizeSmall,
        color: tokens.colors.textMuted,
      }}>
        <span>{dateLabel}</span>
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

// ─── KPI Strip ────────────────────────────────────────────────

function KpiStrip({ revenue, cash, cashBefore, progress }: {
  revenue: number;
  cash: number;
  cashBefore: number;
  progress: number;
}) {
  return (
    <div style={{
      display: "flex",
      gap: tokens.spacing.xl,
      justifyContent: "center",
      background: tokens.colors.cardBg,
      border: `1px solid ${tokens.colors.panelBorder}`,
      borderRadius: tokens.borderRadius.md,
      padding: `${tokens.spacing.md}px ${tokens.spacing.xl}px`,
    }}>
      <KpiItem label="Revenue" color={tokens.colors.success}>
        <AnimatedValue value={revenue} progress={progress} format={(n) => formatCash(Math.round(n))} />
      </KpiItem>
      <KpiItem label="Cash on Hand" color={tokens.colors.statusCash}>
        <AnimatedValue value={cash} from={cashBefore} progress={progress} format={(n) => formatCash(Math.round(n))} />
      </KpiItem>
    </div>
  );
}

function KpiItem({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: tokens.font.sizeTitle,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Group Label ──────────────────────────────────────────────

function GroupLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: tokens.font.sizeSmall,
      fontWeight: 600,
      color: tokens.colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: tokens.spacing.sm,
      marginTop: tokens.spacing.md,
    }}>
      {text}
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export function SimTickerScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const result = state.lastSimulationResult;
  const player = getPlayerCompany(state);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibleHeadlines, setVisibleHeadlines] = useState<TickerHeadline[]>([]);
  const [overlayHeadline, setOverlayHeadline] = useState<TickerHeadline | null>(null);
  const triggeredRef = useRef(new Set<number>());
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);
  const rafRef = useRef<number>(0);
  const progressRef = useRef(0);

  const headlines = useMemo(() => {
    if (!result) return [];
    return generateTickerHeadlines(state, result);
  }, [state, result]);

  // All sales results sorted: player first (by units desc), then competitors (by units desc)
  const sortedPlayerResults = useMemo(() => {
    if (!result) return [];
    return result.playerResults.slice().sort((a, b) => b.unitsSold - a.unitsSold);
  }, [result]);

  const sortedCompResults = useMemo(() => {
    if (!result) return [];
    return result.laptopResults
      .filter((lr) => lr.owner !== player.id)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, MAX_COMPETITOR_MODELS);
  }, [result, player.id]);

  const allSortedResults = useMemo(() => [...sortedPlayerResults, ...sortedCompResults], [sortedPlayerResults, sortedCompResults]);

  const maxUnits = useMemo(() => {
    if (allSortedResults.length === 0) return 1;
    return Math.max(...allSortedResults.map((lr) => lr.unitsSold), 1);
  }, [allSortedResults]);

  const getModelLabel = useCallback((lr: LaptopSalesResult) => {
    const company = state.companies.find((c) => c.id === lr.owner);
    if (!company) return lr.laptopId;
    const model = company.models.find((m) => m.design.id === lr.laptopId);
    if (!model) return lr.laptopId;
    return modelDisplayName(company.name, model.design.name);
  }, [state.companies]);

  const isOverlayOpen = overlayHeadline !== null;

  // RAF animation loop — paused when overlay is open
  useEffect(() => {
    if (done || paused || isOverlayOpen || !result) return;

    function tick(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current;
      }
      const elapsed = timestamp - startTimeRef.current;
      const p = Math.min(elapsed / DURATION_MS, 1);
      progressRef.current = p;
      setProgress(p);

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
  }, [done, paused, isOverlayOpen, result, headlines]);

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

  const openOverlay = useCallback((h: TickerHeadline) => {
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = progress * DURATION_MS;
    startTimeRef.current = null;
    setOverlayHeadline(h);
  }, [progress]);

  const closeOverlay = useCallback(() => {
    pausedAtRef.current = progressRef.current * DURATION_MS;
    startTimeRef.current = null;
    setOverlayHeadline(null);
  }, []);

  const proceed = useCallback(() => {
    if (!result) return;
    if (result.quarter === 4) {
      const yearLaptopResults = aggregateLaptopResults(state.quarterHistory);
      const awards = determineAwards(state, yearLaptopResults);
      dispatch({ type: "SET_AWARDS", awards });

      if (result.cashAfterResolution < 0) {
        navigateTo("gameOver");
      } else {
        navigateTo("yearEndSummary");
      }
    } else {
      navigateTo("quarterlySummary");
    }
  }, [result, state, dispatch, navigateTo]);

  // Keyboard: Space to pause/resume, Enter/Escape to skip or proceed
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isOverlayOpen) {
        if (e.key === "Escape" || e.key === "Enter") closeOverlay();
        return;
      }
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
  }, [done, paused, isOverlayOpen, handlePause, handleResume, handleSkip, proceed, closeOverlay]);

  if (!result) return null;

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

      {/* Centered single column */}
      <div style={columnStyle}>
        {/* Date progress */}
        <DateProgressBar progress={progress} quarter={result.quarter} year={result.year} />

        {/* Sales bars */}
        <div style={{ marginTop: tokens.spacing.lg }}>
          {sortedPlayerResults.length > 0 && (
            <>
              <GroupLabel text="Your Models" />
              {sortedPlayerResults.map((lr) => (
                <SalesBar
                  key={lr.laptopId}
                  label={getModelLabel(lr)}
                  retailPrice={lr.retailPrice}
                  unitsSold={lr.unitsSold}
                  capacity={lr.unitsSold + lr.unsoldUnits}
                  maxUnits={maxUnits}
                  unsoldUnits={lr.unsoldUnits}
                  progress={progress}
                  isPlayer
                />
              ))}
            </>
          )}
          {sortedCompResults.length > 0 && (
            <>
              <GroupLabel text="Competitors" />
              {sortedCompResults.map((lr) => (
                <SalesBar
                  key={lr.laptopId}
                  label={getModelLabel(lr)}
                  retailPrice={lr.retailPrice}
                  unitsSold={lr.unitsSold}
                  capacity={lr.unitsSold + lr.unsoldUnits}
                  maxUnits={maxUnits}
                  unsoldUnits={lr.unsoldUnits}
                  progress={progress}
                  isPlayer={false}
                />
              ))}
            </>
          )}
          {allSortedResults.length === 0 && (
            <div style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase }}>
              No models on sale this quarter.
            </div>
          )}
        </div>

        {/* KPI Strip */}
        <div style={{ marginTop: tokens.spacing.lg }}>
          <KpiStrip
            revenue={result.totalRevenue}
            cash={result.cashAfterResolution}
            cashBefore={cashBefore}
            progress={progress}
          />
        </div>

        {/* Headlines */}
        {visibleHeadlines.length > 0 && (
          <div style={{
            marginTop: tokens.spacing.md,
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing.sm,
          }}>
            {visibleHeadlines.map((h) => (
              <HeadlineToast
                key={h.triggerAt}
                headline={h}
                onClick={() => openOverlay(h)}
              />
            ))}
          </div>
        )}
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

      {/* Headline article overlay */}
      {overlayHeadline && (
        <HeadlineOverlay headline={overlayHeadline} onClose={closeOverlay} />
      )}
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

const columnStyle: CSSProperties = {
  flex: 1,
  maxWidth: 900,
  width: "100%",
  margin: "0 auto",
  padding: `0 ${tokens.spacing.xl}px`,
  overflowY: "auto",
  overflowX: "hidden",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: `${tokens.spacing.md}px ${tokens.spacing.xl}px ${tokens.spacing.lg}px`,
  flexShrink: 0,
};
