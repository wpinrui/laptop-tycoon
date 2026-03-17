/**
 * News system types — fictional publication outlets, event categories,
 * and the NewsItem structure that populates the player's news feed.
 */

import { Quarter } from "../renderer/state/gameTypes";

export type NewsOutletId = "techbuzz" | "siliconStandard" | "consumerWeekly";

export interface NewsOutlet {
  id: NewsOutletId;
  name: string;
  tagline: string;
}

export const OUTLETS: Record<NewsOutletId, NewsOutlet> = {
  techbuzz: {
    id: "techbuzz",
    name: "TechBuzz",
    tagline: "First to the future",
  },
  siliconStandard: {
    id: "siliconStandard",
    name: "The Silicon Standard",
    tagline: "Analysis that matters",
  },
  consumerWeekly: {
    id: "consumerWeekly",
    name: "Consumer Weekly",
    tagline: "Tech for the rest of us",
  },
};

export type NewsCategory =
  | "productLaunch"
  | "componentLaunch"
  | "financial"
  | "marketShare"
  | "perception"
  | "review"
  | "award";

export type NewsBody =
  | { type: "productLaunch"; companyName: string; modelName: string; screenSize: number; price: number; isPlayer: boolean; pressQuotes?: string[] }
  | { type: "componentLaunch"; components: { name: string; slot: string; description: string }[] }
  | { type: "financial"; milestoneTitle: string }
  | { type: "marketShare"; demographic: string; share: number; threshold: number }
  | { type: "perception"; demographic: string; delta: number; direction: "up" | "down" }
  | { type: "review"; laptopName: string; outlet: string; score: number; sentences: string[] }
  | { type: "award"; category: string; winnerName: string; ownerName: string; runnerUpName?: string };

export interface NewsItem {
  id: string;
  year: number;
  quarter: Quarter;
  category: NewsCategory;
  outlet: NewsOutletId;
  headline: string;
  /** Optional subheadline for extra flavour — one sentence max */
  subheadline?: string;
  /** Structured data for rich rendering in the News screen (category-specific) */
  body?: NewsBody;
}
