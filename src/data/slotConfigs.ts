import { ComponentSlotConfig } from "./types";

export const SLOT_CONFIGS: ComponentSlotConfig[] = [
  {
    slot: "cpu",
    name: "CPU",
    costDecayRate: 0.20,
    statDecay: {
      performance: 0.25,
      gamingPerformance: 0.25,
    },
  },
  {
    slot: "gpu",
    name: "GPU",
    costDecayRate: 0.20,
    statDecay: {
      gamingPerformance: 0.30,
    },
  },
  {
    slot: "ram",
    name: "RAM",
    costDecayRate: 0.30,
    statDecay: {
      performance: 0.20,
      gamingPerformance: 0.15,
    },
  },
  {
    slot: "storage",
    name: "Storage",
    costDecayRate: 0.25,
    statDecay: {
      performance: 0.15,
    },
  },
  {
    slot: "display",
    name: "Display Panel",
    costDecayRate: 0.15,
    statDecay: {
      display: 0.10,
    },
  },
  {
    slot: "battery",
    name: "Battery",
    costDecayRate: 0.10,
    statDecay: {
      batteryLife: 0.05,
    },
  },
  {
    slot: "wifi",
    name: "WiFi / Bluetooth",
    costDecayRate: 0.15,
    statDecay: {
      connectivity: 0.15,
    },
  },
  {
    slot: "webcam",
    name: "Webcam",
    costDecayRate: 0.10,
    statDecay: {
      webcam: 0.05,
    },
  },
  {
    slot: "speakers",
    name: "Speakers",
    costDecayRate: 0.10,
    statDecay: {
      speakers: 0.05,
    },
  },
  {
    slot: "ports",
    name: "Ports / Connectivity",
    costDecayRate: 0.10,
    statDecay: {
      connectivity: 0.10,
    },
  },
];
