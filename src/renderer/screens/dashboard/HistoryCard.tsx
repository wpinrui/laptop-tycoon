import { History } from "lucide-react";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle, sectionDividerStyle, sectionHeadingStyle, tableCellStyle } from "./styles";

export function HistoryCard() {
  return (
    <BentoCard title="History" icon={History} screen="history">
      <p style={sectionHeadingStyle}>Past Releases</p>
      <p style={{ ...cardBodyStyle, marginTop: tokens.spacing.xs, fontStyle: "italic" }}>
        No models released yet
      </p>
      <div style={sectionDividerStyle}>
        <p style={sectionHeadingStyle}>Lifetime Stats</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: tokens.spacing.sm }}>
          <tbody>
            {[
              ["Models designed", "0"],
              ["Models launched", "0"],
              ["Total units sold", "0"],
              ["Total revenue", "$0"],
              ["Total profit", "$0"],
              ["Best seller", "—"],
              ["Highest rated", "—"],
              ["Awards won", "0"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ ...tableCellStyle, fontSize: tokens.font.sizeSmall }}>{label}</td>
                <td style={{ ...tableCellStyle, fontSize: tokens.font.sizeSmall, textAlign: "right" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}
