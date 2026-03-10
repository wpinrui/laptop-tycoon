import { CSSProperties, useState } from "react";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
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
import {
  Laptop,
  Plus,
  Factory,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
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
};

export function ModelManagementScreen() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const { dispatch: mfgDispatch } = useMfgWizard();
  const [confirmScrapId, setConfirmScrapId] = useState<string | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const player = getPlayerCompany(state);
  const activeModels = getActiveModels(state);
  const discontinuedModels = player.models.filter((m) => m.status === "discontinued");
  const emptySlots = MAX_MODELS - activeModels.length;
  const canDesignNew = !state.quarterSimulated;

  function handleManufacturing(model: LaptopModel) {
    if (model.manufacturingPlan) {
      mfgDispatch({ type: "LOAD_PLAN", modelId: model.design.id, plan: model.manufacturingPlan });
    } else {
      const promptIds = selectPrompts(model.design.modelType, null);
      mfgDispatch({ type: "INIT", modelId: model.design.id, promptIds, baseBomCost: model.design.unitCost });
    }
    navigateTo("manufacturingWizard");
  }

  function handleScrap(modelId: string) {
    dispatch({ type: "UPDATE_MODEL_STATUS", modelId, status: "discontinued" });
    setConfirmScrapId(null);
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
            confirmScrap={confirmScrapId === model.design.id}
            onAddManufacturing={() => handleManufacturing(model)}
            onScrapClick={() => setConfirmScrapId(model.design.id)}
            onScrapConfirm={() => handleScrap(model.design.id)}
            onScrapCancel={() => setConfirmScrapId(null)}
            gameYear={state.year}
            gameQuarter={state.quarter}
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
              {discontinuedModels.map((model) => (
                <ModelCard
                  key={model.design.id}
                  model={model}
                  companyName={player.name}
                  confirmScrap={false}
                  onScrapClick={() => {}}
                  onScrapConfirm={() => {}}
                  onScrapCancel={() => {}}
                  disabled
                  gameYear={state.year}
                  gameQuarter={state.quarter}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ flexShrink: 0, height: tokens.spacing.lg }} />
      </div>
      <StatusBar />
    </ContentPanel>
  );
}

function ModelCard({
  model,
  companyName,
  confirmScrap,
  onAddManufacturing,
  onScrapClick,
  onScrapConfirm,
  onScrapCancel,
  disabled,
  gameYear,
  gameQuarter,
}: {
  model: LaptopModel;
  companyName: string;
  confirmScrap: boolean;
  onAddManufacturing?: () => void;
  onScrapClick: () => void;
  onScrapConfirm: () => void;
  onScrapCancel: () => void;
  disabled?: boolean;
  gameYear: number;
  gameQuarter: 1 | 2 | 3 | 4;
}) {
  const { design, status, retailPrice, manufacturingQuantity, yearDesigned, manufacturingPlan } = model;
  const hasPlan = manufacturingPlan !== null && manufacturingPlan.year === gameYear && manufacturingPlan.quarter === gameQuarter;
  const isRetailOnly = hasDiscontinuedComponents(design, gameYear);
  const displayStatus = getDisplayStatus(model, gameYear, gameQuarter);
  const statusStyle = STATUS_CONFIG[displayStatus];

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

      {((manufacturingQuantity !== null) || model.unitsInStock > 0) && (
        <div style={{ marginTop: tokens.spacing.sm, paddingTop: tokens.spacing.sm, borderTop: `1px solid ${tokens.colors.panelBorder}` }}>
          {manufacturingQuantity !== null && (
            <SpecRow label="Producing" value={`${manufacturingQuantity.toLocaleString()} units`} />
          )}
          {model.unitsInStock > 0 && (
            <SpecRow label="In Stock" value={`${model.unitsInStock.toLocaleString()} units`} />
          )}
          {hasPlan && (manufacturingQuantity ?? 0) > 0 && model.unitsInStock > 0 && (
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

      {hasPlan && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing.xs,
          marginTop: tokens.spacing.sm,
          color: tokens.colors.success,
          fontSize: tokens.font.sizeSmall,
          fontWeight: 600,
        }}>
          <CheckCircle size={14} /> Manufacturing plan confirmed
        </div>
      )}

      {!disabled && (
        <div style={actionBarStyle}>
          {status === "draft" && (
            <>
              {onAddManufacturing && (
                <MenuButton
                  variant="accent"
                  onClick={onAddManufacturing}
                  style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                    <Factory size={14} /> {hasPlan ? "Edit Manufacturing Plan" : "Add Manufacturing Plan"}
                  </span>
                </MenuButton>
              )}
            </>
          )}
          {(status === "onSale" || status === "manufacturing") && !isRetailOnly && onAddManufacturing && (
            <MenuButton
              variant="accent"
              onClick={onAddManufacturing}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Factory size={14} /> {hasPlan ? "Edit Manufacturing Plan" : "New Manufacturing Plan"}
              </span>
            </MenuButton>
          )}
          <InlineConfirm
            label={status === "draft" ? "Scrap" : "Discontinue"}
            confirmMessage={status === "draft" ? "Scrap this model?" : "Discontinue this model?"}
            isConfirming={confirmScrap}
            onTrigger={onScrapClick}
            onConfirm={onScrapConfirm}
            onCancel={onScrapCancel}
          />
        </div>
      )}
    </div>
  );
}

function InlineConfirm({
  label,
  confirmMessage,
  isConfirming,
  onTrigger,
  onConfirm,
  onCancel,
}: {
  label: string;
  confirmMessage: string;
  isConfirming: boolean;
  onTrigger: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (isConfirming) {
    return (
      <div style={{ display: "flex", gap: tokens.spacing.xs, alignItems: "center" }}>
        <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger }}>{confirmMessage}</span>
        <MenuButton
          onClick={onConfirm}
          style={{
            fontSize: tokens.font.sizeSmall,
            padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
            background: tokens.colors.danger,
            color: "#fff",
          }}
        >
          Yes
        </MenuButton>
        <MenuButton
          onClick={onCancel}
          style={{
            fontSize: tokens.font.sizeSmall,
            padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
          }}
        >
          No
        </MenuButton>
      </div>
    );
  }
  return (
    <MenuButton
      onClick={onTrigger}
      style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
        <Trash2 size={14} /> {label}
      </span>
    </MenuButton>
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
