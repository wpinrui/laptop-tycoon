import { useWizard } from "../WizardContext";
import { GAME_YEAR, DISPLAY_SLOTS, applyDisplayMultiplier, specSummary } from "../constants";
import { ALL_COMPONENTS } from "../../../data/components";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { Component, ComponentSlot, ScreenSizeDefinition } from "../../../data/types";
import { Tooltip } from "../Tooltip";
import { STAT_CONFIG } from "../StatBar";

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

function StatContributions({ stats }: { stats: Record<string, number> }) {
  const entries = Object.entries(stats).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
      {entries.map(([stat, value]) => {
        const config = STAT_CONFIG.find((s) => s.stat === stat);
        if (!config) return null;
        const { Icon } = config;
        return (
          <span key={stat} style={{ color: "#90caf9", fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <Icon size={11} strokeWidth={1.5} /> +{value} {config.label}
          </span>
        );
      })}
    </div>
  );
}

function TooltipContent({ component }: { component: Component }) {
  return (
    <div>
      <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{component.name}</div>
      <div style={{ color: "#ccc", marginBottom: "6px" }}>{component.description}</div>
      <StatContributions stats={component.stats as Record<string, number>} />
    </div>
  );
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
  const { state, dispatch } = useWizard();
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
  const cost = applyDisplayMultiplier(component.costAtLaunch, slot, multiplier);
  const power = applyDisplayMultiplier(component.powerDrawW, slot, multiplier);
  const weight = applyDisplayMultiplier(component.weightG, slot, multiplier);

  return (
    <Tooltip content={<TooltipContent component={component} />}>
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
      </button>
    </Tooltip>
  );
}
