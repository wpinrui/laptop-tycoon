import { CSSProperties, ReactNode } from "react";
import { tokens } from "./tokens";
import { OfficeBackground } from "./OfficeBackground";

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

const contentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div style={layoutStyle}>
      <OfficeBackground />
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
