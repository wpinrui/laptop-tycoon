import { Component } from "../types";

export const SPEAKERS: Component[] = [
  {
    id: "basic_mono",
    name: "Basic Mono Speaker",
    description: "Tinny single speaker — just enough for system sounds.",
    slot: "speakers",
    yearIntroduced: 2000,
    yearDiscontinued: 2003,
    costAtLaunch: 3,
    powerDrawW: 1,
    weightG: 20,
    volumeCm3: 15,
    minThicknessCm: 0.6,
    specs: { type: "Mono", output: "0.5W" },
    stats: { speakers: 15 },
  },
  {
    id: "stereo_basic",
    name: "Stereo Speakers",
    description: "Dual speakers for basic stereo audio. Standard laptop quality.",
    slot: "speakers",
    yearIntroduced: 2000,
    yearDiscontinued: 2005,
    costAtLaunch: 8,
    powerDrawW: 1,
    weightG: 30,
    volumeCm3: 25,
    minThicknessCm: 0.8,
    specs: { type: "Stereo", output: "1W x2" },
    stats: { speakers: 35 },
  },

  // --- 2002 ---
  {
    id: "stereo_enhanced",
    name: "Enhanced Stereo Speakers",
    description: "Better drivers for clearer mids and slightly more bass.",
    slot: "speakers",
    yearIntroduced: 2002,
    yearDiscontinued: 2006,
    costAtLaunch: 12,
    powerDrawW: 1,
    weightG: 35,
    volumeCm3: 35,
    minThicknessCm: 0.8,
    specs: { type: "Stereo", output: "1.5W x2" },
    stats: { speakers: 45 },
  },

  // --- 2004 ---
  {
    id: "jbl_branded",
    name: "JBL-branded Stereo Speakers",
    description: "Premium branded speakers with noticeably better sound quality.",
    slot: "speakers",
    yearIntroduced: 2004,
    yearDiscontinued: 2007,
    costAtLaunch: 20,
    powerDrawW: 2,
    weightG: 40,
    volumeCm3: 45,
    minThicknessCm: 1.0,
    specs: { type: "Stereo", output: "2W x2", brand: "JBL" },
    stats: { speakers: 60 },
  },

  // --- 2005 ---
  {
    id: "harman_kardon",
    name: "Harman Kardon Speakers",
    description: "Top-tier laptop audio — rich, balanced sound for media.",
    slot: "speakers",
    yearIntroduced: 2005,
    yearDiscontinued: 2008,
    costAtLaunch: 40,
    powerDrawW: 2,
    weightG: 45,
    volumeCm3: 50,
    minThicknessCm: 1.0,
    specs: { type: "Stereo", output: "2.5W x2", brand: "Harman Kardon" },
    stats: { speakers: 70 },
  },

  // --- 2006 ---
  {
    id: "stereo_improved",
    name: "Improved Stereo Speakers",
    description:
      "Better-tuned drivers with wider frequency response. A step up from basic.",
    slot: "speakers",
    yearIntroduced: 2006,
    yearDiscontinued: 2009,
    costAtLaunch: 10,
    powerDrawW: 1,
    weightG: 35,
    volumeCm3: 30,
    minThicknessCm: 0.8,
    specs: { type: "Stereo", output: "1.5W x2" },
    stats: { speakers: 48 },
  },

  // --- 2007 ---
  {
    id: "altec_lansing",
    name: "Altec Lansing Speakers",
    description:
      "Premium branded audio with rich, full sound for movies and music.",
    slot: "speakers",
    yearIntroduced: 2007,
    yearDiscontinued: 2010,
    costAtLaunch: 25,
    powerDrawW: 2,
    weightG: 40,
    volumeCm3: 45,
    minThicknessCm: 1.0,
    specs: { type: "Stereo", output: "2W x2", brand: "Altec Lansing" },
    stats: { speakers: 65 },
  },

  // --- 2008 ---
  {
    id: "stereo_with_subwoofer",
    name: "Stereo + Subwoofer Combo",
    description:
      "Built-in subwoofer adds bass depth. A big upgrade for media consumption.",
    slot: "speakers",
    yearIntroduced: 2008,
    yearDiscontinued: 2011,
    costAtLaunch: 35,
    powerDrawW: 3,
    weightG: 60,
    volumeCm3: 65,
    minThicknessCm: 1.2,
    specs: { type: "2.1 Channel", output: "2W x2 + 3W sub" },
    stats: { speakers: 78 },
  },

  // --- 2009 ---
  {
    id: "hk_premium_2009",
    name: "Harman Kardon Premium Speakers",
    description:
      "Top-tier laptop audio with custom-tuned drivers and wider soundstage.",
    slot: "speakers",
    yearIntroduced: 2009,
    yearDiscontinued: 2012,
    costAtLaunch: 45,
    powerDrawW: 2,
    weightG: 50,
    volumeCm3: 55,
    minThicknessCm: 1.0,
    specs: { type: "Stereo", output: "3W x2", brand: "Harman Kardon" },
    stats: { speakers: 82 },
  },

  // --- 2010 ---
  {
    id: "beats_audio",
    name: "Beats Audio Speakers",
    description:
      "Bass-heavy tuning with HP Beats Audio processing. Popular with consumers.",
    slot: "speakers",
    yearIntroduced: 2010,
    yearDiscontinued: 2013,
    costAtLaunch: 40,
    powerDrawW: 3,
    weightG: 55,
    volumeCm3: 60,
    minThicknessCm: 1.0,
    specs: { type: "Stereo + Sub", output: "2.5W x2 + 3W sub", brand: "Beats Audio" },
    stats: { speakers: 85 },
  },
];
