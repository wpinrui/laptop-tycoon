import { Component } from "../types";
import { CPUS } from "./cpus";
import { GPUS } from "./gpus";
import { RAM } from "./ram";
import { STORAGE } from "./storage";
import { RESOLUTIONS } from "./resolutions";
import { DISPLAY_TECH } from "./displayTech";
import { DISPLAY_SURFACES } from "./displaySurfaces";
import { WIFI } from "./wifi";
import { WEBCAMS } from "./webcams";
import { SPEAKERS } from "./speakers";

export const ALL_COMPONENTS: Component[] = [
  ...CPUS,
  ...GPUS,
  ...RAM,
  ...STORAGE,
  ...RESOLUTIONS,
  ...DISPLAY_TECH,
  ...DISPLAY_SURFACES,
  ...WIFI,
  ...WEBCAMS,
  ...SPEAKERS,
];

export { CPUS, GPUS, RAM, STORAGE, RESOLUTIONS, DISPLAY_TECH, DISPLAY_SURFACES, WIFI, WEBCAMS, SPEAKERS };
