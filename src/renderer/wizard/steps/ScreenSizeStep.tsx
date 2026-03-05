import { useWizard } from "../WizardContext";
import { SCREEN_SIZES } from "../../../data/screenSizes";
import { ScreenSizeInches } from "../../../data/types";

const MIN_SIZE = SCREEN_SIZES[0].size;
const MAX_SIZE = SCREEN_SIZES[SCREEN_SIZES.length - 1].size;

function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

export function ScreenSizeStep() {
  const { state, dispatch } = useWizard();
  const selected = state.screenSize ?? 14;
  const sizeDef = SCREEN_SIZES.find((s) => s.size === selected)!;

  function handleChange(value: number) {
    const closest = SCREEN_SIZES.reduce((prev, curr) =>
      Math.abs(curr.size - value) < Math.abs(prev.size - value) ? curr : prev
    );
    dispatch({ type: "SET_SCREEN_SIZE", size: closest.size as ScreenSizeInches });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2>Screen Size</h2>
        <p style={{ color: "#aaa", marginTop: "4px" }}>
          Choose a screen size. This determines cooling capacity, battery space, and base weight.
        </p>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "12px",
          }}
        >
          <span style={{ color: "#888", fontSize: "14px" }}>{MIN_SIZE}"</span>
          <span style={{ fontSize: "48px", fontWeight: "bold", color: "#90caf9" }}>
            {selected}"
          </span>
          <span style={{ color: "#888", fontSize: "14px" }}>{MAX_SIZE}"</span>
        </div>

        <input
          type="range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          step={1}
          value={selected}
          onChange={(e) => handleChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#90caf9" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "4px",
          }}
        >
          {SCREEN_SIZES.map((s) => (
            <span
              key={s.size}
              style={{
                fontSize: "11px",
                color: s.size === selected ? "#90caf9" : "#666",
                fontWeight: s.size === selected ? "bold" : "normal",
                width: 0,
                textAlign: "center",
                overflow: "visible",
              }}
            >
              {s.size}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard label="Cooling Capacity" value={`${sizeDef.baseCoolingCapacityW} W`} />
        <StatCard label="Max Battery Capacity" value={`${sizeDef.baseBatteryCapacityWh} Wh`} />
        <StatCard label="Base Weight" value={formatWeight(sizeDef.baseWeightG)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>{label}</div>
      <div style={{ color: "#e0e0e0", fontSize: "20px", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}
