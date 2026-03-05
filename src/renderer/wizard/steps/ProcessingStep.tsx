import { useWizard } from "../WizardContext";
import { ALL_COMPONENTS } from "../../../data/components";
import { Component, ComponentSlot } from "../../../data/types";

const GAME_YEAR = 2000; // TODO: inject from game state

const PROCESSING_SLOTS: { slot: ComponentSlot; label: string }[] = [
  { slot: "cpu", label: "CPU" },
  { slot: "gpu", label: "GPU" },
  { slot: "ram", label: "RAM" },
  { slot: "storage", label: "Storage" },
];

function getAvailableComponents(slot: ComponentSlot, year: number): Component[] {
  return ALL_COMPONENTS.filter(
    (c) => c.slot === slot && c.yearIntroduced <= year && c.yearDiscontinued >= year
  );
}

function formatCost(cost: number): string {
  return `$${cost}`;
}

function specSummary(component: Component): string {
  return Object.values(component.specs).join(" · ");
}

export function ProcessingStep() {
  const { state, dispatch } = useWizard();

  const totalCost = PROCESSING_SLOTS.reduce((sum, { slot }) => {
    const c = state.components[slot];
    return sum + (c ? c.costAtLaunch : 0);
  }, 0);

  const totalPower = PROCESSING_SLOTS.reduce((sum, { slot }) => {
    const c = state.components[slot];
    return sum + (c ? c.powerDrawW : 0);
  }, 0);

  const totalWeight = PROCESSING_SLOTS.reduce((sum, { slot }) => {
    const c = state.components[slot];
    return sum + (c ? c.weightG : 0);
  }, 0);

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <h2>Processing</h2>
        <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
          Select your CPU, GPU, RAM, and storage.
        </p>

        {PROCESSING_SLOTS.map(({ slot, label }) => (
          <SlotSection
            key={slot}
            slot={slot}
            label={label}
            selected={state.components[slot] ?? null}
            onSelect={(c) => dispatch({ type: "SET_COMPONENT", slot, component: c })}
          />
        ))}
      </div>

      <div
        style={{
          width: "200px",
          flexShrink: 0,
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "16px",
          alignSelf: "flex-start",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "12px", fontWeight: "bold" }}>
          RUNNING TOTALS
        </div>
        <TotalRow label="Cost" value={formatCost(totalCost)} />
        <TotalRow label="Power Draw" value={`${totalPower} W`} />
        <TotalRow label="Weight" value={`${totalWeight} g`} />
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
      <span style={{ color: "#888", fontSize: "13px" }}>{label}</span>
      <span style={{ color: "#e0e0e0", fontSize: "13px", fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function SlotSection({
  slot,
  label,
  selected,
  onSelect,
}: {
  slot: ComponentSlot;
  label: string;
  selected: Component | null;
  onSelect: (component: Component) => void;
}) {
  const available = getAvailableComponents(slot, GAME_YEAR);

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        {available.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selected?.id === component.id}
            onSelect={() => onSelect(component)}
          />
        ))}
      </div>
    </div>
  );
}

function ComponentCard({
  component,
  isSelected,
  onSelect,
}: {
  component: Component;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: isSelected ? "#1a3a5c" : "#2a2a2a",
        border: isSelected ? "2px solid #90caf9" : "1px solid #444",
        borderRadius: "8px",
        padding: "12px",
        textAlign: "left",
        cursor: "pointer",
        color: "#e0e0e0",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "bold",
          marginBottom: "6px",
          color: isSelected ? "#90caf9" : "#e0e0e0",
        }}
      >
        {component.name}
      </div>
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px", lineHeight: "1.4" }}>
        {specSummary(component)}
      </div>
      <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
        <span style={{ color: "#4caf50" }}>{formatCost(component.costAtLaunch)}</span>
        <span style={{ color: "#ff9800" }}>{component.powerDrawW}W</span>
        <span style={{ color: "#888" }}>{component.weightG}g</span>
      </div>
    </button>
  );
}
