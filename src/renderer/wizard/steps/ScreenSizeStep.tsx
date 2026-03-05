import { useWizard } from "../WizardContext";
import { formatWeight } from "../constants";
import { SCREEN_SIZES } from "../../../data/screenSizes";
import { StatCard } from "./StatCard";

const MIN_SIZE = SCREEN_SIZES[0].size;
const MAX_SIZE = SCREEN_SIZES[SCREEN_SIZES.length - 1].size;

export function ScreenSizeStep() {
  const { state, dispatch } = useWizard();
  const sizeDef = SCREEN_SIZES.find((s) => s.size === state.screenSize)!;

  function handleChange(value: number) {
    const closest = SCREEN_SIZES.reduce((prev, curr) =>
      Math.abs(curr.size - value) < Math.abs(prev.size - value) ? curr : prev
    );
    dispatch({ type: "SET_SCREEN_SIZE", size: closest.size });
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
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#90caf9",
            }}
          >
            {state.screenSize}"
          </span>
          <span style={{ color: "#888", fontSize: "14px" }}>{MAX_SIZE}"</span>
        </div>

        <input
          type="range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          step={1}
          value={state.screenSize}
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
                color: state.screenSize === s.size ? "#90caf9" : "#666",
                fontWeight: state.screenSize === s.size ? "bold" : "normal",
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
        <StatCard label="Minimum Weight" value={formatWeight(sizeDef.baseWeightG)} />
      </div>
    </div>
  );
}
