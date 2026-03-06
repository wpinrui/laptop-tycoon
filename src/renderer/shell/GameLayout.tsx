import { CSSProperties, ReactNode } from "react";
import { tokens } from "./tokens";

interface GameLayoutProps {
  children: ReactNode;
}

const layoutStyle: CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: tokens.colors.background,
  overflow: "hidden",
  position: "relative",
};

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div style={layoutStyle}>
      {children}
    </div>
  );
}
