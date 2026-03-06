import { CSSProperties, ReactNode, useEffect } from "react";
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
  border: `2px solid ${tokens.colors.panelBorder}`,
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
  .content-panel.hide-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

let styleInjected = false;

export function ContentPanel({ children, maxWidth = 900, style }: ContentPanelProps) {
  useEffect(() => {
    if (styleInjected) return;
    const el = document.createElement("style");
    el.textContent = scrollbarCSS;
    document.head.appendChild(el);
    styleInjected = true;
  }, []);

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
