import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WaitingRoomScreen } from "../../src/screens/WaitingRoomScreen";

const buildGame = (playersCount = 2) => ({
  roomId: "ROOM-7",
  mapId: "europe",
  settings: { maxPlayers: 5 },
  players: Array.from({ length: playersCount }).map((_, index) => ({
    sessionToken: `p-${index + 1}`,
    nickname: `Player ${index + 1}`,
  })),
});

describe("WaitingRoomScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders lobby logo and player dots", () => {
    render(
      <WaitingRoomScreen
        game={buildGame(3) as any}
        lang="ru"
        sessionToken="p-1"
        onStartGame={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: /логотип/i })).toBeTruthy();
    expect(screen.getByText(/Player 1/i)).toBeTruthy();
    expect(screen.getByText(/Player 2/i)).toBeTruthy();
    expect(screen.getByText(/Player 3/i)).toBeTruthy();
    expect(screen.getAllByTestId(/waiting-player-dot-/)).toHaveLength(3);
  });

  it("calls onLeave when leave button is clicked", () => {
    const onLeave = vi.fn();
    render(
      <WaitingRoomScreen
        game={buildGame(2) as any}
        lang="ru"
        sessionToken="p-1"
        onStartGame={vi.fn()}
        onLeave={onLeave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /назад/i }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("shows start button only for host", () => {
    const { rerender } = render(
      <WaitingRoomScreen
        game={buildGame(2) as any}
        lang="ru"
        sessionToken="p-1"
        onStartGame={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("start-game-btn")).toBeTruthy();

    rerender(
      <WaitingRoomScreen
        game={buildGame(2) as any}
        lang="ru"
        sessionToken="p-2"
        onStartGame={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("start-game-btn")).toBeNull();
  });
});

