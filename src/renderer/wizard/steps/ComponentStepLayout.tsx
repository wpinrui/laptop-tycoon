import { useState } from "react";
import { useWizard } from "../WizardContext";
import { DISPLAY_SLOTS, applyDisplayMultiplier, specSummary, getAvailableComponents, componentCostDecayed } from "../../../data/designConstants";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { Component, ComponentSlot, ScreenSizeDefinition } from "../../../data/types";
import { Tooltip } from "../Tooltip";
import { tokens } from "../../shell/tokens";
import { SelectionCard, OptionTooltipContent } from "../SelectionCard";

export interface SlotDef {
  slot: ComponentSlot;
  label: string;
}

function isDisplaySlot(slot: ComponentSlot): boolean {
  return DISPLAY_SLOTS.includes(slot);
}

interface YearGroup {
  label: string;
  components: Component[];
}

function makeGroupLabel(years: number[]): string {
  const sorted = [...years].sort((a, b) => a - b);
  return sorted.length === 1
    ? `${sorted[0]}`
    : `${sorted[0]}\u2013${sorted[sorted.length - 1]}`;
}

const sortCheapestFirst = (gameYear: number) => (a: Component, b: Component) =>
  componentCostDecayed(a, gameYear) - componentCostDecayed(b, gameYear);

/** Group components by year (newest first), merging small groups so each has >= minSize items. */
function groupByYear(components: Component[], minSize: number, gameYear: number): YearGroup[] {
  // Bucket by yearIntroduced
  const buckets = new Map<number, Component[]>();
  for (const c of components) {
    const year = c.yearIntroduced;
    if (!buckets.has(year)) buckets.set(year, []);
    buckets.get(year)!.push(c);
  }

  // Sort years newest-first
  const years = [...buckets.keys()].sort((a, b) => b - a);

  // Sort each bucket cheapest-first (by decayed cost)
  for (const [, items] of buckets) {
    items.sort(sortCheapestFirst(gameYear));
  }

  // Build groups, merging from the tail (oldest) until each has >= minSize
  const groups: YearGroup[] = [];
  let pendingYears: number[] = [];
  let pendingItems: Component[] = [];

  // Walk oldest to newest so we merge old years upward
  for (let i = years.length - 1; i >= 0; i--) {
    const year = years[i];
    pendingYears.push(year);
    pendingItems.push(...buckets.get(year)!);

    if (pendingItems.length >= minSize) {
      pendingItems.sort(sortCheapestFirst(gameYear));
      groups.push({ label: makeGroupLabel(pendingYears), components: pendingItems });
      pendingYears = [];
      pendingItems = [];
    }
  }

  // Flush remainder — merge into the last group if it exists, otherwise create one
  if (pendingItems.length > 0) {
    if (groups.length > 0) {
      const last = groups[groups.length - 1];
      last.components.push(...pendingItems);
      last.components.sort(sortCheapestFirst(gameYear));
      const allYears = [...new Set(last.components.map((c) => c.yearIntroduced))];
      last.label = makeGroupLabel(allYears);
    } else {
      pendingItems.sort(sortCheapestFirst(gameYear));
      groups.push({ label: makeGroupLabel(pendingYears), components: pendingItems });
    }
  }

  // Reverse so newest group is first
  groups.reverse();
  return groups;
}

const AGING_THRESHOLD_QUARTERS = 5;

/** Returns true if a component is 5+ quarters old relative to the current game date. */
function isAging(component: Component, gameYear: number, gameQuarter: 1 | 2 | 3 | 4): boolean {
  const gameQ = gameYear * 4 + gameQuarter;
  const compQ = component.yearIntroduced * 4 + (component.quarterIntroduced ?? 1);
  return gameQ - compQ >= AGING_THRESHOLD_QUARTERS;
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
  const { state, dispatch, gameYear, gameQuarter } = useWizard();
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
          gameQuarter={gameQuarter}
        />
      ))}

      {children}
    </div>
  );
}

const MIN_GROUP_SIZE = 4;

function SlotSection({
  slot,
  label,
  selected,
  onSelect,
  screenSizeDef,
  gameYear,
  gameQuarter,
}: {
  slot: ComponentSlot;
  label: string;
  selected: Component | null;
  onSelect: (component: Component) => void;
  screenSizeDef: ScreenSizeDefinition;
  gameYear: number;
  gameQuarter: 1 | 2 | 3 | 4;
}) {
  const available = getAvailableComponents(slot, gameYear, gameQuarter);
  const multiplier = screenSizeDef.displayMultiplier;
  const groups = groupByYear(available, MIN_GROUP_SIZE, gameYear);

  // Find which group contains the selected component (if any)
  const selectedGroupIdx = selected
    ? groups.findIndex((g) => g.components.some((c) => c.id === selected.id))
    : -1;

  // Default expanded: group containing selected component, or the newest group (index 0)
  const [expandedIdx, setExpandedIdx] = useState<number>(
    selectedGroupIdx >= 0 ? selectedGroupIdx : 0,
  );

  // If only one group, skip the accordion entirely
  const singleGroup = groups.length <= 1;

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

      {singleGroup ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          {groups[0]?.components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              isSelected={selected?.id === component.id}
              onSelect={() => onSelect(component)}
              slot={slot}
              multiplier={multiplier}
              gameYear={gameYear}
              gameQuarter={gameQuarter}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {groups.map((group, idx) => {
            const isExpanded = expandedIdx === idx;
            const hasSelection = selected
              ? group.components.some((c) => c.id === selected.id)
              : false;

            return (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? -1 : idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: hasSelection ? tokens.colors.interactiveAccent : "#aaa",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "6px 0",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.625rem",
                      display: "inline-block",
                      transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.15s",
                    }}
                  >
                    &#9660;
                  </span>
                  <span>{group.label}</span>
                  <span style={{ color: "#666", fontWeight: "normal" }}>
                    ({group.components.length})
                  </span>
                  {hasSelection && selected && (
                    <span style={{ color: tokens.colors.interactiveAccent, fontWeight: "normal", marginLeft: "auto" }}>
                      {selected.name}
                    </span>
                  )}
                </button>
                {isExpanded && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "4px 0 8px",
                    }}
                  >
                    {group.components.map((component) => (
                      <ComponentCard
                        key={component.id}
                        component={component}
                        isSelected={selected?.id === component.id}
                        onSelect={() => onSelect(component)}
                        slot={slot}
                        multiplier={multiplier}
                        gameYear={gameYear}
                        gameQuarter={gameQuarter}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
  gameQuarter,
}: {
  component: Component;
  isSelected: boolean;
  onSelect: () => void;
  slot: ComponentSlot;
  multiplier: number;
  gameYear: number;
  gameQuarter: 1 | 2 | 3 | 4;
}) {
  const cost = applyDisplayMultiplier(componentCostDecayed(component, gameYear), slot, multiplier);
  const power = applyDisplayMultiplier(component.powerDrawW, slot, multiplier);
  const weight = applyDisplayMultiplier(component.weightG, slot, multiplier);
  const aging = isAging(component, gameYear, gameQuarter);

  return (
    <Tooltip content={<OptionTooltipContent name={component.name} description={component.description} stats={component.stats} />}>
      <SelectionCard isSelected={isSelected} onClick={onSelect}>
        <div
          style={{
            opacity: aging && !isSelected ? 0.55 : 1,
            transition: "opacity 0.15s",
          }}
        >
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: "bold",
              marginBottom: "6px",
              color: isSelected ? tokens.colors.interactiveAccent : "#e0e0e0",
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
            <span style={{ color: "#666" }}>{component.yearIntroduced}</span>
          </div>
        </div>
      </SelectionCard>
    </Tooltip>
  );
}
