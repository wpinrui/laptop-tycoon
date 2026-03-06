import { ReactNode } from "react";
import { StatContributions } from "./StatBar";

export function OptionTooltipContent({
  name,
  description,
  stats,
}: {
  name: string;
  description: string;
  stats: Record<string, number>;
}) {
  return (
    <div>
      <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{name}</div>
      <div style={{ color: "#ccc", marginBottom: "6px" }}>{description}</div>
      <StatContributions stats={stats} />
    </div>
  );
}

interface SelectionCardProps {
  isSelected: boolean;
  onClick: () => void;
  children: ReactNode;
  fullWidth?: boolean;
}

export function SelectionCard({ isSelected, onClick, children, fullWidth }: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: fullWidth ? "100%" : undefined,
        background: isSelected ? "#1a3a5c" : "#2a2a2a",
        border: isSelected ? "2px solid #90caf9" : "2px solid #444",
        borderRadius: "8px",
        padding: "12px",
        textAlign: "left",
        cursor: "pointer",
        color: "#e0e0e0",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "#888";
          e.currentTarget.style.background = "#333";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isSelected ? "#90caf9" : "#444";
        e.currentTarget.style.background = isSelected ? "#1a3a5c" : "#2a2a2a";
      }}
    >
      {children}
    </button>
  );
}
