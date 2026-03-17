import { Component } from "../types";

// Cost, power, weight are base values at 14" reference size.
// Actual values are multiplied by the screen size's displayMultiplier.

export const DISPLAY_TECH: Component[] = [
  {
    id: "tech_tn",
    name: "TN Panel",
    description: "Standard panel — fast response but poor viewing angles and colors.",
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
    description: "Brighter TN panel for better outdoor visibility. Still limited angles.",
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
    description: "Premium panel with wide viewing angles and accurate colors.",
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

  // --- 2007 ---
  {
    id: "tech_tn_led",
    name: "LED-backlit TN Panel",
    description:
      "LED backlight replaces CCFL — thinner, lighter, and more uniform brightness.",
    slot: "displayTech",
    yearIntroduced: 2007,
    yearDiscontinued: 2012,
    costAtLaunch: 80,
    powerDrawW: 3,
    weightG: 40,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      type: "TN",
      backlight: "LED",
      viewingAngle: "~100°",
      colorAccuracy: "Standard",
      brightness: "250 nits",
    },
    stats: { display: 22 },
  },

  // --- 2008 ---
  {
    id: "tech_tn_led_bright",
    name: "LED-backlit TN Panel (High Brightness)",
    description:
      "Brighter LED-backlit TN for outdoor visibility. Fast response times.",
    slot: "displayTech",
    yearIntroduced: 2008,
    yearDiscontinued: 2013,
    costAtLaunch: 60,
    powerDrawW: 4,
    weightG: 42,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      type: "TN",
      backlight: "LED",
      viewingAngle: "~110°",
      colorAccuracy: "Standard",
      brightness: "300 nits",
    },
    stats: { display: 28 },
  },

  // --- 2009 ---
  {
    id: "tech_ips_led",
    name: "LED-backlit IPS Panel",
    description:
      "Premium LED-backlit IPS with wide viewing angles and vivid colors.",
    slot: "displayTech",
    yearIntroduced: 2009,
    yearDiscontinued: 2014,
    costAtLaunch: 150,
    powerDrawW: 5,
    weightG: 55,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      type: "IPS",
      backlight: "LED",
      viewingAngle: "~178°",
      colorAccuracy: "High (>95% sRGB)",
      brightness: "300 nits",
    },
    stats: { display: 45 },
  },
];
