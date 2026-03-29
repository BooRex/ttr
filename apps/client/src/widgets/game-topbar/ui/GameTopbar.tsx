import type { GameState } from "@ttr/shared";
import { PLAYER_COLORS } from "../../../lib/colors";
import { t, type Lang } from "../../../lib/i18n";

type Props = {
  game: GameState;
  lang: Lang;
  isMyTurn: boolean;
  turnPulse: boolean;
  sessionToken: string;
  highlightOwnerSessionToken: string | null;
  onHoverOwner: (sessionToken: string | null) => void;
  onToggleOwner: (sessionToken: string) => void;
  onSetLang: (lang: Lang) => void;
};

export const GameTopbar = ({
  game,
  lang,
  isMyTurn,
  turnPulse,
  sessionToken,
  highlightOwnerSessionToken,
  onHoverOwner,
  onToggleOwner,
  onSetLang,
}: Props) => {
  const activePlayer = game.players[game.activePlayerIndex];

  return (
    <div className="game-topbar">
      <span className="room-badge">{game.roomId}</span>
      {activePlayer && !game.finished && (
        <span className={["text-xs inline-flex items-center gap-1.5", turnPulse ? "turn-pulse text-green-300" : "text-slate-300"].join(" ")}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAYER_COLORS[game.activePlayerIndex] }} />
          {isMyTurn ? t(lang, "ui.yourTurn") : t(lang, "ui.waiting")}
        </span>
      )}

      <div className="players-strip ml-auto">
        {game.players.map((player, idx) => {
          const color = PLAYER_COLORS[idx];
          const isActive = idx === game.activePlayerIndex && !game.finished;
          const isMe = player.sessionToken === sessionToken;
          const isHighlighted = highlightOwnerSessionToken === player.sessionToken;
          return (
            <button
              key={player.sessionToken}
              className={["player-pill", isActive ? "active" : "", isHighlighted ? "highlighted" : ""].join(" ")}
              onMouseEnter={() => onHoverOwner(player.sessionToken)}
              onMouseLeave={() => onHoverOwner(null)}
              onClick={() => onToggleOwner(player.sessionToken)}
              title={player.nickname}
            >
              <div
                className={[
                  "player-avatar",
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center",
                  "text-[11px] font-black select-none transition-transform",
                  isActive ? "scale-110" : "opacity-85",
                ].join(" ")}
                style={{
                  background: color,
                  borderColor: isActive ? "rgba(255,255,255,0.8)" : `${color}60`,
                  boxShadow: isActive ? `0 0 10px ${color}, 0 0 20px ${color}55` : "none",
                  color: idx === 3 ? "#111827" : "#fff",
                }}
              >
                {isMe ? "★" : String(idx + 1)}
              </div>
              <span className="player-pill-meta">
                {player.points}{t(lang, "ui.pointsShort")} · {player.wagonsLeft}🚃 · {player.hand.length}🃏
              </span>
            </button>
          );
        })}
      </div>

      <label className="lang-select-wrap">
        <select value={lang} onChange={(e) => onSetLang(e.target.value as Lang)}>
          {(["ru", "uk", "en", "de"] as Lang[]).map((code) => (
            <option key={code} value={code}>{t(lang, `lang.${code}`)}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

