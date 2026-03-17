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

  // --- 2011 ---
  {
    id: "webcam_hd_720p_standard",
    name: "HD 720p Webcam",
    description:
      "720p HD webcam becomes the standard. Clear video calls for everyone.",
    slot: "webcam",
    yearIntroduced: 2011,
    yearDiscontinued: 2014,
    costAtLaunch: 15,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p standard",
    },
    stats: { webcam: 85 },
  },

  // --- 2012 ---
  {
    id: "webcam_hd_720p_lowlight",
    name: "HD 720p Webcam (Low-light Enhanced)",
    description:
      "Improved sensor for better performance in dimly lit environments.",
    slot: "webcam",
    yearIntroduced: 2012,
    yearDiscontinued: 2015,
    costAtLaunch: 18,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p + improved low-light",
    },
    stats: { webcam: 92 },
  },

  // --- 2013 ---
  {
    id: "webcam_hd_1080p",
    name: "Full HD 1080p Webcam",
    description:
      "Crystal-clear 1080p video. A premium feature for video conferencing.",
    slot: "webcam",
    yearIntroduced: 2013,
    yearDiscontinued: 2016,
    costAtLaunch: 35,
    powerDrawW: 1,
    weightG: 6,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1920x1080",
      megapixels: "2.1 MP (Full HD)",
      feature: "1080p video",
    },
    stats: { webcam: 105 },
  },

  // --- 2014 ---
  {
    id: "webcam_hd_720p_2014",
    name: "HD 720p Webcam (2014)",
    description:
      "Standard 720p webcam with better colour accuracy and faster autofocus.",
    slot: "webcam",
    yearIntroduced: 2014,
    yearDiscontinued: 2017,
    costAtLaunch: 10,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p + fast autofocus",
    },
    stats: { webcam: 90 },
  },

  // --- 2015 ---
  {
    id: "webcam_hd_1080p_wide",
    name: "Full HD 1080p Wide-angle Webcam",
    description:
      "Sharp 1080p with a wider field of view. Premium video conferencing experience.",
    slot: "webcam",
    yearIntroduced: 2015,
    yearDiscontinued: 2018,
    costAtLaunch: 30,
    powerDrawW: 1,
    weightG: 6,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1920x1080",
      megapixels: "2.1 MP (Full HD)",
      feature: "1080p + wide-angle lens",
    },
    stats: { webcam: 110 },
  },
];
