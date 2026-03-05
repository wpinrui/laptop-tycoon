import { useWizard } from "../WizardContext";
import { SCREEN_SIZES } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";

const GAME_YEAR = 2000; // TODO: inject from game state
const MIN_CAPACITY = 20;
const STEP = 5;

function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

export function BatteryStep() {
  const { state, dispatch } = useWizard();
  const screenSizeDef = SCREEN_SIZES.find((s) => s.size === state.screenSize)!;
  const maxCapacity = Math.floor(screenSizeDef.baseBatteryCapacityWh / STEP) * STEP;
  const era = getBatteryEra(GAME_YEAR);

  const capacity = state.batteryCapacityWh;
  const cost = Math.round(capacity * era.costPerWh);
  const weight = Math.round(capacity * era.weightPerWh);

  function handleChange(value: number) {
    dispatch({ type: "SET_BATTERY_CAPACITY", capacityWh: value });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2>Battery</h2>
        <p style={{ color: "#aaa", marginTop: "4px" }}>
          Choose battery capacity. Larger batteries add weight and cost but extend battery life.
          Your {state.screenSize}" chassis supports up to {maxCapacity} Wh.
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
          <span style={{ color: "#888", fontSize: "14px" }}>{MIN_CAPACITY} Wh</span>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#90caf9",
            }}
          >
            {capacity} Wh
          </span>
          <span style={{ color: "#888", fontSize: "14px" }}>{maxCapacity} Wh</span>
        </div>

        <input
          type="range"
          min={MIN_CAPACITY}
          max={maxCapacity}
          step={STEP}
          value={capacity}
          onChange={(e) => handleChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#90caf9" }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard label="Cost" value={`$${cost}`} />
        <StatCard label="Weight" value={formatWeight(weight)} />
        <StatCard label="Technology" value={era.techLabel} />
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
