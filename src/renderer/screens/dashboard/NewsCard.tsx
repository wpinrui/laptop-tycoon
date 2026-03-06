import { Newspaper } from "lucide-react";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, smallTextStyle } from "./styles";

export function NewsCard() {
  return (
    <BentoCard title="News" icon={Newspaper} screen="news">
      {[
        { date: "Jan 2000", text: "The laptop market enters a new decade with growing consumer demand across all segments." },
        { date: "Jan 2000", text: "BudgetTech announces aggressive pricing strategy, aiming to capture the student and budget buyer markets." },
        { date: "Jan 2000", text: "Industry analysts predict 15% year-on-year growth in the consumer laptop segment through 2002." },
        { date: "Jan 2000", text: "LuxBook unveils premium aluminium unibody chassis — sets new standard for build quality." },
        { date: "Jan 2000", text: "Corporate IT spending surges as Y2K upgrades drive bulk laptop purchases worldwide." },
        { date: "Jan 2000", text: "OmniLap expands product line with 4 new models targeting every price bracket." },
        { date: "Jan 2000", text: "Display technology advances push screen resolutions higher — 1024×768 becomes the new baseline." },
      ].map((item, i, arr) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : tokens.spacing.sm, paddingBottom: tokens.spacing.sm, borderBottom: i < arr.length - 1 ? `1px solid ${tokens.colors.panelBorder}` : "none" }}>
          <p style={{ ...smallTextStyle, color: tokens.colors.accent }}>{item.date}</p>
          <p style={cardBodyStyle}>{item.text}</p>
        </div>
      ))}
    </BentoCard>
  );
}
