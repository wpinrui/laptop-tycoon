import { History } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";

export function HistoryCard() {
  return (
    <BentoCard title="History" icon={History} screen="history">
      <p style={emptyStateStyle}>No history yet</p>
    </BentoCard>
  );
}
