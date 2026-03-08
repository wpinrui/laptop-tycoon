import { Sparkles } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { ProgressBar } from "./ProgressBar";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";

import { LaptopStat } from "../../../data/types";

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

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...sectionHeadingStyle, marginBottom: tokens.spacing.sm }}>Recognition</p>
      <div style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>
        <ProgressBar value={Math.round(state.brandRecognition)} height={8} />
        <span style={cardBodyStyle}>{Math.round(state.brandRecognition)}/100</span>
      </div>
      <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
        Grows with sales volume and positive reviews
      </p>
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
