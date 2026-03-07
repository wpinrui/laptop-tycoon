import { CSSProperties, useMemo } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { calculateUnitCost, calculateTotalCost } from "../utils/economiesOfScale";
import { AD_CAMPAIGNS } from "../data/campaigns";
import { approxPercentile } from "../utils/skewNormal";
import { MIN_BATCH_SIZE, MULTI_MODEL_OVERHEAD, MAX_PRICE_MULTIPLIER } from "../utils/constants";
import { getActiveModels } from "../../screens/dashboard/utils";

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: tokens.spacing.lg,
  maxWidth: 900,
};

const panelStyle: CSSProperties = {
  background: tokens.colors.background,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
};

const sliderLabelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: tokens.spacing.xs,
};

const bigValueStyle: CSSProperties = {
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
  color: tokens.colors.accent,
  textAlign: "center",
  margin: `${tokens.spacing.sm}px 0`,
};

const projRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.sm}px 0`,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
};

// Placeholder base demand — will be replaced by actual sales simulation later
const PLACEHOLDER_BASE_DEMAND = 10_000;

export function ManufacturingStep() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState } = useGame();

  const model = gameState.models.find((m) => m.design.id === state.modelId);

  const baseCost = model?.design.unitCost ?? 0;
  const activeModelCount = getActiveModels(gameState).length;

  const minPrice = Math.ceil(baseCost * 1.1);
  const maxPrice = Math.ceil(baseCost * MAX_PRICE_MULTIPLIER);
  const maxQuantity = Math.max(MIN_BATCH_SIZE, Math.floor(gameState.cash / Math.max(1, calculateUnitCost(baseCost, MIN_BATCH_SIZE))));

  // Ensure unitPrice has a sensible default
  const effectivePrice = state.unitPrice || Math.ceil(baseCost * 1.5);
  const effectiveQty = state.unitsOrdered || MIN_BATCH_SIZE;

  const unitCost = calculateUnitCost(baseCost, effectiveQty);
  const totalCost = calculateTotalCost(baseCost, effectiveQty, activeModelCount, MULTI_MODEL_OVERHEAD);

  // Demand projection
  const campaign = AD_CAMPAIGNS.find((c) => c.id === state.campaignId) ?? AD_CAMPAIGNS[0];
  const { distribution: dist } = campaign;

  const projections = useMemo(() => {
    const baseDemand = PLACEHOLDER_BASE_DEMAND;
    const lowerAdBonus = approxPercentile(dist.mean, dist.stdDev, dist.skew, dist.min, dist.max, 0.25);
    const upperAdBonus = approxPercentile(dist.mean, dist.stdDev, dist.skew, dist.min, dist.max, 0.75);

    const lowerDemand = baseDemand * (1 + lowerAdBonus / 100);
    const upperDemand = baseDemand * (1 + upperAdBonus / 100);

    const displayLower = Math.max(0, Math.round(lowerDemand * (1 - state.noiseMargin / 100)));
    const displayUpper = Math.round(upperDemand * (1 + state.noiseMargin / 100));

    return { displayLower, displayUpper };
  }, [dist, state.noiseMargin]);

  if (!model) return <p>Model not found.</p>;

  const pessimisticProfit = projections.displayLower * effectivePrice - totalCost;
  const optimisticSold = Math.min(projections.displayUpper, effectiveQty);
  const optimisticProfit = optimisticSold * effectivePrice - totalCost;
  const cashAfter = gameState.cash - totalCost;

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Manufacturing & Pricing
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Set the retail price and order quantity for {model.design.name}.
      </p>

      <div style={twoColumnStyle}>
        {/* Left: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.lg }}>
          <div style={panelStyle}>
            <div style={sliderLabelStyle}>
              <span style={{ fontWeight: 600 }}>Retail Price</span>
              <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                Unit cost: ${Math.round(baseCost).toLocaleString()}
              </span>
            </div>
            <div style={bigValueStyle}>${effectivePrice.toLocaleString()}</div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={Math.max(1, Math.round((maxPrice - minPrice) / 100))}
              value={effectivePrice}
              onChange={(e) => dispatch({ type: "SET_UNIT_PRICE", unitPrice: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#90caf9" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              <span>${minPrice.toLocaleString()}</span>
              <span>${maxPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sliderLabelStyle}>
              <span style={{ fontWeight: 600 }}>Order Quantity</span>
              <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                Min: {MIN_BATCH_SIZE.toLocaleString()}
              </span>
            </div>
            <div style={bigValueStyle}>{effectiveQty.toLocaleString()} units</div>
            <input
              type="range"
              min={MIN_BATCH_SIZE}
              max={maxQuantity}
              step={Math.max(1, Math.round(maxQuantity / 100))}
              value={effectiveQty}
              onChange={(e) => dispatch({ type: "SET_UNITS_ORDERED", unitsOrdered: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#90caf9" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              <span>{MIN_BATCH_SIZE.toLocaleString()}</span>
              <span>{maxQuantity.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Projections */}
        <div style={panelStyle}>
          <h3 style={{ margin: 0, marginBottom: tokens.spacing.md, fontSize: tokens.font.sizeLarge }}>
            Projections
          </h3>

          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Manufacturing cost / unit</span>
            <span style={{ fontWeight: 600 }}>${Math.round(unitCost).toLocaleString()}</span>
          </div>
          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Total manufacturing cost</span>
            <span style={{ fontWeight: 600 }}>${Math.round(totalCost).toLocaleString()}</span>
          </div>
          {activeModelCount > 1 && (
            <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, padding: `${tokens.spacing.xs}px 0` }}>
              Includes ${MULTI_MODEL_OVERHEAD.toLocaleString()} multi-model overhead
            </div>
          )}
          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Margin per unit</span>
            <span style={{ fontWeight: 600, color: effectivePrice - unitCost > 0 ? "#66bb6a" : tokens.colors.danger }}>
              ${Math.round(effectivePrice - unitCost).toLocaleString()} ({Math.round(((effectivePrice - unitCost) / effectivePrice) * 100)}%)
            </span>
          </div>

          <div style={{ height: 1, background: tokens.colors.panelBorder, margin: `${tokens.spacing.md}px 0` }} />

          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Projected demand</span>
            <span style={{ fontWeight: 600 }}>
              {projections.displayLower.toLocaleString()} – {projections.displayUpper.toLocaleString()}
            </span>
          </div>
          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Projected profit</span>
            <span style={{
              fontWeight: 600,
              color: pessimisticProfit < 0 ? tokens.colors.danger : "#66bb6a",
            }}>
              ${Math.round(pessimisticProfit).toLocaleString()} – ${Math.round(optimisticProfit).toLocaleString()}
            </span>
          </div>
          <div style={projRowStyle}>
            <span style={{ color: tokens.colors.textMuted }}>Break-even units</span>
            <span style={{ fontWeight: 600 }}>
              {effectivePrice > 0 ? Math.ceil(totalCost / effectivePrice).toLocaleString() : "—"}
            </span>
          </div>

          <div style={{ height: 1, background: tokens.colors.panelBorder, margin: `${tokens.spacing.md}px 0` }} />

          <div style={{ display: "flex", justifyContent: "space-between", padding: `${tokens.spacing.sm}px 0` }}>
            <span style={{ fontWeight: 600 }}>Cash after manufacturing</span>
            <span style={{
              fontWeight: 700,
              fontSize: tokens.font.sizeLarge,
              color: cashAfter < 0 ? tokens.colors.danger : tokens.colors.text,
            }}>
              ${Math.round(cashAfter).toLocaleString()}
            </span>
          </div>
          {cashAfter < 0 && (
            <p style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger, margin: 0 }}>
              Warning: You will be in debt. Ending the year with negative cash means game over.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
