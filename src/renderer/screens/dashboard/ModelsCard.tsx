import { CSSProperties } from "react";
import { Laptop } from "lucide-react";
import { useNavigation } from "../../navigation/NavigationContext";
import { useGame } from "../../state/GameContext";
import { ModelStatus } from "../../state/gameTypes";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, emptyStateStyle } from "./styles";
import { getActiveModels, MAX_MODELS } from "./utils";

const STATUS_LABELS: Record<ModelStatus, string> = {
  draft: "Draft",
  manufacturing: "Manufacturing",
  onSale: "On Sale",
  discontinued: "Discontinued",
};

const modelRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.spacing.xs}px 0`,
};

const statusBadgeStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderRadius: tokens.borderRadius.sm,
  background: tokens.colors.panelBorder,
};

export function ModelsCard() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const activeModels = getActiveModels(state);
  const emptySlots = MAX_MODELS - activeModels.length;

  return (
    <BentoCard title="Your Models" icon={Laptop} screen="modelManagement">
      {activeModels.length === 0 ? (
        <p style={emptyStateStyle}>No models yet. Design your first laptop!</p>
      ) : (
        activeModels.map((model) => (
          <div key={model.design.id} style={modelRowStyle}>
            <div>
              <div>{model.design.name}</div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, display: "flex", gap: tokens.spacing.sm }}>
                {model.retailPrice !== null && (
                  <span>${model.retailPrice.toLocaleString()}</span>
                )}
                {model.unitsInStock > 0 && (
                  <span>{model.unitsInStock.toLocaleString()} in stock</span>
                )}
              </div>
            </div>
            <span style={statusBadgeStyle}>{STATUS_LABELS[model.status]}</span>
          </div>
        ))
      )}
      {emptySlots > 0 && activeModels.length > 0 && (
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs }}>
          {emptySlots} empty {emptySlots === 1 ? "slot" : "slots"}
        </p>
      )}
      <MenuButton
        variant="accent"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          navigateTo("designWizard");
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
        disabled={emptySlots === 0}
      >
        + New Design
      </MenuButton>
    </BentoCard>
  );
}
