import { Newspaper } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";

export function NewsCard() {
  return (
    <BentoCard title="News" icon={Newspaper} screen="news">
      <p style={emptyStateStyle}>No news yet</p>
    </BentoCard>
  );
}
