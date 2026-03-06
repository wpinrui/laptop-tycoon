import { CSSProperties } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { Screen } from "../navigation/types";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { formatCash } from "../utils/formatCash";

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: tokens.spacing.xl,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeHero,
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
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "auto",
  gap: tokens.spacing.lg,
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
  screen?: Screen;
  children: React.ReactNode;
}

function BentoCard({ title, screen, children }: BentoCardProps) {
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
      <h3 style={cardTitleStyle}>{title}</h3>
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
    <BentoCard title="Your Models" screen="modelManagement">
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
    <BentoCard title="Financials" screen="financialHistory">
      <p style={cardBodyStyle}>Revenue: —</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>COGS: —</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Gross Profit: —</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Marketing: —</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Net Profit: —</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontStyle: "italic" }}>
        P&L data available after first year
      </p>
    </BentoCard>
  );
}

function MarketCard() {
  return (
    <BentoCard title="Market" screen="marketOverview">
      <p style={cardBodyStyle}>Total Market Size: ~12M units</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontWeight: 600 }}>
        Top Competitors
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        BudgetTech — 3 models, avg $599
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        LuxBook — 2 models, avg $1,899
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        OmniLap — 4 models, avg $999
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontStyle: "italic" }}>
        Demographic breakdown available in detail view
      </p>
    </BentoCard>
  );
}

function BrandCard() {
  const { state } = useGame();

  return (
    <BentoCard title="Brand" screen="brandDetail">
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
        <span style={cardBodyStyle}>Recognition:</span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: tokens.colors.panelBorder,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${state.brandRecognition}%`,
              height: "100%",
              background: tokens.colors.accent,
              borderRadius: 3,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={cardBodyStyle}>{state.brandRecognition}</span>
      </div>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontWeight: 600 }}>
        Niche Reputation
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        Performance: unknown
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        Build Quality: unknown
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        Value: unknown
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontStyle: "italic" }}>
        Reputation builds with consistent product focus
      </p>
    </BentoCard>
  );
}

function ReviewsCard() {
  return (
    <BentoCard title="Reviews & Awards" screen="reviewsAwards">
      <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Latest Reviews</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No reviews yet — launch your first model!
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontWeight: 600 }}>
        Awards This Year
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        Year-end awards announced after simulation
      </p>
    </BentoCard>
  );
}

function NewsCard() {
  return (
    <BentoCard title="News" screen="news">
      <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Headlines</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        The laptop market enters a new decade with growing consumer demand.
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        BudgetTech announces aggressive pricing strategy for 2000.
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        Industry analysts predict 15% growth in the consumer segment.
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        LuxBook unveils premium aluminium chassis design.
      </p>
    </BentoCard>
  );
}

function HistoryCard() {
  return (
    <BentoCard title="History" screen="history">
      <p style={{ ...cardBodyStyle, fontWeight: 600 }}>Past Releases</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No models released yet
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.md, fontWeight: 600 }}>
        Lifetime Stats
      </p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Units sold: 0</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Total revenue: $0</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>Models designed: 0</p>
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
    <BentoCard title="Advance Year">
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
    <ContentPanel maxWidth={1600} style={{ width: "90vw", maxHeight: "90vh" }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{state.companyName}</h1>
        <div style={statsRowStyle}>
          <span>📅 {state.year}</span>
          <span>💰 {formatCash(state.cash)}</span>
        </div>
      </div>

      <div style={gridStyle}>
        <ModelsCard />
        <FinancialsCard />
        <MarketCard />
        <BrandCard />
        <ReviewsCard />
        <NewsCard />
        <HistoryCard />
        <AdvanceYearCard />
      </div>
    </ContentPanel>
  );
}
