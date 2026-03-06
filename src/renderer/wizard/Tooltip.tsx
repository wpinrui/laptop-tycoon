import { useState, useRef, useLayoutEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  content,
  children,
}: {
  content: ReactNode;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionTooltip = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();

    let top = trigger.top - tooltip.height - 8;
    let left = trigger.left + trigger.width / 2 - tooltip.width / 2;

    if (top < 4) top = trigger.bottom + 8;
    if (left < 4) left = 4;
    if (left + tooltip.width > window.innerWidth - 4) {
      left = window.innerWidth - tooltip.width - 4;
    }

    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
  }, []);

  useLayoutEffect(() => {
    if (visible) positionTooltip();
  }, [visible, positionTooltip]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ display: "inline-flex" }}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              top: -9999,
              left: -9999,
              zIndex: 1000,
              fontFamily: "system-ui, sans-serif",
              background: "#1a1a1a",
              border: "1px solid #555",
              borderRadius: "8px",
              padding: "12px 14px",
              maxWidth: "320px",
              color: "#e0e0e0",
              fontSize: "0.75rem",
              lineHeight: "1.5",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              pointerEvents: "none",
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
