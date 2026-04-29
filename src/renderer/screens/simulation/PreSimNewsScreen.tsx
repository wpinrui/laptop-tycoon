import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper, BarChart3, Package, Star, Users, TrendingUp, Calendar, DollarSign, Megaphone } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { useNavigation } from "../../navigation/NavigationContext";
import { tokens } from "../../shell/tokens";
import { MenuButton } from "../../shell/MenuButton";
import { OUTLETS, NewsItem, NewsOutletId, NewsBody, NewsCategory } from "../../../simulation/newsTypes";
import { formatCash, formatNumber, QUARTER_LABELS } from "../../utils/formatCash";
import { reviewScoreColor } from "../../utils/reviewScoreColor";

const CLIPPING_MAX_WIDTH = 680;

// ─── Helpers ────────────────────────────────────────────────

const QUARTER_PUB_DATES = ["January 3", "April 2", "July 1", "October 4"] as const;

function quarterToDate(year: number, quarter: number): string {
  return `${QUARTER_PUB_DATES[quarter - 1]}, ${year}`;
}

const SEASONAL_LABELS: [string, string, string, string] = [
  "Post-Holiday Slowdown",
  "Spring Recovery",
  "Back-to-School Season",
  "Holiday Peak",
];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Outlet Publication Styles ──────────────────────────────

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

// ─── Editorial Prose Templates ───────────────────────────────

interface EditorialTemplate {
  paragraphs: string[];
}

const EDITORIAL_TEMPLATES: Record<NewsOutletId, EditorialTemplate[]> = {
  techbuzz: [
    {
      paragraphs: [
        "The {modelName} enters a market that's become increasingly competitive over the past few quarters. Buyers are more informed than ever, and {companyName} is banking on a combination of hardware specs and brand credibility to stand out from a crowded field.",
        "At {price}, the pitch is clear: real performance without the flagship premium. Whether that's enough to move units in volume remains to be seen, but on paper this is a serious contender — and first impressions suggest {companyName} has done its homework.",
        "Availability is live now at major retailers. Demand forecasts look encouraging, but inventory will be the key variable. Models in this segment often sell faster than manufacturers expect.",
      ],
    },
    {
      paragraphs: [
        "{companyName} isn't playing it safe with the {modelName}. The company is swinging hard at a segment it sees as underserved, and with a {screenSize}\" screen and {price} price tag, it's putting real skin in the game.",
        "The competitive landscape has shifted significantly in recent quarters. Buyers have more options, and the bar for what counts as 'good enough' keeps rising. {companyName}'s answer seems to be specificity — carving out a niche rather than trying to be everything to everyone.",
        "Launch-day sales will be the first real test. Early signals from retail partners are cautiously optimistic. The brand has goodwill to spend — the question is whether the product can convert interest into purchases.",
      ],
    },
  ],
  siliconStandard: [
    {
      paragraphs: [
        "The announcement of the {modelName} is a calculated move in what has become a fiercely contested market segment. {companyName} enters with a clear value proposition — {price} for a {screenSize}\" form factor — and a strategy that appears designed around volume more than margin.",
        "The competitive context matters here. Pricing pressure across the category has been building for several quarters, and {companyName}'s decision to launch at this price point suggests the company believes it can absorb the margin compression while gaining share.",
        "Longer term, the model's performance will hinge on inventory management and demand conversion. Launch-quarter economics are rarely representative of a product's full lifecycle, but they set important precedents for how the market perceives a brand's pricing strategy.",
      ],
    },
    {
      paragraphs: [
        "{companyName} has been measured in its product launches, and the {modelName} continues that pattern. A {screenSize}\" device at {price} is a defensible position in this market — not aggressive, but not timid either.",
        "From a competitive standpoint, the launch timing is interesting. The segment this product targets has seen steady demand, with buyers generally prioritising value-for-money over headline specifications. {companyName} appears to have calibrated accordingly.",
        "Analysts will be watching sell-through rates closely over the first two quarters. If the {modelName} performs to category averages, it validates the company's pricing thesis. Outperformance would suggest there's room to push further.",
      ],
    },
  ],
  consumerWeekly: [
    {
      paragraphs: [
        "If you've been waiting for a laptop that doesn't ask you to choose between price and practicality, the {modelName} might be worth a look. {companyName} has kept things sensible — {screenSize}\" screen, {price} price tag — and the result is a machine built for real-world use rather than benchmark bragging.",
        "The competition isn't standing still, but {companyName} has thought carefully about who this laptop is for. It's not trying to win every spec sheet comparison. It's trying to make sense to the person buying it.",
        "It's available now if you want to get your hands on one. We'd recommend checking stock at your local retailer — models like this tend to move faster than the release-day buzz suggests.",
      ],
    },
    {
      paragraphs: [
        "Here's a simple way to think about the {modelName}: {companyName} made a laptop for people who need it to work, not just look impressive on spec sheets. At {price} for a {screenSize}\" screen, it's a credible option.",
        "The feature set is tuned for everyday use rather than edge cases. That's a deliberate call, and honestly it's the right one for most buyers who spend their days doing normal things with their laptops.",
        "Should you buy it? That depends on your needs — and your current laptop. But for a first look, this one earns a serious second look. Keep an eye on reviews as they roll in over the coming weeks.",
      ],
    },
  ],
};

function getEditorialTemplate(outlet: NewsOutletId, modelName: string): EditorialTemplate {
  const pool = EDITORIAL_TEMPLATES[outlet];
  return pool[simpleHash(modelName) % pool.length];
}

function interpolateEditorial(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

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

// ─── Drop Cap ────────────────────────────────────────────────

function DropCapParagraph({ text, pub, style }: { text: string; pub: PublicationStyle; style?: CSSProperties }) {
  if (!text) return null;
  const first = text[0];
  const rest = text.slice(1);
  return (
    <p style={{ margin: 0, fontSize: tokens.font.sizeBase, lineHeight: 1.6, color: pub.textColor, ...style }}>
      <span style={{
        float: "left",
        fontSize: 78,
        fontFamily: "Georgia, 'Times New Roman', serif",
        lineHeight: 0.75,
        marginRight: 6,
        marginTop: 4,
        color: pub.accentColor,
        fontWeight: 700,
      }}>
        {first}
      </span>
      {rest}
    </p>
  );
}

// ─── Body Renderers ─────────────────────────────────────────

function LaunchBody({ item, pub }: { item: NewsItem; pub: PublicationStyle }) {
  const body = item.body as Extract<NewsBody, { type: "productLaunch" }>;
  const tmpl = getEditorialTemplate(item.outlet, body.modelName);
  const vars: Record<string, string> = {
    companyName: body.companyName,
    modelName: body.modelName,
    screenSize: String(body.screenSize),
    price: formatCash(body.price),
  };

  return (
    <div style={{ marginTop: tokens.spacing.md }}>
      {/* Specs row */}
      <div style={{ display: "flex", gap: tokens.spacing.xl, flexWrap: "wrap", marginBottom: tokens.spacing.sm }}>
        <Spec label="Screen" value={`${body.screenSize}"`} pub={pub} />
        <Spec label="Price" value={formatCash(body.price)} pub={pub} />
        <Spec label="By" value={body.companyName} pub={pub} />
      </div>

      {/* Press quote */}
      {body.pressQuotes && body.pressQuotes.length > 0 && (
        <div style={{ borderLeft: `3px solid ${pub.accentColor}`, paddingLeft: tokens.spacing.md, marginTop: tokens.spacing.md }}>
          {body.pressQuotes.map((q, i) => (
            <p key={i} style={{ fontStyle: "italic", color: pub.mutedColor, margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeBase, lineHeight: 1.5 }}>
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      )}

      {/* Editorial prose */}
      <div style={{ marginTop: tokens.spacing.lg, display: "flex", flexDirection: "column", gap: tokens.spacing.md }}>
        {tmpl.paragraphs.map((para, i) => {
          const text = interpolateEditorial(para, vars);
          if (i === 0) {
            return <DropCapParagraph key={i} text={text} pub={pub} />;
          }
          return (
            <p key={i} style={{ margin: 0, fontSize: tokens.font.sizeBase, lineHeight: 1.6, color: pub.textColor }}>
              {text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Per-category scores for magazine review ─────────────────

const REVIEW_CATEGORIES = [
  { key: "performance", label: "Performance" },
  { key: "display", label: "Display" },
  { key: "buildQuality", label: "Build Quality" },
  { key: "battery", label: "Battery" },
  { key: "value", label: "Value" },
] as const;

function deriveCategoryScore(base: number, hash: number, shift: number): number {
  const variance = ((hash >> shift) & 0xf) - 7;
  return Math.max(1, Math.min(10, base + Math.round(variance * 0.35)));
}

// ─── Pros/cons extraction ────────────────────────────────────

const POS_KEYWORDS = ["impressive", "excellent", "outstanding", "strong", "highlight", "generous", "top-notch", "best", "crisp", "vibrant", "solid", "great", "clear", "easily", "well", "fast", "fastest", "comfortable"];
const NEG_KEYWORDS = ["disappointing", "weak", "limited", "below par", "falls short", "struggle", "frustration", "sparse", "dated", "not", "lacking", "slow", "lags", "barely", "tethered", "washed-out"];

function classifySentences(sentences: string[]): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  for (const s of sentences) {
    const lower = s.toLowerCase();
    const isNeg = NEG_KEYWORDS.some((k) => lower.includes(k));
    const isPos = POS_KEYWORDS.some((k) => lower.includes(k));
    if (isNeg && !isPos) {
      cons.push(s);
    } else {
      pros.push(s);
    }
  }
  return { pros, cons };
}

// ─── Magazine Review (consumerWeekly only) ───────────────────

function MagazineReviewBody({ body, pub }: { body: Extract<NewsBody, { type: "review" }>; pub: PublicationStyle }) {
  const scoreColor = reviewScoreColor(body.score);
  const hash = simpleHash(body.laptopName);
  const categoryScores = REVIEW_CATEGORIES.map((cat, i) => ({
    label: cat.label,
    score: deriveCategoryScore(body.score, hash, i * 4),
  }));
  const { pros, cons } = classifySentences(body.sentences);

  return (
    <div style={{ marginTop: tokens.spacing.md }}>
      {/* Score + laptop name */}
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: scoreColor, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#fff",
        }}>
          {body.score}
        </div>
        <div>
          <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: pub.headlineColor, lineHeight: 1.2 }}>
            {body.laptopName}
          </div>
          <div style={{ fontSize: tokens.font.sizeSmall, color: pub.mutedColor, marginTop: 2 }}>
            Reviewed by {body.outlet}
          </div>
        </div>
      </div>

      {/* Per-category rating bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
        {categoryScores.map(({ label, score }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.md }}>
            <span style={{ fontSize: tokens.font.sizeSmall, color: pub.mutedColor, width: 90, flexShrink: 0 }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 8, background: pub.borderColor, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${score * 10}%`,
                background: reviewScoreColor(score),
                borderRadius: 4,
              }} />
            </div>
            <span style={{ fontSize: tokens.font.sizeSmall, color: pub.headlineColor, fontWeight: 600, width: 20, textAlign: "right", flexShrink: 0 }}>
              {score}
            </span>
          </div>
        ))}
      </div>

      {/* Pros / cons */}
      <div style={{ display: "flex", gap: tokens.spacing.lg, borderTop: `1px solid ${pub.borderColor}`, paddingTop: tokens.spacing.md }}>
        {pros.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: tokens.font.sizeSmall, fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: tokens.spacing.xs }}>
              Verdict
            </div>
            {pros.slice(0, 2).map((s, i) => {
              if (i === 0) return <DropCapParagraph key={i} text={s} pub={pub} style={{ marginBottom: tokens.spacing.xs }} />;
              return <p key={i} style={{ margin: 0, fontSize: tokens.font.sizeBase, lineHeight: 1.5, color: pub.mutedColor }}>{s}</p>;
            })}
          </div>
        )}
        {cons.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: tokens.font.sizeSmall, fontWeight: 700, color: "#c62828", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: tokens.spacing.xs }}>
              Watch Out For
            </div>
            {cons.slice(0, 2).map((s, i) => (
              <p key={i} style={{ margin: i > 0 ? `${tokens.spacing.xs}px 0 0` : 0, fontSize: tokens.font.sizeBase, lineHeight: 1.5, color: pub.mutedColor }}>{s}</p>
            ))}
          </div>
        )}
      </div>
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
          {body.sentences.map((s, i) => {
            if (i === 0) return <DropCapParagraph key={i} text={s} pub={pub} style={{ marginBottom: tokens.spacing.xs }} />;
            return (
              <p key={i} style={{ color: pub.mutedColor, margin: `${tokens.spacing.xs}px 0 0`, fontSize: tokens.font.sizeBase, lineHeight: 1.5 }}>
                {s}
              </p>
            );
          })}
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
      return <LaunchBody item={item} pub={pub} />;
    case "review":
      if (item.outlet === "consumerWeekly") {
        return <MagazineReviewBody body={item.body} pub={pub} />;
      }
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
          {quarterToDate(item.year, item.quarter)}
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
  const result = state.lastSimulationResult;

  const activeModels = player.models.filter((m) => m.status === "manufacturing" || m.status === "onSale");
  const totalInventory = activeModels.reduce((s, m) => s + m.unitsInStock, 0);
  const activeCampaigns = state.marketingCampaigns.filter((c) => !c.paused).length;

  // Competitor models from this quarter's results
  const competitorResults = result
    ? result.laptopResults.filter((lr) => lr.owner !== player.id && lr.unitsSold > 0)
    : [];
  const competingModels = competitorResults.length;

  // Price range of competing models
  const competitorPrices = competitorResults.map((lr) => lr.retailPrice).filter((p) => p > 0);
  const priceRangeLabel = competitorPrices.length > 0
    ? `${formatCash(Math.min(...competitorPrices))} – ${formatCash(Math.max(...competitorPrices))}`
    : "N/A";

  // Seasonal demand label
  const seasonalLabel = result ? SEASONAL_LABELS[result.quarter - 1] : SEASONAL_LABELS[state.quarter - 1];

  // Pre-simulation cash (cash before sales resolved)
  const preSimCash = result
    ? result.cashAfterResolution - result.totalRevenue + result.marketingCost
    : state.cash;

  const stats = [
    { label: "Models Competing", value: String(competingModels), icon: <Users size={18} /> },
    { label: "Price Range", value: priceRangeLabel, icon: <TrendingUp size={18} />, small: true },
    { label: "Your Inventory", value: formatNumber(totalInventory), icon: <Package size={18} /> },
    { label: "Seasonal Demand", value: seasonalLabel, icon: <Calendar size={18} />, small: true },
    { label: "Active Campaigns", value: String(activeCampaigns), icon: <Megaphone size={18} /> },
    { label: "Cash on Hand", value: formatCash(Math.round(preSimCash)), icon: <DollarSign size={18} />, small: true },
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
        {result
          ? `${QUARTER_LABELS[result.quarter - 1]} ${result.year} — Here's where things stand.`
          : `${QUARTER_LABELS[state.quarter - 1]} ${state.year} — Here's where things stand.`}
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
            <span style={{
              fontSize: s.small ? tokens.font.sizeLarge : tokens.font.sizeTitle,
              fontWeight: 700,
              color: tokens.colors.text,
              lineHeight: 1.2,
            }}>
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
            width: 8,
            height: 8,
            borderRadius: 4,
            background: i === activeIndex ? tokens.colors.accent : tokens.colors.surface,
            transition: "background 0.2s",
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

  const preSimArticles = useMemo(() => {
    if (!result) return [];
    return state.newsHistory.filter(
      (n) =>
        n.year === result.year &&
        n.quarter === result.quarter &&
        (n.category === "productLaunch" || n.category === "componentLaunch" || n.category === "review"),
    );
  }, [state.newsHistory, result]);

  const totalSlides = preSimArticles.length + 1;
  const isLastSlide = currentSlide === totalSlides - 1;

  const goNext = useCallback(() => {
    setCurrentSlide((i) => Math.min(i + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlide((i) => Math.max(i - 1, 0));
  }, []);

  const proceed = useCallback(() => {
    if (!result) return;
    navigateTo("simTicker");
  }, [result, navigateTo]);

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
