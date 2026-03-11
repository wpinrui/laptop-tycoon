import { Monitor } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";
import { modelDisplayName } from "../../state/gameTypes";
import { getMarketEntries, getLastQuarterSales } from "../market-browser/types";

export function CompetitorsCard() {
  const { state } = useGame();

  const allOnSale = getMarketEntries(state);
  const playerCount = allOnSale.filter((e) => e.company.isPlayer).length;
  const competitorCount = allOnSale.filter((e) => !e.company.isPlayer).length;

  // Price range across entire market
  const prices = allOnSale.map((e) => e.model.retailPrice ?? 0).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  // Top seller and player's best seller
  const hasSales = !!state.lastSimulationResult;
  let topSeller: { name: string; units: number; isPlayer: boolean } | null = null;
  let playerBest: { name: string; units: number } | null = null;

  if (hasSales) {
    for (const entry of allOnSale) {
      const units = getLastQuarterSales(state, entry.model.design.id);
      if (units === null || units === 0) continue;
      const name = modelDisplayName(entry.company.name, entry.model.design.name);
      if (!topSeller || units > topSeller.units) {
        topSeller = { name, units, isPlayer: entry.company.isPlayer };
      }
      if (entry.company.isPlayer && (!playerBest || units > playerBest.units)) {
        playerBest = { name, units };
      }
    }
  }

  const rowStyle = { display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall } as const;
  const labelStyle = { color: tokens.colors.textMuted } as const;
  const valueStyle = { fontWeight: 600 } as const;

  return (
    <BentoCard title="Market" icon={Monitor} screen="marketBrowser">
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Models on market</span>
          <span style={valueStyle}>{playerCount} yours / {competitorCount} competitors</span>
        </div>
        {minPrice !== null && maxPrice !== null && (
          <div style={rowStyle}>
            <span style={labelStyle}>Price range</span>
            <span style={valueStyle}>${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}</span>
          </div>
        )}
        {topSeller && (
          <div style={{ marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeSmall }}>
            <div style={{ color: tokens.colors.textMuted, marginBottom: 2 }}>Top seller last quarter</div>
            <div style={{ fontWeight: 600, color: topSeller.isPlayer ? tokens.colors.accent : tokens.colors.text }}>
              {topSeller.name} ({topSeller.units.toLocaleString()})
            </div>
            {playerBest && !topSeller.isPlayer && (
              <div style={{ color: tokens.colors.textMuted, marginTop: 2 }}>
                vs your best: {playerBest.name} ({playerBest.units.toLocaleString()})
              </div>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
