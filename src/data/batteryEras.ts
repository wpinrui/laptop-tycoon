import { BatteryEraConfig } from "./types";

export const BATTERY_ERAS: BatteryEraConfig[] = [
  { yearStart: 2000, yearEnd: 2002, costPerWh: 1.50, weightPerWh: 14.0, volumePerWh: 10.0, techLabel: "Li-Ion (Gen 1)" },
  { yearStart: 2003, yearEnd: 2005, costPerWh: 1.20, weightPerWh: 12.0, volumePerWh: 8.0, techLabel: "Li-Ion (Gen 2)" },
  { yearStart: 2006, yearEnd: 2009, costPerWh: 0.90, weightPerWh: 9.0, volumePerWh: 6.0, techLabel: "Li-Ion / Li-Poly" },
  { yearStart: 2010, yearEnd: 2014, costPerWh: 0.65, weightPerWh: 7.0, volumePerWh: 4.5, techLabel: "Li-Polymer" },
  { yearStart: 2015, yearEnd: 2019, costPerWh: 0.45, weightPerWh: 5.5, volumePerWh: 3.5, techLabel: "Li-Polymer (High Density)" },
  { yearStart: 2020, yearEnd: 2026, costPerWh: 0.35, weightPerWh: 4.0, volumePerWh: 2.8, techLabel: "Li-Polymer (Ultra Dense)" },
];

export function getBatteryEra(year: number): BatteryEraConfig {
  return BATTERY_ERAS.find((e) => year >= e.yearStart && year <= e.yearEnd) ?? BATTERY_ERAS[0];
}
