import { CSSProperties } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { Screen } from "../navigation/types";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { formatCash } from "../utils/formatCash";
import {
  Laptop,
  DollarSign,
  BarChart3,
  Sparkles,
  Trophy,
  Newspaper,
  History,
  FastForward,
  type LucideIcon,
} from "lucide-react";

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "75vh",
  width: "92vw",
  maxWidth: 1800,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: tokens.spacing.lg,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  flexShrink: 0,
};

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
};

const logoStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: tokens.borderRadius.sm,
  objectFit: "contain",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
};

const statsRowStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  alignItems: "center",
  fontSize: tokens.font.sizeLarge,
  color: tokens.colors.textMuted,
};

const gridStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.lg,
  paddingTop: tokens.spacing.lg,
  overflowY: "auto",
  flex: 1,
  minHeight: 0,
};

const columnStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.lg,
  minWidth: 0,
};

const cardStyle: CSSProperties = {
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.xl,
  cursor: "pointer",
  transition: "background 0.15s",
  border: `1px solid ${tokens.colors.panelBorder}`,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 600,
  marginBottom: tokens.spacing.md,
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
};

const cardBodyStyle: CSSProperties = {
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeBase,
  margin: 0,
};

const modelRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.spacing.xs}px 0`,
};

const statusBadgeStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderRadius: tokens.borderRadius.sm,
  background: tokens.colors.panelBorder,
};

const emptyStateStyle: CSSProperties = {
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeBase,
  fontStyle: "italic",
};

const MAX_MODELS = 2;

interface BentoCardProps {
  title: string;
  icon: LucideIcon;
  screen?: Screen;
  children: React.ReactNode;
}

function BentoCard({ title, icon: Icon, screen, children }: BentoCardProps) {
  const { navigateTo } = useNavigation();

  return (
    <div
      style={{
        ...cardStyle,
        cursor: screen ? "pointer" : "default",
      }}
      onClick={screen ? () => navigateTo(screen) : undefined}
      onMouseEnter={screen ? (e) => {
        e.currentTarget.style.background = tokens.colors.surfaceHover;
      } : undefined}
      onMouseLeave={screen ? (e) => {
        e.currentTarget.style.background = tokens.colors.surface;
      } : undefined}
    >
      <h3 style={cardTitleStyle}>
        <Icon size={20} color="#fff" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ModelsCard() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const activeModels = state.models.filter((m) => m.status !== "discontinued");
  const emptySlots = MAX_MODELS - activeModels.length;

  return (
    <BentoCard title="Your Models" icon={Laptop} screen="modelManagement">
      {activeModels.length === 0 ? (
        <p style={emptyStateStyle}>No models yet. Design your first laptop!</p>
      ) : (
        activeModels.map((model) => (
          <div key={model.design.id} style={modelRowStyle}>
            <span>{model.design.name}</span>
            <span style={statusBadgeStyle}>{model.status}</span>
          </div>
        ))
      )}
      {emptySlots > 0 && activeModels.length > 0 && (
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
          {emptySlots} empty {emptySlots === 1 ? "slot" : "slots"}
        </p>
      )}
      <MenuButton
        variant="accent"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          navigateTo("designWizard");
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
        disabled={emptySlots === 0}
      >
        + New Design
      </MenuButton>
    </BentoCard>
  );
}

function FinancialsCard() {
  return (
    <BentoCard title="Financials" icon={DollarSign} screen="financialHistory">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["Revenue", "—"],
            ["COGS", "—"],
            ["Gross Profit", "—"],
            ["Marketing", "—"],
            ["R&D Overhead", "—"],
            ["Net Profit", "—"],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ ...cardBodyStyle, padding: `${tokens.spacing.xs}px 0` }}>{label}</td>
              <td style={{ ...cardBodyStyle, padding: `${tokens.spacing.xs}px 0`, textAlign: "right" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
        <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Cash Flow Trend</p>
        <div style={{ display: "flex", gap: tokens.spacing.xs, marginTop: tokens.spacing.sm, height: 48, alignItems: "flex-end" }}>
          {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.65, 0.9].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: tokens.colors.accent, borderRadius: 2, opacity: 0.5 }} />
          ))}
        </div>
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.sm, fontStyle: "italic" }}>
          Quarterly data available after Year 1
        </p>
      </div>
    </BentoCard>
  );
}

function MarketCard() {
  return (
    <BentoCard title="Market" icon={BarChart3} screen="marketOverview">
      <p style={cardBodyStyle}>Total Market Size: ~12M units/year</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontWeight: 600 }}>
        Top Competitors
      </p>
      {[
        { name: "BudgetTech", models: 3, avg: "$599", strategy: "High volume, low margin" },
        { name: "LuxBook", models: 2, avg: "$1,899", strategy: "Premium materials, brand cachet" },
        { name: "OmniLap", models: 4, avg: "$999", strategy: "Broad range, generalist" },
      ].map((c) => (
        <div key={c.name} style={{ marginTop: tokens.spacing.sm, paddingLeft: tokens.spacing.sm, borderLeft: `2px solid ${tokens.colors.panelBorder}` }}>
          <p style={{ ...cardBodyStyle, fontWeight: 600 }}>{c.name}</p>
          <p style={cardBodyStyle}>{c.models} models — avg {c.avg}</p>
          <p style={{ ...cardBodyStyle, fontStyle: "italic", fontSize: tokens.font.sizeSmall }}>{c.strategy}</p>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
        <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Demographic Split</p>
        {[
          { name: "Corporate", pct: 22 },
          { name: "Consumer", pct: 28 },
          { name: "Student", pct: 18 },
          { name: "Creative", pct: 12 },
          { name: "Gamer", pct: 10 },
          { name: "Other", pct: 10 },
        ].map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
            <span style={{ ...cardBodyStyle, width: 70, fontSize: tokens.font.sizeSmall }}>{d.name}</span>
            <div style={{ flex: 1, height: 4, background: tokens.colors.panelBorder, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${d.pct}%`, height: "100%", background: tokens.colors.accent, borderRadius: 2 }} />
            </div>
            <span style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall, width: 30, textAlign: "right" }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function BrandCard() {
  const { state } = useGame();

  const reputationStats = [
    "Performance", "Gaming", "Display", "Build Quality",
    "Battery Life", "Value", "Design", "Portability",
  ];

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...cardBodyStyle, fontWeight: 600, marginBottom: tokens.spacing.sm }}>Recognition</p>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
        <div
          style={{
            flex: 1,
            height: 8,
            background: tokens.colors.panelBorder,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${state.brandRecognition}%`,
              height: "100%",
              background: tokens.colors.accent,
              borderRadius: 4,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={cardBodyStyle}>{state.brandRecognition}/100</span>
      </div>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic", fontSize: tokens.font.sizeSmall }}>
        Grows with sales volume and positive reviews
      </p>
      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
        <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Niche Reputation</p>
        {reputationStats.map((stat) => (
          <div key={stat} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
            <span style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall }}>{stat}</span>
            <span style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall, fontStyle: "italic" }}>—</span>
          </div>
        ))}
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontStyle: "italic", fontSize: tokens.font.sizeSmall }}>
          Reputation builds with consistent product focus across multiple years
        </p>
      </div>
    </BentoCard>
  );
}

function ReviewsCard() {
  return (
    <BentoCard title="Reviews & Awards" icon={Trophy} screen="reviewsAwards">
      <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Latest Reviews</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No reviews yet — launch your first model!
      </p>
      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
        <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Year-End Awards</p>
        {[
          "Best Overall Laptop",
          "Best Value",
          "Best Gaming Laptop",
          "Best Business Laptop",
          "Best Display",
          "Most Innovative Design",
          "Best Build Quality",
          "Best Battery Life",
        ].map((award) => (
          <div key={award} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
            <span style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall }}>{award}</span>
            <span style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall, fontStyle: "italic" }}>TBD</span>
          </div>
        ))}
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.sm, fontStyle: "italic", fontSize: tokens.font.sizeSmall }}>
          Awards announced after year-end simulation
        </p>
      </div>
    </BentoCard>
  );
}

function NewsCard() {
  return (
    <BentoCard title="News" icon={Newspaper} screen="news">
      {[
        { date: "Jan 2000", text: "The laptop market enters a new decade with growing consumer demand across all segments." },
        { date: "Jan 2000", text: "BudgetTech announces aggressive pricing strategy, aiming to capture the student and budget buyer markets." },
        { date: "Jan 2000", text: "Industry analysts predict 15% year-on-year growth in the consumer laptop segment through 2002." },
        { date: "Jan 2000", text: "LuxBook unveils premium aluminium unibody chassis — sets new standard for build quality." },
        { date: "Jan 2000", text: "Corporate IT spending surges as Y2K upgrades drive bulk laptop purchases worldwide." },
        { date: "Jan 2000", text: "OmniLap expands product line with 4 new models targeting every price bracket." },
        { date: "Jan 2000", text: "Display technology advances push screen resolutions higher — 1024×768 becomes the new baseline." },
      ].map((item, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : tokens.spacing.sm, paddingBottom: tokens.spacing.sm, borderBottom: i < 6 ? `1px solid ${tokens.colors.panelBorder}` : "none" }}>
          <p style={{ ...cardBodyStyle, fontSize: tokens.font.sizeSmall, color: tokens.colors.accent }}>{item.date}</p>
          <p style={cardBodyStyle}>{item.text}</p>
        </div>
      ))}
    </BentoCard>
  );
}

function HistoryCard() {
  return (
    <BentoCard title="History" icon={History} screen="history">
      <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Past Releases</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No models released yet
      </p>
      <div style={{ borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
        <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Lifetime Stats</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: tokens.spacing.sm }}>
          <tbody>
            {[
              ["Models designed", "0"],
              ["Models launched", "0"],
              ["Total units sold", "0"],
              ["Total revenue", "$0"],
              ["Total profit", "$0"],
              ["Best seller", "—"],
              ["Highest rated", "—"],
              ["Awards won", "0"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ ...cardBodyStyle, padding: `${tokens.spacing.xs}px 0`, fontSize: tokens.font.sizeSmall }}>{label}</td>
                <td style={{ ...cardBodyStyle, padding: `${tokens.spacing.xs}px 0`, fontSize: tokens.font.sizeSmall, textAlign: "right" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}

function AdvanceYearCard() {
  const { state } = useGame();
  const activeModels = state.models.filter((m) => m.status !== "discontinued");
  const allHavePlans = activeModels.length > 0 && activeModels.every(
    (m) => m.retailPrice !== null && m.manufacturingQuantity !== null
  );
  const warnings: string[] = [];

  if (activeModels.length === 0) {
    warnings.push("Design at least one laptop model");
  }
  if (activeModels.length > 0 && !allHavePlans) {
    warnings.push("Set pricing & manufacturing for all models");
  }

  return (
    <BentoCard title="Advance Year" icon={FastForward}>
      {warnings.length > 0 ? (
        warnings.map((w) => (
          <p key={w} style={{ ...cardBodyStyle, color: tokens.colors.danger }}>
            {w}
          </p>
        ))
      ) : (
        <p style={cardBodyStyle}>All models ready. Advance to simulate the year.</p>
      )}
      <MenuButton
        variant="accent"
        disabled={!allHavePlans}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
      >
        Begin Year {state.year + 1}
      </MenuButton>
    </BentoCard>
  );
}

export function DashboardScreen() {
  const { state } = useGame();

  return (
    <ContentPanel maxWidth={1800} style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          {state.companyLogo && (
            <img src={state.companyLogo} alt="Logo" style={logoStyle} />
          )}
          <h1 style={titleStyle}>{state.companyName}</h1>
        </div>
        <div style={statsRowStyle}>
          <span>📅 {state.year}</span>
          <span>💰 {formatCash(state.cash)}</span>
        </div>
      </div>

      <div className="content-panel" style={gridStyle}>
        <div style={columnStyle}>
          <ModelsCard />
          <NewsCard />
          <HistoryCard />
        </div>
        <div style={columnStyle}>
          <BrandCard />
          <MarketCard />
          <ReviewsCard />
        </div>
        <div style={columnStyle}>
          <AdvanceYearCard />
          <FinancialsCard />
        </div>
      </div>
    </ContentPanel>
  );
}
