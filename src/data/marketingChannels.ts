import { DemographicId } from "./types";
import { getInflatedCost } from "../simulation/costInflation";

export type MarketingTier = 1 | 2 | 3;
export type MarketingMode = "aggressive" | "premium";

export interface MarketingChannel {
  id: string;
  name: string;
  description: string;
  tier: MarketingTier;
  /** Base quarterly cost (year-2000 dollars, inflates over time) */
  baseCostPerQuarter: number;
  /** First year available */
  yearAvailable: number;
  /** Last year available (inclusive). null = never deprecated. */
  yearDeprecated: number | null;
  /** Demographics this channel targets */
  targetDemographics: DemographicId[];
}

/** Raw reach contribution per quarter per targeted demographic, by tier. */
export const CHANNEL_REACH_PER_TIER: Record<MarketingTier, number> = {
  1: 0.5,
  2: 0.3,
  3: 0.2,
};

/** Premium mode costs 1.5x base */
export const PREMIUM_COST_MULTIPLIER = 1.5;
/** Premium mode delivers 0.7x reach but adds perception bonus */
export const PREMIUM_REACH_MULTIPLIER = 0.7;
/** Perception experience modifier per aggressive channel per targeted demographic */
export const AGGRESSIVE_PERCEPTION_PENALTY = -0.2;
/** Perception experience modifier per premium channel per targeted demographic */
export const PREMIUM_PERCEPTION_BONUS = 0.2;
/** WoM multiplier bonus for premium channels (added to the base 1.0) */
export const PREMIUM_WOM_BONUS = 0.1;

/** Get the quarterly cost for a channel in a given year and mode. */
export function getChannelCost(channel: MarketingChannel, year: number, mode: MarketingMode): number {
  const base = getInflatedCost(channel.baseCostPerQuarter, year);
  return mode === "premium" ? Math.round(base * PREMIUM_COST_MULTIPLIER) : base;
}

/** Check if a channel is available in a given year. */
export function isChannelAvailable(channel: MarketingChannel, year: number): boolean {
  if (year < channel.yearAvailable) return false;
  if (channel.yearDeprecated !== null && year > channel.yearDeprecated) return false;
  return true;
}

export const MARKETING_CHANNELS: MarketingChannel[] = [
  // ============================================================
  // TIER 1 — Grassroots/Niche ($20K–$50K/qtr, 2-4 demographics)
  // ============================================================
  {
    id: "techForums",
    name: "Tech Forum Sponsorship",
    description: "Banner ads and sponsored threads on enthusiast hardware forums.",
    tier: 1,
    baseCostPerQuarter: 25_000,
    yearAvailable: 2000,
    yearDeprecated: 2012,
    targetDemographics: ["techEnthusiast", "developer"],
  },
  {
    id: "lanParty",
    name: "LAN Party Sponsorship",
    description: "Provide demo units and prizes at competitive LAN events.",
    tier: 1,
    baseCostPerQuarter: 20_000,
    yearAvailable: 2000,
    yearDeprecated: 2010,
    targetDemographics: ["gamer", "esportsPro"],
  },
  {
    id: "campusRep",
    name: "Campus Rep Program",
    description: "Student ambassadors demo your laptops on college campuses.",
    tier: 1,
    baseCostPerQuarter: 30_000,
    yearAvailable: 2000,
    yearDeprecated: null,
    targetDemographics: ["student", "educationK12"],
  },
  {
    id: "makerMeetups",
    name: "Maker/Hacker Meetups",
    description: "Sponsor local maker spaces and hackathon events.",
    tier: 1,
    baseCostPerQuarter: 25_000,
    yearAvailable: 2005,
    yearDeprecated: null,
    targetDemographics: ["developer", "techEnthusiast", "threeDArtist"],
  },
  {
    id: "indieGameTournaments",
    name: "Indie Game Tournaments",
    description: "Sponsor small-scale competitive gaming events and indie showcases.",
    tier: 1,
    baseCostPerQuarter: 30_000,
    yearAvailable: 2005,
    yearDeprecated: null,
    targetDemographics: ["gamer", "esportsPro", "streamer"],
  },
  {
    id: "musicForums",
    name: "Music Production Forums",
    description: "Advertise on DAW communities and music production sites.",
    tier: 1,
    baseCostPerQuarter: 20_000,
    yearAvailable: 2000,
    yearDeprecated: null,
    targetDemographics: ["musicProducer", "creativeProfessional"],
  },
  {
    id: "nomadBlogs",
    name: "Digital Nomad Blogs",
    description: "Sponsored reviews on remote work and travel blogs.",
    tier: 1,
    baseCostPerQuarter: 25_000,
    yearAvailable: 2008,
    yearDeprecated: null,
    targetDemographics: ["digitalNomad", "writer"],
  },
  {
    id: "twitchPartnerships",
    name: "Twitch/Streamer Partnerships",
    description: "Send units to popular streamers for on-stream use and reviews.",
    tier: 1,
    baseCostPerQuarter: 40_000,
    yearAvailable: 2012,
    yearDeprecated: null,
    targetDemographics: ["streamer", "gamer", "esportsPro"],
  },
  {
    id: "youtubeReviewers",
    name: "YouTube Tech Reviewers",
    description: "Seed units to tech YouTubers for detailed review coverage.",
    tier: 1,
    baseCostPerQuarter: 50_000,
    yearAvailable: 2010,
    yearDeprecated: null,
    targetDemographics: ["techEnthusiast", "gamer", "developer", "videoEditor"],
  },

  // ============================================================
  // TIER 2 — Professional/Trade ($100K–$150K/qtr, 5-8 demographics)
  // ============================================================
  {
    id: "tradeShow",
    name: "Trade Show Booth (CES/Computex)",
    description: "Major presence at industry trade shows with demos and press events.",
    tier: 2,
    baseCostPerQuarter: 150_000,
    yearAvailable: 2000,
    yearDeprecated: null,
    targetDemographics: ["techEnthusiast", "businessProfessional", "corporate", "developer", "creativeProfessional"],
  },
  {
    id: "bizMagazine",
    name: "Business Magazine Ads",
    description: "Full-page spreads in Forbes, BusinessWeek, and trade publications.",
    tier: 2,
    baseCostPerQuarter: 100_000,
    yearAvailable: 2000,
    yearDeprecated: 2015,
    targetDemographics: ["businessProfessional", "corporate", "dayTrader"],
  },
  {
    id: "itChannel",
    name: "IT Channel Partnership",
    description: "Partner with IT resellers and managed service providers for enterprise deals.",
    tier: 2,
    baseCostPerQuarter: 120_000,
    yearAvailable: 2000,
    yearDeprecated: null,
    targetDemographics: ["corporate", "businessProfessional", "educationK12", "fieldWorker"],
  },
  {
    id: "creativeBundle",
    name: "Creative Software Bundle",
    description: "Bundle creative software trials with your laptops. Co-marketing with software vendors.",
    tier: 2,
    baseCostPerQuarter: 100_000,
    yearAvailable: 2003,
    yearDeprecated: null,
    targetDemographics: ["creativeProfessional", "videoEditor", "threeDArtist", "musicProducer", "streamer"],
  },
  {
    id: "linkedinAds",
    name: "LinkedIn/Professional Ads",
    description: "Targeted ads on LinkedIn and professional networking platforms.",
    tier: 2,
    baseCostPerQuarter: 120_000,
    yearAvailable: 2008,
    yearDeprecated: null,
    targetDemographics: ["businessProfessional", "corporate", "dayTrader", "developer", "digitalNomad"],
  },
  {
    id: "esportsLeague",
    name: "Esports League Sponsorship",
    description: "Official hardware sponsor for competitive esports leagues.",
    tier: 2,
    baseCostPerQuarter: 130_000,
    yearAvailable: 2010,
    yearDeprecated: null,
    targetDemographics: ["esportsPro", "gamer", "streamer", "techEnthusiast", "student"],
  },
  {
    id: "podcastNetwork",
    name: "Podcast Network Ads",
    description: "Host-read ads across popular tech, business, and creative podcasts.",
    tier: 2,
    baseCostPerQuarter: 100_000,
    yearAvailable: 2014,
    yearDeprecated: null,
    targetDemographics: ["techEnthusiast", "developer", "businessProfessional", "creativeProfessional", "writer", "digitalNomad"],
  },

  // ============================================================
  // TIER 3 — Mass Market ($250K–$500K/qtr, 10-18 demographics)
  // ============================================================
  {
    id: "printCampaign",
    name: "Print Magazine Campaign",
    description: "Broad print campaign across consumer, tech, and lifestyle magazines.",
    tier: 3,
    baseCostPerQuarter: 300_000,
    yearAvailable: 2000,
    yearDeprecated: 2012,
    targetDemographics: [
      "generalConsumer", "businessProfessional", "budgetBuyer", "student",
      "corporate", "creativeProfessional", "writer", "desktopReplacement",
    ],
  },
  {
    id: "tvCampaign",
    name: "National TV Campaign",
    description: "Prime-time television commercials reaching the broadest possible audience.",
    tier: 3,
    baseCostPerQuarter: 500_000,
    yearAvailable: 2000,
    yearDeprecated: null,
    targetDemographics: [
      "generalConsumer", "businessProfessional", "budgetBuyer", "student",
      "corporate", "creativeProfessional", "gamer", "techEnthusiast",
      "educationK12", "developer", "desktopReplacement", "fieldWorker",
    ],
  },
  {
    id: "displayNetwork",
    name: "Online Display Network",
    description: "Banner ads across major websites and ad networks. Broad reach, low engagement.",
    tier: 3,
    baseCostPerQuarter: 250_000,
    yearAvailable: 2004,
    yearDeprecated: null,
    targetDemographics: [
      "generalConsumer", "businessProfessional", "budgetBuyer", "student",
      "corporate", "creativeProfessional", "gamer", "techEnthusiast",
      "educationK12", "developer", "videoEditor", "threeDArtist",
      "musicProducer", "esportsPro", "streamer", "digitalNomad",
      "fieldWorker", "writer", "dayTrader", "desktopReplacement",
    ],
  },
  {
    id: "socialMedia",
    name: "Social Media Campaign",
    description: "Paid campaigns across Facebook, Instagram, Twitter, and emerging platforms.",
    tier: 3,
    baseCostPerQuarter: 300_000,
    yearAvailable: 2010,
    yearDeprecated: null,
    targetDemographics: [
      "generalConsumer", "businessProfessional", "budgetBuyer", "student",
      "creativeProfessional", "gamer", "techEnthusiast", "educationK12",
      "developer", "videoEditor", "threeDArtist", "musicProducer",
      "esportsPro", "streamer", "digitalNomad", "writer",
      "dayTrader", "desktopReplacement",
    ],
  },
  {
    id: "influencerNetwork",
    name: "Influencer Network",
    description: "Coordinated campaign across lifestyle, tech, and creative influencers.",
    tier: 3,
    baseCostPerQuarter: 400_000,
    yearAvailable: 2015,
    yearDeprecated: null,
    targetDemographics: [
      "student", "generalConsumer", "gamer", "streamer",
      "creativeProfessional", "techEnthusiast", "videoEditor",
      "musicProducer", "digitalNomad", "writer", "desktopReplacement",
    ],
  },
];
