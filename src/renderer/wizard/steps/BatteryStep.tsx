import { useWizard } from "../WizardContext";
import { GAME_YEAR, formatWeight, MIN_BATTERY_WH, MAX_BATTERY_WH, BATTERY_STEP_WH, batteryWarningThresholdH } from "../constants";
import { getBatteryEra } from "../../../data/batteryEras";
import { StatCard } from "./StatCard";

export function BatteryStep() {
  const { state, dispatch } = useWizard();
  const era = getBatteryEra(GAME_YEAR);

  const capacity = state.batteryCapacityWh;
  const cost = Math.round(capacity * era.costPerWh);
  const weight = Math.round(capacity * era.weightPerWh);

  // Calculate total power draw from selected components
  let totalPower = 0;
  for (const comp of Object.values(state.components)) {
    if (comp) totalPower += comp.powerDrawW;
  }

  const estimatedHours = totalPower > 0 ? capacity / totalPower : 0;
  const batteryWarning = totalPower > 0 && estimatedHours < batteryWarningThresholdH(GAME_YEAR);
  const batteryH = Math.floor(estimatedHours);
  const batteryM = Math.round((estimatedHours - batteryH) * 60);
  const batteryLifeStr = batteryM > 0 ? `~${batteryH} hour${batteryH !== 1 ? "s" : ""} ${batteryM} minute${batteryM !== 1 ? "s" : ""}` : `~${batteryH} hour${batteryH !== 1 ? "s" : ""}`;

  function handleChange(value: number) {
    dispatch({ type: "SET_BATTERY_CAPACITY", capacityWh: value });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2>Battery</h2>
        <p style={{ color: "#aaa", marginTop: "4px" }}>
          Choose battery capacity. Larger batteries add weight, cost, and take up internal space.
          The chassis must have enough volume to fit the battery.
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
          <span style={{ color: "#888", fontSize: "0.875rem" }}>{MIN_BATTERY_WH} Wh</span>
          <span
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#90caf9",
            }}
          >
            {capacity} Wh
          </span>
          <span style={{ color: "#888", fontSize: "0.875rem" }}>{MAX_BATTERY_WH} Wh</span>
        </div>

        <input
          type="range"
          min={MIN_BATTERY_WH}
          max={MAX_BATTERY_WH}
          step={BATTERY_STEP_WH}
          value={capacity}
          onChange={(e) => handleChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#90caf9" }}
        />
        <div style={{ fontSize: "0.625rem", color: "#666", marginTop: "4px" }}>
          Affects: battery life, weight, cost, internal space
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: totalPower > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard label="Cost" value={`$${cost}`} />
        <StatCard label="Weight" value={formatWeight(weight)} />
        <StatCard label="Technology" value={era.techLabel} />
        {totalPower > 0 && (
          <StatCard
            label="Est. Battery Life"
            value={batteryLifeStr}
            warning={batteryWarning}
          />
        )}
      </div>

      {totalPower > 0 && (
        <div style={{ fontSize: "0.75rem", color: "#888", textAlign: "center" }}>
          {capacity} Wh ÷ {totalPower} W total power draw = {batteryLifeStr}
        </div>
      )}
    </div>
  );
}
