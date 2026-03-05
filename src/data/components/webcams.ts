import { Component } from "../types";

export const WEBCAMS: Component[] = [
  {
    id: "no_webcam",
    name: "No Webcam",
    slot: "webcam",
    yearIntroduced: 2000,
    yearDiscontinued: 2006,
    costAtLaunch: 0,
    powerDrawW: 0,
    weightG: 0,
    specs: { resolution: "None" },
    stats: { webcam: 0 },
  },

  // --- 2003 (early built-in webcams) ---
  {
    id: "vga_webcam_03",
    name: "VGA Webcam (0.3 MP)",
    slot: "webcam",
    yearIntroduced: 2003,
    yearDiscontinued: 2006,
    costAtLaunch: 15,
    powerDrawW: 1,
    weightG: 5,
    specs: { resolution: "640x480", megapixels: "0.3 MP" },
    stats: { webcam: 35 },
  },

  // --- 2005 ---
  {
    id: "webcam_1_3mp",
    name: "1.3 MP Webcam",
    slot: "webcam",
    yearIntroduced: 2005,
    yearDiscontinued: 2008,
    costAtLaunch: 20,
    powerDrawW: 1,
    weightG: 5,
    specs: { resolution: "1280x1024", megapixels: "1.3 MP" },
    stats: { webcam: 55 },
  },
];
