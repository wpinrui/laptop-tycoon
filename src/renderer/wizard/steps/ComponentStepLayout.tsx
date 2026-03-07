import { useWizard } from "../WizardContext";
import { DISPLAY_SLOTS, applyDisplayMultiplier, specSummary, getAvailableComponents, componentCostDecayed } from "../constants";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { Component, ComponentSlot, ScreenSizeDefinition } from "../../../data/types";
import { Tooltip } from "../Tooltip";
import { SelectionCard, OptionTooltipContent } from "../SelectionCard";

export interface SlotDef {
  slot: ComponentSlot;
  label: string;
}

function isDisplaySlot(slot: ComponentSlot): boolean {
  return DISPLAY_SLOTS.includes(slot);
}

export function ComponentStepLayout({
  title,
  description,
  slots,
  children,
}: {
  title: string;
  description: string;
  slots: SlotDef[];
  children?: React.ReactNode;
}) {
  const { state, dispatch, gameYear } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);

  return (
    <div>
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
          gameYear={gameYear}
        />
      ))}

      {children}
    </div>
  );
}

function SlotSection({
  slot,
  label,
  selected,
  onSelect,
  screenSizeDef,
  gameYear,
}: {
  slot: ComponentSlot;
  label: string;
  selected: Component | null;
  onSelect: (component: Component) => void;
  screenSizeDef: ScreenSizeDefinition;
  gameYear: number;
}) {
  const available = getAvailableComponents(slot, gameYear);
  const multiplier = screenSizeDef.displayMultiplier;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
        {label}
        {isDisplaySlot(slot) && multiplier !== 1.0 && (
          <span style={{ color: "#888", fontWeight: "normal", fontSize: "0.75rem", marginLeft: "8px" }}>
            ({screenSizeDef.size}" size: {multiplier}x)
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
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
            gameYear={gameYear}
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
  gameYear,
}: {
  component: Component;
  isSelected: boolean;
  onSelect: () => void;
  slot: ComponentSlot;
  multiplier: number;
  gameYear: number;
}) {
  const cost = applyDisplayMultiplier(componentCostDecayed(component, gameYear), slot, multiplier);
  const power = applyDisplayMultiplier(component.powerDrawW, slot, multiplier);
  const weight = applyDisplayMultiplier(component.weightG, slot, multiplier);

  return (
    <Tooltip content={<OptionTooltipContent name={component.name} description={component.description} stats={component.stats} />}>
      <SelectionCard isSelected={isSelected} onClick={onSelect}>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: "bold",
            marginBottom: "6px",
            color: isSelected ? "#90caf9" : "#e0e0e0",
          }}
        >
          {component.name}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "#888", marginBottom: "8px", lineHeight: "1.4" }}>
          {specSummary(component.specs)}
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem" }}>
          <span style={{ color: "#4caf50" }}>${cost}</span>
          {power > 0 && <span style={{ color: "#ff9800" }}>{power}W</span>}
          {weight > 0 && <span style={{ color: "#888" }}>{weight}g</span>}
        </div>
      </SelectionCard>
    </Tooltip>
  );
}
