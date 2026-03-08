import { Trophy } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";
import { AWARD_CATEGORY_LIST } from "../../../simulation/reviewsAwards";

export function ReviewsCard() {
  const { state } = useGame();
  const reviews = state.currentYearReviews;
  const awards = state.currentYearAwards;

  // Show only player reviews
  const playerReviews = reviews.filter((r) => r.owner === "player");

  return (
    <BentoCard title="Reviews & Awards" icon={Trophy} screen="reviewsAwards">
      <p style={sectionHeadingStyle}>Latest Reviews</p>
      {playerReviews.length > 0 ? (
        playerReviews.map((r) => (
          <div key={`${r.laptopId}-${r.outlet}`} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
            <span style={smallTextStyle}>{r.outletName}: {r.laptopName}</span>
            <span style={{ ...smallTextStyle, fontWeight: 600 }}>{r.score}/10</span>
          </div>
        ))
      ) : (
        <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
          {state.quarter === 1 && !state.quarterSimulated
            ? "Reviews published after Q1 sales resolve"
            : "No reviews yet"}
        </p>
      )}
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Year-End Awards</p>
        {awards.length > 0 ? (
          awards.map((a) => (
            <div key={a.category} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
              <span style={smallTextStyle}>{a.categoryLabel}</span>
              <span style={{ ...smallTextStyle, fontWeight: 600 }}>{a.winnerName}</span>
            </div>
          ))
        ) : (
          AWARD_CATEGORY_LIST.map((cat) => (
            <div key={cat.category} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
              <span style={smallTextStyle}>{cat.label}</span>
              <span style={hintStyle}>TBD</span>
            </div>
          ))
        )}
        <p style={{ ...hintStyle, marginTop: tokens.spacing.sm }}>
          {awards.length > 0
            ? "Award winners receive +2 perception and +1% reach"
            : "Awards announced after Q4"
          }
        </p>
      </div>
    </BentoCard>
  );
}
