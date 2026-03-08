import { tokens } from "../shell/tokens";
import { tableStyle, thStyle, tdStyle } from "./summaryStyles";
import { Award } from "../../simulation/reviewsAwards";

export function AwardsTable({ awards }: { awards: Award[] }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Award</th>
          <th style={thStyle}>Winner</th>
          <th style={thStyle}>Company</th>
        </tr>
      </thead>
      <tbody>
        {awards.map((a) => {
          const isPlayer = a.ownerCompanyId === "player";
          return (
            <tr key={a.category}>
              <td style={tdStyle}>{a.categoryLabel}</td>
              <td style={{ ...tdStyle, fontWeight: isPlayer ? 700 : 400, color: isPlayer ? tokens.colors.accent : undefined }}>
                {a.winnerName}
              </td>
              <td style={{ ...tdStyle, color: isPlayer ? tokens.colors.accent : tokens.colors.textMuted }}>
                {a.ownerCompanyName}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
