import { CSSProperties } from "react";
import { useGame } from "../../state/GameContext";
import { ContentPanel } from "../../shell/ContentPanel";
import { tokens } from "../../shell/tokens";
import { formatCash } from "../../utils/formatCash";
import { ModelsCard } from "./ModelsCard";
import { FinancialsCard } from "./FinancialsCard";
import { MarketCard } from "./MarketCard";
import { BrandCard } from "./BrandCard";
import { ReviewsCard } from "./ReviewsCard";
import { NewsCard } from "./NewsCard";
import { HistoryCard } from "./HistoryCard";
import { AdvanceYearCard } from "./AdvanceYearCard";

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
  fontWeight: 700,
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
          <span>📅 {state.yearSimulated ? "Dec" : "Jan"} {state.year}</span>
          <span>💰 {formatCash(state.cash)}</span>
        </div>
      </div>

      <div className="content-panel hide-scrollbar" style={gridStyle}>
        <div style={columnStyle}>
          <ModelsCard />
          <NewsCard />
          <HistoryCard />
        </div>
        <div style={columnStyle}>
          <BrandCard />
          <MarketCard />
        </div>
        <div style={columnStyle}>
          <AdvanceYearCard />
          <FinancialsCard />
          <ReviewsCard />
        </div>
      </div>
    </ContentPanel>
  );
}
