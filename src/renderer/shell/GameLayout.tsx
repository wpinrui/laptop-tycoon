import { CSSProperties, ReactNode } from "react";
import { HUD } from "./HUD";

interface GameLayoutProps {
  children: ReactNode;
  showHUD?: boolean;
}

const layoutStyle: CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#121212",
  overflow: "hidden",
  position: "relative",
};

export function GameLayout({ children, showHUD = true }: GameLayoutProps) {
  return (
    <div style={layoutStyle}>
      {showHUD && <HUD />}
      {children}
    </div>
  );
}
