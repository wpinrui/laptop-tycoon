import { CSSProperties, useState } from "react";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { useWizard } from "../wizard/WizardContext";
import { LaptopModel, ModelStatus } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { getActiveModels, MAX_MODELS } from "./dashboard/utils";
import {
  Laptop,
  Plus,
  Pencil,
  DollarSign,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_COLOURS: Record<ModelStatus, string> = {
  draft: "#ffa726",
  manufacturing: "#42a5f5",
  onSale: "#66bb6a",
  discontinued: "#888",
};

const STATUS_LABELS: Record<ModelStatus, string> = {
  draft: "Draft",
  manufacturing: "Manufacturing",
  onSale: "On Sale",
  discontinued: "Discontinued",
};

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

const modelCardStyle: CSSProperties = {
  background: tokens.colors.surface,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
};

const specRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.xs}px 0`,
  fontSize: tokens.font.sizeSmall,
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
  const { dispatch: wizardDispatch } = useWizard();
  const [confirmScrapId, setConfirmScrapId] = useState<string | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const activeModels = getActiveModels(state);
  const discontinuedModels = state.models.filter((m) => m.status === "discontinued");
  const emptySlots = MAX_MODELS - activeModels.length;

  function handleEdit(model: LaptopModel) {
    wizardDispatch({ type: "LOAD_DESIGN", design: model.design });
    navigateTo("designWizard");
  }

  function handleScrap(modelId: string) {
    dispatch({ type: "UPDATE_MODEL_STATUS", modelId, status: "discontinued" });
    setConfirmScrapId(null);
  }

  return (
    <ContentPanel maxWidth={1800} style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle }}>Your Models</h2>
          <p style={{ margin: 0, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}>
            {activeModels.length} / {MAX_MODELS} slots used
          </p>
        </div>
        <div style={{ display: "flex", gap: tokens.spacing.sm }}>
          <MenuButton onClick={() => navigateTo("dashboard")}>
            Back
          </MenuButton>
          <MenuButton
            variant="accent"
            onClick={() => navigateTo("designWizard")}
            disabled={emptySlots === 0}
          >
            <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
              <Plus size={16} /> New Design
            </span>
          </MenuButton>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginTop: tokens.spacing.lg }}>
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
            confirmScrap={confirmScrapId === model.design.id}
            onEdit={() => handleEdit(model)}
            onSetPricing={() => navigateTo("pricingManufacturing")}
            onScrapClick={() => setConfirmScrapId(model.design.id)}
            onScrapConfirm={() => handleScrap(model.design.id)}
            onScrapCancel={() => setConfirmScrapId(null)}
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
                  confirmScrap={false}
                  onSetPricing={() => {}}
                  onScrapClick={() => {}}
                  onScrapConfirm={() => {}}
                  onScrapCancel={() => {}}
                  disabled
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </ContentPanel>
  );
}

function ModelCard({
  model,
  confirmScrap,
  onEdit,
  onSetPricing,
  onScrapClick,
  onScrapConfirm,
  onScrapCancel,
  disabled,
}: {
  model: LaptopModel;
  confirmScrap: boolean;
  onEdit?: () => void;
  onSetPricing: () => void;
  onScrapClick: () => void;
  onScrapConfirm: () => void;
  onScrapCancel: () => void;
  disabled?: boolean;
}) {
  const { design, status, retailPrice, manufacturingQuantity, yearDesigned } = model;

  return (
    <div style={{ ...modelCardStyle, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
            {design.name}
          </div>
          <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
            {design.screenSize}" &middot; {design.modelType === "brandNew" ? "Brand New" : design.modelType === "successor" ? "Successor" : "Spec Bump"} &middot; Designed {yearDesigned}
          </div>
        </div>
        <span style={{
          fontSize: tokens.font.sizeSmall,
          padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
          borderRadius: tokens.borderRadius.sm,
          background: `${STATUS_COLOURS[status]}22`,
          color: STATUS_COLOURS[status],
          fontWeight: 600,
        }}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div style={{ marginTop: tokens.spacing.md }}>
        <SpecRow label="Unit Cost" value={`$${design.unitCost.toLocaleString()}`} />
        <SpecRow label="Components" value={Object.keys(design.components).length.toString()} />
        {retailPrice !== null && (
          <SpecRow label="Retail Price" value={`$${retailPrice.toLocaleString()}`} />
        )}
        {manufacturingQuantity !== null && (
          <SpecRow label="Manufacturing Qty" value={manufacturingQuantity.toLocaleString()} />
        )}
      </div>

      {!disabled && (
        <div style={actionBarStyle}>
          {status === "draft" && (
            <>
              {onEdit && (
                <MenuButton
                  onClick={onEdit}
                  style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                    <Pencil size={14} /> Edit
                  </span>
                </MenuButton>
              )}
              <MenuButton
                variant="accent"
                onClick={onSetPricing}
                style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                  <DollarSign size={14} /> Set Pricing
                </span>
              </MenuButton>
              {confirmScrap ? (
                <div style={{ display: "flex", gap: tokens.spacing.xs, alignItems: "center" }}>
                  <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.danger }}>Scrap this model?</span>
                  <MenuButton
                    onClick={onScrapConfirm}
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
                    onClick={onScrapCancel}
                    style={{
                      fontSize: tokens.font.sizeSmall,
                      padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                    }}
                  >
                    No
                  </MenuButton>
                </div>
              ) : (
                <MenuButton
                  onClick={onScrapClick}
                  style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                    <Trash2 size={14} /> Scrap
                  </span>
                </MenuButton>
              )}
            </>
          )}
          {(status === "manufacturing" || status === "onSale") && (
            <MenuButton
              onClick={onScrapClick}
              style={{ fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: tokens.spacing.xs }}>
                <Trash2 size={14} /> Discontinue
              </span>
            </MenuButton>
          )}
        </div>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={specRowStyle}>
      <span style={{ color: tokens.colors.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
