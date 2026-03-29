import { useState } from "react";
import type { DestinationCard } from "@ttr/shared";

/**
 * Управление всеми hover/highlight состояниями на доске
 */
export const useHoverState = () => {
  const [hoveredDestination, setHoveredDestination] = useState<DestinationCard | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [highlightOwnerSessionToken, setHighlightOwnerSessionToken] = useState<string | null>(null);

  const resetHovers = () => {
    setHoveredDestination(null);
    setHoveredConnection(null);
    setHighlightOwnerSessionToken(null);
  };

  return {
    hoveredDestination,
    setHoveredDestination,
    hoveredConnection,
    setHoveredConnection,
    highlightOwnerSessionToken,
    setHighlightOwnerSessionToken,
    resetHovers,
  };
};

