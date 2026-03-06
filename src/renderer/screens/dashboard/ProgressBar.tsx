import { tokens } from "../../shell/tokens";

interface ProgressBarProps {
  value: number;
  height?: number;
}

export function ProgressBar({ value, height = 4 }: ProgressBarProps) {
  const radius = height / 2;

  return (
    <div
      style={{
        flex: 1,
        height,
        background: tokens.colors.panelBorder,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: tokens.colors.accent,
          borderRadius: radius,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}
