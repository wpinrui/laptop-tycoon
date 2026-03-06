import { BarChart3 } from "lucide-react";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { ProgressBar } from "./ProgressBar";
import { cardBodyStyle, hintStyle, sectionDividerStyle, sectionHeadingStyle, smallTextStyle } from "./styles";

export function MarketCard() {
  return (
    <BentoCard title="Market" icon={BarChart3} screen="marketOverview">
      <p style={cardBodyStyle}>Total Market Size: ~12M units/year</p>
      <p style={{ ...sectionHeadingStyle, marginTop: tokens.spacing.md }}>
        Top Competitors
      </p>
      {[
        { name: "BudgetTech", models: 3, avg: "$599", strategy: "High volume, low margin" },
        { name: "LuxBook", models: 2, avg: "$1,899", strategy: "Premium materials, brand cachet" },
        { name: "OmniLap", models: 4, avg: "$999", strategy: "Broad range, generalist" },
      ].map((c) => (
        <div key={c.name} style={{ marginTop: tokens.spacing.sm, paddingLeft: tokens.spacing.sm, borderLeft: `2px solid ${tokens.colors.panelBorder}` }}>
          <p style={sectionHeadingStyle}>{c.name}</p>
          <p style={cardBodyStyle}>{c.models} models — avg {c.avg}</p>
          <p style={hintStyle}>{c.strategy}</p>
        </div>
      ))}
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Demographic Split</p>
        {[
          { name: "Corporate", pct: 22 },
          { name: "Consumer", pct: 28 },
          { name: "Student", pct: 18 },
          { name: "Creative", pct: 12 },
          { name: "Gamer", pct: 10 },
          { name: "Other", pct: 10 },
        ].map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
            <span style={{ ...smallTextStyle, width: 70 }}>{d.name}</span>
            <ProgressBar value={d.pct} />
            <span style={{ ...smallTextStyle, width: 30, textAlign: "right" }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
