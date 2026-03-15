import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { getPlayerCompany } from "../../state/gameTypes";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { ProgressBar } from "./ProgressBar";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";
import { formatPerception } from "./utils";

import { DEMOGRAPHICS } from "../../../data/demographics";

const TOP_N = 5;

export function BrandCard() {
  const { state } = useGame();
  const player = getPlayerCompany(state);

  const topReach = useMemo(() => {
    const entries = DEMOGRAPHICS.map((dem) => ({
      dem,
      value: Math.round(player.brandReach[dem.id] ?? 0),
    }));
    entries.sort((a, b) => b.value - a.value);
    return entries;
  }, [player.brandReach]);

  const topPerception = useMemo(() => {
    const entries = DEMOGRAPHICS.map((dem) => ({
      dem,
      value: player.brandPerception[dem.id] ?? 0,
    }));
    entries.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return entries;
  }, [player.brandPerception]);

  const shownReach = topReach.slice(0, TOP_N);
  const hiddenReachCount = topReach.length - TOP_N;

  const shownPerception = topPerception.slice(0, TOP_N);
  const hiddenPerceptionCount = topPerception.length - TOP_N;

  return (
    <BentoCard title="Brand" icon={Sparkles} screen="brandDetail">
      <p style={{ ...sectionHeadingStyle, marginBottom: tokens.spacing.sm }}>Brand Reach</p>
      {shownReach.map(({ dem, value }) => (
        <div key={dem.id} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
          <span style={{ ...smallTextStyle, minWidth: 130, flexShrink: 0 }}>{dem.shortName}</span>
          <ProgressBar value={value} height={6} />
          <span style={{ ...smallTextStyle, minWidth: 36, textAlign: "right" }}>{value}%</span>
        </div>
      ))}
      {hiddenReachCount > 0 && (
        <p style={{ ...smallTextStyle, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted }}>
          +{hiddenReachCount} more demographics
        </p>
      )}
      <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
        Percentage of each demographic that has heard of your company
      </p>

      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Brand Perception</p>
        {shownPerception.map(({ dem, value }) => {
          const perception = formatPerception(value);
          return (
            <div key={dem.id} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
              <span style={{ ...smallTextStyle, minWidth: 130, flexShrink: 0 }}>{dem.shortName}</span>
              <span style={{ ...cardBodyStyle, fontSize: 14, minWidth: 50, textAlign: "right", color: perception.color }}>
                {perception.sign}{perception.value}
              </span>
            </div>
          );
        })}
        {hiddenPerceptionCount > 0 && (
          <p style={{ ...smallTextStyle, marginTop: tokens.spacing.xs, color: tokens.colors.textMuted }}>
            +{hiddenPerceptionCount} more demographics
          </p>
        )}
        <p style={{ ...hintStyle, marginTop: tokens.spacing.xs }}>
          Accumulated sentiment — positive = benefit of the doubt, negative = scepticism
        </p>
      </div>

    </BentoCard>
  );
}
