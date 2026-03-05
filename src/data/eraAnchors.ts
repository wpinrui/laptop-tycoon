import { EraAnchor } from "./types";

export const ERA_ANCHORS: EraAnchor[] = [
  {
    year: 2000,
    description: "Early laptop market. Corporate and general consumers dominate. Gaming laptops barely exist.",
    demandPool: {
      corporate: 120000,
      businessProfessional: 60000,
      student: 80000,
      creativeProfessional: 15000,
      gamer: 5000,
      techEnthusiast: 20000,
      generalConsumer: 150000,
      budgetBuyer: 50000,
    },
  },
  {
    year: 2005,
    description: "Laptops going mainstream. WiFi ubiquitous. Students and business professionals growing fast. Gaming still niche but emerging.",
    demandPool: {
      corporate: 160000,
      businessProfessional: 110000,
      student: 180000,
      creativeProfessional: 30000,
      gamer: 20000,
      techEnthusiast: 35000,
      generalConsumer: 280000,
      budgetBuyer: 100000,
    },
  },
];
