export interface ColourOption {
  id: string;
  name: string;
  hex: string;
  costPerUnit: number; // additional manufacturing cost per laptop
}

export const COLOUR_OPTIONS: ColourOption[] = [
  // Standard colours — cheap
  { id: "silver", name: "Silver", hex: "#C0C0C0", costPerUnit: 2 },
  { id: "black", name: "Black", hex: "#1a1a1a", costPerUnit: 2 },
  { id: "white", name: "White", hex: "#F5F5F5", costPerUnit: 3 },
  { id: "space-gray", name: "Space Gray", hex: "#6B6B6B", costPerUnit: 4 },
  // Premium colours — moderate
  { id: "midnight-blue", name: "Midnight Blue", hex: "#1B2A4A", costPerUnit: 8 },
  { id: "dark-green", name: "Dark Green", hex: "#2E4A3A", costPerUnit: 8 },
  { id: "champagne", name: "Champagne", hex: "#D4C5A9", costPerUnit: 8 },
  { id: "burgundy", name: "Burgundy", hex: "#6B1C2A", costPerUnit: 10 },
  // Statement colours — expensive
  { id: "gold", name: "Gold", hex: "#D4AF37", costPerUnit: 15 },
  { id: "rose-gold", name: "Rose Gold", hex: "#B76E79", costPerUnit: 15 },
  { id: "red", name: "Red", hex: "#CC2233", costPerUnit: 12 },
  { id: "blue", name: "Blue", hex: "#3366CC", costPerUnit: 12 },
];
