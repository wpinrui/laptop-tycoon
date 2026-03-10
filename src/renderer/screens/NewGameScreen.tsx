import { CSSProperties, useRef, useState } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { STARTING_CASH, STARTING_YEAR } from "../state/gameTypes";
import { formatCash } from "../utils/formatCash";

const LOGO_SIZE = 128;

const headerStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
  textAlign: "center",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.lg,
  marginTop: tokens.spacing.xl,
};

const labelStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.xs,
  display: "block",
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: `${tokens.spacing.md}px`,
  background: tokens.colors.surface,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.sm,
  color: tokens.colors.text,
  fontSize: tokens.font.sizeLarge,
  fontFamily: tokens.font.family,
  outline: "none",
  boxSizing: "border-box",
};

const logoContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
};

const logoPreviewStyle: CSSProperties = {
  width: LOGO_SIZE,
  height: LOGO_SIZE,
  borderRadius: tokens.borderRadius.md,
  border: `2px dashed ${tokens.colors.panelBorder}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeSmall,
  cursor: "pointer",
  overflow: "hidden",
  flexShrink: 0,
  background: tokens.colors.surface,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeSmall,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: tokens.spacing.sm,
  marginTop: tokens.spacing.sm,
};

export function NewGameScreen() {
  const { navigateTo, goBack } = useNavigation();
  const { dispatch } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [padLogo, setPadLogo] = useState(true);
  const [rawLogo, setRawLogo] = useState<string | null>(null);

  const canStart = companyName.trim().length > 0;

  function applyPadding(dataUrl: string, pad: boolean) {
    if (!pad) {
      setCompanyLogo(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.width, img.height);
      const padded = Math.round(size / 0.8); // 10% padding each side
      const canvas = document.createElement("canvas");
      canvas.width = padded;
      canvas.height = padded;
      const ctx = canvas.getContext("2d")!;
      const offset = Math.round((padded - size) / 2);
      const dx = offset + Math.round((size - img.width) / 2);
      const dy = offset + Math.round((size - img.height) / 2);
      ctx.drawImage(img, dx, dy, img.width, img.height);
      setCompanyLogo(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRawLogo(dataUrl);
      applyPadding(dataUrl, padLogo);
    };
    reader.readAsDataURL(file);
  }

  function handleStart() {
    if (!canStart) return;
    dispatch({ type: "NEW_GAME", companyName: companyName.trim(), companyLogo });
    navigateTo("dashboard");
  }

  return (
    <ContentPanel maxWidth={460}>
      <h1 style={headerStyle}>New Game</h1>

      <div style={formStyle}>
        <div>
          <label style={labelStyle}>Company Name</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Enter company name..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Company Logo (optional)</label>
          <div style={logoContainerStyle}>
            <div
              style={logoPreviewStyle}
              onClick={() => fileInputRef.current?.click()}
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ textAlign: "center", padding: tokens.spacing.sm }}>
                  Click to upload
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleLogoSelect}
            />
            <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
              <p style={{ margin: 0 }}>Square image recommended</p>
              <p style={{ margin: 0 }}>PNG with transparency supported</p>
              {companyLogo && (
                <>
                  <button
                    style={{
                      marginTop: tokens.spacing.xs,
                      background: "none",
                      border: "none",
                      color: tokens.colors.danger,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: tokens.font.sizeSmall,
                      fontFamily: tokens.font.family,
                    }}
                    onClick={() => {
                      setCompanyLogo(null);
                      setRawLogo(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: tokens.spacing.xs,
                      cursor: "pointer",
                      fontSize: tokens.font.sizeSmall,
                      color: tokens.colors.textMuted,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={padLogo}
                      onChange={(e) => {
                        setPadLogo(e.target.checked);
                        if (rawLogo) applyPadding(rawLogo, e.target.checked);
                      }}
                      style={{ accentColor: tokens.colors.accent, cursor: "pointer" }}
                    />
                    Add padding
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={infoRowStyle}>
          <span>Starting Year: {STARTING_YEAR}</span>
          <span>Starting Cash: {formatCash(STARTING_CASH)}</span>
        </div>

        <div style={buttonRowStyle}>
          <MenuButton onClick={goBack} style={{ flex: 1 }}>
            Back
          </MenuButton>
          <MenuButton
            variant="accent"
            onClick={handleStart}
            disabled={!canStart}
            style={{ flex: 1 }}
          >
            Start Game
          </MenuButton>
        </div>
      </div>
    </ContentPanel>
  );
}
