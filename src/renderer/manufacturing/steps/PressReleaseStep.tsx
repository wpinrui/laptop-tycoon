import { CSSProperties } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { PRESS_RELEASE_PROMPTS, PRESS_RELEASE_CHAR_LIMIT } from "../data/pressReleasePrompts";

const headerStyle: CSSProperties = {
  background: tokens.colors.surface,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.lg,
};

const promptStyle: CSSProperties = {
  background: tokens.colors.background,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: tokens.borderRadius.sm,
  padding: tokens.spacing.md,
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  fontSize: tokens.font.sizeBase,
  resize: "none",
  boxSizing: "border-box",
};

export function PressReleaseStep() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState } = useGame();

  const model = gameState.models.find((m) => m.design.id === state.modelId);
  if (!model) return <p>Model not found.</p>;

  const prompts = state.pressReleasePromptIds
    .map((id) => PRESS_RELEASE_PROMPTS.find((p) => p.id === id))
    .filter(Boolean) as typeof PRESS_RELEASE_PROMPTS;

  return (
    <div>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Press Release
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Craft your messaging. Reviewers and media may quote your responses.
      </p>

      <div style={headerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: tokens.font.sizeLarge, fontWeight: 700 }}>
              {gameState.companyName}
            </div>
            <div style={{ fontSize: tokens.font.sizeTitle, fontWeight: 700, color: tokens.colors.accent, marginTop: tokens.spacing.xs }}>
              {model.design.name}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
            <div>{model.design.screenSize}" · {Object.keys(model.design.components).length} components</div>
            <div>Unit cost: ${model.design.unitCost.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {prompts.map((prompt) => {
        const response = state.pressReleaseResponses[prompt.id] ?? "";
        const charCount = response.length;

        return (
          <div key={prompt.id} style={promptStyle}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: tokens.spacing.sm }}>
              {prompt.text}
            </label>
            <textarea
              style={inputStyle}
              rows={2}
              maxLength={PRESS_RELEASE_CHAR_LIMIT}
              value={response}
              onChange={(e) =>
                dispatch({ type: "SET_PRESS_RESPONSE", promptId: prompt.id, response: e.target.value })
              }
              placeholder="Your response..."
            />
            <div style={{
              textAlign: "right",
              fontSize: tokens.font.sizeSmall,
              color: charCount > PRESS_RELEASE_CHAR_LIMIT * 0.9 ? tokens.colors.danger : tokens.colors.textMuted,
              marginTop: tokens.spacing.xs,
            }}>
              {charCount}/{PRESS_RELEASE_CHAR_LIMIT}
            </div>
          </div>
        );
      })}
    </div>
  );
}
