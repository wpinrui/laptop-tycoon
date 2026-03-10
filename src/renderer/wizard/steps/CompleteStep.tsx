import { useWizard } from "../WizardContext";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { RD_COST } from "../../../simulation/tunables";
import { MenuButton } from "../../shell/MenuButton";
import { CheckCircle, FileText } from "lucide-react";

export function CompleteStep({ onFinalize, onSaveAsDraft }: {
  onFinalize: () => void;
  onSaveAsDraft: () => void;
}) {
  const { state } = useWizard();
  const { state: gameState } = useGame();
  const rdCost = RD_COST[state.modelType];
  const isEditing = !!state.editingModelId;
  const canAfford = gameState.cash >= rdCost;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: tokens.spacing.xl }}>
      <h2 style={{ marginBottom: tokens.spacing.sm }}>
        {isEditing ? "Save Changes" : "Complete Design"}
      </h2>
      <p style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.xl }}>
        {isEditing
          ? "Choose how to save your changes."
          : "Your design is ready. Choose how to proceed."}
      </p>

      {/* Finalize option */}
      <div
        style={{
          background: tokens.colors.interactiveAccentBg,
          border: `1px solid ${tokens.colors.interactiveAccent}`,
          borderRadius: tokens.borderRadius.md,
          padding: tokens.spacing.lg,
          marginBottom: tokens.spacing.md,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
          <CheckCircle size={20} color={tokens.colors.interactiveAccent} />
          <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>
            {isEditing ? "Save Redesign" : "Finalize Design"}
          </span>
        </div>
        <p style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase, margin: 0, marginBottom: tokens.spacing.md }}>
          Commits to the design and pays R&D costs. The design can still be changed later, but R&D will be charged again.
        </p>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${tokens.spacing.sm}px 0`,
          borderTop: `1px solid ${tokens.colors.panelBorder}`,
          marginBottom: tokens.spacing.md,
        }}>
          <span style={{ fontSize: tokens.font.sizeBase, color: tokens.colors.text }}>R&D Cost</span>
          <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600, color: tokens.colors.interactiveAccent }}>
            ${rdCost.toLocaleString()}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${tokens.spacing.sm}px 0`,
          marginBottom: tokens.spacing.md,
        }}>
          <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            Cash after: ${(gameState.cash - rdCost).toLocaleString()}
          </span>
        </div>
        <MenuButton
          variant="accent"
          onClick={onFinalize}
          disabled={!canAfford}
          style={{ width: "100%", fontSize: tokens.font.sizeBase, fontWeight: 600 }}
        >
          {isEditing ? "Save Redesign" : "Finalize Design"} — ${rdCost.toLocaleString()}
        </MenuButton>
        {!canAfford && (
          <p style={{ color: tokens.colors.danger, fontSize: tokens.font.sizeSmall, margin: 0, marginTop: tokens.spacing.sm }}>
            Not enough cash
          </p>
        )}
      </div>

      {/* Save as Draft option */}
      {!isEditing && (
        <div
          style={{
            background: tokens.colors.surface,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.lg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
            <FileText size={20} color={tokens.colors.textMuted} />
            <span style={{ fontSize: tokens.font.sizeLarge, fontWeight: 600 }}>Save as Draft</span>
          </div>
          <p style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase, margin: 0, marginBottom: tokens.spacing.md }}>
            Save your design without paying R&D. You can continue editing for free and finalize later.
          </p>
          <MenuButton
            onClick={onSaveAsDraft}
            style={{ width: "100%", fontSize: tokens.font.sizeBase }}
          >
            Save as Draft — Free
          </MenuButton>
        </div>
      )}
    </div>
  );
}
