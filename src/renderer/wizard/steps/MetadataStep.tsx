import { useState, useRef, useCallback } from "react";
import { useWizard } from "../WizardContext";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { ModelType } from "../types";
import { tokens } from "../../shell/tokens";
import { useClickOutside } from "../../hooks/useClickOutside";

const MODEL_TYPE_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  { value: "brandNew", label: "Brand New", description: "Fresh design from scratch. Highest R&D cost." },
  { value: "successor", label: "Successor", description: "New body + components. Reduced R&D cost." },
  { value: "specBump", label: "Spec Bump", description: "Reuses predecessor's body and screen size. Components only." },
];

export function MetadataStep() {
  const { state, dispatch, gameYear } = useWizard();
  const { state: gameState } = useGame();

  const showPredecessor = state.modelType !== "brandNew";

  const player = getPlayerCompany(gameState);

  // Populate predecessor models from game state (exclude the model currently being edited)
  const predecessorModels = player.models
    .filter((m) => m.design.id !== state.editingModelId)
    .map((m) => ({ id: m.design.id, name: modelDisplayName(player.name, m.design.name), year: m.yearDesigned }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2>Laptop Info</h2>
        <p style={{ color: "#aaa", marginTop: "4px" }}>Name your laptop and choose the model type.</p>
      </div>

      <div>
        <label style={{ display: "block", color: "#aaa", marginBottom: "8px", fontSize: "0.875rem" }}>
          Laptop Name
        </label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
          placeholder="e.g. ProBook 2000"
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 12px",
            background: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "#e0e0e0",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", color: "#aaa", marginBottom: "8px", fontSize: "0.875rem" }}>
          Model Type
        </label>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
                  background: isSelected ? "#1e3a5f" : "#2a2a2a",
                  border: isSelected ? `2px solid ${tokens.colors.interactiveAccent}` : "2px solid #444",
                  borderRadius: "8px",
                  color: isSelected ? tokens.colors.interactiveAccent : "#ccc",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "0.875rem", marginBottom: "4px" }}>{opt.label}</div>
                <div style={{ fontSize: "0.75rem", color: isSelected ? tokens.colors.interactiveAccent : "#888" }}>{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {showPredecessor && (
        <div>
          <label style={{ display: "block", color: "#aaa", marginBottom: "8px", fontSize: "0.875rem" }}>
            Predecessor Model
          </label>
          {predecessorModels.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.875rem" }}>
              No previous models available. Start with a Brand New model first.
            </p>
          ) : (
            <select
              value={state.predecessorId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const model = getPlayerCompany(gameState).models.find((m) => m.design.id === id);
                dispatch({ type: "SET_PREDECESSOR", predecessorId: id, predecessorDesign: model?.design, gameYear });
              }}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "10px 12px",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#e0e0e0",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            >
              <option value="">Select a predecessor...</option>
              {predecessorModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.year})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {predecessorModels.length > 0 && (
        <LoadFromModelPicker
          models={predecessorModels}
          onSelect={(modelId) => {
            const model = getPlayerCompany(gameState).models.find((m) => m.design.id === modelId);
            if (model) {
              dispatch({ type: "PREFILL_FROM_MODEL", design: model.design, gameYear });
            }
          }}
        />
      )}
    </div>
  );
}

function LoadFromModelPicker({
  models,
  onSelect,
}: {
  models: { id: string; name: string; year: number }[];
  onSelect: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div>
      <label style={{ display: "block", color: "#aaa", marginBottom: "8px", fontSize: "0.875rem" }}>
        Load from existing model
      </label>
      <div ref={ref} style={{ position: "relative", maxWidth: "400px" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "#888",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Copy options from a previous model...</span>
          <span style={{ fontSize: "0.6em" }}>{open ? "\u25B2" : "\u25BC"}</span>
        </button>
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: tokens.colors.cardBg,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: "6px",
              overflow: "hidden",
              overflowY: "auto",
              maxHeight: 240,
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: tokens.colors.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = tokens.colors.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {model.name} ({model.year})
              </div>
            ))}
          </div>
        )}
      </div>
      <p style={{ color: "#666", fontSize: "0.75rem", marginTop: "6px" }}>
        Fills in options you haven't already selected. Discontinued parts are skipped.
      </p>
    </div>
  );
}
