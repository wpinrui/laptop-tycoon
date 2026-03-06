import { Sparkles } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";

const reputationStats = [
  "Performance", "Gaming", "Display", "Build Quality",
  "Battery Life", "Value", "Design", "Portability",
];

export function BrandCard() {
  const { state } = useGame();

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...sectionHeadingStyle, marginBottom: tokens.spacing.sm }}>Recognition</p>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
        <div
          style={{
            flex: 1,
            height: 8,
            background: tokens.colors.panelBorder,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${state.brandRecognition}%`,
              height: "100%",
              background: tokens.colors.accent,
              borderRadius: 4,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={cardBodyStyle}>{state.brandRecognition}/100</span>
      </div>
      <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
        Grows with sales volume and positive reviews
      </p>
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Niche Reputation</p>
        {reputationStats.map((stat) => (
          <div key={stat} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
            <span style={smallTextStyle}>{stat}</span>
            <span style={hintStyle}>—</span>
          </div>
        ))}
        <p style={{ ...hintStyle, marginTop: tokens.spacing.md }}>
          Reputation builds with consistent product focus across multiple years
        </p>
      </div>
    </BentoCard>
  );
}
