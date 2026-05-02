import type { GameState } from "@ttr/shared";
import { PLAYER_COLORS } from "../../../lib/colors";
import { t, type Lang } from "../../../lib/i18n";
import { PlayerPillMeta } from "../../../components/PlayerPillMeta";
import { getLogoSrc } from "../../../lib/logoAssets";

type Props = {
  game: GameState;
  lang: Lang;
  sessionToken: string;
  highlightOwnerSessionToken: string | null;
  onHoverOwner: (sessionToken: string | null) => void;
  onToggleOwner: (sessionToken: string) => void;
  onSetLang: (lang: Lang) => void;
  onOpenScoringHelp: () => void;
  onOpenTutorial: () => void;
};

export const GameTopbar = ({
  game,
  lang,
  sessionToken,
  highlightOwnerSessionToken,
  onHoverOwner,
  onToggleOwner,
  onSetLang,
  onOpenScoringHelp,
  onOpenTutorial,
}: Props) => {
  const finalRoundTrigger = game.lastRoundTriggered && game.lastRoundEndIndex !== null
    ? game.players[game.lastRoundEndIndex]
    : null;

  return (
    <div className="game-topbar">
      <div className="topbar-room">
        <img
          src={getLogoSrc(lang)}
          alt="logo"
          className="topbar-mini-logo"
          width={40}
          height={16}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <span className="room-badge">{game.roomId}</span>
      </div>

      {game.lastRoundTriggered && !game.finished && (
        <span className="final-round-badge" title={finalRoundTrigger ? `${finalRoundTrigger.nickname} ${t(lang, "ui.finalRoundTriggeredBy")}` : ""}>
          🔔 {t(lang, "ui.finalRound")}
        </span>
      )}

      <div className="players-strip ml-auto">
        {game.players.map((player, idx) => {
          const color = PLAYER_COLORS[idx];
          const isActive = idx === game.activePlayerIndex && !game.finished;
          const isMe = player.sessionToken === sessionToken;
          const isHighlighted = highlightOwnerSessionToken === player.sessionToken;
          const pillStyle = isActive
            ? {
                borderColor: `${color}cc`,
                background: `${color}22`,
                boxShadow: `0 0 0 1px ${color}55`,
              }
            : undefined;
          return (
            <button
              key={player.sessionToken}
              data-player-pill-token={player.sessionToken}
              className={["player-pill", isActive ? "active" : "", isHighlighted ? "highlighted" : ""].join(" ")}
              style={pillStyle}
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
                  color: idx === 3 ? "#111827" : "#fff",
                }}
              >
                {isMe ? "★" : String(idx + 1)}
              </div>
              <PlayerPillMeta player={player} lang={lang} hidePoints={!isMe} />
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

      <button
        type="button"
        className="topbar-control text-xs rounded-xl border border-[#64748b] bg-[#1e293b] text-slate-200"
        onClick={onOpenScoringHelp}
      >
        {t(lang, "ui.scoreHelp")}
      </button>

      <button
        type="button"
        className="topbar-control text-base font-black rounded-xl border border-[#64748b] bg-[#1e293b] text-slate-200"
        title={t(lang, "ui.tutorialHint")}
        aria-label={t(lang, "ui.tutorial")}
        onClick={onOpenTutorial}
      >
        ?
      </button>
    </div>
  );
};

