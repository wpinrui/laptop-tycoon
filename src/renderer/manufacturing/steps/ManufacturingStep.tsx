import { CSSProperties, useState, useRef, useEffect } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { tokens } from "../../shell/tokens";
import { calculateBomUnitCost, buildCostBreakdown } from "../utils/economiesOfScale";
import { AD_CAMPAIGNS, getCampaignCost } from "../data/campaigns";
import { approxPercentile } from "../utils/skewNormal";
import {
  MIN_BATCH_SIZE, MAX_PRICE_MULTIPLIER,
  ASSEMBLY_QA_COST, PACKAGING_LOGISTICS_COST, CHANNEL_MARGIN_RATE,
  TOOLING_COST, CERTIFICATION_COST, MULTI_MODEL_OVERHEAD,
  MIN_RETAIL_PRICE, snapPrice,
} from "../utils/constants";
import { getActiveModels } from "../../screens/dashboard/utils";
import { projectDemandRange } from "../../../simulation/salesEngine";
import { MarketSizeCard } from "../components/MarketSizeCard";

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: tokens.spacing.lg,
  maxWidth: 1080,
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

const detailRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `2px 0`,
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

const editableInputStyle: CSSProperties = {
  ...bigValueStyle,
  background: "none",
  border: `1px solid ${tokens.colors.accent}`,
  borderRadius: tokens.borderRadius.sm,
  outline: "none",
  fontFamily: tokens.font.family,
  width: "100%",
  boxSizing: "border-box",
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
};

function EditableValue({
  value,
  onChange,
  min,
  max,
  prefix,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  prefix?: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const parsed = parseInt(draft.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={editableInputStyle}
      />
    );
  }

  return (
    <div
      style={{
        ...bigValueStyle,
        cursor: "pointer",
        textDecoration: hovered ? "underline" : "none",
        filter: hovered ? "brightness(1.3)" : "none",
        transition: "filter 0.15s, text-decoration 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      title="Click to type a value"
    >
      {prefix}{value.toLocaleString()}{suffix}
    </div>
  );
}

function MetricCard({ label, value, subtitle, color, bgColor }: {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div style={{
      background: bgColor,
      borderRadius: tokens.borderRadius.md,
      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minHeight: 72,
    }}>
      <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={detailRowStyle}>
      <span>{label}</span>
      <span style={{ color: color ?? tokens.colors.textMuted, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// projectDemandRange provides real simulation-backed demand estimates


export function ManufacturingStep() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState } = useGame();
  const [showDetails, setShowDetails] = useState(true);
  const player = getPlayerCompany(gameState);

  const model = player.models.find((m) => m.design.id === state.modelId);
  const inventory = model?.unitsInStock ?? 0;

  const baseBom = model?.design.unitCost ?? 0;
  const modelType = model?.design.modelType ?? "brandNew";
  const activeModelCount = getActiveModels(gameState).length;

  const campaign = AD_CAMPAIGNS.find((c) => c.id === state.campaignId) ?? AD_CAMPAIGNS[0];
  const adCost = getCampaignCost(campaign, gameState.year);

  const toolingCost = TOOLING_COST[modelType];
  const certCost = CERTIFICATION_COST[modelType];
  const overhead = activeModelCount > 1 ? MULTI_MODEL_OVERHEAD : 0;

  // Fixed costs that must be paid regardless
  const totalFixedCosts = toolingCost + certCost + overhead + adCost;

  // Price slider: based on total cost per unit (BOM + assembly + packaging + support)
  const baseTotalPerUnit = baseBom + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST + state.supportBudget;
  const minPrice = Math.max(snapPrice(baseTotalPerUnit * 0.5), MIN_RETAIL_PRICE);
  const maxPrice = snapPrice(baseTotalPerUnit * MAX_PRICE_MULTIPLIER);

  // Quantity slider: binary search for max affordable
  const cashForManufacturing = Math.max(0, gameState.cash - totalFixedCosts);
  const minPerUnit = calculateBomUnitCost(baseBom, 10_000_000) + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST + state.supportBudget;
  const maxQuantity = (() => {
    let lo = MIN_BATCH_SIZE;
    let hi = Math.max(MIN_BATCH_SIZE, Math.floor(cashForManufacturing / Math.max(1, minPerUnit)));
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const mfgPerUnit = calculateBomUnitCost(baseBom, mid) + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST + state.supportBudget;
      if (mfgPerUnit * mid <= cashForManufacturing) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return Math.max(MIN_BATCH_SIZE, lo);
  })();

  // Effective values
  const effectivePrice = state.unitPrice || snapPrice(baseTotalPerUnit * 1.5);
  const effectiveQty = state.unitsOrdered;

  // Full cost breakdown — uses effective values for price/qty
  const { cost } = buildCostBreakdown(gameState, {
    ...state,
    unitPrice: effectivePrice,
    unitsOrdered: effectiveQty,
  });

  // Demand projection from sales simulation engine
  const { distribution: dist } = campaign;

  const projection = projectDemandRange(gameState, state.modelId, effectivePrice, adCost);
  const lowerAdBonus = approxPercentile(dist.mean, dist.stdDev, dist.skew, dist.min, dist.max, 0.25);
  const upperAdBonus = approxPercentile(dist.mean, dist.stdDev, dist.skew, dist.min, dist.max, 0.75);
  const projections = {
    displayLower: Math.max(0, Math.round(projection.low * (1 + lowerAdBonus / 100))),
    displayUpper: Math.round(projection.high * (1 + upperAdBonus / 100)),
  };

  // Other player models for price reference
  const otherPlayerModels = player.models.filter(
    (m) => m.design.id !== state.modelId && m.retailPrice !== null && m.status !== "discontinued",
  );

  if (!model) return <p>Model not found.</p>;

  // Total units available for sale = new manufacturing order + existing inventory
  const totalAvailable = effectiveQty + inventory;

  // Profit uses revenue per unit (after channel margin), not retail price
  // Cap sold units to total available — can't sell more than what exists
  const pessimisticSold = Math.min(projections.displayLower, totalAvailable);
  const pessimisticProfit = pessimisticSold * cost.revenuePerUnit - cost.totalManufacturingSpend;
  const optimisticSold = Math.min(projections.displayUpper, totalAvailable);
  const optimisticProfit = optimisticSold * cost.revenuePerUnit - cost.totalManufacturingSpend;
  const cashAfter = gameState.cash - cost.totalManufacturingSpend;

  // For additional orders, compute blended break-even cost across all orders
  const blendedCostPerUnit = (() => {
    if (!state.isAdditionalOrder || !model) return cost.fullyLoadedCostPerUnit;
    const priorSpend = model.totalProductionSpend ?? 0;
    const priorUnits = model.totalUnitsOrdered ?? 0;
    // Check if we're editing an existing same-quarter plan — subtract its old cost/units
    const existingPlan = model.manufacturingPlan;
    const isEdit = existingPlan && existingPlan.year === gameState.year && existingPlan.quarter === gameState.quarter;
    const oldPlanCost = isEdit ? existingPlan.manufacturing.totalCost + existingPlan.marketing.cost : 0;
    const oldPlanUnits = isEdit ? existingPlan.manufacturing.unitsOrdered : 0;
    const totalSpend = priorSpend - oldPlanCost + cost.totalManufacturingSpend;
    const totalUnits = priorUnits - oldPlanUnits + effectiveQty;
    return totalUnits > 0 ? totalSpend / totalUnits : cost.fullyLoadedCostPerUnit;
  })();

  const marginPerUnit = cost.revenuePerUnit - blendedCostPerUnit;
  const marginPct = effectivePrice > 0 ? (marginPerUnit / effectivePrice) * 100 : 0;

  const profitable = marginPerUnit > 0;
  const profitColor = profitable ? tokens.colors.success : tokens.colors.danger;
  const profitBg = profitable ? tokens.colors.successBg : tokens.colors.dangerBg;
  const cashColor = cashAfter < 0 ? tokens.colors.danger : tokens.colors.success;
  const cashBg = cashAfter < 0 ? tokens.colors.dangerBg : tokens.colors.successBg;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Manufacturing & Pricing
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Set the retail price and order quantity for {modelDisplayName(player.name, model.design.name)}.
      </p>

      {inventory > 0 && (
        <div style={{
          ...panelStyle,
          marginBottom: tokens.spacing.lg,
          maxWidth: 1080,
          background: tokens.colors.surface,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>Existing Inventory</div>
            <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              Unsold units from previous year(s). These will be sold alongside any new manufacturing order.
            </div>
          </div>
          <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700, color: tokens.colors.accent }}>
            {inventory.toLocaleString()} units
          </div>
        </div>
      )}

      <div style={twoColumnStyle}>
        {/* Left: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.lg }}>
          <MarketSizeCard year={gameState.year} quarter={gameState.quarter} />

          <div style={panelStyle}>
            <div style={sliderLabelStyle}>
              <span style={{ fontWeight: 600 }}>Retail Price</span>
              <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                BOM: {fmt(baseBom)}
              </span>
            </div>
            <EditableValue
              value={effectivePrice}
              onChange={(v) => dispatch({ type: "SET_UNIT_PRICE", unitPrice: v })}
              min={minPrice}
              max={maxPrice}
              prefix="$"
            />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={50}
              value={effectivePrice}
              onChange={(e) => {
                const raw = Number(e.target.value);
                dispatch({ type: "SET_UNIT_PRICE", unitPrice: snapPrice(raw) });
              }}
              style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              <span>{fmt(minPrice)}</span>
              <span>{fmt(maxPrice)}</span>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sliderLabelStyle}>
              <span style={{ fontWeight: 600 }}>Order Quantity</span>
              <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                {inventory > 0
                  ? `${inventory.toLocaleString()} already in stock`
                  : `Min: ${MIN_BATCH_SIZE.toLocaleString()}`}
              </span>
            </div>
            <EditableValue
              value={effectiveQty}
              onChange={(v) => dispatch({ type: "SET_UNITS_ORDERED", unitsOrdered: v })}
              min={0}
              max={maxQuantity}
              suffix=" units"
            />
            <input
              type="range"
              min={0}
              max={maxQuantity}
              step={Math.max(1, Math.round(maxQuantity / 100))}
              value={effectiveQty}
              onChange={(e) => dispatch({ type: "SET_UNITS_ORDERED", unitsOrdered: Number(e.target.value) })}
              style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              <span>0</span>
              <span>{maxQuantity.toLocaleString()}</span>
            </div>
            {inventory > 0 && (
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Total available for sale: {(effectiveQty + inventory).toLocaleString()} units (ordered + inventory)
              </div>
            )}
          </div>

          {otherPlayerModels.length > 0 && (
            <div style={panelStyle}>
              <div style={{ fontWeight: 600, marginBottom: tokens.spacing.sm }}>Your Other Models</div>
              {otherPlayerModels.map((m) => (
                <div key={m.design.id} style={detailRowStyle}>
                  <span>{modelDisplayName(player.name, m.design.name)}</span>
                  <span style={{ fontWeight: 500, color: tokens.colors.text }}>{fmt(m.retailPrice ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Projections */}
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.md }}>
          {/* Hero metrics */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: tokens.spacing.sm,
          }}>
            <MetricCard
              label={state.isAdditionalOrder ? "Blended margin / unit" : "Margin / unit"}
              value={`${fmt(marginPerUnit)} (${Math.round(marginPct)}%)`}
              color={profitColor}
              bgColor={profitBg}
            />
            <MetricCard
              label="Manufacturing cost"
              value={fmt(cost.manufacturingCostPerUnit)}
              subtitle="per unit"
              color={tokens.colors.text}
              bgColor={tokens.colors.surface}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <MetricCard
                label="Projected profit"
                value={`${fmt(pessimisticProfit)} to ${fmt(optimisticProfit)}`}
                color={pessimisticProfit < 0 ? tokens.colors.danger : tokens.colors.success}
                bgColor={pessimisticProfit < 0 ? tokens.colors.dangerBg : tokens.colors.successBg}
              />
            </div>
          </div>

          {/* Cash after - full width, prominent */}
          <div style={{
            background: cashBg,
            border: `1px solid ${cashAfter < 0 ? tokens.colors.danger : tokens.colors.successBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontWeight: 600 }}>Cash after manufacturing</span>
            <span style={{ fontWeight: 700, fontSize: tokens.font.sizeTitle, color: cashColor }}>
              {fmt(cashAfter)}
            </span>
          </div>
          {cashAfter < 0 && (
            <p style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger, margin: 0, marginTop: -tokens.spacing.xs }}>
              Warning: You will be in debt. Ending the year with negative cash means game over.
            </p>
          )}

          {/* Key summary rows */}
          <div style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
              <span style={{ color: tokens.colors.textMuted }}>Channel margin ({Math.round(CHANNEL_MARGIN_RATE * 100)}%)</span>
              <span style={{ fontWeight: 600 }}>{fmt(cost.channelMargin)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
              <span style={{ fontWeight: 600 }}>Revenue per unit</span>
              <span style={{ fontWeight: 600 }}>{fmt(cost.revenuePerUnit)}</span>
            </div>
            <div style={{ height: 1, background: tokens.colors.panelBorder, margin: `${tokens.spacing.xs}px 0` }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
              <span style={{ fontWeight: 600 }}>Total fixed costs</span>
              <span style={{ fontWeight: 600 }}>{fmt(cost.totalFixedCosts)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
              <span style={{ color: tokens.colors.textMuted }}>Fixed cost / unit (amortised)</span>
              <span style={{ fontWeight: 600 }}>{fmt(cost.fixedCostPerUnit)}</span>
            </div>
            <div style={{ height: 1, background: tokens.colors.panelBorder, margin: `${tokens.spacing.xs}px 0` }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing.xs }}>
              <span style={{ fontWeight: 600 }}>Break-even units</span>
              <span style={{ fontWeight: 600 }}>
                {cost.revenuePerUnit > 0
                  ? Math.ceil(cost.totalManufacturingSpend / cost.revenuePerUnit).toLocaleString()
                  : "\u2014"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Total spend</span>
              <span style={{ fontWeight: 600 }}>{fmt(cost.totalManufacturingSpend)}</span>
            </div>
          </div>

          {/* Collapsible cost details */}
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: tokens.spacing.xs,
              color: tokens.colors.textMuted,
              fontSize: tokens.font.sizeSmall,
              userSelect: "none",
            }}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span style={{ transform: showDetails ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>
              {"\u25B6"}
            </span>
            Cost details
          </div>

          {showDetails && (
            <div style={{
              ...panelStyle,
              padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}>
              <DetailRow label="Component cost (BOM)" value={fmt(cost.bomCost)} />
              <DetailRow label="Assembly & QA" value={fmt(cost.assemblyQa)} />
              <DetailRow label="Packaging & logistics" value={fmt(cost.packagingLogistics)} />
              {cost.eosDiscount < 0 && (
                <DetailRow label="Economies of scale" value={`-${fmt(Math.abs(cost.eosDiscount))}`} color={tokens.colors.success} />
              )}
              <div style={{ height: 1, background: tokens.colors.panelBorder, margin: `${tokens.spacing.xs}px 0` }} />
              <DetailRow label={`Channel margin (${Math.round(CHANNEL_MARGIN_RATE * 100)}%)`} value={fmt(cost.channelMargin)} />
              {cost.toolingCost > 0 && <DetailRow label="Body R&D / tooling" value={fmt(cost.toolingCost)} />}
              {cost.certificationCost > 0 && <DetailRow label="Certification" value={fmt(cost.certificationCost)} />}
              {cost.multiModelOverhead > 0 && <DetailRow label="Multi-model overhead" value={fmt(cost.multiModelOverhead)} />}
              <DetailRow label="Advertising" value={fmt(cost.adCost)} />
              <DetailRow label="Fixed cost / unit (amortised)" value={fmt(cost.fixedCostPerUnit)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
