import { useWizard } from "../WizardContext";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { ModelType } from "../types";
import { tokens } from "../../shell/tokens";
import { CustomSelect } from "../../shell/CustomSelect";

const MODEL_TYPE_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  { value: "brandNew", label: "Brand New", description: "Fresh design from scratch. Highest R&D cost." },
  { value: "successor", label: "Successor", description: "New body + components. Reduced R&D cost." },
  { value: "specBump", label: "Spec Bump", description: "Reuses predecessor's body and screen size. Components only." },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.sm,
  fontSize: tokens.font.sizeSmall,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 400,
  padding: "10px 12px",
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.cardBorder}`,
  borderRadius: tokens.borderRadius.sm,
  color: tokens.colors.text,
  fontSize: tokens.font.sizeBase,
  fontFamily: "inherit",
  outline: "none",
};

export function MetadataStep() {
  const { state, dispatch, gameYear } = useWizard();
  const { state: gameState } = useGame();

  const showPredecessor = state.modelType !== "brandNew";

  const player = getPlayerCompany(gameState);

  // Populate predecessor models from game state (exclude the model currently being edited)
  const predecessorModels = player.models
    .filter((m) => m.design.id !== state.editingModelId)
    .map((m) => ({ id: m.design.id, name: modelDisplayName(player.name, m.design.name), year: m.yearDesigned }));

  const predecessorOptions = [
    { value: "", label: "Select a predecessor..." },
    ...predecessorModels.map((m) => ({ value: m.id, label: `${m.name} (${m.year})` })),
  ];

  const loadFromOptions = [
    { value: "", label: "Copy options from a previous model..." },
    ...predecessorModels.map((m) => ({ value: m.id, label: `${m.name} (${m.year})` })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.lg }}>
      <div>
        <h2>Laptop Info</h2>
        <p style={{ color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>Name your laptop and choose the model type.</p>
      </div>

      <div>
        <label style={labelStyle}>Laptop Name</label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
          placeholder="e.g. ProBook 2000"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Model Type</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {MODEL_TYPE_OPTIONS.map((opt) => {
            const isSelected = state.modelType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => dispatch({ type: "SET_MODEL_TYPE", modelType: opt.value })}
                style={{
                  flex: "1 1 200px",
                  display: "flex",
                  flexDirection: "column" as const,
                  justifyContent: "flex-start",
                  padding: "12px 16px",
                  background: isSelected ? tokens.colors.interactiveAccentBg : tokens.colors.cardBg,
                  border: isSelected ? `2px solid ${tokens.colors.interactiveAccent}` : `2px solid ${tokens.colors.cardBorder}`,
                  borderRadius: tokens.borderRadius.sm,
                  color: isSelected ? tokens.colors.interactiveAccent : tokens.colors.text,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: tokens.font.sizeBase, marginBottom: tokens.spacing.xs }}>{opt.label}</div>
                <div style={{ fontSize: tokens.font.sizeSmall, color: isSelected ? tokens.colors.interactiveAccent : tokens.colors.textMuted }}>{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {showPredecessor && (
        <div>
          <label style={labelStyle}>Predecessor Model</label>
          {predecessorModels.length === 0 ? (
            <p style={{ color: tokens.colors.textMuted, fontStyle: "italic", fontSize: tokens.font.sizeBase }}>
              No previous models available. Start with a Brand New model first.
            </p>
          ) : (
            <CustomSelect
              value={state.predecessorId ?? ""}
              onChange={(id) => {
                const resolvedId = id || null;
                const model = getPlayerCompany(gameState).models.find((m) => m.design.id === resolvedId);
                dispatch({ type: "SET_PREDECESSOR", predecessorId: resolvedId, predecessorDesign: model?.design, gameYear });
              }}
              options={predecessorOptions}
              size="md"
            />
          )}
        </div>
      )}

      {predecessorModels.length > 0 && (
        <div>
          <label style={labelStyle}>Load from existing model</label>
          <CustomSelect
            value=""
            onChange={(id) => {
              if (!id) return;
              const model = getPlayerCompany(gameState).models.find((m) => m.design.id === id);
              if (model) {
                dispatch({ type: "PREFILL_FROM_MODEL", design: model.design, gameYear });
              }
            }}
            options={loadFromOptions}
            size="md"
          />
          <p style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall, marginTop: tokens.spacing.xs }}>
            Fills in options you haven't already selected. Discontinued parts are skipped.
          </p>
        </div>
      )}
    </div>
  );
}
