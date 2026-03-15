import { DemographicId, MarketingTier } from "./types";
import { getInflatedCost } from "../simulation/costInflation";
import {
  TIER_COSTS,
  TIER_BASE_CEILINGS,
} from "../simulation/tunables";

// Re-export MarketingTier for consumers that previously imported from here
export type { MarketingTier } from "./types";

// ==================== Tier Helpers ====================

/** Derive maximum available marketing tier from a demographic's permeability. */
export function getMaxTier(permeability: number): MarketingTier {
  if (permeability >= 0.65) return 2;
  if (permeability >= 0.35) return 3;
  if (permeability >= 0.20) return 4;
  return 5;
}

/**
 * Effective reach ceiling for a given campaign tier on a demographic.
 * Scales base ceilings proportionally so that maxTier always reaches 95%.
 */
export function getEffectiveReachCeiling(tier: MarketingTier, maxTier: MarketingTier): number {
  const baseCeiling = TIER_BASE_CEILINGS[tier];
  const maxBaseCeiling = TIER_BASE_CEILINGS[maxTier];
  return Math.min(95, baseCeiling * (95 / maxBaseCeiling));
}

/** Get the inflated quarterly cost for a campaign tier in a given year. */
export function getCampaignCost(tier: MarketingTier, year: number): number {
  return getInflatedCost(TIER_COSTS[tier], year);
}

// ==================== Social Proximity Adjacency ====================

/** Symmetric adjacency pairs: [demographicA, demographicB, weight]. */
export const SOCIAL_ADJACENCY: readonly [DemographicId, DemographicId, number][] = [
  ["gamer", "esportsPro", 0.8],
  ["gamer", "streamer", 0.6],
  ["esportsPro", "streamer", 0.5],
  ["developer", "techEnthusiast", 0.7],
  ["videoEditor", "creativeProfessional", 0.6],
  ["digitalNomad", "writer", 0.5],
  ["businessProfessional", "corporate", 0.4],
  ["student", "budgetBuyer", 0.3],
  ["musicProducer", "creativeProfessional", 0.4],
  ["threeDArtist", "creativeProfessional", 0.5],
];

/** Get all adjacent demographics and their weights for a given demographic. */
export function getAdjacencies(demId: DemographicId): { demographicId: DemographicId; weight: number }[] {
  const result: { demographicId: DemographicId; weight: number }[] = [];
  for (const [a, b, w] of SOCIAL_ADJACENCY) {
    if (a === demId) result.push({ demographicId: b, weight: w });
    else if (b === demId) result.push({ demographicId: a, weight: w });
  }
  return result;
}

// ==================== Tier Labels ====================

/** Tier flavor labels for UI display. */
export const TIER_LABELS: Record<MarketingTier, string> = {
  1: "Founder Hustle",
  2: "Targeted Digital",
  3: "Professional",
  4: "Mass Market",
  5: "Cultural Omnipresence",
};

// ==================== Campaign Descriptions ====================

/** Preset campaign descriptions per demographic × tier. */
export const CAMPAIGN_DESCRIPTIONS: Record<DemographicId, Partial<Record<MarketingTier, string>>> = {
  // === Max Tier 2 ===
  techEnthusiast: {
    1: "Posting hands-on reviews in r/hardware and enthusiast forums",
    2: "Sponsoring hardware YouTube channels and tech conference booths",
  },
  esportsPro: {
    1: "Sponsoring local LAN parties and posting in competitive gaming Discords",
    2: "Tournament prize pools, pro team equipment deals, and esports media partnerships",
  },
  gamer: {
    1: "Community posts in gaming subreddits and Discord servers, word-of-mouth seeding",
    2: "Gaming YouTuber sponsorships, Twitch streamer partnerships, and gaming site ads",
  },
  streamer: {
    1: "Gifting units to micro-streamers and posting in content creator Discords",
    2: "Mid-tier streamer sponsorships, streaming setup YouTube integrations, and creator community partnerships",
  },
  developer: {
    1: "Posting on Hacker News, Stack Overflow sponsorship, and developer meetup demos",
    2: "Tech conference sponsorships, developer podcast ads, and GitHub community partnerships",
  },

  // === Max Tier 3 ===
  videoEditor: {
    1: "Posting in video editing forums and small creator community outreach",
    2: "YouTube creator sponsorships and video editing software bundle partnerships",
    3: "Film festival sponsorships, professional editor ambassadors, and creative industry media buys",
  },
  digitalNomad: {
    1: "Posts in remote work blogs and digital nomad Discord communities",
    2: "Targeted ads on travel/remote work platforms and nomad influencer partnerships",
    3: "Co-working space partnerships, travel YouTuber sponsorships, and remote work conference presence",
  },
  creativeProfessional: {
    1: "Sponsoring local creative meetups and posting in design community forums",
    2: "Design tool bundle partnerships, creative podcast sponsorships, and Behance/Dribbble ads",
    3: "Creative conference presence, mid-tier creative influencer campaigns, and agency demo programs",
  },
  threeDArtist: {
    1: "Posting in 3D/CAD forums and sponsoring local render meetups",
    2: "Blender/Unreal community partnerships and 3D art YouTuber sponsorships",
    3: "SIGGRAPH conference presence, studio demo programs, and professional 3D media campaigns",
  },
  musicProducer: {
    1: "Posts in DAW communities and music production forums, gifting to bedroom producers",
    2: "Music production YouTuber sponsorships and DAW software bundle deals",
    3: "NAMM show presence, studio ambassador programs, and music industry publication ads",
  },

  // === Max Tier 4 ===
  dayTrader: {
    1: "Posts in trading forums and finance subreddits",
    2: "Finance podcast ads and trading platform partnership promotions",
    3: "Financial media sponsorships, trading conference booths, and fintech influencer campaigns",
    4: "CNBC/Bloomberg ads, brokerage co-marketing deals, and financial advisor channel programs",
  },
  desktopReplacement: {
    1: "Power user forum posts and enthusiast community outreach",
    2: "Hardware review site sponsorships and power user YouTuber partnerships",
    3: "Gaming/productivity hybrid campaigns, tech publication features, and retail demo kiosks",
    4: "Big-box retail floor presence, streaming and online ad campaigns targeting home office buyers",
  },
  student: {
    1: "Founder posting in student Discord servers and r/SuggestALaptop personally",
    2: "Google Ads on \"best student laptop\" and gifting units to small tech YouTubers",
    3: "Campus ambassador programs, mid-tier YouTuber sponsorships, and timed back-to-school campaigns",
    4: "Best Buy end-caps, streaming ads during back-to-school season, and university IT bulk deals",
  },
  writer: {
    1: "Posts in writing communities and NaNoWriMo forums",
    2: "Writing tool newsletter ads and book blogger/author influencer partnerships",
    3: "Literary conference presence, writing podcast sponsorships, and journalism trade ads",
    4: "Mainstream media ads in magazines and bookstores, publisher co-marketing deals",
  },

  // === Max Tier 5 ===
  businessProfessional: {
    1: "LinkedIn thought leadership posts and local networking event demos",
    2: "LinkedIn targeted ads and business podcast sponsorships",
    3: "Industry conference booths, business travel media ads, and executive influencer partnerships",
    4: "Airport lounge advertising, business magazine spreads, and airline partnership co-branding",
    5: "Celebrity CEO endorsements, Fortune 500 fleet trials, and omnipresent professional media campaigns",
  },
  budgetBuyer: {
    1: "Posts in deal-hunting forums and budget tech communities",
    2: "Google Shopping ads and coupon/deal site partnerships",
    3: "Walmart.com featured listings, budget tech YouTuber sponsorships, and comparison site placements",
    4: "Big-box retail shelf placement, Black Friday feature deals, and mass circular advertising",
    5: "National TV ads during prime time, celebrity spokesperson, and back-to-school institutional deals",
  },
  fieldWorker: {
    1: "Posts in industry-specific forums and field tech communities",
    2: "Trade publication ads and field equipment reseller partnerships",
    3: "Industry trade show booths, fleet management vendor partnerships, and rugged tech media features",
    4: "Distributor channel programs, government procurement qualification, and industry magazine campaigns",
    5: "Major contractor fleet deals, military/government contracts, and national industrial media campaigns",
  },
  corporate: {
    1: "Cold outreach to IT managers and posts in enterprise IT forums",
    2: "IT reseller partnerships and enterprise tech publication ads",
    3: "Enterprise trade show presence, managed service provider deals, and analyst briefings",
    4: "Channel partner programs, government procurement listings, and enterprise media campaigns",
    5: "Global enterprise agreements, Fortune 500 fleet deals, and institutional procurement at massive scale",
  },
  generalConsumer: {
    1: "Social media posts and word-of-mouth seeding through early adopters",
    2: "Google/Facebook targeted ads and consumer tech blog sponsored reviews",
    3: "Mid-tier influencer campaigns, online retail promotions, and tech publication ads",
    4: "Best Buy floor presence, streaming TV ads, and retail circular features",
    5: "Celebrity spokesperson, Super Bowl ad, and cultural omnipresence across all media channels",
  },
  educationK12: {
    1: "Direct outreach to school IT administrators and education tech forums",
    2: "Education technology conference presence and district pilot programs",
    3: "State education board presentations, edtech publication ads, and education ecosystem partnerships",
    4: "Regional procurement contract bids, education distributor partnerships, and teacher influencer programs",
    5: "National education framework deals, federal grant program qualification, and institutional procurement at scale",
  },
};
