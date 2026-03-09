import { DollarSign } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";

export function FinancialsCard() {
  return (
    <BentoCard title="Financials" icon={DollarSign} screen="financialHistory">
      <p style={emptyStateStyle}>No financial data yet</p>
    </BentoCard>
  );
}
