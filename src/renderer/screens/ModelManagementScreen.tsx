import { CSSProperties, useState } from "react";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { useWizard } from "../wizard/WizardContext";
import { useMfgWizard } from "../manufacturing/ManufacturingWizardContext";
import { selectPrompts } from "../manufacturing/data/pressReleasePrompts";
import { LaptopModel, hasDiscontinuedComponents, getPlayerCompany, modelDisplayName } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { ScreenHeader } from "../shell/ScreenHeader";
import { tokens } from "../shell/tokens";
import { StatusBar } from "../shell/StatusBar";
import { getActiveModels, MAX_MODELS } from "./dashboard/utils";
import { STATUS_CONFIG, getDisplayStatus } from "../statusConfig";
import { ChangePricingDialog } from "../manufacturing/components/ChangePricingDialog";
import { ConfirmDiscardDialog } from "../shell/ConfirmDiscardDialog";
import {
  Laptop,
  Plus,
  Pencil,
  Factory,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: tokens.layout.panelHeight,
  width: tokens.layout.panelWidth,
  maxWidth: tokens.layout.panelMaxWidth,
  overflow: "hidden",
};


const modelCardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
};

const specRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.xs}px 0`,
  fontSize: tokens.font.sizeBase,
};

const actionBarStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.sm,
  marginTop: tokens.spacing.md,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
  paddingTop: tokens.spacing.md,
  flexWrap: "wrap",
};

export function ModelManagementScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const { dispatch: wizardDispatch } = useWizard();
  const { dispatch: mfgDispatch } = useMfgWizard();
  const [discontinueModel, setDiscontinueModel] = useState<LaptopModel | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [pricingModel, setPricingModel] = useState<LaptopModel | null>(null);

  const player = getPlayerCompany(state);
  const activeModels = getActiveModels(state);
  const discontinuedModels = player.models.filter((m) => m.status === "discontinued");
  const emptySlots = MAX_MODELS - activeModels.length;
  const canDesignNew = !state.quarterSimulated;

  function handleEdit(model: LaptopModel) {
    wizardDispatch({ type: "LOAD_DESIGN", design: model.design });
    navigateTo("designWizard");
  }

  function handleManufacturing(model: LaptopModel) {
    const plan = model.manufacturingPlan;
    const isCurrentQuarterPlan = plan?.year === state.year && plan?.quarter === state.quarter;
    const isAdditional = model.status === "manufacturing" || model.status === "onSale";

    if (plan && isCurrentQuarterPlan) {
      // Editing same-quarter plan — load existing values
      mfgDispatch({ type: "LOAD_PLAN", modelId: model.design.id, plan, isAdditionalOrder: isAdditional });
    } else {
      // New order (first time, or additional order in a later quarter)
      const promptIds = selectPrompts(model.design.modelType, null);
      const hasPriorOrder = plan?.year === state.year;
      mfgDispatch({
        type: "INIT",
        modelId: model.design.id,
        promptIds,
        baseBomCost: model.design.unitCost,
        isAdditionalOrder: hasPriorOrder,
        existingRetailPrice: model.retailPrice ?? undefined,
      });
    }
    navigateTo("manufacturingWizard");
  }

  function handleScrap(modelId: string) {
    dispatch({ type: "UPDATE_MODEL_STATUS", modelId, status: "discontinued" });
    setDiscontinueModel(null);
  }

  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={panelStyle}>
      <ScreenHeader
        title="Your Models"
        icon={Laptop}
        right={
          <>
            <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              {activeModels.length} / {MAX_MODELS} slots
            </span>
            <MenuButton
              variant="accent"
              onClick={() => navigateTo("designWizard")}
              disabled={emptySlots === 0 || !canDesignNew}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Plus size={16} /> New Design
              </span>
            </MenuButton>
          </>
        }
      />

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", marginTop: tokens.spacing.lg }}>
      {activeModels.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: `${tokens.spacing.xl * 2}px 0`,
          color: tokens.colors.textMuted,
        }}>
          <Laptop size={48} style={{ marginBottom: tokens.spacing.md, opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: tokens.font.sizeLarge }}>No models yet</p>
          <p style={{ margin: 0, marginTop: tokens.spacing.sm, fontSize: tokens.font.sizeBase }}>
            Design your first laptop to get started.
          </p>
        </div>
      ) : (
        activeModels.map((model) => (
          <ModelCard
            key={model.design.id}
            model={model}
            companyName={player.name}
            onEdit={canDesignNew ? () => handleEdit(model) : undefined}
            onAddManufacturing={() => handleManufacturing(model)}
            onChangePricing={() => setPricingModel(model)}
            onDiscontinue={() => setDiscontinueModel(model)}
            gameYear={state.year}
            gameQuarter={state.quarter}
            quarterSimulated={state.quarterSimulated}
          />
        ))
      )}

      {discontinuedModels.length > 0 && (
        <div style={{ marginTop: tokens.spacing.lg }}>
          <button
            onClick={() => setShowDiscontinued(!showDiscontinued)}
            style={{
              background: "none",
              border: "none",
              color: tokens.colors.textMuted,
              cursor: "pointer",
              fontSize: tokens.font.sizeSmall,
              fontFamily: tokens.font.family,
              display: "flex",
              alignItems: "center",
              gap: tokens.spacing.xs,
              padding: 0,
            }}
          >
            {showDiscontinued ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {discontinuedModels.length} discontinued model{discontinuedModels.length !== 1 ? "s" : ""}
          </button>
          {showDiscontinued && (
            <div style={{ marginTop: tokens.spacing.sm }}>
              {discontinuedModels.map((model) => {
                const hasStock = model.unitsInStock > 0;
                return (
                  <ModelCard
                    key={model.design.id}
                    model={model}
                    companyName={player.name}
                    disabled={!hasStock}
                    onChangePricing={hasStock ? () => setPricingModel(model) : undefined}
                    gameYear={state.year}
                    gameQuarter={state.quarter}
                    quarterSimulated={state.quarterSimulated}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
      <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
      </div>
      <StatusBar />

      {discontinueModel && (
        <ConfirmDiscardDialog
          title={discontinueModel.status === "draft" ? "Scrap Model?" : "Discontinue Model?"}
          message={
            discontinueModel.status === "draft"
              ? `Are you sure you want to scrap ${modelDisplayName(player.name, discontinueModel.design.name)}? This cannot be undone.`
              : `Are you sure you want to discontinue ${modelDisplayName(player.name, discontinueModel.design.name)}?${discontinueModel.unitsInStock > 0 ? ` ${discontinueModel.unitsInStock.toLocaleString()} units in stock will be lost.` : ""}`
          }
          confirmLabel={discontinueModel.status === "draft" ? "Scrap" : "Discontinue"}
          cancelLabel="Cancel"
          onConfirm={() => handleScrap(discontinueModel.design.id)}
          onCancel={() => setDiscontinueModel(null)}
        />
      )}

      {pricingModel && pricingModel.retailPrice !== null && (
        <ChangePricingDialog
          modelName={modelDisplayName(player.name, pricingModel.design.name)}
          currentPrice={pricingModel.retailPrice}
          baseBomCost={pricingModel.design.unitCost}
          onConfirm={(newPrice) => {
            dispatch({ type: "SET_RETAIL_PRICE", modelId: pricingModel.design.id, retailPrice: newPrice });
            setPricingModel(null);
          }}
          onCancel={() => setPricingModel(null)}
          onOpenFullWizard={() => {
            setPricingModel(null);
            handleManufacturing(pricingModel);
          }}
        />
      )}
    </ContentPanel>
  );
}

function ModelCard({
  model,
  companyName,
  onEdit,
  onAddManufacturing,
  onChangePricing,
  onDiscontinue,
  disabled,
  gameYear,
  gameQuarter,
  quarterSimulated,
}: {
  model: LaptopModel;
  companyName: string;
  onEdit?: () => void;
  onAddManufacturing?: () => void;
  onChangePricing?: () => void;
  onDiscontinue?: () => void;
  disabled?: boolean;
  gameYear: number;
  gameQuarter: 1 | 2 | 3 | 4;
  quarterSimulated: boolean;
}) {
  const { design, status, retailPrice, manufacturingQuantity, yearDesigned, manufacturingPlan } = model;
  const hasCurrentQuarterPlan = manufacturingPlan !== null && manufacturingPlan.year === gameYear && manufacturingPlan.quarter === gameQuarter;
  const hasPlanThisYear = manufacturingPlan !== null && manufacturingPlan.year === gameYear;
  const isRetailOnly = hasDiscontinuedComponents(design, gameYear);
  const displayStatus = getDisplayStatus(model, gameYear, gameQuarter);
  const statusStyle = STATUS_CONFIG[displayStatus];

  // Out-of-stock warning: model is actively selling but has zero inventory and no pending production
  const isSellingModel = status === "manufacturing" || status === "onSale";
  const outOfStock = isSellingModel && !isRetailOnly && model.unitsInStock === 0 && !hasCurrentQuarterPlan;

  // An additional order is a current-quarter plan on a model that was already manufacturing/selling
  const isAdditionalOrder = hasCurrentQuarterPlan && (status === "manufacturing" || status === "onSale");

  // Button label logic
  const getMfgButtonLabel = () => {
    if (isAdditionalOrder) return "Modify Additional Order";
    if (hasCurrentQuarterPlan) return "Edit Manufacturing Plan";
    if (hasPlanThisYear) return "Order Additional Units";
    return "Add Manufacturing Plan";
  };

  // Show "Change Pricing" for models that already have a price set and aren't in the first manufacturing plan flow
  // Also allow pricing changes on discontinued models that still have inventory (clearance sales)
  const canChangePricing = retailPrice !== null && !isRetailOnly && (
    (hasPlanThisYear && (!hasCurrentQuarterPlan || isAdditionalOrder)) ||
    (status === "discontinued" && model.unitsInStock > 0)
  );

  // "Producing" only shows when there's a current-quarter plan that hasn't been simulated yet
  const isPendingProduction = hasCurrentQuarterPlan && !quarterSimulated && !manufacturingPlan?.results && manufacturingQuantity !== null;
  const showInventorySection = isPendingProduction || model.unitsInStock > 0;

  return (
    <div style={{ ...modelCardStyle, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
            {modelDisplayName(companyName, design.name)}
          </div>
          <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            {design.screenSize}" &middot; {design.modelType === "brandNew" ? "Brand New" : design.modelType === "successor" ? "Successor" : "Spec Bump"} &middot; Designed {yearDesigned}
          </div>
        </div>
        <span style={{
          fontSize: tokens.font.sizeSmall,
          padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
          borderRadius: tokens.borderRadius.sm,
          background: statusStyle.bg,
          color: statusStyle.color,
          fontWeight: 600,
        }}>
          {statusStyle.label}
        </span>
      </div>

      <div style={{ marginTop: tokens.spacing.md }}>
        <SpecRow label="Unit Cost" value={`$${design.unitCost.toLocaleString()}`} />
        {retailPrice !== null && (
          <SpecRow label="Retail Price" value={`$${retailPrice.toLocaleString()}`} />
        )}
      </div>

      {showInventorySection && (
        <div style={{ marginTop: tokens.spacing.sm, paddingTop: tokens.spacing.sm, borderTop: `1px solid ${tokens.colors.panelBorder}` }}>
          {isPendingProduction && (
            <SpecRow label="Producing" value={`${manufacturingQuantity!.toLocaleString()} units`} />
          )}
          {model.unitsInStock > 0 && (
            <SpecRow label="In Stock" value={`${model.unitsInStock.toLocaleString()} units`} />
          )}
          {isPendingProduction && (manufacturingQuantity ?? 0) > 0 && model.unitsInStock > 0 && (
            <SpecRow
              label="Total Available"
              value={`${((manufacturingQuantity ?? 0) + model.unitsInStock).toLocaleString()} units`}
              highlight
            />
          )}
        </div>
      )}

      {isRetailOnly && model.unitsInStock > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing.xs,
          marginTop: tokens.spacing.sm,
          color: tokens.colors.warning,
          fontSize: tokens.font.sizeSmall,
          fontWeight: 600,
        }}>
          Retail only — components discontinued, selling remaining inventory
        </div>
      )}

      {outOfStock && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing.xs,
          marginTop: tokens.spacing.sm,
          color: tokens.colors.warning,
          fontSize: tokens.font.sizeSmall,
          fontWeight: 600,
        }}>
          <AlertTriangle size={14} /> Out of stock — order more units or discontinue
        </div>
      )}

      {hasPlanThisYear && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing.xs,
          marginTop: tokens.spacing.sm,
          color: tokens.colors.success,
          fontSize: tokens.font.sizeSmall,
          fontWeight: 600,
        }}>
          <CheckCircle size={14} />
          {hasCurrentQuarterPlan
            ? "Manufacturing plan confirmed"
            : `Ordered ${(manufacturingPlan!.manufacturing.unitsOrdered).toLocaleString()} units in Q${manufacturingPlan!.quarter}`}
        </div>
      )}

      {!disabled && (
        <div style={actionBarStyle}>
          {(status === "draft" || status === "designed") && onEdit && (
            <MenuButton
              onClick={onEdit}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Pencil size={14} /> {status === "draft" ? "Edit Design" : "Redesign"}
              </span>
            </MenuButton>
          )}
          {(status === "designed" || ((status === "onSale" || status === "manufacturing") && !isRetailOnly)) && onAddManufacturing && (
            <MenuButton
              variant="accent"
              onClick={onAddManufacturing}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Factory size={14} /> {getMfgButtonLabel()}
              </span>
            </MenuButton>
          )}
          {(status === "onSale" || status === "manufacturing" || status === "discontinued") && !isRetailOnly && canChangePricing && onChangePricing && (
            <MenuButton
              onClick={onChangePricing}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <DollarSign size={14} /> Change Pricing
              </span>
            </MenuButton>
          )}
          {onDiscontinue && (
            <MenuButton
              onClick={onDiscontinue}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Trash2 size={14} /> {status === "draft" ? "Scrap" : "Discontinue"}
              </span>
            </MenuButton>
          )}
        </div>
      )}
    </div>
  );
}


function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ ...specRowStyle, ...(highlight ? { borderTop: `1px solid ${tokens.colors.panelBorder}`, marginTop: tokens.spacing.xs, paddingTop: tokens.spacing.sm } : {}) }}>
      <span style={{ color: highlight ? tokens.colors.text : tokens.colors.textMuted, fontWeight: highlight ? 600 : undefined }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
