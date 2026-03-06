import { Component } from "../types";

// Cost, power, weight are base values at 14" reference size.
// Actual values are multiplied by the screen size's displayMultiplier.

export const DISPLAY_SURFACES: Component[] = [
  {
    id: "surface_matte",
    name: "Matte Finish",
    description: "Anti-glare coating reduces reflections. Preferred for office work.",
    slot: "displaySurface",
    yearIntroduced: 2000,
    yearDiscontinued: 2010,
    costAtLaunch: 5,
    powerDrawW: 0,
    weightG: 0,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { finish: "Matte", reflections: "Low", contrast: "Standard" },
    stats: { display: 5 },
  },
  {
    id: "surface_glossy",
    name: "Glossy Finish",
    description: "Vivid colors and deeper blacks, but reflective in bright environments.",
    slot: "displaySurface",
    yearIntroduced: 2003,
    yearDiscontinued: 2010,
    costAtLaunch: 3,
    powerDrawW: 0,
    weightG: 0,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { finish: "Glossy", reflections: "High", contrast: "Enhanced" },
    stats: { display: 8 },
  },
];
