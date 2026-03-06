import { useWizard } from "../WizardContext";
import { GAME_YEAR, formatWeight } from "../constants";
import { ALL_COMPONENTS } from "../../../data/components";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { Component, ComponentSlot, ScreenSizeDefinition } from "../../../data/types";

const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];

export interface SlotDef {
  slot: ComponentSlot;
  label: string;
}

function getAvailableComponents(slot: ComponentSlot, year: number): Component[] {
  return ALL_COMPONENTS
    .filter((c) => c.slot === slot && c.yearIntroduced <= year && c.yearDiscontinued >= year)
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

function isDisplaySlot(slot: ComponentSlot): boolean {
  return DISPLAY_SLOTS.includes(slot);
}

function applyMultiplier(value: number, slot: ComponentSlot, multiplier: number): number {
  if (!isDisplaySlot(slot)) return value;
  return Math.round(value * multiplier);
}

function formatCost(cost: number): string {
  return `$${cost}`;
}

function specSummary(component: Component): string {
  return Object.entries(component.specs)
    .map(([key, value]) => `${formatSpecKey(key)}: ${value}`)
    .join(" · ");
}

function formatSpecKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function ComponentStepLayout({
  title,
  description,
  slots,
}: {
  title: string;
  description: string;
  slots: SlotDef[];
}) {
  const { state, dispatch } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const multiplier = screenSizeDef.displayMultiplier;

  function sumProp(prop: "costAtLaunch" | "powerDrawW" | "weightG"): number {
    return slots.reduce((sum, { slot }) => {
      const c = state.components[slot];
      return sum + (c ? applyMultiplier(c[prop], slot, multiplier) : 0);
    }, 0);
  }

  const totalCost = sumProp("costAtLaunch");
  const totalPower = sumProp("powerDrawW");
  const totalWeight = sumProp("weightG");

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <h2>{title}</h2>
        <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
          {description}
        </p>

        {slots.map(({ slot, label }) => (
          <SlotSection
            key={slot}
            slot={slot}
            label={label}
            selected={state.components[slot] ?? null}
            onSelect={(c) => dispatch({ type: "SET_COMPONENT", slot, component: c })}
            screenSizeDef={screenSizeDef}
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
        <TotalRow label="Weight" value={formatWeight(totalWeight)} />
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
  screenSizeDef,
}: {
  slot: ComponentSlot;
  label: string;
  selected: Component | null;
  onSelect: (component: Component) => void;
  screenSizeDef: ScreenSizeDefinition;
}) {
  const available = getAvailableComponents(slot, GAME_YEAR);
  const multiplier = screenSizeDef.displayMultiplier;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
        {label}
        {isDisplaySlot(slot) && multiplier !== 1.0 && (
          <span style={{ color: "#888", fontWeight: "normal", fontSize: "12px", marginLeft: "8px" }}>
            ({screenSizeDef.size}" size: {multiplier}x)
          </span>
        )}
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
            slot={slot}
            multiplier={multiplier}
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
  slot,
  multiplier,
}: {
  component: Component;
  isSelected: boolean;
  onSelect: () => void;
  slot: ComponentSlot;
  multiplier: number;
}) {
  const cost = applyMultiplier(component.costAtLaunch, slot, multiplier);
  const power = applyMultiplier(component.powerDrawW, slot, multiplier);
  const weight = applyMultiplier(component.weightG, slot, multiplier);

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
        <span style={{ color: "#4caf50" }}>{formatCost(cost)}</span>
        {power > 0 && <span style={{ color: "#ff9800" }}>{power}W</span>}
        {weight > 0 && <span style={{ color: "#888" }}>{weight}g</span>}
      </div>
    </button>
  );
}
