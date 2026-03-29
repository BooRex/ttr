import type { CardColor, GameEvent } from "@ttr/shared";
import { cardLabel, t, type Lang } from "../../../lib/i18n";

export type EventViewModel = {
  id: string;
  icon: string;
  message: string;
  player?: { sessionToken: string; nickname: string };
  cardColor?: CardColor;
  cardColorLabel?: string;
  route?: { from: string; to: string };
  winner?: { sessionToken: string | null; nickname: string; points: number | null };
};

export const toEventViewModel = (lang: Lang, event: GameEvent): EventViewModel => {
  if (event.type === "game_started") {
    return {
      id: event.id,
      icon: "🎲",
      message: t(lang, "events.gameStarted"),
    };
  }

  if (event.type === "draw_card") {
    return {
      id: event.id,
      icon: "🃏",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.drawCard"),
      cardColor: event.cardColor,
      cardColorLabel: cardLabel(lang, event.cardColor),
    };
  }

  if (event.type === "draw_destinations") {
    return {
      id: event.id,
      icon: "🗺",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.drawDestinations"),
    };
  }

  if (event.type === "choose_destinations") {
    return {
      id: event.id,
      icon: "✅",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.chooseDestinations", { count: event.keepCount }),
    };
  }

  if (event.type === "claim_route") {
    return {
      id: event.id,
      icon: "🚂",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.claimRoute"),
      route: { from: event.from, to: event.to },
    };
  }

  if (event.type === "final_round") {
    return {
      id: event.id,
      icon: "⏳",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.finalRound", { wagonsLeft: event.wagonsLeft }),
    };
  }

  if (event.type === "turn_skipped") {
    return {
      id: event.id,
      icon: "⏭",
      player: { sessionToken: event.sessionToken, nickname: event.nickname },
      message: t(lang, "events.turnSkipped", { reason: event.reason }),
    };
  }

  return {
    id: event.id,
    icon: "🏁",
    message: t(lang, "events.gameFinished"),
    winner: event.winnerNickname
      ? {
          sessionToken: event.winnerSessionToken,
          nickname: event.winnerNickname,
          points: event.winnerPoints,
        }
      : undefined,
  };
};

