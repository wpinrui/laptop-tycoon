import { BarChart3 } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";

export function MarketCard() {
  return (
    <BentoCard title="Market" icon={BarChart3} screen="marketOverview">
      <p style={emptyStateStyle}>No market data yet</p>
    </BentoCard>
  );
}
