import { CSSProperties } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { Screen } from "../navigation/types";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { formatCash } from "../utils/formatCash";

const headerStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeHero,
  fontWeight: 700,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "auto",
  gap: tokens.spacing.lg,
  marginTop: tokens.spacing.xl,
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
  screen: Screen;
  span?: boolean;
  children: React.ReactNode;
}

function BentoCard({ title, screen, span, children }: BentoCardProps) {
  const { navigateTo } = useNavigation();

  return (
    <div
      style={{
        ...cardStyle,
        gridColumn: span ? "1 / -1" : undefined,
      }}
      onClick={() => navigateTo(screen)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = tokens.colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = tokens.colors.surface;
      }}
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
    <BentoCard title="Your Models" screen="modelManagement" span>
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
  const { state } = useGame();

  return (
    <BentoCard title="Financials" screen="financialHistory">
      <p style={cardBodyStyle}>Cash: {formatCash(state.cash)}</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        P&L data available after first year
      </p>
    </BentoCard>
  );
}

function MarketCard() {
  return (
    <BentoCard title="Market" screen="marketOverview">
      <p style={cardBodyStyle}>Competitor data available soon</p>
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
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
        Niche reputation builds over time
      </p>
    </BentoCard>
  );
}

function ReviewsCard() {
  return (
    <BentoCard title="Reviews & Awards" screen="reviewsAwards">
      <p style={cardBodyStyle}>No reviews yet</p>
    </BentoCard>
  );
}

function NewsCard() {
  return (
    <BentoCard title="News" screen="news">
      <p style={cardBodyStyle}>No headlines yet</p>
    </BentoCard>
  );
}

function HistoryCard() {
  return (
    <BentoCard title="History" screen="history">
      <p style={cardBodyStyle}>No past releases</p>
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
    <div
      style={{
        ...cardStyle,
        gridColumn: "1 / -1",
        textAlign: "center",
        cursor: "default",
      }}
    >
      <h3 style={cardTitleStyle}>Advance Year</h3>
      {warnings.length > 0 ? (
        warnings.map((w) => (
          <p key={w} style={{ ...cardBodyStyle, color: tokens.colors.danger }}>
            {w}
          </p>
        ))
      ) : (
        <p style={cardBodyStyle}>Ready to advance</p>
      )}
      <MenuButton
        variant="accent"
        disabled={!allHavePlans}
        style={{ marginTop: tokens.spacing.md }}
      >
        Begin Year {state.year + 1}
      </MenuButton>
    </div>
  );
}

export function DashboardScreen() {
  const { state } = useGame();

  return (
    <ContentPanel maxWidth={1200} style={{ width: "80vw", maxHeight: "80vh" }}>
      <h1 style={headerStyle}>{state.companyName} — Year {state.year}</h1>

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
