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
    costAtLaunch: 100,
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
    costAtLaunch: 150,
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
    costAtLaunch: 300,
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
    costAtLaunch: 175,
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
    costAtLaunch: 350,
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
    costAtLaunch: 500,
    powerDrawW: 8,
    weightG: 240,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1920x1200", pixels: "2.30M", aspectRatio: "16:10" },
    stats: { display: 70 },
  },

  // --- 2006 ---
  {
    id: "res_wxga_plus",
    name: "WXGA+ (1440x900)",
    description:
      "Widescreen with extra vertical space. A nice upgrade from standard WXGA.",
    slot: "resolution",
    yearIntroduced: 2006,
    yearDiscontinued: 2010,
    costAtLaunch: 200,
    powerDrawW: 6,
    weightG: 210,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1440x900", pixels: "1.30M", aspectRatio: "16:10" },
    stats: { display: 42 },
  },

  // --- 2008 ---
  {
    id: "res_hd",
    name: "HD (1366x768)",
    description:
      "The new standard widescreen resolution. Compact 16:9 format for movies.",
    slot: "resolution",
    yearIntroduced: 2008,
    yearDiscontinued: 2013,
    costAtLaunch: 125,
    powerDrawW: 5,
    weightG: 195,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1366x768", pixels: "1.05M", aspectRatio: "16:9" },
    stats: { display: 35 },
  },
  {
    id: "res_hd_plus",
    name: "HD+ (1600x900)",
    description:
      "More screen real estate in 16:9. A sharp step up from basic HD.",
    slot: "resolution",
    yearIntroduced: 2008,
    yearDiscontinued: 2013,
    costAtLaunch: 225,
    powerDrawW: 6,
    weightG: 215,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1600x900", pixels: "1.44M", aspectRatio: "16:9" },
    stats: { display: 50 },
  },

  // --- 2009 ---
  {
    id: "res_fhd",
    name: "Full HD (1920x1080)",
    description:
      "Crisp 1080p display — perfect for HD video and detailed work.",
    slot: "resolution",
    yearIntroduced: 2009,
    yearDiscontinued: 2014,
    costAtLaunch: 350,
    powerDrawW: 7,
    weightG: 230,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1920x1080", pixels: "2.07M", aspectRatio: "16:9" },
    stats: { display: 65 },
  },

  // --- 2011 ---
  {
    id: "res_hd_standard",
    name: "HD (1366x768, LED)",
    description:
      "Standard 1366x768 with LED backlight. The default for mainstream laptops.",
    slot: "resolution",
    yearIntroduced: 2011,
    yearDiscontinued: 2016,
    costAtLaunch: 100,
    powerDrawW: 4,
    weightG: 180,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1366x768", pixels: "1.05M", aspectRatio: "16:9" },
    stats: { display: 35 },
  },

  // --- 2012 ---
  {
    id: "res_fhd_2012",
    name: "Full HD (1920x1080)",
    description:
      "Sharp 1080p display. Increasingly common as the premium mainstream choice.",
    slot: "resolution",
    yearIntroduced: 2012,
    yearDiscontinued: 2017,
    costAtLaunch: 250,
    powerDrawW: 6,
    weightG: 210,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1920x1080", pixels: "2.07M", aspectRatio: "16:9" },
    stats: { display: 68 },
  },

  // --- 2013 ---
  {
    id: "res_qhd",
    name: "QHD (2560x1440)",
    description:
      "Ultra-sharp display for professionals. Text is incredibly crisp.",
    slot: "resolution",
    yearIntroduced: 2013,
    yearDiscontinued: 2018,
    costAtLaunch: 450,
    powerDrawW: 8,
    weightG: 230,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "2560x1440", pixels: "3.69M", aspectRatio: "16:9" },
    stats: { display: 82 },
  },
  {
    id: "res_wqxga",
    name: "WQXGA (2560x1600)",
    description:
      "High-res 16:10 display with extra vertical space. Ideal for creative work.",
    slot: "resolution",
    yearIntroduced: 2013,
    yearDiscontinued: 2018,
    costAtLaunch: 500,
    powerDrawW: 8,
    weightG: 235,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "2560x1600", pixels: "4.10M", aspectRatio: "16:10" },
    stats: { display: 85 },
  },

  // --- 2014 ---
  {
    id: "res_qhd_plus",
    name: "QHD+ (3200x1800)",
    description:
      "Near-4K resolution in a laptop. Stunning pixel density that demands GPU power.",
    slot: "resolution",
    yearIntroduced: 2014,
    yearDiscontinued: 2018,
    costAtLaunch: 600,
    powerDrawW: 9,
    weightG: 240,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "3200x1800", pixels: "5.76M", aspectRatio: "16:9" },
    stats: { display: 92 },
  },

  // --- 2015 ---
  {
    id: "res_4k",
    name: "4K UHD (3840x2160)",
    description:
      "Full 4K resolution in a laptop. Jaw-dropping clarity but hammers battery life.",
    slot: "resolution",
    yearIntroduced: 2015,
    yearDiscontinued: 2019,
    costAtLaunch: 750,
    powerDrawW: 10,
    weightG: 250,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "3840x2160", pixels: "8.29M", aspectRatio: "16:9" },
    stats: { display: 100 },
  },
];
