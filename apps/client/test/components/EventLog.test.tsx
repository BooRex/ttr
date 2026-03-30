import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GameEvent } from "@ttr/shared";
import { EventLog } from "../../src/components/EventLog";

const players = [
  { sessionToken: "p1", nickname: "Alice" },
  { sessionToken: "p2", nickname: "Bob" },
];

const events: GameEvent[] = [
  {
    id: "1",
    type: "claim_route",
    sessionToken: "p1",
    nickname: "Alice",
    routeId: "r1",
    from: "London",
    to: "Dieppe",
  },
  {
    id: "2",
    type: "draw_card",
    sessionToken: "p2",
    nickname: "Bob",
  },
];

describe("EventLog component", () => {
  it("renders player names and claim route badge", () => {
    render(
      <EventLog
        events={events}
        players={players}
        lang="ru"
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Лондон", { exact: false })).toBeInTheDocument();
  });

  it("calls hover callback for route badge", () => {
    const onHoverConnection = vi.fn();
    render(
      <EventLog
        events={events}
        players={players}
        lang="en"
        onHoverConnection={onHoverConnection}
      />,
    );

    const routeBadge = screen.getByTitle("London → Dieppe");
    fireEvent.mouseEnter(routeBadge);
    expect(onHoverConnection).toHaveBeenCalledWith("London", "Dieppe");
  });
});

