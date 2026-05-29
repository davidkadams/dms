// Background layers
export const bgPrimary = "#1a1a2e";
export const bgCard = "#22223a";
export const bgDeep = "#16162a";
export const bgHover = "#2a2a4e";
export const bgRowAlt = "#1e1e36";

// Text
export const textPrimary = "#e0e0f0";
export const textBody = "rgba(255,255,255,0.7)";
export const textSubtle = "rgba(255,255,255,0.6)";
export const textSecondary = "rgba(255,255,255,0.55)";
export const textMuted = "rgba(255,255,255,0.45)";
export const textLabel = "rgba(255,255,255,0.35)";
export const textDim = "rgba(255,255,255,0.3)";
export const textFaint = "rgba(255,255,255,0.2)";
export const textNav = "#a0a0c0";

// Accents
export const accentTeal = "#00bfb3";
export const accentBlue = "#90caf9";
export const accentPurple = "#b39ddb";
export const accentGreen = "#81c784";
export const accentOrange = "#ffcc80";
export const accentRed = "#ef9a9a";

// Border raw values (for custom border shorthand usage)
export const colorBorder = "rgba(255,255,255,0.07)";
export const colorBorderInput = "rgba(255,255,255,0.12)";
export const colorBorderRow = "rgba(255,255,255,0.05)";
export const colorBorderSep = "rgba(255,255,255,0.1)";

// Composed border strings
export const borderCard = "1px solid rgba(255,255,255,0.07)";
export const borderInput = "1px solid rgba(255,255,255,0.12)";
export const borderRow = "1px solid rgba(255,255,255,0.05)";
export const borderSep = "1px solid rgba(255,255,255,0.1)";

// Reusable style objects
export const inputStyle = {
  background: bgDeep,
  color: textPrimary,
  border: borderInput,
  borderRadius: 2,
  fontFamily: "inherit",
  outline: "none",
};

export const selectStyle = {
  background: bgDeep,
  color: textPrimary,
  border: borderInput,
  borderRadius: 2,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const btnPrimary = {
  background: textPrimary,
  color: bgPrimary,
  border: "none",
  borderRadius: 2,
  fontFamily: "inherit",
  cursor: "pointer",
  fontWeight: 600,
};

export const btnGhost = {
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.7)",
  border: borderInput,
  borderRadius: 2,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const btnDisabled = {
  background: "rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.35)",
  border: "none",
  borderRadius: 2,
  fontFamily: "inherit",
  cursor: "not-allowed",
  fontWeight: 600,
};
