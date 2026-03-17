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

  // --- 2016 ---
  {
    id: "webcam_hd_720p_2016",
    name: "HD 720p Webcam (2016)",
    description:
      "Still just 720p on most laptops — even premium ones. The sad webcam era begins.",
    slot: "webcam",
    yearIntroduced: 2016,
    yearDiscontinued: 2019,
    costAtLaunch: 8,
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
  {
    id: "webcam_hd_1080p_2016",
    name: "Full HD 1080p Webcam (2016)",
    description:
      "1080p webcam reserved for premium models. Noticeably sharper video calls.",
    slot: "webcam",
    yearIntroduced: 2016,
    yearDiscontinued: 2019,
    costAtLaunch: 25,
    powerDrawW: 1,
    weightG: 6,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1920x1080",
      megapixels: "2.1 MP (Full HD)",
      feature: "1080p video",
    },
    stats: { webcam: 108 },
  },

  // --- 2017 ---
  {
    id: "webcam_hd_720p_ir",
    name: "HD 720p Webcam + IR Camera",
    description:
      "720p webcam with infrared sensor for Windows Hello face unlock. Security meets convenience.",
    slot: "webcam",
    yearIntroduced: 2017,
    yearDiscontinued: 2020,
    costAtLaunch: 18,
    powerDrawW: 1,
    weightG: 7,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p + IR (Windows Hello)",
    },
    stats: { webcam: 100 },
  },

  // --- 2018 ---
  {
    id: "webcam_hd_720p_2018",
    name: "HD 720p Webcam (2018)",
    description:
      "720p webcams persist even on premium laptops. The camera quality stagnation continues.",
    slot: "webcam",
    yearIntroduced: 2018,
    yearDiscontinued: 2021,
    costAtLaunch: 6,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p standard",
    },
    stats: { webcam: 82 },
  },
  {
    id: "webcam_hd_1080p_ir",
    name: "Full HD 1080p Webcam + IR Camera",
    description:
      "Premium webcam combo with 1080p video and Windows Hello facial recognition.",
    slot: "webcam",
    yearIntroduced: 2018,
    yearDiscontinued: 2021,
    costAtLaunch: 30,
    powerDrawW: 1,
    weightG: 8,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1920x1080",
      megapixels: "2.1 MP (Full HD)",
      feature: "1080p + IR (Windows Hello)",
    },
    stats: { webcam: 118 },
  },

  // --- 2019 ---
  {
    id: "webcam_hd_720p_2019",
    name: "HD 720p Webcam (2019)",
    description:
      "Yes, still 720p. Even on $1500 laptops. The webcam dark ages.",
    slot: "webcam",
    yearIntroduced: 2019,
    yearDiscontinued: 2022,
    costAtLaunch: 5,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p standard",
    },
    stats: { webcam: 80 },
  },
  {
    id: "webcam_hd_720p_ir_2019",
    name: "HD 720p Webcam + IR Camera (2019)",
    description:
      "At least it has Windows Hello. The camera resolution hasn't budged though.",
    slot: "webcam",
    yearIntroduced: 2019,
    yearDiscontinued: 2022,
    costAtLaunch: 15,
    powerDrawW: 1,
    weightG: 7,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p + IR (Windows Hello)",
    },
    stats: { webcam: 98 },
  },

  // --- 2020 ---
  {
    id: "webcam_hd_720p_2020",
    name: "HD 720p Webcam (2020)",
    description:
      "The pandemic exposes how bad 720p webcams really are. Demand for better cameras skyrockets.",
    slot: "webcam",
    yearIntroduced: 2020,
    yearDiscontinued: 2023,
    costAtLaunch: 5,
    powerDrawW: 1,
    weightG: 5,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1280x720",
      megapixels: "1.0 MP (HD)",
      feature: "720p standard",
    },
    stats: { webcam: 78 },
  },
  {
    id: "webcam_hd_1080p_ir_2020",
    name: "Full HD 1080p Webcam + IR Camera (2020)",
    description:
      "Premium 1080p with Windows Hello. Finally appreciated as remote work takes over.",
    slot: "webcam",
    yearIntroduced: 2020,
    yearDiscontinued: 2023,
    costAtLaunch: 25,
    powerDrawW: 1,
    weightG: 8,
    volumeCm3: 0,
    minThicknessCm: 0,
    specs: {
      resolution: "1920x1080",
      megapixels: "2.1 MP (Full HD)",
      feature: "1080p + IR (Windows Hello)",
    },
    stats: { webcam: 120 },
  },
];
