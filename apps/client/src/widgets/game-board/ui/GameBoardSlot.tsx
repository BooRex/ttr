import type { Route, Station } from "@ttr/shared";
import { BoardCanvas } from "../../../components/BoardCanvas";
import type { Lang } from "../../../lib/i18n";

type Props = {
  mapId: string;
  lang: Lang;
  routes: Route[];
  stations: Station[];
  players: { sessionToken: string }[];
  selectedRouteId: string;
  highlightOwnerSessionToken: string | null;
  highlightRouteIds: string[];
  highlightCityNames: string[];
  selectedStationCity?: string;
  onSelectCity?: (city: string) => void;
  onSelectRoute: (routeId: string) => void;
};

export const GameBoardSlot = ({
  mapId,
  lang,
  routes,
  stations,
  players,
  selectedRouteId,
  highlightOwnerSessionToken,
  highlightRouteIds,
  highlightCityNames,
  selectedStationCity,
  onSelectCity,
  onSelectRoute,
}: Props) => {
  return (
    <div className="board-slot">
      <div className="board-square">
        <BoardCanvas
          mapId={mapId}
          lang={lang}
          routes={routes}
          stations={stations}
          players={players}
          selectedRouteId={selectedRouteId}
          highlightOwnerSessionToken={highlightOwnerSessionToken}
          highlightRouteIds={highlightRouteIds}
          highlightCityNames={highlightCityNames}
          selectedStationCity={selectedStationCity}
          onSelectCity={onSelectCity}
          onSelectRoute={onSelectRoute}
        />
      </div>
    </div>
  );
};

