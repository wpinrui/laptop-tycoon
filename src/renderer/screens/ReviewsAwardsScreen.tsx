import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { StatusBar } from "../shell/StatusBar";
import { tokens } from "../shell/tokens";
import { titleStyle, sectionStyle, sectionHeadingStyle, tableStyle, thStyle, tdStyle, tdRight } from "./summaryStyles";
import { AWARD_CATEGORY_LIST } from "../../simulation/reviewsAwards";
import { AwardsTable } from "./AwardsTable";
import { reviewScoreColor } from "../utils/reviewScoreColor";

export function ReviewsAwardsScreen() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const reviews = state.currentYearReviews;
  const awards = state.currentYearAwards;
  const playerReviews = reviews.filter((r) => r.owner === "player");
  const competitorReviews = reviews.filter((r) => r.owner !== "player");

  return (
    <ContentPanel maxWidth={900}>
      <h1 style={titleStyle}>Reviews & Awards — {state.year}</h1>

      {/* Player Reviews */}
      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Your Reviews</h3>
        {playerReviews.length > 0 ? (
          playerReviews.map((r) => (
            <div
              key={`${r.laptopId}-${r.outlet}`}
              style={{
                marginBottom: tokens.spacing.md,
                padding: tokens.spacing.md,
                background: tokens.colors.surface,
                borderRadius: tokens.borderRadius.md,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.spacing.sm }}>
                <span style={{ fontWeight: 600 }}>{r.outletName}</span>
                <span style={{ fontWeight: 700, fontSize: tokens.font.sizeTitle, color: reviewScoreColor(r.score) }}>
                  {r.score}/10
                </span>
              </div>
              <p style={{ margin: 0, fontWeight: 600, marginBottom: tokens.spacing.xs }}>{r.laptopName}</p>
              {r.sentences.map((s, i) => (
                <p key={i} style={{ margin: 0, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted, fontSize: tokens.font.sizeSmall }}>
                  {s}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>
            {state.quarter <= 1 && !state.quarterSimulated
              ? "Reviews will be published after Q1 sales resolve."
              : "No reviews this year."}
          </p>
        )}
      </div>

      {/* Competitor Reviews Summary */}
      {competitorReviews.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Competitor Reviews</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Outlet</th>
                <th style={thStyle}>Laptop</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {competitorReviews.map((r) => (
                <tr key={`${r.laptopId}-${r.outlet}`}>
                  <td style={tdStyle}>{r.outletName}</td>
                  <td style={tdStyle}>{r.laptopName}</td>
                  <td style={tdRight}>{r.score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Awards */}
      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Year-End Awards</h3>
        {awards.length > 0 ? (
          <AwardsTable awards={awards} />
        ) : (
          <div>
            {AWARD_CATEGORY_LIST.map((cat) => (
              <div key={cat.category} style={{ display: "flex", justifyContent: "space-between", padding: `${tokens.spacing.xs}px 0` }}>
                <span>{cat.label}</span>
                <span style={{ color: tokens.colors.textMuted, fontStyle: "italic" }}>TBD</span>
              </div>
            ))}
            <p style={{ color: tokens.colors.textMuted, fontStyle: "italic", marginTop: tokens.spacing.sm }}>
              Awards announced after Q4 simulation.
            </p>
          </div>
        )}
      </div>

      <MenuButton
        variant="accent"
        onClick={() => navigateTo("dashboard")}
        style={{ width: "100%", marginTop: tokens.spacing.md }}
      >
        Back to Dashboard
      </MenuButton>
      <StatusBar />
    </ContentPanel>
  );
}
