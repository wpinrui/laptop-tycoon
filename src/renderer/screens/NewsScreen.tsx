import { CSSProperties, useMemo } from "react";
import { Newspaper } from "lucide-react";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { OUTLETS, NewsItem, NewsOutletId, NewsBody } from "../../simulation/newsTypes";
import { formatCash } from "../utils/formatCash";
import { reviewScoreColor } from "../utils/reviewScoreColor";

// ─── Outlet Accent Colors ────────────────────────────────────

const OUTLET_COLORS: Record<NewsOutletId, string> = {
  techbuzz: "#29b6f6",        // electric blue
  siliconStandard: "#ffb74d", // warm amber
  consumerWeekly: "#66bb6a",  // friendly green
};

// ─── Layout Styles ───────────────────────────────────────────

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  height: tokens.layout.panelHeight,
  width: tokens.layout.panelWidth,
};

const scrollBody: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
};

// ─── Quarter Group Header ────────────────────────────────────

const groupHeaderStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  color: tokens.colors.text,
  padding: `${tokens.spacing.md}px 0`,
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  background: tokens.colors.background,
};

const groupLineStyle: CSSProperties = {
  flex: 1,
  height: 1,
  background: tokens.colors.panelBorder,
};

// ─── Article Card ────────────────────────────────────────────

function articleCardStyle(outletId: NewsOutletId): CSSProperties {
  return {
    background: tokens.colors.cardBg,
    border: `1px solid ${tokens.colors.panelBorder}`,
    borderLeft: `3px solid ${OUTLET_COLORS[outletId]}`,
    borderRadius: tokens.borderRadius.md,
    padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    marginBottom: tokens.spacing.md,
  };
}

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: tokens.spacing.sm,
};

const headlineStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  color: tokens.colors.text,
  lineHeight: 1.4,
  margin: 0,
};

const subheadlineStyle: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.textMuted,
  margin: `${tokens.spacing.xs}px 0 0`,
  lineHeight: 1.4,
};

// ─── Body Styles ─────────────────────────────────────────────

const bodyContainerStyle: CSSProperties = {
  marginTop: tokens.spacing.md,
  padding: tokens.spacing.md,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.sm,
};

const specRowStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  flexWrap: "wrap",
};

const specItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const specLabelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const specValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  fontWeight: 600,
  color: tokens.colors.text,
};

const scoreBadgeBg = "rgba(255, 255, 255, 0.06)";

// ─── Shared Components ───────────────────────────────────────

function SpecItem({ label, value, color, fontWeight }: { label: string; value: string; color?: string; fontWeight?: number }) {
  return (
    <div style={specItemStyle}>
      <span style={specLabelStyle}>{label}</span>
      <span style={{ ...specValueStyle, ...(color ? { color } : {}), ...(fontWeight != null ? { fontWeight } : {}) }}>{value}</span>
    </div>
  );
}

// ─── Body Renderers ──────────────────────────────────────────

function ProductLaunchBody({ body }: { body: Extract<NewsBody, { type: "productLaunch" }> }) {
  return (
    <div style={bodyContainerStyle}>
      <div style={specRowStyle}>
        <SpecItem label="Model" value={body.modelName} />
        <SpecItem label="Screen" value={`${body.screenSize}"`} />
        <SpecItem label="Price" value={formatCash(body.price)} color={tokens.colors.statusCash} />
      </div>
      {body.pressQuotes && body.pressQuotes.length > 0 && (
        <div style={{ marginTop: tokens.spacing.sm }}>
          {body.pressQuotes.map((quote, i) => (
            <p key={i} style={{ margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, fontStyle: "italic" }}>
              "{quote}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancialBody({ body }: { body: Extract<NewsBody, { type: "financial" }> }) {
  return (
    <div style={bodyContainerStyle}>
      <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: tokens.colors.success }}>
        {body.milestoneTitle}
      </span>
    </div>
  );
}

function MarketShareBody({ body }: { body: Extract<NewsBody, { type: "marketShare" }> }) {
  return (
    <div style={bodyContainerStyle}>
      <div style={specRowStyle}>
        <SpecItem label="Demographic" value={body.demographic} />
        <SpecItem label="Market Share" value={`${Math.round(body.share * 100)}%`} color={tokens.colors.accent} />
      </div>
    </div>
  );
}

function PerceptionBody({ body }: { body: Extract<NewsBody, { type: "perception" }> }) {
  const isUp = body.direction === "up";
  const color = isUp ? tokens.colors.success : tokens.colors.danger;
  const arrow = isUp ? "\u2191" : "\u2193";
  const delta = `${arrow} ${body.delta > 0 ? "+" : ""}${body.delta.toFixed(1)}`;
  return (
    <div style={bodyContainerStyle}>
      <div style={specRowStyle}>
        <SpecItem label="Demographic" value={body.demographic} />
        <SpecItem label="Change" value={delta} color={color} />
      </div>
    </div>
  );
}

function ReviewBody({ body }: { body: Extract<NewsBody, { type: "review" }> }) {
  const scoreColor = reviewScoreColor(body.score);
  return (
    <div style={bodyContainerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.md, marginBottom: body.sentences.length > 0 ? tokens.spacing.sm : 0 }}>
        <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: scoreColor, background: scoreBadgeBg, padding: "4px 12px", borderRadius: tokens.borderRadius.sm }}>
          {body.score}/10
        </span>
        <span style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.text, fontWeight: 500 }}>{body.laptopName}</span>
      </div>
      {body.sentences.map((s, i) => (
        <p key={i} style={{ margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
          {s}
        </p>
      ))}
    </div>
  );
}

function AwardBody({ body }: { body: Extract<NewsBody, { type: "award" }> }) {
  return (
    <div style={bodyContainerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.md }}>
        <SpecItem label="Category" value={body.category} color={tokens.colors.statusCash} />
        <SpecItem label="Winner" value={`${body.winnerName} (${body.ownerName})`} />
        {body.runnerUpName && (
          <SpecItem label="Runner-up" value={body.runnerUpName} color={tokens.colors.textMuted} fontWeight={400} />
        )}
      </div>
    </div>
  );
}

function NewsBodyRenderer({ body }: { body: NewsBody }) {
  switch (body.type) {
    case "productLaunch":
      return <ProductLaunchBody body={body} />;
    case "financial":
      return <FinancialBody body={body} />;
    case "marketShare":
      return <MarketShareBody body={body} />;
    case "perception":
      return <PerceptionBody body={body} />;
    case "review":
      return <ReviewBody body={body} />;
    case "award":
      return <AwardBody body={body} />;
    default: {
      const _exhaustive: never = body;
      return _exhaustive;
    }
  }
}

// ─── Article Card Component ──────────────────────────────────

function ArticleCard({ item }: { item: NewsItem }) {
  const outlet = OUTLETS[item.outlet];
  const accentColor = OUTLET_COLORS[item.outlet];

  return (
    <div style={articleCardStyle(item.outlet)}>
      {/* Header: outlet + time */}
      <div style={cardHeaderStyle}>
        <div>
          <span style={{ fontSize: tokens.font.sizeBase, fontWeight: 600, color: accentColor }}>{outlet.name}</span>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginLeft: tokens.spacing.sm }}>{outlet.tagline}</span>
        </div>
        <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, flexShrink: 0, marginLeft: tokens.spacing.md }}>
          Q{item.quarter} {item.year}
        </span>
      </div>

      {/* Headline */}
      <p style={headlineStyle}>{item.headline}</p>

      {/* Subheadline */}
      {item.subheadline && <p style={subheadlineStyle}>{item.subheadline}</p>}

      {/* Body */}
      {item.body && <NewsBodyRenderer body={item.body} />}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function NewsScreen() {
  const { state } = useGame();
  const newsHistory = state.newsHistory;

  // Group by quarter, most recent first
  const grouped = useMemo(() => {
    const map = new Map<string, NewsItem[]>();
    for (const item of newsHistory) {
      const key = `${item.year}-Q${item.quarter}`;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    // Sort groups: most recent first (year desc, then quarter desc)
    return [...map.entries()].sort((a, b) => {
      const [aYear, aQ] = a[0].split("-Q").map(Number);
      const [bYear, bQ] = b[0].split("-Q").map(Number);
      return bYear - aYear || bQ - aQ;
    });
  }, [newsHistory]);

  if (newsHistory.length === 0) {
    return (
      <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
        <ScreenHeader title="News" icon={Newspaper} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: tokens.colors.textMuted, fontStyle: "italic", fontSize: tokens.font.sizeBase }}>
            No news yet. Simulate your first quarter to generate headlines.
          </p>
        </div>
        <StatusBar />
      </ContentPanel>
    );
  }

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
      <ScreenHeader title="News" icon={Newspaper} />
      <div className="content-panel hide-scrollbar" style={scrollBody}>
        {grouped.map(([key, items]) => {
          const [year, q] = key.split("-Q");
          return (
            <div key={key}>
              <div style={groupHeaderStyle}>
                Q{q} {year}
                <span style={groupLineStyle} />
              </div>
              {items.map((item) => (
                <ArticleCard key={item.id} item={item} />
              ))}
            </div>
          );
        })}
        <div style={{ height: tokens.spacing.xl }} />
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
