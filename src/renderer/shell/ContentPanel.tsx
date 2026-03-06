import { CSSProperties, ReactNode } from "react";
import { tokens } from "./tokens";

interface ContentPanelProps {
  children: ReactNode;
  maxWidth?: number;
  style?: CSSProperties;
}

const panelStyle: CSSProperties = {
  background: tokens.colors.panelBg,
  backdropFilter: tokens.backdrop.blur,
  WebkitBackdropFilter: tokens.backdrop.blur,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.lg,
  padding: tokens.spacing.xl,
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  fontSize: tokens.font.sizeBase,
  overflowY: "auto",
};

const scrollbarCSS = `
  .content-panel::-webkit-scrollbar { width: 6px; }
  .content-panel::-webkit-scrollbar-track { background: transparent; }
  .content-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
  .content-panel::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
`;

let styleInjected = false;
function injectScrollbarStyle() {
  if (styleInjected) return;
  const style = document.createElement("style");
  style.textContent = scrollbarCSS;
  document.head.appendChild(style);
  styleInjected = true;
}

export function ContentPanel({ children, maxWidth = 900, style }: ContentPanelProps) {
  injectScrollbarStyle();

  return (
    <div
      className="content-panel"
      style={{
        ...panelStyle,
        maxWidth,
        width: "90%",
        maxHeight: "85vh",
        margin: "0 auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
