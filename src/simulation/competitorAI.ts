import {
  Component,
  ComponentSlot,
  ChassisOption,
  LaptopStat,
} from "../data/types";
import { CompetitorArchetype, CompetitorDefinition } from "../data/competitors";
import { LaptopDesign, LaptopModel, CompanyState } from "../renderer/state/gameTypes";
import {
  getAvailableComponents,
  getAvailableChassisOptions,
  computeLaptopTotals,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MAX_MM,
  minBezelForYear,
} from "../data/designConstants";
import {
  MATERIALS,
  COOLING_SOLUTIONS,
  KEYBOARD_FEATURES,
  TRACKPAD_FEATURES,
} from "../data/chassisOptions";
import { PORT_TYPES } from "../data/portTypes";
import { COLOUR_OPTIONS } from "../data/colourOptions";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";
import { averageReach } from "./brandProgression";
import { calculateBomUnitCost } from "../renderer/manufacturing/utils/economiesOfScale";
import {
  ASSEMBLY_QA_COST,
  PACKAGING_LOGISTICS_COST,
  CHANNEL_MARGIN_RATE,
  RD_COST,
  TOOLING_COST,
  CERTIFICATION_COST,
  AI_ORDER_MULTIPLIER,
  MIN_BATCH_SIZE,
} from "./tunables";
import { estimateAnnualDemand } from "./salesEngine";

const COMPONENT_SLOTS: ComponentSlot[] = [
  "cpu", "gpu", "ram", "storage",
  "resolution", "displayTech", "displaySurface",
  "wifi", "webcam", "speakers",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(value: number, range: number): number {
  return value + (Math.random() * 2 - 1) * range;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function totalStatValue(comp: Component): number {
  return Object.values(comp.stats).reduce((sum, v) => sum + (v ?? 0), 0);
}

function statRelevance(comp: Component, highStats: LaptopStat[]): number {
  if (highStats.length === 0) return 0;
  return highStats.reduce((sum, stat) => sum + (comp.stats[stat] ?? 0), 0);
}

function pickComponentByPercentile(
  available: Component[],
  targetPercentile: number,
  sortBy: (c: Component) => number,
): Component {
  if (available.length === 1) return available[0];
  const sorted = [...available].sort((a, b) => sortBy(a) - sortBy(b));
  const jittered = clamp(jitter(targetPercentile, 0.1), 0, 1);
  const index = Math.min(Math.floor(jittered * sorted.length), sorted.length - 1);
  return sorted[index];
}

function pickComponent(
  slot: ComponentSlot,
  year: number,
  competitor: CompetitorDefinition,
  engineeringBonus: number,
): Component | null {
  const available = getAvailableComponents(slot, year);
  if (available.length === 0) return null;

  const { archetype, statPriorities } = competitor;

  if (archetype === "budget") {
    return pickComponentByPercentile(available, clamp(0.15 + engineeringBonus, 0, 1), (c) => totalStatValue(c));
  }

  if (archetype === "premium") {
    if (statPriorities.high.length > 0) {
      const relevance = (c: Component) => statRelevance(c, statPriorities.high);
      const maxRelevance = Math.max(...available.map(relevance));
      if (maxRelevance > 0) {
        return pickComponentByPercentile(available, clamp(0.8 + engineeringBonus, 0, 1), relevance);
      }
    }
    return pickComponentByPercentile(available, clamp(0.6 + engineeringBonus, 0, 1), (c) => totalStatValue(c));
  }

  // generalist — middle 50%
  return pickComponentByPercentile(available, clamp(0.5 + engineeringBonus, 0, 1), (c) => totalStatValue(c));
}

function pickChassisOption(
  options: ChassisOption[],
  year: number,
  tier: "low" | "mid" | "high",
): ChassisOption | null {
  const available = getAvailableChassisOptions(options, year);
  if (available.length === 0) return null;

  // available is sorted by costAtLaunch ascending
  if (tier === "low") return available[0];
  if (tier === "high") return available[available.length - 1];
  // mid
  const midIndex = Math.floor(available.length / 2);
  return available[midIndex];
}

function pickCooling(
  year: number,
  totalPowerW: number,
  archetype: CompetitorArchetype,
): ChassisOption | null {
  const available = getAvailableChassisOptions(COOLING_SOLUTIONS, year);
  if (available.length === 0) return null;

  // Sort by cooling capacity
  const sorted = [...available].sort((a, b) => a.coolingCapacityW - b.coolingCapacityW);

  // Budget may undercool slightly, premium overcools, generalist matches
  const toleranceMult = archetype === "budget" ? 0.85 : archetype === "premium" ? 1.2 : 1.0;
  const target = totalPowerW * toleranceMult;

  // Pick the cheapest solution that meets the target
  const adequate = sorted.find((s) => s.coolingCapacityW >= target);
  if (adequate) return adequate;
  // If nothing is adequate, pick the best available
  return sorted[sorted.length - 1];
}

function pickPorts(year: number, archetype: CompetitorArchetype): Record<string, number> {
  const ports: Record<string, number> = {};
  const available = PORT_TYPES.filter(
    (pt) => pt.yearIntroduced <= year && (pt.yearDiscontinued === null || pt.yearDiscontinued >= year),
  );

  if (archetype === "budget") {
    // Minimal: 2 USB, 1 VGA (if available), 1 audio jack
    const usb = available.find((p) => p.category === "usb");
    if (usb) ports[usb.id] = 2;
    const vga = available.find((p) => p.id === "vga");
    if (vga) ports[vga.id] = 1;
    const audio = available.find((p) => p.id === "audio_jack");
    if (audio) ports[audio.id] = 1;
    const ethernet = available.find((p) => p.id === "ethernet_rj45");
    if (ethernet) ports[ethernet.id] = 1;
  } else if (archetype === "premium") {
    // Full set of available ports
    const usb = available.filter((p) => p.category === "usb").sort((a, b) => b.yearIntroduced - a.yearIntroduced);
    if (usb.length > 0) ports[usb[0].id] = 3;
    for (const pt of available) {
      if (pt.category === "usb") continue; // already handled
      if (ports[pt.id] !== undefined) continue;
      ports[pt.id] = 1;
    }
    const audio = available.find((p) => p.id === "audio_jack");
    if (audio) ports[audio.id] = 2;
  } else {
    // Generalist: reasonable set
    const usb = available.filter((p) => p.category === "usb").sort((a, b) => b.yearIntroduced - a.yearIntroduced);
    if (usb.length > 0) ports[usb[0].id] = 3;
    const vga = available.find((p) => p.id === "vga");
    if (vga) ports[vga.id] = 1;
    const audio = available.find((p) => p.id === "audio_jack");
    if (audio) ports[audio.id] = 1;
    const ethernet = available.find((p) => p.id === "ethernet_rj45");
    if (ethernet) ports[ethernet.id] = 1;
    const cardReader = available.find((p) => p.id === "card_reader");
    if (cardReader) ports[cardReader.id] = 1;
    // Add a video out port if DVI is available, otherwise VGA
    const dvi = available.find((p) => p.id === "dvi");
    if (dvi) ports[dvi.id] = 1;
  }

  return ports;
}

function pickColours(archetype: CompetitorArchetype): string[] {
  if (archetype === "budget") {
    // 1 cheap colour
    return ["black"];
  }
  if (archetype === "premium") {
    // 3-4 colours including premium ones
    const sorted = [...COLOUR_OPTIONS].sort((a, b) => b.costPerUnit - a.costPerUnit);
    const count = 3 + Math.floor(Math.random() * 2); // 3 or 4
    return sorted.slice(0, count).map((c) => c.id);
  }
  // Generalist: 2 colours
  return ["black", "silver"];
}

function pickBattery(archetype: CompetitorArchetype): number {
  if (archetype === "budget") return 30 + Math.floor(Math.random() * 3) * 5; // 30-40 Wh
  if (archetype === "premium") return 60 + Math.floor(Math.random() * 5) * 5; // 60-80 Wh
  return 45 + Math.floor(Math.random() * 4) * 5; // 45-60 Wh
}

function pickThickness(archetype: CompetitorArchetype): number {
  if (archetype === "budget") {
    // Thick: 4.0 - 6.0 cm
    return Math.round((4.0 + Math.random() * 2.0) / THICKNESS_STEP_CM) * THICKNESS_STEP_CM;
  }
  if (archetype === "premium") {
    // Thin: 1.0 - 2.5 cm
    return Math.round((1.0 + Math.random() * 1.5) / THICKNESS_STEP_CM) * THICKNESS_STEP_CM;
  }
  // Average: 2.5 - 4.0 cm
  return Math.round((2.5 + Math.random() * 1.5) / THICKNESS_STEP_CM) * THICKNESS_STEP_CM;
}

function pickBezel(archetype: CompetitorArchetype, year: number): number {
  const minBezel = minBezelForYear(year);
  if (archetype === "budget") return BEZEL_MAX_MM - Math.floor(Math.random() * 5); // 35-40mm
  if (archetype === "premium") return minBezel + Math.floor(Math.random() * 5);
  return Math.max(minBezel, 15) + Math.floor(Math.random() * 10);
}

function generateSingleModel(
  year: number,
  competitor: CompetitorDefinition,
  totalPlayerCount: number,
  engineeringBonus: number,
): LaptopModel {
  const { archetype } = competitor;
  const screenSize = pickRandom(competitor.screenSizePreference);

  // Pick components
  const components: Partial<Record<ComponentSlot, Component>> = {};
  let totalPowerW = 0;
  for (const slot of COMPONENT_SLOTS) {
    const comp = pickComponent(slot, year, competitor, engineeringBonus);
    if (comp) {
      components[slot] = comp;
      totalPowerW += comp.powerDrawW;
    }
  }

  // Chassis
  const material = pickChassisOption(MATERIALS, year, competitor.chassisPreferences.materialTier);
  const cooling = pickCooling(year, totalPowerW, archetype);
  const peripheralTier = archetype === "budget" ? "low" : archetype === "premium" ? "high" : "mid";
  const keyboardFeature = pickChassisOption(KEYBOARD_FEATURES, year, peripheralTier);
  const trackpadFeature = pickChassisOption(TRACKPAD_FEATURES, year, peripheralTier);

  const chassis = {
    material,
    coolingSolution: cooling,
    keyboardFeature,
    trackpadFeature,
  };

  const thicknessCm = clamp(pickThickness(archetype), THICKNESS_MIN_CM, THICKNESS_MAX_CM);
  const bezelMm = clamp(pickBezel(archetype, year), minBezelForYear(year), BEZEL_MAX_MM);
  const batteryCapacityWh = pickBattery(archetype);
  const ports = pickPorts(year, archetype);
  const selectedColours = pickColours(archetype);

  // Compute costs
  const totals = computeLaptopTotals(
    components, ports, chassis,
    batteryCapacityWh, selectedColours,
    screenSize, bezelMm, thicknessCm, year,
  );

  const designId = crypto.randomUUID();
  const design: LaptopDesign = {
    id: designId,
    name: `${competitor.productLine} ${year}`,
    modelType: "brandNew",
    predecessorId: null,
    screenSize,
    components,
    ports,
    batteryCapacityWh,
    thicknessCm,
    bezelMm,
    chassis,
    selectedColours,
    unitCost: totals.totalCost,
  };

  // Preliminary manufacturing quantity (heuristic, used for initial EoS pricing)
  const totalDemand = Object.values(STARTING_DEMAND_POOL).reduce((sum, v) => sum + v, 0);
  const brandFactor = averageReach(competitor.brandReach) / 100;
  const competitorShare = 1 / totalPlayerCount;
  const manufacturingQuantity = Math.round(totalDemand * competitorShare * brandFactor * (0.8 + Math.random() * 0.4));

  const retailPrice = computeAIRetailPrice(design, manufacturingQuantity, competitor);

  return {
    design,
    status: "onSale",
    retailPrice,
    manufacturingQuantity,
    yearDesigned: year,
    manufacturingPlan: null,
    unitsInStock: manufacturingQuantity,
    totalProductionSpend: 0,
    totalUnitsOrdered: 0,
  };
}

/** Compute retail price for an AI model given a production quantity. */
function computeAIRetailPrice(
  design: LaptopDesign,
  quantity: number,
  competitor: CompetitorDefinition,
): number {
  const bomAfterEos = calculateBomUnitCost(design.unitCost, quantity);
  const variableCost = bomAfterEos + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST;
  const fixedCosts = RD_COST[design.modelType] + TOOLING_COST[design.modelType] + CERTIFICATION_COST[design.modelType];
  const amortizedFixed = fixedCosts / quantity;
  const fullyLoadedCost = variableCost + amortizedFixed;
  return Math.round(
    (fullyLoadedCost / (1 - CHANNEL_MARGIN_RATE)) * competitor.pricingStrategy.marginMultiplier
  );
}

export function generateCompetitorModels(
  year: number,
  competitors: CompetitorDefinition[],
  companies?: CompanyState[],
): LaptopModel[] {
  const totalPlayerCount = competitors.length + 1; // +1 for human player

  // Pass 1: generate designs with heuristic quantities and initial pricing
  const models = competitors.map((competitor) => {
    const companyState = companies?.find((c) => c.id === competitor.id);
    const bonus = companyState?.engineeringBonus ?? competitor.engineeringBonus;
    return generateSingleModel(year, competitor, totalPlayerCount, bonus);
  });

  // Pass 2: if live game context available, refine quantities using VP-based demand
  if (companies) {
    const extraModels = competitors.map((c, i) => ({ owner: c.id, model: models[i] }));
    const demandMap = estimateAnnualDemand({ year, companies }, extraModels);

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const competitor = competitors[i];
      const expectedDemand = demandMap.get(model.design.id) ?? model.manufacturingQuantity ?? 0;
      const quantity = Math.max(MIN_BATCH_SIZE, Math.round(expectedDemand * AI_ORDER_MULTIPLIER[competitor.archetype]));

      model.manufacturingQuantity = quantity;
      model.unitsInStock = quantity;
      model.retailPrice = computeAIRetailPrice(model.design, quantity, competitor);
    }
  }

  return models;
}
