import { useMemo } from "react";
import type { DestinationCard, GameState } from "@ttr/shared";
import {
  buildDestinationSelectionHighlight,
  buildConnectionHighlight,
  buildOwnedDestinationHighlight,
  type RouteHighlight,
} from "../entities/game/model";

export const useBoardHighlight = (
  game: GameState | null,
  sessionToken: string,
  hoveredDestination: DestinationCard | null,
  hoveredConnection: { from: string; to: string } | null,
  selectedDestinations: DestinationCard[] = [],
): RouteHighlight => {
  return useMemo<RouteHighlight>(() => {
    if (!game) return { routeIds: [], cityNames: [] };

    if (hoveredDestination) {
      return buildOwnedDestinationHighlight(game.routes, sessionToken, hoveredDestination);
    }

    if (selectedDestinations.length > 0) {
      return buildDestinationSelectionHighlight(selectedDestinations);
    }

    if (hoveredConnection) {
      return buildConnectionHighlight(game.routes, hoveredConnection.from, hoveredConnection.to);
    }

    return { routeIds: [], cityNames: [] };
  }, [game, hoveredDestination, hoveredConnection, selectedDestinations, sessionToken]);
};

