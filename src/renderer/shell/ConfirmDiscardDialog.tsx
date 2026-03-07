import { ContentPanel } from "./ContentPanel";
import { MenuButton } from "./MenuButton";
import { tokens, overlayStyle } from "./tokens";

interface ConfirmDiscardDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDiscardDialog({ title, message, onConfirm, onCancel }: ConfirmDiscardDialogProps) {
  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <ContentPanel maxWidth={400}>
        <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
          {title}
        </h2>
        <p style={{ margin: 0, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, textAlign: "center", marginBottom: tokens.spacing.md }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: tokens.spacing.sm }}>
          <MenuButton onClick={onCancel} style={{ flex: 1 }}>
            Keep Editing
          </MenuButton>
          <MenuButton variant="danger" onClick={onConfirm} style={{ flex: 1 }}>
            Discard
          </MenuButton>
        </div>
      </ContentPanel>
    </div>
  );
}
