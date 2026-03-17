import { Component } from "../types";

export const WEBCAMS: Component[] = [
  {
    id: "no_webcam",
    name: "No Webcam",
    description: "No built-in camera. Users need an external USB webcam.",
    slot: "webcam",
    yearIntroduced: 2000,
    yearDiscontinued: 2006,
    costAtLaunch: 0,
    powerDrawW: 0,
    weightG: 0,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "None" },
    stats: { webcam: 0 },
  },

  // --- 2003 (early built-in webcams) ---
  {
    id: "vga_webcam_03",
    name: "VGA Webcam (0.3 MP)",
    description: "Basic built-in webcam for video calls — grainy but convenient.",
    slot: "webcam",
    yearIntroduced: 2003,
    yearDiscontinued: 2006,
    costAtLaunch: 15,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "640x480", megapixels: "0.3 MP" },
    stats: { webcam: 35 },
  },

  // --- 2005 ---
  {
    id: "webcam_1_3mp",
    name: "1.3 MP Webcam",
    description: "Higher resolution webcam with noticeably clearer image quality.",
    slot: "webcam",
    yearIntroduced: 2005,
    yearDiscontinued: 2008,
    costAtLaunch: 20,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1280x1024", megapixels: "1.3 MP" },
    stats: { webcam: 55 },
  },

  // --- 2005 (high-end) ---
  {
    id: "webcam_2mp",
    name: "2.0 MP Webcam",
    description: "Top-of-the-line webcam with sharp video and still image capture.",
    slot: "webcam",
    yearIntroduced: 2005,
    yearDiscontinued: 2009,
    costAtLaunch: 45,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: { resolution: "1600x1200", megapixels: "2.0 MP" },
    stats: { webcam: 75 },
  },

  // --- 2007 ---
  {
    id: "webcam_1_3mp_improved",
    name: "1.3 MP Webcam (Improved)",
    description:
      "Standard built-in webcam with better low-light performance.",
    slot: "webcam",
    yearIntroduced: 2007,
    yearDiscontinued: 2010,
    costAtLaunch: 12,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x1024",
      megapixels: "1.3 MP",
      feature: "Improved sensor",
    },
    stats: { webcam: 48 },
  },

  // --- 2008 ---
  {
    id: "webcam_2mp_autofocus",
    name: "2.0 MP Webcam with Autofocus",
    description: "Sharp webcam with auto-focus for clearer video calls.",
    slot: "webcam",
    yearIntroduced: 2008,
    yearDiscontinued: 2011,
    costAtLaunch: 20,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1600x1200",
      megapixels: "2.0 MP",
      feature: "Autofocus",
    },
    stats: { webcam: 68 },
  },

  // --- 2009 ---
  {
    id: "webcam_hd_720p",
    name: "HD 720p Webcam",
    description:
      "High-definition webcam for crystal-clear video conferencing.",
    slot: "webcam",
    yearIntroduced: 2009,
    yearDiscontinued: 2012,
    costAtLaunch: 30,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p video",
    },
    stats: { webcam: 82 },
  },

  // --- 2010 ---
  {
    id: "webcam_hd_720p_wide",
    name: "HD 720p Wide-angle Webcam",
    description:
      "HD webcam with wider field of view — ideal for group calls.",
    slot: "webcam",
    yearIntroduced: 2010,
    yearDiscontinued: 2013,
    costAtLaunch: 25,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p + wide-angle lens",
    },
    stats: { webcam: 88 },
  },
];
