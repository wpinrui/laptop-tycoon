import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper, BarChart3, Package, Star, Users } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { useNavigation } from "../../navigation/NavigationContext";
import { tokens } from "../../shell/tokens";
import { MenuButton } from "../../shell/MenuButton";
import { OUTLETS, NewsItem, NewsOutletId, NewsBody, NewsCategory } from "../../../simulation/newsTypes";
import { formatCash, formatNumber, QUARTER_LABELS } from "../../utils/formatCash";
import { reviewScoreColor } from "../../utils/reviewScoreColor";

const CLIPPING_MAX_WIDTH = 680;

// ─── Outlet Publication Styles ──────────────────────────────

/** Each outlet gets a distinct "newspaper" visual identity. */
interface PublicationStyle {
  background: string;
  accentColor: string;
  headlineFont: string;
  headlineColor: string;
  headlineStyle?: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  mastheadSize: number;
}

const PUBLICATION_STYLES: Record<NewsOutletId, PublicationStyle> = {
  techbuzz: {
    background: "#f0ebe0",
    accentColor: "#29b6f6",
    headlineFont: "Georgia, 'Times New Roman', serif",
    headlineColor: "#1a1a1a",
    textColor: "#1a1a1a",
    mutedColor: "#555",
    borderColor: "#d4cfc4",
    mastheadSize: 32,
  },
  siliconStandard: {
    background: "#ece7da",
    accentColor: "#8b2332",
    headlineFont: "Georgia, 'Times New Roman', serif",
    headlineColor: "#1a1a1a",
    headlineStyle: "italic",
    textColor: "#1a1a1a",
    mutedColor: "#555",
    borderColor: "#c4bfb4",
    mastheadSize: 28,
  },
  consumerWeekly: {
    background: "#ffffff",
    accentColor: "#2e7d32",
    headlineFont: tokens.font.family,
    headlineColor: "#1a1a1a",
    textColor: "#333",
    mutedColor: "#666",
    borderColor: "#ddd",
    mastheadSize: 28,
  },
};

// ─── Clipping Styles ────────────────────────────────────────

function clippingContainerStyle(pub: PublicationStyle): CSSProperties {
  return {
    background: pub.background,
    border: `1px solid ${pub.borderColor}`,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.xl,
    maxWidth: CLIPPING_MAX_WIDTH,
    width: "100%",
    color: pub.textColor,
  };
}

function mastheadStyle(pub: PublicationStyle): CSSProperties {
  return {
    fontFamily: pub.headlineFont,
    fontSize: pub.mastheadSize,
    fontWeight: 700,
    color: pub.accentColor,
    borderBottom: `2px solid ${pub.accentColor}`,
    paddingBottom: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  };
}

function headlineTextStyle(pub: PublicationStyle): CSSProperties {
  return {
    fontFamily: pub.headlineFont,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.3,
    color: pub.headlineColor,
    fontStyle: pub.headlineStyle ?? "normal",
    margin: `${tokens.spacing.md}px 0`,
  };
}

// ─── Body Renderers ─────────────────────────────────────────

function LaunchBody({ body, pub }: { body: Extract<NewsBody, { type: "productLaunch" }>; pub: PublicationStyle }) {
  return (
    <div style={{ marginTop: tokens.spacing.md }}>
      <div style={{ display: "flex", gap: tokens.spacing.xl, flexWrap: "wrap", marginBottom: tokens.spacing.sm }}>
        <Spec label="Screen" value={`${body.screenSize}"`} pub={pub} />
        <Spec label="Price" value={formatCash(body.price)} pub={pub} />
        <Spec label="By" value={body.companyName} pub={pub} />
      </div>
      {body.pressQuotes && body.pressQuotes.length > 0 && (
        <div style={{ borderLeft: `3px solid ${pub.accentColor}`, paddingLeft: tokens.spacing.md, marginTop: tokens.spacing.md }}>
          {body.pressQuotes.map((q, i) => (
            <p key={i} style={{ fontStyle: "italic", color: pub.mutedColor, margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeBase, lineHeight: 1.5 }}>
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewClippingBody({ body, pub }: { body: Extract<NewsBody, { type: "review" }>; pub: PublicationStyle }) {
  const scoreColor = reviewScoreColor(body.score);
  return (
    <div style={{ marginTop: tokens.spacing.md }}>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: scoreColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, color: "#fff",
        }}>
          {body.score}
        </div>
        <div>
          <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600, color: pub.headlineColor }}>{body.laptopName}</div>
          <div style={{ fontSize: tokens.font.sizeSmall, color: pub.mutedColor }}>Reviewed by {body.outlet}</div>
        </div>
      </div>
      {body.sentences.length > 0 && (
        <div style={{ borderTop: `1px solid ${pub.borderColor}`, paddingTop: tokens.spacing.sm }}>
          {body.sentences.map((s, i) => (
            <p key={i} style={{ color: pub.mutedColor, margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeBase, lineHeight: 1.5 }}>
              {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, pub }: { label: string; value: string; pub: PublicationStyle }) {
  return (
    <div>
      <div style={{ fontSize: tokens.font.sizeSmall, color: pub.mutedColor, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600, color: pub.headlineColor }}>{value}</div>
    </div>
  );
}

function GenericBody({ item, pub }: { item: NewsItem; pub: PublicationStyle }) {
  if (!item.body) return null;
  switch (item.body.type) {
    case "productLaunch":
      return <LaunchBody body={item.body} pub={pub} />;
    case "review":
      return <ReviewClippingBody body={item.body} pub={pub} />;
    default:
      return null;
  }
}

// ─── Category Icon ──────────────────────────────────────────

function CategoryBadge({ category, pub }: { category: NewsCategory; pub: PublicationStyle }) {
  const icon = category === "productLaunch" ? <Package size={14} /> : category === "componentLaunch" ? <Package size={14} /> : category === "review" ? <Star size={14} /> : <Newspaper size={14} />;
  const label = category === "productLaunch" ? "Product Launch" : category === "componentLaunch" ? "New Hardware" : category === "review" ? "Review" : "News";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: tokens.font.sizeSmall, color: pub.accentColor, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: 0.8,
    }}>
      {icon} {label}
    </span>
  );
}

// ─── Newspaper Clipping ─────────────────────────────────────

function NewspaperClipping({ item }: { item: NewsItem }) {
  const outlet = OUTLETS[item.outlet];
  const pub = PUBLICATION_STYLES[item.outlet];

  return (
    <div style={clippingContainerStyle(pub)}>
      <div style={mastheadStyle(pub)}>
        <span>{outlet.name}</span>
        <span style={{ fontSize: tokens.font.sizeSmall, fontWeight: 400, color: pub.mutedColor }}>
          Q{item.quarter} {item.year}
        </span>
      </div>
      <CategoryBadge category={item.category} pub={pub} />
      <h2 style={headlineTextStyle(pub)}>{item.headline}</h2>
      {item.subheadline && (
        <p style={{ fontSize: tokens.font.sizeBase, color: pub.mutedColor, lineHeight: 1.5, margin: 0 }}>
          {item.subheadline}
        </p>
      )}
      <GenericBody item={item} pub={pub} />
    </div>
  );
}

// ─── Market Snapshot Slide ──────────────────────────────────

function MarketSnapshot() {
  const { state } = useGame();
  const player = getPlayerCompany(state);

  const activeModels = player.models.filter((m) => m.status === "manufacturing" || m.status === "onSale");
  const totalInventory = activeModels.reduce((s, m) => s + m.unitsInStock, 0);
  const competitorCount = state.companies.filter((c) => !c.isPlayer).length;
  const competitorModels = state.companies
    .filter((c) => !c.isPlayer)
    .reduce((s, c) => s + c.models.filter((m) => m.unitsInStock > 0 || m.yearDesigned === state.year).length, 0);

  const stats = [
    { label: "Your Models", value: String(activeModels.length), icon: <Package size={18} /> },
    { label: "Inventory", value: formatNumber(totalInventory), icon: <BarChart3 size={18} /> },
    { label: "Competitors", value: String(competitorCount), icon: <Users size={18} /> },
    { label: "Competing Models", value: String(competitorModels), icon: <Star size={18} /> },
  ];

  return (
    <div style={{
      background: tokens.colors.cardBg,
      border: `1px solid ${tokens.colors.panelBorder}`,
      borderRadius: tokens.borderRadius.md,
      padding: tokens.spacing.xl,
      maxWidth: CLIPPING_MAX_WIDTH,
      width: "100%",
      color: tokens.colors.text,
    }}>
      <div style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700, marginBottom: tokens.spacing.lg, textAlign: "center" }}>
        Market Snapshot
      </div>
      <div style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, textAlign: "center", marginBottom: tokens.spacing.lg }}>
        {QUARTER_LABELS[state.quarter - 1]} {state.year} — Here&apos;s where things stand.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacing.md }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: tokens.colors.surface,
            borderRadius: tokens.borderRadius.sm,
            padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing.xs,
          }}>
            <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              {s.icon} {s.label}
            </span>
            <span style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700, color: tokens.colors.text }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {activeModels.length > 0 && (
        <div style={{ marginTop: tokens.spacing.lg }}>
          <div style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, marginBottom: tokens.spacing.sm }}>Your Lineup</div>
          {activeModels.map((m) => (
            <div key={m.design.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: `${tokens.spacing.sm}px 0`,
              borderBottom: `1px solid ${tokens.colors.surface}`,
              fontSize: tokens.font.sizeBase,
            }}>
              <span>{modelDisplayName(player.name, m.design.name)}</span>
              <span style={{ color: tokens.colors.textMuted }}>
                {formatNumber(m.unitsInStock)} units &middot; {formatCash(m.retailPrice ?? 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Navigation Arrow Button ────────────────────────────────

function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right"; onClick: () => void; disabled: boolean }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "transparent" : tokens.colors.surface,
        border: `1px solid ${disabled ? "transparent" : tokens.colors.panelBorder}`,
        borderRadius: "50%",
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.2 : 0.8,
        transition: "opacity 0.15s, background 0.15s",
        color: tokens.colors.text,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget.style.opacity = "1"); }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget.style.opacity = "0.8"); }}
    >
      <Icon size={24} />
    </button>
  );
}

// ─── Dot Indicator ──────────────────────────────────────────

function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div style={{ display: "flex", gap: tokens.spacing.sm, justifyContent: "center" }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === activeIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === activeIndex ? tokens.colors.accent : tokens.colors.surface,
            transition: "width 0.2s, background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export function PreSimNewsScreen() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const result = state.lastSimulationResult;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Collect pre-sim articles for this quarter: product launches + reviews
  const preSimArticles = useMemo(() => {
    if (!result) return [];
    return state.newsHistory.filter(
      (n) =>
        n.year === result.year &&
        n.quarter === result.quarter &&
        (n.category === "productLaunch" || n.category === "componentLaunch" || n.category === "review"),
    );
  }, [state.newsHistory, result]);

  // Total slides = articles + market snapshot
  const totalSlides = preSimArticles.length + 1;
  const isLastSlide = currentSlide === totalSlides - 1;

  const goNext = useCallback(() => {
    setCurrentSlide((i) => Math.min(i + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlide((i) => Math.max(i - 1, 0));
  }, []);

  // Navigate to the sim ticker animation
  const proceed = useCallback(() => {
    if (!result) return;
    navigateTo("simTicker");
  }, [result, navigateTo]);

  // Keyboard navigation — skip if a button/link is focused to avoid double-firing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "Enter" && (tag === "BUTTON" || tag === "A")) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLastSlide) {
          proceed();
        } else {
          goNext();
        }
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, isLastSlide, proceed]);

  // Skip to results if there are no articles (quiet quarter)
  if (preSimArticles.length === 0) {
    return (
      <div style={screenStyle}>
        <div style={centeredColumn}>
          <MarketSnapshot />
          <div style={{ marginTop: tokens.spacing.lg, width: "100%", maxWidth: CLIPPING_MAX_WIDTH }}>
            <MenuButton variant="accent" onClick={proceed} style={{ width: "100%" }}>
              Start Simulation
            </MenuButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={screenStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
          {QUARTER_LABELS[state.quarter - 1]} {state.year} — The News
        </span>
        <button
          onClick={proceed}
          style={{
            background: "none", border: "none", color: tokens.colors.textMuted,
            cursor: "pointer", fontSize: tokens.font.sizeBase, textDecoration: "underline",
            fontFamily: tokens.font.family,
          }}
        >
          Skip to simulation &rarr;
        </button>
      </div>

      {/* Carousel area */}
      <div style={carouselAreaStyle}>
        <ArrowButton direction="left" onClick={goPrev} disabled={currentSlide === 0} />

        <div style={slideContainerStyle}>
          {preSimArticles.map((article, i) => (
            <div
              key={article.id}
              style={{
                display: i === currentSlide ? "flex" : "none",
                justifyContent: "center",
                animation: i === currentSlide ? "clipFadeIn 0.3s ease-out" : undefined,
              }}
            >
              <NewspaperClipping item={article} />
            </div>
          ))}
          {/* Market snapshot = last slide */}
          <div
            style={{
              display: isLastSlide ? "flex" : "none",
              justifyContent: "center",
              animation: isLastSlide ? "clipFadeIn 0.3s ease-out" : undefined,
            }}
          >
            <MarketSnapshot />
          </div>
        </div>

        <ArrowButton direction="right" onClick={isLastSlide ? proceed : goNext} disabled={false} />
      </div>

      {/* Dots + action */}
      <div style={footerStyle}>
        <DotIndicator count={totalSlides} activeIndex={currentSlide} />
        <div style={{ marginTop: tokens.spacing.md, width: "100%", maxWidth: CLIPPING_MAX_WIDTH }}>
          {isLastSlide ? (
            <MenuButton variant="accent" onClick={proceed} style={{ width: "100%" }}>
              Start Simulation
            </MenuButton>
          ) : (
            <div style={{ textAlign: "center", color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase }}>
              {currentSlide + 1} of {totalSlides}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inject keyframe animation ──────────────────────────────

const KEYFRAME_CSS = `
@keyframes clipFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

(function injectKeyframes() {
  if (typeof document === "undefined") return;
  const id = "presim-news-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = KEYFRAME_CSS;
  document.head.appendChild(style);
})();

// ─── Layout Styles ──────────────────────────────────────────

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

const carouselAreaStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: tokens.spacing.lg,
  padding: `0 ${tokens.spacing.xl}px`,
  minHeight: 0,
  overflow: "hidden",
};

const slideContainerStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  maxHeight: "100%",
  overflow: "auto",
};

const footerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: `${tokens.spacing.md}px ${tokens.spacing.xl}px ${tokens.spacing.lg}px`,
  flexShrink: 0,
};

const centeredColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  padding: tokens.spacing.xl,
};
