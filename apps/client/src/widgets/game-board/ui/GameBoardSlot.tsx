import type { Route } from "@ttr/shared";
import { BoardCanvas } from "../../../components/BoardCanvas";
import type { Lang } from "../../../lib/i18n";

type Props = {
  mapId: string;
  lang: Lang;
  routes: Route[];
  players: { sessionToken: string }[];
  selectedRouteId: string;
  highlightOwnerSessionToken: string | null;
  highlightRouteIds: string[];
  highlightCityNames: string[];
  onSelectRoute: (routeId: string) => void;
};

export const GameBoardSlot = ({
  mapId,
  lang,
  routes,
  players,
  selectedRouteId,
  highlightOwnerSessionToken,
  highlightRouteIds,
  highlightCityNames,
  onSelectRoute,
}: Props) => {
  return (
    <div className="board-slot">
      <div className="board-square">
        <BoardCanvas
          mapId={mapId}
          lang={lang}
          routes={routes}
          players={players}
          selectedRouteId={selectedRouteId}
          highlightOwnerSessionToken={highlightOwnerSessionToken}
          highlightRouteIds={highlightRouteIds}
          highlightCityNames={highlightCityNames}
          onSelectRoute={onSelectRoute}
        />
      </div>
    </div>
  );
};

