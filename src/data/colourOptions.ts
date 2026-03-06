export interface ColourOption {
  id: string;
  name: string;
  hex: string;
  costPerUnit: number; // additional manufacturing cost per laptop
}

export const COLOUR_OPTIONS: ColourOption[] = [
  // Standard — cheap, safe, common
  { id: "black", name: "Black", hex: "#1a1a1a", costPerUnit: 2 },
  { id: "dark-grey", name: "Dark Grey", hex: "#4a4a4a", costPerUnit: 2 },
  { id: "white", name: "White", hex: "#F0F0F0", costPerUnit: 3 },
  { id: "silver", name: "Silver", hex: "#C0C0C0", costPerUnit: 3 },
  // Trendy pastels — moderate, custom pigment work
  { id: "baby-blue", name: "Baby Blue", hex: "#89CFF0", costPerUnit: 7 },
  { id: "pastel-green", name: "Pastel Green", hex: "#9CD4A0", costPerUnit: 7 },
  { id: "lilac", name: "Lilac", hex: "#B8A9D0", costPerUnit: 8 },
  // Premium — special finishes, metallic or muted luxury
  { id: "champagne", name: "Champagne", hex: "#D4C5A9", costPerUnit: 10 },
  { id: "midnight-blue", name: "Midnight Blue", hex: "#1B2A4A", costPerUnit: 10 },
  { id: "copper", name: "Copper", hex: "#C07040", costPerUnit: 12 },
  { id: "rose-gold", name: "Rose Gold", hex: "#B76E79", costPerUnit: 14 },
  // Bold — expensive, niche appeal
  { id: "yellow", name: "Yellow", hex: "#F5D033", costPerUnit: 12 },
];
