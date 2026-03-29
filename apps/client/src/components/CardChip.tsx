import type { CardColor } from "@ttr/shared";
import { CARD_CFG } from "../lib/colors";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { w: string; h: string; icon: string; count: string }> = {
  sm: { w: "w-9",     h: "h-12",      icon: "text-xl",  count: "text-[9px]"  },
  md: { w: "w-[52px]",h: "h-[66px]",  icon: "text-2xl", count: "text-[11px]" },
  lg: { w: "w-14",    h: "h-[76px]",  icon: "text-3xl", count: "text-xs"     },
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
};

export const CardChip = ({
  color, count, size = "md", onClick, disabled, selected, dimmed,
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
        s.w, s.h,
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
        {cfg.icon}
      </span>

      {/* Count — absolute bottom center */}
      {count !== undefined && (
        <span
          aria-hidden="true"
          className={`${s.count} font-black tabular-nums absolute bottom-1 left-0 right-0 text-center leading-none`}
          style={{ opacity: 0.9 }}
        >
          ×{count}
        </span>
      )}
    </button>
  );
};
