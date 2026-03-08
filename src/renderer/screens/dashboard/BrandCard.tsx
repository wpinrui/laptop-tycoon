import { Sparkles } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { ProgressBar } from "./ProgressBar";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";
import { formatPerception } from "./utils";

import { DEMOGRAPHICS } from "../../../data/demographics";

export function BrandCard() {
  const { state } = useGame();

  const perception = formatPerception(state.brandPerception);

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...sectionHeadingStyle, marginBottom: tokens.spacing.sm }}>Brand Reach</p>
      {DEMOGRAPHICS.map((dem) => {
        const reach = Math.round(state.brandReach[dem.id] ?? 0);
        return (
          <div key={dem.id} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
            <span style={{ ...smallTextStyle, minWidth: 130, flexShrink: 0 }}>{dem.name}</span>
            <ProgressBar value={reach} height={6} />
            <span style={{ ...smallTextStyle, minWidth: 36, textAlign: "right" }}>{reach}%</span>
          </div>
        );
      })}
      <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
        Percentage of each demographic that has heard of your company
      </p>

      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Brand Perception</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
          <span style={{ ...cardBodyStyle, fontSize: 20, color: perception.color }}>
            {perception.sign}{perception.value}
          </span>
          <span style={hintStyle}>/ 50</span>
        </div>
        <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
          Accumulated sentiment — positive = benefit of the doubt, negative = scepticism
        </p>
      </div>

    </BentoCard>
  );
}
