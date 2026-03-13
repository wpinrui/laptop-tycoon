import { DemographicId } from "./types";
import { getInflatedCost } from "../simulation/costInflation";

export interface Sponsorship {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  reachBonus: Partial<Record<DemographicId, number>>;
}

export const SPONSORSHIPS: Sponsorship[] = [
  {
    id: "gaming_tournament",
    name: "Gaming Tournament Sponsor",
    description: "Sponsor a major esports tournament. Highly targeted at gamers and tech enthusiasts.",
    baseCost: 150_000,
    reachBonus: {
      gamer: 5,
      techEnthusiast: 2,
      esportsPro: 3,
      streamer: 2,
    },
  },
  {
    id: "university_programme",
    name: "University Laptop Programme",
    description: "Partner with universities to offer student discounts and campus presence.",
    baseCost: 300_000,
    reachBonus: {
      student: 6,
      educationK12: 2,
    },
  },
  {
    id: "enterprise_conference",
    name: "Enterprise IT Conference",
    description: "Exhibit at a major enterprise IT conference. Reaches corporate and business buyers.",
    baseCost: 400_000,
    reachBonus: {
      corporate: 5,
      businessProfessional: 3,
      dayTrader: 2,
    },
  },
  {
    id: "tech_blog_partnership",
    name: "Tech Blog Partnership",
    description: "Partner with popular tech review sites for sponsored content and reviews.",
    baseCost: 100_000,
    reachBonus: {
      techEnthusiast: 4,
      gamer: 2,
      developer: 3,
      streamer: 1,
    },
  },
  {
    id: "retail_shelf_placement",
    name: "Retail Shelf Placement Deal",
    description: "Secure premium shelf placement at major retail chains. Broad but shallow reach.",
    baseCost: 500_000,
    reachBonus: {
      corporate: 3,
      businessProfessional: 3,
      student: 3,
      creativeProfessional: 3,
      gamer: 3,
      techEnthusiast: 3,
      generalConsumer: 3,
      budgetBuyer: 3,
      developer: 3,
      educationK12: 3,
      videoEditor: 3,
      threeDArtist: 3,
      musicProducer: 3,
      esportsPro: 3,
      streamer: 3,
      digitalNomad: 3,
      fieldWorker: 3,
      writer: 3,
      dayTrader: 3,
      desktopReplacement: 3,
    },
  },
  {
    id: "transit_ads",
    name: "Airport & Transit Ads",
    description: "Billboard and digital ads in airports and transit hubs. Targets business travellers.",
    baseCost: 250_000,
    reachBonus: {
      businessProfessional: 2,
      generalConsumer: 2,
      digitalNomad: 3,
    },
  },
  {
    id: "tv_commercial",
    name: "TV Commercial",
    description: "National TV ad campaign. Expensive but reaches the broadest audience.",
    baseCost: 800_000,
    reachBonus: {
      corporate: 2,
      businessProfessional: 2,
      student: 2,
      creativeProfessional: 2,
      gamer: 2,
      techEnthusiast: 2,
      generalConsumer: 4,
      budgetBuyer: 2,
      developer: 2,
      educationK12: 2,
      videoEditor: 2,
      threeDArtist: 2,
      musicProducer: 2,
      esportsPro: 2,
      streamer: 2,
      digitalNomad: 2,
      fieldWorker: 2,
      writer: 2,
      dayTrader: 2,
      desktopReplacement: 2,
    },
  },
];

/** Get the inflation-adjusted cost of a sponsorship for a given year. */
export function getSponsorshipCost(sponsorship: Sponsorship, year: number): number {
  return getInflatedCost(sponsorship.baseCost, year);
}
