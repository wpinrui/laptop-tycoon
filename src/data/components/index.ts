import { Component } from "../types";
import { CPUS } from "./cpus";
import { GPUS } from "./gpus";
import { RAM } from "./ram";
import { STORAGE } from "./storage";
import { RESOLUTIONS } from "./resolutions";
import { DISPLAY_TECH } from "./displayTech";
import { DISPLAY_SURFACES } from "./displaySurfaces";
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
  ...RESOLUTIONS,
  ...DISPLAY_TECH,
  ...DISPLAY_SURFACES,
  ...BATTERIES,
  ...WIFI,
  ...WEBCAMS,
  ...SPEAKERS,
  ...PORTS,
];

export { CPUS, GPUS, RAM, STORAGE, RESOLUTIONS, DISPLAY_TECH, DISPLAY_SURFACES, BATTERIES, WIFI, WEBCAMS, SPEAKERS, PORTS };
