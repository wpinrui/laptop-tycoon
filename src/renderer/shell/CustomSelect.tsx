import { CSSProperties, useState, useRef, useEffect, ReactNode } from "react";
import { tokens } from "./tokens";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectGroup<T extends string = string> {
  label: string;
  options: SelectOption<T>[];
}

type OptionsOrGroups<T extends string> = SelectOption<T>[] | SelectGroup<T>[];

function isGroups<T extends string>(items: OptionsOrGroups<T>): items is SelectGroup<T>[] {
  return items.length > 0 && "options" in items[0];
}

function flatOptions<T extends string>(items: OptionsOrGroups<T>): SelectOption<T>[] {
  if (isGroups(items)) return items.flatMap((g) => g.options);
  return items;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: OptionsOrGroups<T>;
  /** Optional label shown before the select */
  label?: ReactNode;
  /** Compact size for toolbar usage */
  size?: "sm" | "md";
}

const SIZES = {
  sm: { fontSize: tokens.font.sizeSmall, padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px` },
  md: { fontSize: tokens.font.sizeBase, padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px` },
};

function OptionRow<T extends string>({
  opt,
  isActive,
  size,
  onClick,
}: {
  opt: SelectOption<T>;
  isActive: boolean;
  size: "sm" | "md";
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: SIZES[size].padding,
        cursor: "pointer",
        fontSize: SIZES[size].fontSize,
        color: isActive ? tokens.colors.accent : tokens.colors.text,
        fontWeight: isActive ? 600 : 400,
        background: isActive ? tokens.colors.background : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = tokens.colors.background;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {opt.label}
    </div>
  );
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const all = flatOptions(options);
  const selected = all.find((o) => o.value === value);
  const sizeConfig = SIZES[size];

  // Compute max label width for the invisible sizer
  const longestLabel = all.reduce((a, b) => (a.length >= b.label.length ? a : b.label), "");

  const labelStyle: CSSProperties = {
    fontSize: sizeConfig.fontSize,
    color: tokens.colors.textMuted,
    marginRight: 4,
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      {label && <span style={labelStyle}>{label}</span>}
      <div ref={ref} style={{ position: "relative", display: "inline-grid" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            gridArea: "1 / 1",
            background: tokens.colors.surface,
            color: tokens.colors.text,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            padding: sizeConfig.padding,
            fontSize: sizeConfig.fontSize,
            fontFamily: tokens.font.family,
            cursor: "pointer",
            outline: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: tokens.spacing.xs,
            whiteSpace: "nowrap",
          }}
        >
          {selected?.label ?? value}
          <span style={{ fontSize: "0.6em", marginLeft: 2 }}>{open ? "\u25B2" : "\u25BC"}</span>
        </button>
        {/* Invisible sizer to keep width stable */}
        <div
          style={{
            gridArea: "1 / 1",
            visibility: "hidden",
            pointerEvents: "none",
            padding: sizeConfig.padding,
            fontSize: sizeConfig.fontSize,
            fontFamily: tokens.font.family,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: tokens.spacing.xs,
            border: "1px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          {longestLabel}
          <span style={{ fontSize: "0.6em", marginLeft: 2 }}>{"\u25BC"}</span>
        </div>
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: tokens.colors.surface,
              border: `1px solid ${tokens.colors.panelBorder}`,
              borderRadius: tokens.borderRadius.sm,
              overflow: "hidden",
              overflowY: "auto",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              minWidth: "100%",
              maxHeight: 300,
              whiteSpace: "nowrap",
            }}
          >
            {isGroups(options)
              ? options.map((group) => (
                  <div key={group.label}>
                    <div
                      style={{
                        padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                        fontSize: 10,
                        fontWeight: 700,
                        color: tokens.colors.textMuted,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        borderTop: `1px solid ${tokens.colors.panelBorder}`,
                      }}
                    >
                      {group.label}
                    </div>
                    {group.options.map((opt) => (
                      <OptionRow
                        key={opt.value}
                        opt={opt}
                        isActive={opt.value === value}
                        size={size}
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                      />
                    ))}
                  </div>
                ))
              : options.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    opt={opt}
                    isActive={opt.value === value}
                    size={size}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                  />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
