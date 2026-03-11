import { CSSProperties, useEffect, useState } from "react";
import {
  SaveSlotMeta,
  AutosaveMeta,
  getAllSlotMeta,
  getAutosaveMetas,
  deleteSlot,
} from "./saveSystem";
import { ContentPanel } from "./ContentPanel";
import { MenuButton } from "./MenuButton";
import { tokens, overlayStyle as baseOverlayStyle } from "./tokens";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SaveSlotPickerProps {
  title: string;
  onSelect: (slotId: string) => void;
  onCancel: () => void;
  allowDelete?: boolean;
  /** If true, selecting an occupied slot requires overwrite confirmation. */
  confirmOverwrite?: boolean;
  /** If true, show a "New Save" button for creating a new slot. */
  allowNewSlot?: boolean;
  onNewSlot?: () => void;
  /** If provided, also allow selecting an autosave. */
  onSelectAutosave?: (slotId: string, autoIndex: number) => void;
}

const overlayStyle: CSSProperties = {
  ...baseOverlayStyle,
  zIndex: tokens.zIndex.overlay + 2,
};

const slotStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  background: tokens.colors.surface,
  borderRadius: tokens.borderRadius.md,
  cursor: "pointer",
  transition: "background 0.15s",
  border: "none",
  color: tokens.colors.text,
  fontFamily: tokens.font.family,
  fontSize: tokens.font.sizeLarge,
  width: "100%",
  textAlign: "left",
};

const autoRowStyle: CSSProperties = {
  ...slotStyle,
  fontSize: tokens.font.sizeBase,
  padding: `${tokens.spacing.sm}px ${tokens.spacing.lg}px ${tokens.spacing.sm}px 48px`,
  color: tokens.colors.textMuted,
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AutosaveRow({
  meta,
  onSelect,
}: {
  meta: AutosaveMeta;
  onSelect: () => void;
}) {
  return (
    <button
      style={autoRowStyle}
      onClick={onSelect}
      onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
    >
      <span
        style={{
          background: tokens.colors.surfaceHover,
          borderRadius: tokens.borderRadius.sm,
          padding: "2px 6px",
          fontSize: tokens.font.sizeSmall,
          fontWeight: 600,
          marginRight: tokens.spacing.xs,
        }}
      >
        Auto
      </span>
      <span>
        Year {meta.year} Q{meta.quarter} — {formatDate(meta.savedAt)}
      </span>
    </button>
  );
}

function SlotRow({
  meta,
  onSelect,
  allowDelete,
  onDeleted,
  expanded,
  onToggleExpand,
  hasAutosaves,
}: {
  meta: SaveSlotMeta;
  onSelect: () => void;
  allowDelete?: boolean;
  onDeleted: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  hasAutosaves: boolean;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <div style={{ display: "flex", gap: tokens.spacing.xs }}>
      {hasAutosaves && (
        <button
          style={{
            ...slotStyle,
            width: 36,
            padding: 0,
            justifyContent: "center",
            flexShrink: 0,
          }}
          onClick={onToggleExpand}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
          title={expanded ? "Collapse autosaves" : "Expand autosaves"}
        >
          <Chevron size={16} />
        </button>
      )}
      <button
        style={{ ...slotStyle, paddingLeft: hasAutosaves ? tokens.spacing.md : tokens.spacing.lg }}
        onClick={onSelect}
        onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
      >
        <span style={{ fontWeight: 600, minWidth: 0 }}>{meta.companyName}</span>
        <span style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase }}>
          — Year {meta.year} Q{meta.quarter} — {formatDate(meta.savedAt)}
        </span>
      </button>
      {allowDelete && (
        <button
          style={{
            ...slotStyle,
            width: "auto",
            justifyContent: "center",
            padding: `${tokens.spacing.md}px ${tokens.spacing.md}px`,
            color: tokens.colors.danger,
            fontSize: tokens.font.sizeBase,
            flexShrink: 0,
          }}
          title="Delete save"
          onClick={onDeleted}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
        >
          ✕
        </button>
      )}
    </div>
  );
}

const confirmOverlayStyle: CSSProperties = {
  ...overlayStyle,
  background: "transparent",
  zIndex: tokens.zIndex.overlay + 3,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  marginTop: tokens.spacing.xs,
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.textMuted,
  textAlign: "center",
};

export function SaveSlotPicker({
  title,
  onSelect,
  onCancel,
  allowDelete,
  confirmOverwrite,
  allowNewSlot,
  onNewSlot,
  onSelectAutosave,
}: SaveSlotPickerProps) {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [autosaves, setAutosaves] = useState<Record<string, AutosaveMeta[]>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<SaveSlotMeta | null>(null);
  const [pendingOverwriteSlot, setPendingOverwriteSlot] = useState<SaveSlotMeta | null>(null);
  const [revision, setRevision] = useState(0);

  // Load slot metadata
  useEffect(() => {
    void getAllSlotMeta().then((metas) => {
      // Sort by most recent first
      metas.sort((a, b) => b.savedAt - a.savedAt);
      setSlots(metas);
    });
  }, [revision]);

  // Load autosaves when a slot is expanded
  useEffect(() => {
    if (!expandedSlot) return;
    void getAutosaveMetas(expandedSlot).then((metas) => {
      setAutosaves((prev) => ({ ...prev, [expandedSlot]: metas }));
    });
  }, [expandedSlot, revision]);

  function handleSlotSelect(meta: SaveSlotMeta) {
    if (confirmOverwrite) {
      setPendingOverwriteSlot(meta);
    } else {
      onSelect(meta.slotId);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteSlot) return;
    await deleteSlot(pendingDeleteSlot.slotId);
    setPendingDeleteSlot(null);
    setExpandedSlot(null);
    setRevision((r) => r + 1);
  }

  return (
    <>
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <ContentPanel maxWidth={640}>
          <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
            {title}
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: tokens.spacing.sm,
              marginTop: tokens.spacing.lg,
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {slots.map((meta) => {
              const slotAutos = autosaves[meta.slotId] ?? [];
              const isExpanded = expandedSlot === meta.slotId;
              return (
                <div key={meta.slotId} style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
                  <SlotRow
                    meta={meta}
                    onSelect={() => handleSlotSelect(meta)}
                    allowDelete={allowDelete}
                    onDeleted={() => setPendingDeleteSlot(meta)}
                    expanded={isExpanded}
                    onToggleExpand={() => setExpandedSlot(isExpanded ? null : meta.slotId)}
                    hasAutosaves={!!onSelectAutosave}
                  />
                  {isExpanded && onSelectAutosave && slotAutos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {slotAutos.map((am) => (
                        <AutosaveRow
                          key={am.autoIndex}
                          meta={am}
                          onSelect={() => onSelectAutosave(meta.slotId, am.autoIndex)}
                        />
                      ))}
                    </div>
                  )}
                  {isExpanded && onSelectAutosave && slotAutos.length === 0 && (
                    <div style={{ ...autoRowStyle, cursor: "default", fontStyle: "italic" }}>
                      No autosaves yet
                    </div>
                  )}
                </div>
              );
            })}
            {slots.length === 0 && (
              <div style={{ textAlign: "center", color: tokens.colors.textMuted, padding: tokens.spacing.lg }}>
                No saves found
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
            {allowNewSlot && onNewSlot && (
              <MenuButton variant="accent" onClick={onNewSlot} style={{ flex: 1 }}>
                New Save
              </MenuButton>
            )}
            <MenuButton onClick={onCancel} style={{ flex: 1 }}>Cancel</MenuButton>
          </div>
        </ContentPanel>
      </div>
      {pendingDeleteSlot && (
        <div
          style={confirmOverlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) setPendingDeleteSlot(null); }}
        >
          <ContentPanel maxWidth={560}>
            <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
              Delete Save?
            </h2>
            <p style={{ ...subtitleStyle, marginBottom: tokens.spacing.md }}>
              {pendingDeleteSlot.companyName} — Year {pendingDeleteSlot.year}
            </p>
            <p style={{ ...subtitleStyle, marginBottom: tokens.spacing.md, fontSize: tokens.font.sizeSmall }}>
              This will also delete all autosaves for this slot.
            </p>
            <div style={{ display: "flex", gap: tokens.spacing.sm }}>
              <MenuButton onClick={() => setPendingDeleteSlot(null)} style={{ flex: 1 }}>
                Cancel
              </MenuButton>
              <MenuButton variant="danger" onClick={() => void confirmDelete()} style={{ flex: 1 }}>
                Delete
              </MenuButton>
            </div>
          </ContentPanel>
        </div>
      )}
      {pendingOverwriteSlot && (
        <div
          style={confirmOverlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) setPendingOverwriteSlot(null); }}
        >
          <ContentPanel maxWidth={560}>
            <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
              Overwrite Save?
            </h2>
            <p style={{ ...subtitleStyle, marginBottom: tokens.spacing.md }}>
              {pendingOverwriteSlot.companyName} — Year {pendingOverwriteSlot.year}
            </p>
            <div style={{ display: "flex", gap: tokens.spacing.sm }}>
              <MenuButton onClick={() => setPendingOverwriteSlot(null)} style={{ flex: 1 }}>
                Cancel
              </MenuButton>
              <MenuButton
                variant="danger"
                onClick={() => {
                  const id = pendingOverwriteSlot.slotId;
                  setPendingOverwriteSlot(null);
                  onSelect(id);
                }}
                style={{ flex: 1 }}
              >
                Overwrite
              </MenuButton>
            </div>
          </ContentPanel>
        </div>
      )}
    </>
  );
}
