import { AdCampaign } from "../types";
import { CAMPAIGN_COST_INFLATION, CAMPAIGN_BASE_YEAR } from "../../../simulation/tunables";

export const AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: "no_campaign",
    name: "No Campaign",
    description: "No advertising. Rely on word of mouth and reviews.",
    baseCost: 0,
    distribution: { mean: 0, stdDev: 0, skew: 0, min: 0, max: 0 },
  },
  {
    id: "product_showcase",
    name: "Product Showcase",
    description: "A polished product video and press kit. Safe, professional, predictable.",
    baseCost: 2_000_000,
    distribution: { mean: 5, stdDev: 2, skew: 0, min: 1, max: 10 },
  },
  {
    id: "lifestyle",
    name: "Lifestyle Campaign",
    description: "Aspirational branding — show the lifestyle, not the specs.",
    baseCost: 1_200_000,
    distribution: { mean: 8, stdDev: 5, skew: -0.3, min: -3, max: 20 },
  },
  {
    id: "comparative",
    name: "Comparative Ad",
    description: "Directly call out a competitor's weakness. Bold but can look petty.",
    baseCost: 600_000,
    distribution: { mean: 10, stdDev: 8, skew: -0.5, min: -10, max: 30 },
  },
  {
    id: "stunt",
    name: "Stunt / Viral",
    description: "Outrageous publicity stunt. Could go massively viral or massively wrong.",
    baseCost: 200_000,
    distribution: { mean: 12, stdDev: 12, skew: -0.7, min: -20, max: 40 },
  },
];

export function getCampaignCost(campaign: AdCampaign, year: number): number {
  const yearsElapsed = year - CAMPAIGN_BASE_YEAR;
  return Math.round(campaign.baseCost * Math.pow(CAMPAIGN_COST_INFLATION, yearsElapsed));
}

export function getRiskLabel(campaign: AdCampaign): string {
  if (campaign.id === "no_campaign") return "No Risk";
  if (campaign.distribution.stdDev <= 2) return "Low Risk";
  if (campaign.distribution.stdDev <= 5) return "Medium Risk";
  if (campaign.distribution.stdDev <= 8) return "High Risk";
  return "Very High Risk";
}
