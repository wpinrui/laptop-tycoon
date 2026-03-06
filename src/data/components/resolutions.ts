import { Component } from "../types";

// Cost, power, weight are base values at 14" reference size.
// Actual values are multiplied by the screen size's displayMultiplier.

export const RESOLUTIONS: Component[] = [
  // --- 2000 ---
  {
    id: "res_svga",
    name: "SVGA (800x600)",
    description: "Low resolution — text is large and workspace is limited.",
    slot: "resolution",
    yearIntroduced: 2000,
    yearDiscontinued: 2003,
    costAtLaunch: 40,
    powerDrawW: 4,
    weightG: 180,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "800x600", pixels: "480K", aspectRatio: "4:3" },
    stats: { display: 15 },
  },
  {
    id: "res_xga",
    name: "XGA (1024x768)",
    description: "The standard laptop resolution. Good balance of sharpness and performance.",
    slot: "resolution",
    yearIntroduced: 2000,
    yearDiscontinued: 2005,
    costAtLaunch: 60,
    powerDrawW: 5,
    weightG: 200,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1024x768", pixels: "786K", aspectRatio: "4:3" },
    stats: { display: 30 },
  },

  // --- 2001 ---
  {
    id: "res_sxga_plus",
    name: "SXGA+ (1400x1050)",
    description: "High resolution for professionals who need more screen real estate.",
    slot: "resolution",
    yearIntroduced: 2001,
    yearDiscontinued: 2006,
    costAtLaunch: 120,
    powerDrawW: 7,
    weightG: 220,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1400x1050", pixels: "1.47M", aspectRatio: "4:3" },
    stats: { display: 48 },
  },

  // --- 2003 ---
  {
    id: "res_wxga",
    name: "WXGA (1280x800)",
    description: "Widescreen format — better for movies and side-by-side windows.",
    slot: "resolution",
    yearIntroduced: 2003,
    yearDiscontinued: 2007,
    costAtLaunch: 70,
    powerDrawW: 5,
    weightG: 200,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1280x800", pixels: "1.02M", aspectRatio: "16:10" },
    stats: { display: 38 },
  },

  // --- 2004 ---
  {
    id: "res_wsxga_plus",
    name: "WSXGA+ (1680x1050)",
    description: "High-res widescreen for creative professionals. Sharp and spacious.",
    slot: "resolution",
    yearIntroduced: 2004,
    yearDiscontinued: 2008,
    costAtLaunch: 140,
    powerDrawW: 7,
    weightG: 230,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1680x1050", pixels: "1.76M", aspectRatio: "16:10" },
    stats: { display: 55 },
  },

  // --- 2005 ---
  {
    id: "res_wuxga",
    name: "WUXGA (1920x1200)",
    description: "Ultra-high resolution — stunning clarity but demanding on the GPU.",
    slot: "resolution",
    yearIntroduced: 2005,
    yearDiscontinued: 2009,
    costAtLaunch: 200,
    powerDrawW: 8,
    weightG: 240,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1920x1200", pixels: "2.30M", aspectRatio: "16:10" },
    stats: { display: 70 },
  },
];
