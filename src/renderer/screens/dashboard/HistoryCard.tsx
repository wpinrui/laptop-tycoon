import { CSSProperties } from "react";
import { History } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { Milestone, MilestoneType } from "../../state/gameTypes";
import { BentoCard } from "./BentoCard";
import { emptyStateStyle } from "./styles";
import { tokens } from "../../shell/tokens";
import { STARTING_YEAR } from "../../state/gameTypes";

// ─── Event Type Colors ───────────────────────────────────────

const EVENT_COLORS: Record<MilestoneType, string> = {
  model: tokens.colors.accent,       // #4fc3f7
  award: tokens.colors.statusCash,   // #facc15
  financial: tokens.colors.success,  // #66bb6a
  market: "#ce93d8",                 // purple
};

// ─── Styles ──────────────────────────────────────────────────

const timelineStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  paddingLeft: 20,
};

const timelineLineStyle: CSSProperties = {
  position: "absolute",
  left: 5,
  top: 6,
  bottom: 6,
  width: 2,
  background: tokens.colors.panelBorder,
};

const eventStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: tokens.spacing.sm,
  padding: "6px 0",
  position: "relative",
};

function dotStyle(color: string): CSSProperties {
  return {
    width: 12,
    height: 12,
    borderRadius: "50%",
    flexShrink: 0,
    position: "absolute",
    left: -20,
    top: 9,
    border: `2px solid ${tokens.colors.cardBg}`,
    background: color,
  };
}

const eventTextStyle: CSSProperties = {
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.text,
  lineHeight: 1.4,
};

const eventDateStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginTop: 2,
};

const footerStyle: CSSProperties = {
  marginTop: tokens.spacing.md,
  paddingTop: tokens.spacing.sm,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  fontStyle: "italic",
};

// ─── Helpers ─────────────────────────────────────────────────

/** Group consecutive same-type milestones from the same quarter for compact display. */
function groupRecentMilestones(milestones: Milestone[]): Milestone[][] {
  // Reverse chronological
  const sorted = [...milestones].sort(
    (a, b) => b.year - a.year || b.quarter - a.quarter,
  );

  const groups: Milestone[][] = [];
  for (const ms of sorted) {
    const last = groups[groups.length - 1];
    if (
      last &&
      last[0].type === ms.type &&
      last[0].year === ms.year &&
      last[0].quarter === ms.quarter
    ) {
      last.push(ms);
    } else {
      groups.push([ms]);
    }
  }
  return groups.slice(0, 4); // Show top 4 groups
}

// ─── Component ───────────────────────────────────────────────

export function HistoryCard() {
  const { state } = useGame();
  const milestones = state.milestones;

  if (milestones.length === 0) {
    return (
      <BentoCard title="History" icon={History} screen="history">
        <p style={emptyStateStyle}>
          Your story begins when you launch your first model.
        </p>
      </BentoCard>
    );
  }

  const groups = groupRecentMilestones(milestones);
  const yearsInBusiness = state.year - STARTING_YEAR;

  return (
    <BentoCard title="History" icon={History} screen="history">
      <div style={timelineStyle}>
        <div style={timelineLineStyle} />
        {groups.map((group, gi) => {
          const rep = group[0];
          const color = EVENT_COLORS[rep.type];
          const names = group.map((m) => m.title.replace(/^(Launched |Won |Reached |Cumulative |First )/, ""));

          return (
            <div key={gi} style={eventStyle}>
              <div style={dotStyle(color)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={eventTextStyle}>
                  {group.length === 1 ? (
                    <span dangerouslySetInnerHTML={{ __html: highlightTitle(rep.title, color) }} />
                  ) : (
                    <span dangerouslySetInnerHTML={{
                      __html: highlightGroupTitle(rep, names, color),
                    }} />
                  )}
                </div>
                <div style={eventDateStyle}>{rep.year} Q{rep.quarter}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={footerStyle}>
        {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} in {yearsInBusiness} year{yearsInBusiness !== 1 ? "s" : ""} →
      </div>
    </BentoCard>
  );
}

// ─── Title Formatting ────────────────────────────────────────

function highlightTitle(title: string, color: string): string {
  // Bold the subject after the verb prefix
  const prefixes = ["Launched ", "Won ", "Reached ", "Cumulative revenue exceeded ", "First profitable "];
  for (const prefix of prefixes) {
    if (title.startsWith(prefix)) {
      const subject = title.slice(prefix.length);
      return `${prefix}<strong style="color: ${color};">${subject}</strong>`;
    }
  }
  return title;
}

function highlightGroupTitle(rep: Milestone, names: string[], color: string): string {
  const verb = rep.type === "model" ? "Launched" : rep.type === "award" ? "Won" : "Reached";
  const MAX_SHOWN = 2;
  const highlighted = names.slice(0, MAX_SHOWN).map((n) => `<strong style="color: ${color};">${n}</strong>`);
  const remaining = names.length - MAX_SHOWN;

  if (names.length === 1) return `${verb} ${highlighted[0]}`;
  if (names.length === 2) return `${verb} ${highlighted[0]} & ${highlighted[1]}`;
  return `${verb} ${highlighted.join(", ")} & <strong style="color: ${color};">${remaining} more</strong>`;
}
