import type { CardColor } from "@ttr/shared";

/** Card background, text, border and icon — single source of truth */
export const CARD_CFG: Record<
  CardColor,
  { bg: string; text: string; border: string; icon: string; gradient?: string }
> = {
  red:        { bg: "#b91c1c", text: "#fff",    border: "#ef4444", icon: "♥" },
  blue:       { bg: "#1d4ed8", text: "#fff",    border: "#60a5fa", icon: "✦" },
  green:      { bg: "#15803d", text: "#fff",    border: "#4ade80", icon: "♣" },
  yellow:     { bg: "#ca8a04", text: "#ffffff", border: "#fef08a", icon: "★" },
  black:      { bg: "#111827", text: "#f9fafb", border: "#6b7280", icon: "♠" },
  white:      { bg: "#e2e8f0", text: "#0f172a", border: "#f8fafc", icon: "✚" },
  orange:     { bg: "#c2410c", text: "#fff",    border: "#fb923c", icon: "◆" },
  pink:       { bg: "#9d174d", text: "#fff",    border: "#f472b6", icon: "✿" },
  locomotive: {
    bg: "#4c1d95",
    text: "#f0f9ff",
    border: "#c4b5fd",
    icon: "◆",
    gradient: "linear-gradient(135deg,#7c3aed 0%,#1d4ed8 55%,#0891b2 100%)",
  },
};

/** Color used to paint a route line on the board */
export const ROUTE_COLOR: Record<string, string> = {
  red:   "#ef4444",
  blue:  "#3b82f6",
  green: "#22c55e",
  yellow:"#fde047",
  black: "#0b0f14",
  white: "#ffffff",
  orange:"#ea580c",
  pink:  "#ec4899",
  gray:  "#9ca3af",
};

/** Colors assigned to each player seat (0-indexed) */
export const PLAYER_COLORS = [
  "#ef4444", // seat 0 — red
  "#3b82f6", // seat 1 — blue
  "#22c55e", // seat 2 — green
  "#fde047", // seat 3 — bright yellow
  "#a78bfa", // seat 4 — lilac
] as const;

