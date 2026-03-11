import { Monitor } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";
import { modelDisplayName } from "../../state/gameTypes";
import { getMarketEntries, getLastQuarterSales } from "../market-browser/types";

function PriceRangeBar({
  marketMin,
  marketMax,
  playerMin,
  playerMax,
}: {
  marketMin: number;
  marketMax: number;
  playerMin: number | null;
  playerMax: number | null;
}) {
  const range = marketMax - marketMin;
  // If all laptops have the same price, show a full bar
  if (range <= 0) {
    return (
      <div style={{ fontSize: tokens.font.sizeBase }}>
        <div style={{ color: tokens.colors.textMuted, marginBottom: 3 }}>
          All models at ${marketMin.toLocaleString()}
        </div>
        <div style={{
          height: 8,
          background: playerMin !== null ? tokens.colors.accent : tokens.colors.surface,
          borderRadius: 4,
        }} />
      </div>
    );
  }

  const pctLeft = playerMin !== null ? ((playerMin - marketMin) / range) * 100 : 0;
  const pctRight = playerMax !== null ? ((playerMax - marketMin) / range) * 100 : 0;
  // Ensure the segment is at least 6% wide so it's visible even for a single price point
  const segmentWidth = Math.max(pctRight - pctLeft, 6);

  return (
    <div style={{ fontSize: tokens.font.sizeBase }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: tokens.colors.textMuted, marginBottom: 4 }}>
        <span>${marketMin.toLocaleString()}</span>
        <span>${marketMax.toLocaleString()}</span>
      </div>
      <div style={{
        position: "relative",
        height: 8,
        background: tokens.colors.surface,
        borderRadius: 4,
        overflow: "hidden",
      }}>
        {playerMin !== null && playerMax !== null && (
          <div style={{
            position: "absolute",
            left: `${pctLeft}%`,
            width: `${segmentWidth}%`,
            height: "100%",
            background: tokens.colors.accent,
            borderRadius: 4,
          }} />
        )}
      </div>
    </div>
  );
}

export function CompetitorsCard() {
  const { state } = useGame();

  const allOnSale = getMarketEntries(state);
  const playerEntries = allOnSale.filter((e) => e.company.isPlayer);
  const competitorCount = allOnSale.filter((e) => !e.company.isPlayer).length;

  // Price ranges
  const allPrices = allOnSale.map((e) => e.model.retailPrice ?? 0).filter((p) => p > 0);
  const marketMin = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const marketMax = allPrices.length > 0 ? Math.max(...allPrices) : null;

  const playerPrices = playerEntries.map((e) => e.model.retailPrice ?? 0).filter((p) => p > 0);
  const playerMin = playerPrices.length > 0 ? Math.min(...playerPrices) : null;
  const playerMax = playerPrices.length > 0 ? Math.max(...playerPrices) : null;

  // Top seller and player's best seller
  let topSeller: { name: string; units: number; isPlayer: boolean } | null = null;
  let playerBest: { name: string; units: number } | null = null;

  if (state.lastSimulationResult) {
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

  return (
    <BentoCard title="Market" icon={Monitor} screen="marketBrowser">
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.md }}>
        {/* Model counts */}
        <div style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted }}>
          {playerEntries.length} model{playerEntries.length !== 1 ? "s" : ""} vs {competitorCount} competitors
        </div>

        {/* Price range bar */}
        {marketMin !== null && marketMax !== null && (
          <PriceRangeBar
            marketMin={marketMin}
            marketMax={marketMax}
            playerMin={playerMin}
            playerMax={playerMax}
          />
        )}

        {/* Top seller headline */}
        {topSeller && (
          <div style={{
            borderTop: `1px solid ${tokens.colors.panelBorder}`,
            paddingTop: tokens.spacing.sm,
          }}>
            <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: 4 }}>
              Top seller last quarter
            </div>
            <div style={{
              fontSize: tokens.font.sizeLarge,
              fontWeight: 700,
              color: topSeller.isPlayer ? tokens.colors.accent : tokens.colors.text,
            }}>
              {topSeller.name}
            </div>
            <div style={{
              fontSize: tokens.font.sizeBase,
              color: topSeller.isPlayer ? tokens.colors.accent : tokens.colors.text,
              fontWeight: 600,
              marginTop: 2,
            }}>
              {topSeller.units.toLocaleString()} units
            </div>
            {playerBest && !topSeller.isPlayer && (
              <div style={{
                fontSize: tokens.font.sizeSmall,
                color: tokens.colors.textMuted,
                marginTop: 4,
              }}>
                Your best: {playerBest.name} — {playerBest.units.toLocaleString()} units
              </div>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
