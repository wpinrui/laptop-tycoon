import { Trophy } from "lucide-react";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";

export function ReviewsCard() {
  return (
    <BentoCard title="Reviews & Awards" icon={Trophy} screen="reviewsAwards">
      <p style={sectionHeadingStyle}>Latest Reviews</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No reviews yet — launch your first model!
      </p>
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Year-End Awards</p>
        {[
          "Best Overall Laptop",
          "Best Value",
          "Best Gaming Laptop",
          "Best Business Laptop",
          "Best Display",
          "Most Innovative Design",
          "Best Build Quality",
          "Best Battery Life",
        ].map((award) => (
          <div key={award} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
            <span style={smallTextStyle}>{award}</span>
            <span style={hintStyle}>TBD</span>
          </div>
        ))}
        <p style={{ ...hintStyle, marginTop: tokens.spacing.sm }}>
          Awards announced after year-end simulation
        </p>
      </div>
    </BentoCard>
  );
}
