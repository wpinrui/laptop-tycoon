/**
 * Reviews & Awards system.
 *
 * - Reviews: published after Q1 sales resolve (2 per laptop: tech & mainstream outlet)
 * - Awards: published after Q4 (category winners from all companies)
 * - Award effect: demographic-specific perception & reach boost based on outlet affinity
 */

import { DemographicId, LaptopStat, ALL_STATS } from "../data/types";
import { GameState, CompanyState, modelDisplayName } from "../renderer/state/gameTypes";
import { computeStatsForDesign } from "./statCalculation";
import { LaptopSalesResult, QuarterSimulationResult } from "./salesTypes";
import {
  AWARD_PRIMARY_PERCEPTION_BONUS,
  AWARD_PRIMARY_REACH_BONUS,
  AWARD_SECONDARY_PERCEPTION_BONUS,
  AWARD_SECONDARY_REACH_BONUS,
  PERCEPTION_CONTRIBUTION_SCALE,
} from "./tunables";

// ==================== Types ====================

export type ReviewOutlet = "techEnthusiast" | "mainstream";

export interface LaptopReview {
  laptopId: string;
  laptopName: string;
  owner: string;
  outlet: ReviewOutlet;
  outletName: string;
  score: number; // 1-10
  sentences: string[];
}

export type AwardCategory =
  | "bestOverall"
  | "bestValue"
  | "bestPortable"
  | "bestPerformance"
  | "bestForBusiness";

export interface Award {
  category: AwardCategory;
  categoryLabel: string;
  winnerId: string; // laptop id
  winnerName: string;
  ownerCompanyId: string;
  ownerCompanyName: string;
}

export interface ReviewsAwarded {
  reviews: LaptopReview[];
}

export interface AwardsAwarded {
  awards: Award[];
}

// ==================== Review Generation ====================

/** Stat groups the tech enthusiast outlet cares about */
const TECH_STATS: LaptopStat[] = [
  "performance", "gamingPerformance", "connectivity",
  "thermals", "batteryLife", "display",
];

/** Stat groups the mainstream outlet cares about */
const MAINSTREAM_STATS: LaptopStat[] = [
  "design", "buildQuality", "keyboard", "trackpad",
  "display", "batteryLife", "weight", "thinness",
];

// --- Template Data ---

interface SentimentTemplates {
  good: string[];
  neutral: string[];
  bad: string[];
}

const STAT_TEMPLATES: Partial<Record<LaptopStat, SentimentTemplates>> = {
  performance: {
    good: [
      "The {{laptop}} delivers impressive processing power that handles demanding workloads with ease.",
      "Performance is a clear strength — the {{laptop}} chews through multitasking without breaking a sweat.",
      "Benchmark results place the {{laptop}} among the fastest in its class.",
    ],
    neutral: [
      "The {{laptop}} offers adequate processing power for everyday tasks.",
      "Performance is middling — fine for general use but nothing to write home about.",
      "CPU performance lands squarely in the middle of the pack.",
    ],
    bad: [
      "The {{laptop}} struggles under moderate workloads, showing its limitations quickly.",
      "Performance is disappointing — expect noticeable lag during multitasking.",
      "The processing power here falls short of what the competition offers at this price.",
    ],
  },
  gamingPerformance: {
    good: [
      "Gamers will appreciate the {{laptop}}'s ability to push high frame rates in current titles.",
      "Graphics performance is excellent, making this a compelling choice for gaming.",
    ],
    neutral: [
      "Light gaming is possible on the {{laptop}}, but don't expect to max out settings.",
      "The GPU handles older titles well enough, though newer games require compromises.",
    ],
    bad: [
      "Gaming performance is severely limited — this isn't the machine for playing anything demanding.",
      "The integrated graphics struggle with even modest gaming workloads.",
    ],
  },
  batteryLife: {
    good: [
      "Battery life is outstanding — the {{laptop}} easily lasts a full workday on a single charge.",
      "With excellent endurance, the {{laptop}} won't leave you hunting for outlets.",
    ],
    neutral: [
      "Battery life is acceptable, getting you through most of a workday with careful use.",
      "Expect average battery runtime — not bad, but you'll want to pack a charger for long days.",
    ],
    bad: [
      "Battery life is a weakness, barely lasting half a workday under normal use.",
      "The {{laptop}} is essentially tethered to the wall — disappointing endurance.",
    ],
  },
  display: {
    good: [
      "The display is a highlight, offering vibrant colours and sharp detail.",
      "Screen quality is excellent — text is crisp and media looks fantastic.",
    ],
    neutral: [
      "The display is serviceable for everyday work, though it won't wow you.",
      "Screen quality is average — adequate brightness and colour accuracy.",
    ],
    bad: [
      "The display is noticeably below par, with washed-out colours and limited brightness.",
      "Screen quality lets the {{laptop}} down — a better panel would improve the experience significantly.",
    ],
  },
  connectivity: {
    good: [
      "Connectivity options are generous, with a solid selection of ports and fast wireless.",
      "The {{laptop}} scores well on connectivity — plenty of ports and modern standards.",
    ],
    neutral: [
      "Port selection is adequate, covering the basics without going above and beyond.",
      "Connectivity is standard fare — nothing remarkable but nothing missing either.",
    ],
    bad: [
      "Limited port selection is a frustration — you'll likely need a dongle or dock.",
      "Connectivity is sparse, which feels like an oversight at this price point.",
    ],
  },
  design: {
    good: [
      "The {{laptop}} is a looker — clean lines and premium materials make a strong first impression.",
      "Design is clearly a priority here, and the result is one of the most attractive laptops available.",
    ],
    neutral: [
      "The design is inoffensive but unremarkable — it won't turn heads either way.",
      "Aesthetically, the {{laptop}} takes a conservative approach. It's fine.",
    ],
    bad: [
      "The design feels dated, with chunky proportions that won't impress.",
      "Visually, the {{laptop}} lacks the polish you'd expect from a modern machine.",
    ],
  },
  buildQuality: {
    good: [
      "Build quality is top-notch — the chassis feels rock-solid with minimal flex.",
      "Premium materials and tight tolerances give the {{laptop}} a reassuringly sturdy feel.",
    ],
    neutral: [
      "Build quality is decent enough, with only minor flex in the keyboard deck.",
      "Construction is passable — it'll hold up fine with normal care.",
    ],
    bad: [
      "Build quality is concerning, with noticeable flex and creaking that doesn't inspire confidence.",
      "The chassis feels flimsy, which is disappointing for a laptop in this segment.",
    ],
  },
  keyboard: {
    good: [
      "The keyboard is a joy to type on, with satisfying travel and consistent feedback.",
      "Typing experience is excellent — one of the better keyboards we've tested recently.",
    ],
    neutral: [
      "The keyboard is perfectly acceptable for everyday typing, if unremarkable.",
      "Key feel is adequate — not the best, but you'll get used to it quickly.",
    ],
    bad: [
      "The keyboard is a letdown, with mushy keys and an uncomfortable layout.",
      "Typing on the {{laptop}} is a chore — the keyboard needs serious improvement.",
    ],
  },
  trackpad: {
    good: [
      "The trackpad is responsive and spacious, with smooth gesture support.",
      "Trackpad quality is a highlight — precise tracking and satisfying clicks.",
    ],
    neutral: [
      "The trackpad works well enough for daily navigation.",
      "Tracking is acceptable, though gesture support could be more refined.",
    ],
    bad: [
      "The trackpad is small and imprecise, making navigation more frustrating than it needs to be.",
      "Trackpad quality is below average — consider pairing this with a mouse.",
    ],
  },
  weight: {
    good: [
      "It's impressively light, making the {{laptop}} genuinely easy to carry around all day.",
      "Portability is excellent thanks to the feathery weight.",
    ],
    neutral: [
      "Weight is about average for this class — manageable but not ultralight.",
      "It's neither heavy nor particularly light. Standard fare.",
    ],
    bad: [
      "This is a heavy machine — your shoulders will know about it at the end of the day.",
      "Weight is a significant drawback for anyone hoping to travel light.",
    ],
  },
  thinness: {
    good: [
      "The slim profile slips easily into any bag and looks great on a desk.",
      "Impressively thin, the {{laptop}} feels thoroughly modern.",
    ],
    neutral: [
      "Thickness is typical for the category — not slim, not bulky.",
      "The profile is unremarkable. It's a standard-size machine.",
    ],
    bad: [
      "The thick chassis feels out of place next to slimmer competitors.",
      "Bulk is noticeable — this is not the sleekest option available.",
    ],
  },
  thermals: {
    good: [
      "Thermal management is excellent — the {{laptop}} stays cool and quiet under load.",
      "Heat and noise are well controlled, even during sustained workloads.",
    ],
    neutral: [
      "Thermals are acceptable, with moderate fan noise under heavy use.",
      "The cooling system keeps things in check, though it gets audible when pushed.",
    ],
    bad: [
      "Thermal throttling is a real issue, limiting sustained performance.",
      "The {{laptop}} runs hot and loud — the cooling system can't keep up.",
    ],
  },
  speakers: {
    good: [
      "Speaker quality surprises — full sound with decent bass for a laptop.",
      "Audio output is well above average, making the {{laptop}} great for media.",
    ],
    neutral: [
      "Speakers are adequate for casual listening, but nothing special.",
      "Audio is tinny at high volumes — you'll want headphones for anything serious.",
    ],
    bad: [
      "Speaker quality is poor — thin, quiet, and lacking any bass.",
      "Audio output is a weak point. External speakers are practically required.",
    ],
  },
  webcam: {
    good: [
      "The webcam produces a clear, well-lit image — great for video calls.",
      "Video quality is notably better than the competition's grainy offerings.",
    ],
    neutral: [
      "The webcam is serviceable for video calls in decent lighting.",
      "Image quality is average — it gets the job done.",
    ],
    bad: [
      "The webcam produces a grainy, dark image. Not ideal for regular video calls.",
      "Webcam quality is disappointing in an era when video calls are essential.",
    ],
  },
};

const INTRO_TEMPLATES = {
  techEnthusiast: [
    "We've spent the past few weeks putting the {{laptop}} through its paces.",
    "The {{laptop}} promises a lot on paper. Here's how it performs in practice.",
    "After extensive testing, we're ready to deliver our verdict on the {{laptop}}.",
    "We ran a full battery of benchmarks and real-world tests on the {{laptop}}.",
  ],
  mainstream: [
    "The {{laptop}} arrives at a competitive price point. Is it worth your money?",
    "We've been using the {{laptop}} as our daily driver. Here's what we found.",
    "If you're in the market for a new laptop, the {{laptop}} deserves a look.",
    "The {{laptop}} aims to balance features and price. Let's see how it does.",
  ],
};

const VERDICT_TEMPLATES = {
  good: [
    "Overall, the {{laptop}} is an excellent choice that's easy to recommend.",
    "The {{laptop}} earns a strong recommendation from us.",
    "This is one of the better laptops we've reviewed — well worth considering.",
  ],
  neutral: [
    "The {{laptop}} is a decent option, though it faces stiff competition.",
    "There's nothing wrong with the {{laptop}}, but there's nothing exceptional either.",
    "The {{laptop}} is a solid if unremarkable choice in a crowded market.",
  ],
  bad: [
    "It's hard to recommend the {{laptop}} when better alternatives exist at the same price.",
    "The {{laptop}} has some redeeming qualities, but the shortcomings are hard to overlook.",
    "We'd suggest looking elsewhere unless the {{laptop}} addresses its key weaknesses.",
  ],
};

// ==================== Review Scoring Constants ====================

/** Minimum ratio clamp when comparing a stat to market average */
const RATIO_CLAMP_MIN = 0.5;
/** Maximum ratio clamp when comparing a stat to market average */
const RATIO_CLAMP_MAX = 1.5;
/** Ratio above which a stat is considered "good" in review sentiment */
const SENTIMENT_GOOD_THRESHOLD = 1.15;
/** Ratio below which a stat is considered "bad" in review sentiment */
const SENTIMENT_BAD_THRESHOLD = 0.85;
/** Maximum stat commentaries per review */
const MAX_STATS_PER_REVIEW = 6;
/** Divisor for normalising retail price in value scoring (higher price = lower value) */
const VALUE_PRICE_DIVISOR = 1000;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/**
 * Compute a simple score for a laptop by comparing its stats against the market average.
 * Returns a 1–10 score.
 */
function computeReviewScore(
  laptopStats: Record<LaptopStat, number>,
  marketAvg: Record<LaptopStat, number>,
  focusStats: LaptopStat[],
): number {
  let above = 0;
  let total = 0;
  for (const stat of focusStats) {
    const val = laptopStats[stat] ?? 0;
    const avg = marketAvg[stat] ?? 0;
    if (avg > 0) {
      const ratio = val / avg;
      above += Math.min(Math.max(ratio, RATIO_CLAMP_MIN), RATIO_CLAMP_MAX);
      total += 1;
    }
  }
  if (total === 0) return 5;
  const avgRatio = above / total;
  // Map RATIO_CLAMP_MIN–RATIO_CLAMP_MAX → 1–10
  const score = 1 + (avgRatio - RATIO_CLAMP_MIN) * (9 / (RATIO_CLAMP_MAX - RATIO_CLAMP_MIN));
  // Add slight randomness (±0.5)
  const noisy = score + (Math.random() - 0.5);
  return Math.round(Math.min(10, Math.max(1, noisy)));
}

/**
 * Determine sentiment for a stat based on how it compares to market average.
 */
function getSentiment(value: number, avg: number): "good" | "neutral" | "bad" {
  if (avg === 0) return "neutral";
  const ratio = value / avg;
  if (ratio > SENTIMENT_GOOD_THRESHOLD) return "good";
  if (ratio < SENTIMENT_BAD_THRESHOLD) return "bad";
  return "neutral";
}

/**
 * Generate reviews for all laptops on sale after Q1.
 */
export function generateReviews(state: GameState, q1Result: QuarterSimulationResult): LaptopReview[] {
  const reviews: LaptopReview[] = [];
  const year = state.year;

  // Collect all active laptops (player + competitor) from simulation results
  const allLaptopIds = q1Result.laptopResults.map((r) => r.laptopId);
  if (allLaptopIds.length === 0) return reviews;

  // Build stat vectors for all laptops
  const statsByLaptop = new Map<string, Record<LaptopStat, number>>();
  const laptopNames = new Map<string, string>();
  const laptopOwners = new Map<string, string>();

  for (const company of state.companies) {
    for (const model of company.models) {
      if (!allLaptopIds.includes(model.design.id)) continue;
      const stats = computeStatsForDesign(model.design, year);
      const fullStats = {} as Record<LaptopStat, number>;
      for (const s of ALL_STATS) fullStats[s] = stats[s] ?? 0;
      statsByLaptop.set(model.design.id, fullStats);
      laptopNames.set(model.design.id, modelDisplayName(company.name, model.design.name));
      laptopOwners.set(model.design.id, company.id);
    }
  }

  // Compute market averages
  const marketAvg = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    let sum = 0;
    let count = 0;
    for (const stats of statsByLaptop.values()) {
      sum += stats[stat] ?? 0;
      count++;
    }
    marketAvg[stat] = count > 0 ? sum / count : 0;
  }

  // Generate 2 reviews per laptop
  for (const laptopId of allLaptopIds) {
    const stats = statsByLaptop.get(laptopId);
    if (!stats) continue;
    const name = laptopNames.get(laptopId) ?? "Unknown";
    const owner = laptopOwners.get(laptopId) ?? "";
    const vars = { laptop: name };

    for (const outlet of ["techEnthusiast", "mainstream"] as ReviewOutlet[]) {
      const focusStats = outlet === "techEnthusiast" ? TECH_STATS : MAINSTREAM_STATS;
      const outletName = outlet === "techEnthusiast" ? "TechByte Review" : "Digital Life Magazine";

      const score = computeReviewScore(stats, marketAvg, focusStats);
      const sentences: string[] = [];

      // Intro
      sentences.push(fillTemplate(pickRandom(INTRO_TEMPLATES[outlet]), vars));

      // Stat commentaries (pick 5-6 relevant stats)
      const statsToReview = focusStats.slice(0, Math.min(MAX_STATS_PER_REVIEW, focusStats.length));
      for (const stat of statsToReview) {
        const templates = STAT_TEMPLATES[stat];
        if (!templates) continue;
        const sentiment = getSentiment(stats[stat] ?? 0, marketAvg[stat] ?? 0);
        const pool = templates[sentiment];
        if (pool.length > 0) {
          sentences.push(fillTemplate(pickRandom(pool), vars));
        }
      }

      // Verdict
      const verdictSentiment = score >= 7 ? "good" : score >= 5 ? "neutral" : "bad";
      sentences.push(fillTemplate(pickRandom(VERDICT_TEMPLATES[verdictSentiment]), vars));

      reviews.push({
        laptopId,
        laptopName: name,
        owner,
        outlet,
        outletName,
        score,
        sentences,
      });
    }
  }

  return reviews;
}

// ==================== Award Determination ====================

/** Which outlet each award category is associated with (determines demographic impact). */
const AWARD_OUTLET_AFFINITY: Record<AwardCategory, ReviewOutlet | "both"> = {
  bestOverall: "both",
  bestValue: "mainstream",
  bestPortable: "mainstream",
  bestPerformance: "techEnthusiast",
  bestForBusiness: "mainstream",
};

type DemographicAffinity = "primary" | "secondary";

/** Demographics that care about tech-focused review outlets */
const TECH_OUTLET_DEMOGRAPHICS: Record<string, DemographicAffinity> = {
  techEnthusiast: "primary",
  gamer: "primary",
  developer: "primary",
  esportsPro: "primary",
  streamer: "primary",
  videoEditor: "secondary",
  threeDArtist: "secondary",
  dayTrader: "secondary",
  creativeProfessional: "secondary",
};

/** Demographics that care about mainstream review outlets */
const MAINSTREAM_OUTLET_DEMOGRAPHICS: Record<string, DemographicAffinity> = {
  generalConsumer: "primary",
  student: "primary",
  budgetBuyer: "primary",
  businessProfessional: "primary",
  corporate: "primary",
  educationK12: "primary",
  digitalNomad: "secondary",
  fieldWorker: "secondary",
  writer: "secondary",
  desktopReplacement: "secondary",
  musicProducer: "secondary",
};

/** Get the affinity level for a demographic given an award's outlet type. */
function getDemographicAffinity(
  demId: DemographicId,
  outlet: ReviewOutlet | "both",
): DemographicAffinity | null {
  if (outlet === "both") {
    const tech = TECH_OUTLET_DEMOGRAPHICS[demId];
    const mainstream = MAINSTREAM_OUTLET_DEMOGRAPHICS[demId];
    // Take the best match from either outlet
    if (tech === "primary" || mainstream === "primary") return "primary";
    if (tech === "secondary" || mainstream === "secondary") return "secondary";
    return null;
  }
  if (outlet === "techEnthusiast") return TECH_OUTLET_DEMOGRAPHICS[demId] ?? null;
  return MAINSTREAM_OUTLET_DEMOGRAPHICS[demId] ?? null;
}

const AWARD_CATEGORIES: {
  category: AwardCategory;
  label: string;
  /** How to score: either a single stat, a stat combo, or a custom function key */
  scoring: "overall" | "value" | "portable" | LaptopStat;
}[] = [
  { category: "bestOverall", label: "Best Overall Laptop", scoring: "overall" },
  { category: "bestValue", label: "Best Value", scoring: "value" },
  { category: "bestPortable", label: "Best Portable", scoring: "portable" },
  { category: "bestPerformance", label: "Best Performance Laptop", scoring: "performance" },
  { category: "bestForBusiness", label: "Best for Business", scoring: "buildQuality" },
];

/**
 * Determine year-end awards based on all laptops that were on sale during the year.
 * Uses aggregated year simulation data.
 */
export function determineAwards(
  state: GameState,
  yearLaptopResults: LaptopSalesResult[],
): Award[] {
  const year = state.year;

  // Build full stats and sales data for each laptop
  interface LaptopEntry {
    id: string;
    name: string;
    companyId: string;
    companyName: string;
    stats: Record<LaptopStat, number>;
    retailPrice: number;
    unitsSold: number;
  }

  const entries: LaptopEntry[] = [];

  for (const company of state.companies) {
    for (const model of company.models) {
      const salesResult = yearLaptopResults.find((r) => r.laptopId === model.design.id);
      if (!salesResult) continue;
      const stats = computeStatsForDesign(model.design, year);
      const fullStats = {} as Record<LaptopStat, number>;
      for (const s of ALL_STATS) fullStats[s] = stats[s] ?? 0;

      entries.push({
        id: model.design.id,
        name: modelDisplayName(company.name, model.design.name),
        companyId: company.id,
        companyName: company.name,
        stats: fullStats,
        retailPrice: salesResult.retailPrice,
        unitsSold: salesResult.unitsSold,
      });
    }
  }

  if (entries.length === 0) return [];

  // Score each laptop per category
  const awards: Award[] = [];

  for (const cat of AWARD_CATEGORIES) {
    let scored: { entry: LaptopEntry; score: number }[];

    if (cat.scoring === "overall") {
      // Sum of all stats
      scored = entries.map((e) => ({
        entry: e,
        score: ALL_STATS.reduce((sum, s) => sum + (e.stats[s] ?? 0), 0),
      }));
    } else if (cat.scoring === "value") {
      // Value = sum of stats / price (higher = better value)
      scored = entries.map((e) => ({
        entry: e,
        score: ALL_STATS.reduce((sum, s) => sum + (e.stats[s] ?? 0), 0) / Math.max(1, e.retailPrice / VALUE_PRICE_DIVISOR),
      }));
    } else if (cat.scoring === "portable") {
      // Portable = weight + thinness + batteryLife (all high = good)
      scored = entries.map((e) => ({
        entry: e,
        score: (e.stats.weight ?? 0) + (e.stats.thinness ?? 0) + (e.stats.batteryLife ?? 0),
      }));
    } else {
      // Single stat
      const stat = cat.scoring as LaptopStat;
      scored = entries.map((e) => ({
        entry: e,
        score: e.stats[stat] ?? 0,
      }));
    }

    // Sort descending, pick winner
    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];
    if (winner && winner.score > 0) {
      awards.push({
        category: cat.category,
        categoryLabel: cat.label,
        winnerId: winner.entry.id,
        winnerName: winner.entry.name,
        ownerCompanyId: winner.entry.companyId,
        ownerCompanyName: winner.entry.companyName,
      });
    }
  }

  return awards;
}

// ==================== Award Bonus Application ====================

/**
 * Apply demographic-specific award bonuses to all winning companies.
 * Each award targets demographics based on its outlet affinity:
 * - Primary demographics get full perception + reach boost
 * - Secondary demographics get a reduced boost
 * - Unrelated demographics get nothing
 * Returns updated companies array.
 */
export function applyAwardBonuses(
  companies: CompanyState[],
  awards: Award[],
): CompanyState[] {
  // Collect awards per company
  const awardsPerCompany = new Map<string, Award[]>();
  for (const award of awards) {
    const list = awardsPerCompany.get(award.ownerCompanyId) ?? [];
    list.push(award);
    awardsPerCompany.set(award.ownerCompanyId, list);
  }

  if (awardsPerCompany.size === 0) return companies;

  return companies.map((company) => {
    const companyAwards = awardsPerCompany.get(company.id);
    if (!companyAwards) return company;

    const newPerception = { ...company.brandPerception };
    const newReach = { ...company.brandReach };
    const newHistory = { ...company.perceptionHistory };

    for (const demId of Object.keys(newPerception) as DemographicId[]) {
      let totalPerceptionBoost = 0;
      let totalReachBoost = 0;

      for (const award of companyAwards) {
        const outlet = AWARD_OUTLET_AFFINITY[award.category];
        const affinity = getDemographicAffinity(demId, outlet);
        if (affinity === "primary") {
          totalPerceptionBoost += AWARD_PRIMARY_PERCEPTION_BONUS;
          totalReachBoost += AWARD_PRIMARY_REACH_BONUS;
        } else if (affinity === "secondary") {
          totalPerceptionBoost += AWARD_SECONDARY_PERCEPTION_BONUS;
          totalReachBoost += AWARD_SECONDARY_REACH_BONUS;
        }
        // null affinity = irrelevant demographic, no effect
      }

      if (totalPerceptionBoost > 0 || totalReachBoost > 0) {
        newPerception[demId] = Math.min(50, Math.max(-50, newPerception[demId] + totalPerceptionBoost));
        newReach[demId] = Math.min(100, newReach[demId] + totalReachBoost);
        // Inject into rolling window history so the boost persists
        const experienceBoost = totalPerceptionBoost / PERCEPTION_CONTRIBUTION_SCALE;
        const hist = [...(newHistory[demId] ?? [])];
        if (hist.length > 0) {
          hist[hist.length - 1] += experienceBoost;
        }
        newHistory[demId] = hist;
      }
    }

    return {
      ...company,
      brandPerception: newPerception,
      brandReach: newReach,
      perceptionHistory: newHistory,
    };
  });
}

/** Award category definitions exposed for UI */
export const AWARD_CATEGORY_LIST = AWARD_CATEGORIES.map((c) => ({
  category: c.category,
  label: c.label,
}));
