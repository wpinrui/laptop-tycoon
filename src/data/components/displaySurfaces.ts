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

  // --- 2006 ---
  {
    id: "surface_glossy_premium",
    name: "Premium Glossy Finish",
    description:
      "Ultra-vivid glossy display with deeper blacks. The trendy choice of the late 2000s.",
    slot: "displaySurface",
    yearIntroduced: 2006,
    yearDiscontinued: 2012,
    costAtLaunch: 5,
    powerDrawW: 0,
    weightG: 0,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { finish: "Glossy (Premium)", reflections: "High", contrast: "Enhanced+" },
    stats: { display: 12 },
  },

  // --- 2009 ---
  {
    id: "surface_anti_glare",
    name: "Anti-glare Coating",
    description:
      "Advanced anti-reflective treatment that reduces glare without dulling colors.",
    slot: "displaySurface",
    yearIntroduced: 2009,
    yearDiscontinued: 2014,
    costAtLaunch: 15,
    powerDrawW: 0,
    weightG: 0,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { finish: "Anti-glare", reflections: "Very Low", contrast: "Standard+" },
    stats: { display: 10 },
  },
];
