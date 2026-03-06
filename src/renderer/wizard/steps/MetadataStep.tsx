import { useWizard } from "../WizardContext";
import { ModelType } from "../types";

const MODEL_TYPE_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  { value: "brandNew", label: "Brand New", description: "Fresh design from scratch. No loyalty base." },
  { value: "successor", label: "Successor", description: "New body + components. Inherits loyalty and niche reputation." },
  { value: "specBump", label: "Spec Bump", description: "Reuses predecessor's body and screen size. Components only." },
];

// TODO: replace with real predecessor models from game state
const PREDECESSOR_MODELS: { id: string; name: string; year: number }[] = [];

export function MetadataStep() {
  const { state, dispatch } = useWizard();

  const showPredecessor = state.modelType !== "brandNew";

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
                  border: isSelected ? "2px solid #90caf9" : "2px solid #444",
                  borderRadius: "8px",
                  color: isSelected ? "#90caf9" : "#ccc",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "0.875rem", marginBottom: "4px" }}>{opt.label}</div>
                <div style={{ fontSize: "0.75rem", color: isSelected ? "#90caf9" : "#888" }}>{opt.description}</div>
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
          {PREDECESSOR_MODELS.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.875rem" }}>
              No previous models available. Start with a Brand New model first.
            </p>
          ) : (
            <select
              value={state.predecessorId ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_PREDECESSOR", predecessorId: e.target.value || null })
              }
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
              {PREDECESSOR_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.year})
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
