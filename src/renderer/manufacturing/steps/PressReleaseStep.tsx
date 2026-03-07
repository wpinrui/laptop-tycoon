import { CSSProperties } from "react";
import { useMfgWizard } from "../ManufacturingWizardContext";
import { tokens } from "../../shell/tokens";
import { PRESS_RELEASE_PROMPTS, PRESS_RELEASE_CHAR_LIMIT } from "../data/pressReleasePrompts";

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

  const prompts = state.pressReleasePromptIds
    .map((id) => PRESS_RELEASE_PROMPTS.find((p) => p.id === id))
    .filter(Boolean) as typeof PRESS_RELEASE_PROMPTS;

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.xs }}>
        Press Release
      </h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>
        Answer in short phrases or taglines (max {PRESS_RELEASE_CHAR_LIMIT} chars). Media may quote your responses.
      </p>

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
              placeholder={`e.g. "${prompt.example}"`}
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
