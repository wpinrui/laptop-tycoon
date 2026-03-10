import { CSSProperties } from "react";
import { Laptop } from "lucide-react";
import { useNavigation } from "../../navigation/NavigationContext";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";
import { getActiveModels, MAX_MODELS } from "./utils";
import { STATUS_CONFIG } from "../../statusConfig";

const modelRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.spacing.sm}px 0`,
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

export function ModelsCard() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  const activeModels = getActiveModels(state);
  const emptySlots = MAX_MODELS - activeModels.length;
  const canDesignNew = !state.quarterSimulated;

  return (
    <BentoCard title="Your Models" icon={Laptop} screen="modelManagement">
      {activeModels.length === 0 ? (
        <p style={emptyStateStyle}>No models yet. Design your first laptop!</p>
      ) : (
        activeModels.map((model) => {
          const status = STATUS_CONFIG[model.status];
          return (
            <div key={model.design.id} style={modelRowStyle}>
              <div>
                <div style={{ fontWeight: 600, fontSize: tokens.font.sizeBase }}>{modelDisplayName(player.name, model.design.name)}</div>
                <div style={{ fontSize: tokens.font.sizeSmall, display: "flex", gap: tokens.spacing.sm, marginTop: 2 }}>
                  {model.retailPrice !== null && (
                    <span style={{ color: tokens.colors.text }}>${model.retailPrice.toLocaleString()}</span>
                  )}
                  {model.manufacturingQuantity !== null && model.manufacturingQuantity > 0 && (
                    <span style={{ color: tokens.colors.textMuted }}>{model.manufacturingQuantity.toLocaleString()} units</span>
                  )}
                  {model.unitsInStock > 0 && (
                    <span style={{ color: tokens.colors.textMuted }}>{model.unitsInStock.toLocaleString()} in stock</span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: tokens.font.sizeSmall,
                padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                borderRadius: tokens.borderRadius.sm,
                background: status.bg,
                color: status.color,
                fontWeight: 500,
              }}>{status.label}</span>
            </div>
          );
        })
      )}
      <MenuButton
        variant="surface"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          navigateTo("designWizard");
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%", fontSize: tokens.font.sizeBase }}
        disabled={emptySlots === 0 || !canDesignNew}
      >
        + New Design
      </MenuButton>
    </BentoCard>
  );
}
