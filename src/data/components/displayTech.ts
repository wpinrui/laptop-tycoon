import { Component } from "../types";

// Cost, power, weight are base values at 14" reference size.
// Actual values are multiplied by the screen size's displayMultiplier.

export const DISPLAY_TECH: Component[] = [
  {
    id: "tech_tn",
    name: "TN Panel",
    slot: "displayTech",
    yearIntroduced: 2000,
    yearDiscontinued: 2008,
    costAtLaunch: 30,
    powerDrawW: 3,
    weightG: 50,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { type: "TN", viewingAngle: "~90°", colorAccuracy: "Standard", brightness: "170 nits" },
    stats: { display: 10 },
  },
  {
    id: "tech_tn_bright",
    name: "TN Panel (High Brightness)",
    slot: "displayTech",
    yearIntroduced: 2003,
    yearDiscontinued: 2008,
    costAtLaunch: 50,
    powerDrawW: 4,
    weightG: 55,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { type: "TN", viewingAngle: "~100°", colorAccuracy: "Standard", brightness: "250 nits" },
    stats: { display: 18 },
  },
  {
    id: "tech_ips_early",
    name: "IPS Panel",
    slot: "displayTech",
    yearIntroduced: 2004,
    yearDiscontinued: 2009,
    costAtLaunch: 120,
    powerDrawW: 5,
    weightG: 65,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { type: "IPS", viewingAngle: "~170°", colorAccuracy: "High", brightness: "220 nits" },
    stats: { display: 35 },
  },
];
