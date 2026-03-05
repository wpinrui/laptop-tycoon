import { useWizard } from "../WizardContext";
import { GAME_YEAR, formatWeight, MIN_BATTERY_WH, BATTERY_STEP_WH, maxBatteryWh } from "../constants";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { StatCard } from "./StatCard";

export function BatteryStep() {
  const { state, dispatch } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const maxCapacity = maxBatteryWh(screenSizeDef.baseBatteryCapacityWh);
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
          <span style={{ color: "#888", fontSize: "14px" }}>{MIN_BATTERY_WH} Wh</span>
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
          min={MIN_BATTERY_WH}
          max={maxCapacity}
          step={BATTERY_STEP_WH}
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
