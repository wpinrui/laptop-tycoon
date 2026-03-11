import { CSSProperties } from "react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany } from "../../state/gameTypes";
import { ContentPanel } from "../../shell/ContentPanel";
import { tokens } from "../../shell/tokens";
import { StatusBar } from "../../shell/StatusBar";
import { ModelsCard } from "./ModelsCard";
import { FinancialsCard } from "./FinancialsCard";
import { MarketCard } from "./MarketCard";
import { BrandCard } from "./BrandCard";
import { ReviewsCard } from "./ReviewsCard";
import { NewsCard } from "./NewsCard";
import { HistoryCard } from "./HistoryCard";
import { CompetitorsCard } from "./CompetitorsCard";
import { AdvanceYearCard } from "./AdvanceYearCard";

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: tokens.layout.panelHeight,
  width: tokens.layout.panelWidth,
  maxWidth: tokens.layout.panelMaxWidth,
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: tokens.spacing.lg,
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
  const player = getPlayerCompany(state);

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          {state.companyLogo && (
            <img src={state.companyLogo} alt="Logo" style={logoStyle} />
          )}
          <h1 style={titleStyle}>{player.name}</h1>
        </div>
      </div>

      <div className="content-panel hide-scrollbar" style={gridStyle}>
        <div style={columnStyle}>
          <ModelsCard />
          <NewsCard />
          <CompetitorsCard />
          <HistoryCard />
          <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
        </div>
        <div style={columnStyle}>
          <BrandCard />
          <MarketCard />
          <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
        </div>
        <div style={columnStyle}>
          <AdvanceYearCard />
          <FinancialsCard />
          <ReviewsCard />
          <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
        </div>
      </div>
      <StatusBar />
    </ContentPanel>
  );
}
