import { Newspaper } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { tokens } from "../../shell/tokens";
import { OUTLETS } from "../../../simulation/newsTypes";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle, smallTextStyle } from "./styles";

export function NewsCard() {
  const { state } = useGame();
  const latest = [...state.newsHistory].reverse().slice(0, 3);

  return (
    <BentoCard title="News" icon={Newspaper} screen="news">
      {latest.length === 0 ? (
        <p style={emptyStateStyle}>No news yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {latest.map((item, i) => (
            <div key={item.id}>
              {i > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${tokens.colors.panelBorder}`,
                    margin: `${tokens.spacing.sm}px 0`,
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <span style={smallTextStyle}>
                  {OUTLETS[item.outlet].name}
                </span>
                <span
                  style={{
                    ...smallTextStyle,
                    flexShrink: 0,
                    marginLeft: tokens.spacing.sm,
                  }}
                >
                  Q{item.quarter} {item.year}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: tokens.font.sizeBase,
                  color: tokens.colors.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.headline}
              </p>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
