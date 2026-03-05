import { Component } from "../types";

export const WIFI: Component[] = [
  // --- 2000 (no wifi standard, optional) ---
  {
    id: "no_wifi",
    name: "No WiFi",
    slot: "wifi",
    yearIntroduced: 2000,
    yearDiscontinued: 2005,
    costAtLaunch: 0,
    powerDrawW: 0,
    weightG: 0,
    specs: { wifi: "None", bluetooth: "None" },
    stats: { connectivity: 0 },
  },
  {
    id: "wifi_802_11b",
    name: "802.11b WiFi",
    slot: "wifi",
    yearIntroduced: 2000,
    yearDiscontinued: 2004,
    costAtLaunch: 50,
    powerDrawW: 2,
    weightG: 10,
    specs: { wifi: "802.11b", speed: "11 Mbps", bluetooth: "None" },
    stats: { connectivity: 35 },
  },

  // --- 2002 ---
  {
    id: "wifi_802_11b_bt1",
    name: "802.11b WiFi + Bluetooth 1.1",
    slot: "wifi",
    yearIntroduced: 2002,
    yearDiscontinued: 2005,
    costAtLaunch: 65,
    powerDrawW: 3,
    weightG: 12,
    specs: { wifi: "802.11b", speed: "11 Mbps", bluetooth: "1.1" },
    stats: { connectivity: 45 },
  },

  // --- 2003 (Centrino era) ---
  {
    id: "intel_pro_2100_abg",
    name: "Intel PRO/Wireless 2100 (802.11b/g)",
    slot: "wifi",
    yearIntroduced: 2003,
    yearDiscontinued: 2005,
    costAtLaunch: 40,
    powerDrawW: 2,
    weightG: 8,
    specs: { wifi: "802.11b/g", speed: "54 Mbps", bluetooth: "None" },
    stats: { connectivity: 55 },
  },

  // --- 2004 ---
  {
    id: "intel_pro_2200bg_bt",
    name: "Intel PRO/Wireless 2200BG + Bluetooth 1.2",
    slot: "wifi",
    yearIntroduced: 2004,
    yearDiscontinued: 2006,
    costAtLaunch: 45,
    powerDrawW: 2,
    weightG: 8,
    specs: { wifi: "802.11b/g", speed: "54 Mbps", bluetooth: "1.2" },
    stats: { connectivity: 62 },
  },
  {
    id: "intel_pro_2915abg",
    name: "Intel PRO/Wireless 2915ABG",
    slot: "wifi",
    yearIntroduced: 2004,
    yearDiscontinued: 2006,
    costAtLaunch: 55,
    powerDrawW: 2,
    weightG: 8,
    specs: { wifi: "802.11a/b/g", speed: "54 Mbps", bluetooth: "None" },
    stats: { connectivity: 68 },
  },

  // --- 2005 ---
  {
    id: "intel_pro_3945abg_bt",
    name: "Intel PRO/Wireless 3945ABG + Bluetooth 2.0",
    slot: "wifi",
    yearIntroduced: 2005,
    yearDiscontinued: 2008,
    costAtLaunch: 45,
    powerDrawW: 2,
    weightG: 7,
    specs: { wifi: "802.11a/b/g", speed: "54 Mbps", bluetooth: "2.0 + EDR" },
    stats: { connectivity: 75 },
  },
];
