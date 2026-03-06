import { CSSProperties, useState } from "react";
import { SaveSlotMeta, MAX_SLOTS, getAllSlotMeta, deleteSlot } from "./saveSystem";
import { ContentPanel } from "./ContentPanel";
import { MenuButton } from "./MenuButton";
import { tokens } from "./tokens";

interface SaveSlotPickerProps {
  title: string;
  onSelect: (slotIndex: number) => void;
  onCancel: () => void;
  allowDelete?: boolean;
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

function SlotRow({
  index,
  meta,
  onSelect,
  allowDelete,
  onDeleted,
}: {
  index: number;
  meta: SaveSlotMeta | null;
  onSelect: (i: number) => void;
  allowDelete?: boolean;
  onDeleted: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: tokens.spacing.xs }}>
      <button
        style={slotStyle}
        onClick={() => onSelect(index)}
        onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
      >
        <span style={{ fontWeight: 600, minWidth: 60 }}>Slot {index + 1}</span>
        {meta ? (
          <span style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase }}>
            {meta.companyName} — Year {meta.year} — {formatDate(meta.savedAt)}
          </span>
        ) : (
          <span style={{ color: tokens.colors.textMuted, fontStyle: "italic", fontSize: tokens.font.sizeBase }}>
            Empty
          </span>
        )}
      </button>
      {allowDelete && meta && (
        <button
          style={{
            ...slotStyle,
            width: "auto",
            justifyContent: "center",
            padding: `${tokens.spacing.md}px ${tokens.spacing.md}px`,
            color: tokens.colors.danger,
            fontSize: tokens.font.sizeBase,
          }}
          title="Delete save"
          onClick={() => onDeleted()}
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

export function SaveSlotPicker({ title, onSelect, onCancel, allowDelete }: SaveSlotPickerProps) {
  const [revision, setRevision] = useState(0);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  // Re-read slots from localStorage each render (revision forces re-read after delete)
  void revision;
  const rawSlots = getAllSlotMeta();

  // Build indexed entries and sort: occupied slots by most recent first, empty slots at the end
  const entries = rawSlots.map((meta, i) => ({ meta, index: i }));
  entries.sort((a, b) => {
    if (a.meta && b.meta) return b.meta.savedAt - a.meta.savedAt;
    if (a.meta) return -1;
    if (b.meta) return 1;
    return a.index - b.index;
  });

  function confirmDelete() {
    if (pendingDeleteIndex === null) return;
    deleteSlot(pendingDeleteIndex);
    setPendingDeleteIndex(null);
    setRevision((r) => r + 1);
  }

  const pendingMeta = pendingDeleteIndex !== null ? rawSlots[pendingDeleteIndex] : null;

  return (
    <>
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <ContentPanel maxWidth={600}>
          <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
            {title}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
            {entries.map(({ meta, index }) => (
              <SlotRow
                key={index}
                index={index}
                meta={meta}
                onSelect={onSelect}
                allowDelete={allowDelete}
                onDeleted={() => setPendingDeleteIndex(index)}
              />
            ))}
          </div>
          <div style={{ marginTop: tokens.spacing.lg }}>
            <MenuButton onClick={onCancel} style={{ width: "100%" }}>Cancel</MenuButton>
          </div>
        </ContentPanel>
      </div>
      {pendingDeleteIndex !== null && pendingMeta && (
        <div
          style={confirmOverlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) setPendingDeleteIndex(null); }}
        >
          <ContentPanel maxWidth={560}>
            <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
              Delete Save?
            </h2>
            <p style={{ ...subtitleStyle, marginBottom: tokens.spacing.md }}>
              Slot {pendingDeleteIndex + 1}: {pendingMeta.companyName} — Year {pendingMeta.year}
            </p>
            <div style={{ display: "flex", gap: tokens.spacing.sm }}>
              <MenuButton onClick={() => setPendingDeleteIndex(null)} style={{ flex: 1 }}>
                Cancel
              </MenuButton>
              <MenuButton variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
                Delete
              </MenuButton>
            </div>
          </ContentPanel>
        </div>
      )}
    </>
  );
}
