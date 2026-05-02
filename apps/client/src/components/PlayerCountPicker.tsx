import { memo } from "react";
import { PLAYER_COLORS } from "../lib/colors";
import { GAME_DEFAULTS } from "../lib/constants";

interface PlayerCountPickerProps {
  value: number;
  onChange: (value: number) => void;
}

const PlayerCountPickerComponent = ({ value, onChange }: PlayerCountPickerProps) => {
  const safeValue = Math.max(GAME_DEFAULTS.MIN_PLAYERS, Math.min(value, GAME_DEFAULTS.MAX_PLAYERS_LIMIT));

  return (
    <div className="player-count-picker" role="radiogroup" aria-label="Player count">
      {PLAYER_COLORS.map((color, index) => {
        const count = index + 1;
        const isActive = count <= safeValue;

        return (
          <button
            key={count}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${count} players`}
            className={`player-count-dot ${isActive ? "active" : "inactive"}`}
            style={{
              ["--dot-color" as string]: color,
            }}
            onClick={() => onChange(Math.max(GAME_DEFAULTS.MIN_PLAYERS, count))}
          >
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export const PlayerCountPicker = memo(PlayerCountPickerComponent);

