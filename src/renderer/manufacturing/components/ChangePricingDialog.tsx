import { useState } from "react";
import { ContentPanel } from "../../shell/ContentPanel";
import { MenuButton } from "../../shell/MenuButton";
import { tokens, overlayStyle } from "../../shell/tokens";
import { ASSEMBLY_QA_COST, PACKAGING_LOGISTICS_COST, MAX_PRICE_MULTIPLIER, CHANNEL_MARGIN_RATE } from "../utils/constants";

/** Snap price to nearest $50 ending in 9, e.g. $449, $499, $549 */
function snapPrice(raw: number): number {
  return Math.round(raw / 50) * 50 - 1;
}

interface ChangePricingDialogProps {
  modelName: string;
  currentPrice: number;
  baseBomCost: number;
  onConfirm: (newPrice: number) => void;
  onCancel: () => void;
  onOpenFullWizard: () => void;
}

export function ChangePricingDialog({
  modelName,
  currentPrice,
  baseBomCost,
  onConfirm,
  onCancel,
  onOpenFullWizard,
}: ChangePricingDialogProps) {
  const [price, setPrice] = useState(currentPrice);

  const baseTotalPerUnit = baseBomCost + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST;
  const minPrice = Math.max(snapPrice(baseTotalPerUnit * 0.5), 49);
  const maxPrice = snapPrice(baseTotalPerUnit * MAX_PRICE_MULTIPLIER);

  const revenuePerUnit = price - price * CHANNEL_MARGIN_RATE;
  const margin = revenuePerUnit - baseTotalPerUnit;
  const marginPct = price > 0 ? (margin / price) * 100 : 0;
  const profitable = margin > 0;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <ContentPanel maxWidth={420}>
        <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700 }}>
          Change Pricing
        </h2>
        <p style={{ margin: 0, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: tokens.spacing.lg }}>
          {modelName}
        </p>

        <div style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700, color: tokens.colors.accent, textAlign: "center", margin: `${tokens.spacing.sm}px 0` }}>
          {fmt(price)}
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50}
          value={price}
          onChange={(e) => setPrice(snapPrice(Number(e.target.value)))}
          style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginBottom: tokens.spacing.md }}>
          <span>{fmt(minPrice)}</span>
          <span>{fmt(maxPrice)}</span>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: `${tokens.spacing.xs}px 0`,
          fontSize: tokens.font.sizeBase,
        }}>
          <span style={{ color: tokens.colors.textMuted }}>Margin / unit</span>
          <span style={{ fontWeight: 600, color: profitable ? tokens.colors.success : tokens.colors.danger }}>
            {fmt(margin)} ({Math.round(marginPct)}%)
          </span>
        </div>

        <div style={{ display: "flex", gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
          <MenuButton onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </MenuButton>
          <MenuButton
            variant="accent"
            onClick={() => onConfirm(price)}
            disabled={price === currentPrice}
            style={{ flex: 1 }}
          >
            Update Price
          </MenuButton>
        </div>

        <button
          onClick={onOpenFullWizard}
          style={{
            background: "none",
            border: "none",
            color: tokens.colors.accent,
            cursor: "pointer",
            fontSize: tokens.font.sizeSmall,
            fontFamily: tokens.font.family,
            textDecoration: "underline",
            marginTop: tokens.spacing.md,
            padding: 0,
            width: "100%",
            textAlign: "center",
          }}
        >
          Open full manufacturing wizard
        </button>
      </ContentPanel>
    </div>
  );
}
