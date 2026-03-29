import { useCallback, useEffect, useState } from "react";
import type { CardColor, DestinationCard, GameState } from "@ttr/shared";
import { useSocketEmit } from "./useSocketEmit";
import { useGameSelectors } from "./useGameSelectors";
import { SOCKET_EVENTS } from "../lib/constants";

interface UseGameLogicProps {
  game: GameState | null;
  roomId: string;
  sessionToken: string;
}

export const useGameLogic = ({ game, roomId, sessionToken }: UseGameLogicProps) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<CardColor>("red");
  const [selectedLocoCount, setSelectedLocoCount] = useState<number>(0);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);

  // ── Selectors (мемоизированы) ──────────────────────────────────────────────
  const { me, activePlayer, isMyTurn, isMyPendingChoice, winner, canAct } = useGameSelectors(
    game,
    sessionToken,
  );
  const pendingChoice = game?.pendingDestinationChoice;

  // ── Socket emit wrapper ────────────────────────────────────────────────────
  const { emit } = useSocketEmit(roomId, sessionToken);

  // ── Destination choice cleanup ─────────────────────────────────────────────
  useEffect(() => {
    if (!pendingChoice || pendingChoice.sessionToken !== sessionToken) {
      setSelectedDestinationIds([]);
    } else {
      setSelectedDestinationIds((c) =>
        c.filter((id) => pendingChoice.cards.some((card: DestinationCard) => card.id === id)),
      );
    }
  }, [pendingChoice, sessionToken]);

  // Drop selected route after it gets claimed or becomes unavailable
  useEffect(() => {
    if (!game?.started || !selectedRouteId) return;
    const route = game.routes.find((r: any) => r.id === selectedRouteId);
    if (!route || route.ownerSessionToken) {
      setSelectedRouteId("");
      setSelectedLocoCount(0);
    }
  }, [game?.routes, game?.started, selectedRouteId]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    emit(SOCKET_EVENTS.ROOM_START);
  }, [emit]);

  const drawCardFrom = useCallback(
    (index?: number) => {
      emit(SOCKET_EVENTS.GAME_DRAW_CARD, { fromOpenIndex: index });
    },
    [emit],
  );

  const claimRoute = useCallback(() => {
    emit(SOCKET_EVENTS.GAME_CLAIM_ROUTE, {
      routeId: selectedRouteId,
      color: selectedColor,
      useLocomotives: selectedLocoCount,
    });
  }, [emit, selectedRouteId, selectedColor, selectedLocoCount]);

  const onSelectClaim = useCallback(
    (baseColor: CardColor, locoCount: number) => {
      setSelectedColor(baseColor);
      setSelectedLocoCount(locoCount);
    },
    [],
  );

  const drawDestinations = useCallback(() => {
    emit(SOCKET_EVENTS.GAME_DRAW_DESTINATIONS);
  }, [emit]);

  const confirmDestinations = useCallback(() => {
    if (!pendingChoice) return;
    emit(SOCKET_EVENTS.GAME_CHOOSE_DESTINATIONS, { keepIds: selectedDestinationIds });
  }, [pendingChoice, emit, selectedDestinationIds]);

  return {
    // UI State
    selectedRouteId,
    setSelectedRouteId,
    selectedColor,
    setSelectedColor,
    selectedLocoCount,
    setSelectedLocoCount,
    selectedDestinationIds,
    setSelectedDestinationIds,

    // Derived state
    me,
    activePlayer,
    isMyTurn,
    pendingChoice,
    isMyPendingChoice,
    winner,
    canAct,

    // Actions
    startGame,
    drawCardFrom,
    claimRoute,
    onSelectClaim,
    drawDestinations,
    confirmDestinations,
  };
};

