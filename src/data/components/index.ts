import { Component } from "../types";
import { CPUS } from "./cpus";
import { GPUS } from "./gpus";
import { RAM } from "./ram";
import { STORAGE } from "./storage";
import { DISPLAYS } from "./displays";
import { BATTERIES } from "./batteries";
import { WIFI } from "./wifi";
import { WEBCAMS } from "./webcams";
import { SPEAKERS } from "./speakers";
import { PORTS } from "./ports";

export const ALL_COMPONENTS: Component[] = [
  ...CPUS,
  ...GPUS,
  ...RAM,
  ...STORAGE,
  ...DISPLAYS,
  ...BATTERIES,
  ...WIFI,
  ...WEBCAMS,
  ...SPEAKERS,
  ...PORTS,
];

export { CPUS, GPUS, RAM, STORAGE, DISPLAYS, BATTERIES, WIFI, WEBCAMS, SPEAKERS, PORTS };
