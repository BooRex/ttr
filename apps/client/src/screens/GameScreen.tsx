import { memo } from "react";
import type { DestinationCard, CardColor, GameState } from "@ttr/shared";
import { GameTopbar } from "../widgets/game-topbar";
import { GameBoardSlot } from "../widgets/game-board";
import { GameRightPanel } from "../widgets/game-right-panel";
import { ActionPanel, type ClaimOpt } from "../components/ActionPanel";
import { EventLog } from "../components/EventLog";
import { t, type Lang } from "../lib/i18n";

interface GameScreenProps {
  game: GameState;
  lang: Lang;
  sessionToken: string;
  isMyTurn: boolean;
  turnPulse: boolean;
  canAct: boolean;
  isMobileLayout: boolean;
  isPortrait: boolean;
  isEventsOpen: boolean;
  onToggleEvents: () => void;
  me: any;
  activePlayer: any;
  winner: any;
  pendingChoice: any;
  isMyPendingChoice: boolean;
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  selectedColor: CardColor;
  selectedLocoCount: number;
  selectedDestinationIds: string[];
  onToggleDestination: (id: string) => void;
  highlightOwnerSessionToken: string | null;
  onHoverOwner: (token: string | null) => void;
  onToggleOwner: (token: string) => void;
  highlightRouteIds: string[];
  highlightCityNames: string[];
  hoveredDestination: DestinationCard | null;
  onHoverDestination: (dest: DestinationCard | null) => void;
  hoveredConnection: { from: string; to: string } | null;
  onHoverConnection: (from: string, to: string) => void;
  onLeaveConnection: () => void;
  onDrawCard: (index?: number) => void;
  onClaimRoute: () => void;
  onSelectClaim: (opt: ClaimOpt) => void;
  onDrawDestinations: () => void;
  onConfirmDestinations: () => void;
  onDeselectRoute: () => void;
  onSetLang: (lang: Lang) => void;
  onBackToLobby: () => void;
}

const GameScreenComponent = ({
  game,
  lang,
  sessionToken,
  isMyTurn,
  turnPulse,
  canAct,
  isMobileLayout,
  isPortrait,
  isEventsOpen,
  onToggleEvents,
  me,
  activePlayer,
  winner,
  pendingChoice,
  isMyPendingChoice,
  selectedRouteId,
  onSelectRoute,
  selectedColor,
  selectedLocoCount,
  selectedDestinationIds,
  onToggleDestination,
  highlightOwnerSessionToken,
  onHoverOwner,
  onToggleOwner,
  highlightRouteIds,
  highlightCityNames,
  hoveredDestination,
  onHoverDestination,
  hoveredConnection,
  onHoverConnection,
  onLeaveConnection,
  onDrawCard,
  onClaimRoute,
  onSelectClaim,
  onDrawDestinations,
  onConfirmDestinations,
  onDeselectRoute,
  onSetLang,
  onBackToLobby,
}: GameScreenProps) => {
  return (
    <div className="game-screen" data-testid="game-screen">
      {isPortrait && (
        <div className="orientation-overlay">
          <div className="orientation-card">
            <div className="text-4xl mb-2">📱↻</div>
            <h2>{t(lang, "ui.onlyLandscape")}</h2>
            <p>{t(lang, "ui.rotateDevice")}</p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <GameTopbar
        game={game}
        lang={lang}
        isMyTurn={isMyTurn}
        turnPulse={turnPulse}
        sessionToken={sessionToken}
        highlightOwnerSessionToken={highlightOwnerSessionToken}
        onHoverOwner={onHoverOwner}
        onToggleOwner={onToggleOwner}
        onSetLang={onSetLang}
      />

      <div className="game-layout">
        <aside className="game-side side-left">
          <div className="card side-card side-scroll">
            <ActionPanel
              game={game}
              me={me}
              lang={lang}
              sessionToken={sessionToken}
              selectedRouteId={selectedRouteId}
              selectedColor={selectedColor}
              selectedLocoCount={selectedLocoCount}
              canAct={canAct}
              isMyTurn={isMyTurn}
              activePlayer={activePlayer}
              pendingChoice={pendingChoice}
              isMyPendingChoice={isMyPendingChoice}
              selectedDestinationIds={selectedDestinationIds}
              onToggleDestination={onToggleDestination}
              onConfirmDestinations={onConfirmDestinations}
              onSelectClaim={onSelectClaim}
              onDrawCard={onDrawCard}
              onDrawDestinations={onDrawDestinations}
              onClaimRoute={onClaimRoute}
              onDeselectRoute={onDeselectRoute}
            />
          </div>
        </aside>

        <GameBoardSlot
          mapId={game.mapId}
          lang={lang}
          routes={game.routes}
          players={game.players}
          selectedRouteId={selectedRouteId}
          highlightOwnerSessionToken={highlightOwnerSessionToken}
          highlightRouteIds={highlightRouteIds}
          highlightCityNames={highlightCityNames}
          onSelectRoute={onSelectRoute}
        />

        <GameRightPanel
          game={game}
          me={me}
          winner={winner}
          lang={lang}
          onHoverDestination={onHoverDestination}
          onLeaveDestination={() => onHoverDestination(null)}
          onHoverConnection={onHoverConnection}
          onLeaveConnection={onLeaveConnection}
          onBackToLobby={onBackToLobby}
        />
      </div>

      <button className="events-fab" onClick={onToggleEvents}>
        {t(lang, "ui.openEvents")}
      </button>

      {isMobileLayout && isEventsOpen && (
        <div className="events-modal">
          <div className="events-modal-head">
            <h3>{t(lang, "ui.events")}</h3>
            <button onClick={onToggleEvents}>{t(lang, "ui.close")}</button>
          </div>
          <EventLog
            events={game.events ?? []}
            players={game.players}
            lang={lang}
            onHoverConnection={onHoverConnection}
            onLeaveConnection={onLeaveConnection}
          />
        </div>
      )}
    </div>
  );
};

export const GameScreen = memo(GameScreenComponent);

