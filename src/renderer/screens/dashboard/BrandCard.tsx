import { Sparkles } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { ProgressBar } from "./ProgressBar";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";
import { perceptionColor } from "./utils";

import { DEMOGRAPHICS } from "../../../data/demographics";
import { LaptopStat, DemographicId } from "../../../data/types";

const reputationStats: { label: string; key: LaptopStat }[] = [
  { label: "Performance", key: "performance" },
  { label: "Gaming", key: "gamingPerformance" },
  { label: "Battery Life", key: "batteryLife" },
  { label: "Display", key: "display" },
  { label: "Connectivity", key: "connectivity" },
  { label: "Speakers", key: "speakers" },
  { label: "Webcam", key: "webcam" },
  { label: "Design", key: "design" },
  { label: "Build Quality", key: "buildQuality" },
  { label: "Keyboard", key: "keyboard" },
  { label: "Trackpad", key: "trackpad" },
  { label: "Repairability", key: "repairability" },
  { label: "Weight", key: "weight" },
  { label: "Thinness", key: "thinness" },
  { label: "Thermals", key: "thermals" },
  { label: "Support", key: "supportAndService" },
];

export function BrandCard() {
  const { state } = useGame();

  const perceptionValue = Math.round(state.brandPerception);
  const perceptionSign = perceptionValue > 0 ? "+" : "";

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...sectionHeadingStyle, marginBottom: tokens.spacing.sm }}>Brand Reach</p>
      {DEMOGRAPHICS.map((dem) => {
        const reach = Math.round(state.brandReach[dem.id as DemographicId] ?? 0);
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
          <span style={{ ...cardBodyStyle, fontSize: 20, color: perceptionColor(perceptionValue) }}>
            {perceptionSign}{perceptionValue}
          </span>
          <span style={hintStyle}>/ 50</span>
        </div>
        <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
          Accumulated sentiment — positive = benefit of the doubt, negative = scepticism
        </p>
      </div>

      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Niche Reputation</p>
        {reputationStats.map(({ label, key }) => {
          const value = Math.round(state.nicheReputation[key] ?? 0);
          return (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", marginTop: tokens.spacing.xs }}>
              <span style={smallTextStyle}>{label}</span>
              <span style={value > 0 ? smallTextStyle : hintStyle}>
                {value > 0 ? value : "—"}
              </span>
            </div>
          );
        })}
        <p style={{ ...hintStyle, marginTop: tokens.spacing.md }}>
          Reputation builds with consistent product focus across multiple years
        </p>
      </div>
    </BentoCard>
  );
}
