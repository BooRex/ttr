import type { CardColor } from "@ttr/shared";
import { CARD_CFG } from "../lib/colors";
import { LocomotiveStatIcon } from "./StatIcons";

type Size = "sm" | "md" | "lg" | "panel";

const SIZE: Record<Size, { w: string; h: string; icon: string; count: string }> = {
  sm: { w: "w-8",  h: "h-12", icon: "text-lg",  count: "text-[8px]"  },
  md: { w: "w-10", h: "h-15", icon: "text-xl",  count: "text-[10px]" },
  lg: { w: "w-12", h: "h-18", icon: "text-2xl", count: "text-[11px]" },
  panel: { w: "w-full", h: "h-full", icon: "text-2xl", count: "text-[11px]" },
};

type Props = {
  color: CardColor;
  count?: number;
  size?: Size;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** Dim card but show it exists */
  dimmed?: boolean;
  /** Fill the full width of its container (for grid layouts) */
  fluid?: boolean;
};

export const CardChip = ({
  color, count, size = "md", onClick, disabled, selected, dimmed, fluid,
}: Props) => {
  const cfg = CARD_CFG[color];
  const s   = SIZE[size];
  const isLoco = color === "locomotive";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={color}
      title={color}
      className={[
        // fixed size — always rectangular, same proportions
        fluid ? "w-full" : s.w, s.h,
        "relative flex items-center justify-center",
        "rounded-xl border-[3px] font-bold select-none",
        "transition-all duration-100",
        !disabled ? "cursor-pointer active:scale-90" : "cursor-default",
        disabled  ? "opacity-40" : "",
        dimmed    ? "opacity-50" : "",
        selected  ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-105 z-10" : "",
        isLoco    ? "shadow-[0_0_14px_3px_rgba(167,139,250,0.45)]" : "",
      ].join(" ")}
      style={{
        background:   cfg.gradient ?? cfg.bg,
        color:        cfg.text,
        borderColor:  cfg.border,
        // inner top-highlight for card depth
        boxShadow: [
          "inset 0 1px 1px rgba(255,255,255,0.25)",
          isLoco ? "0 0 14px 3px rgba(167,139,250,0.45)" : "",
        ].filter(Boolean).join(", "),
      }}
    >
      {/* Locomotive shine overlay */}
      {isLoco && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[10px] pointer-events-none"
          style={{ background: "linear-gradient(155deg,rgba(255,255,255,.28) 0%,transparent 55%)" }}
        />
      )}

      {/* Icon — always centered in the card */}
      <span aria-hidden="true" className={`${s.icon} leading-none z-10`}>
        {isLoco ? <LocomotiveStatIcon className="w-6 h-6" /> : cfg.icon}
      </span>

      {/* Count badge — bottom-right corner */}
      {count !== undefined && (
        <span
          aria-hidden="true"
          className={`text-[10px] font-black tabular-nums absolute bottom-0.5 right-0.5 rounded-full w-5 h-5 inline-flex items-center justify-center leading-none bg-slate-800 text-white border border-slate-500/60 z-50`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
