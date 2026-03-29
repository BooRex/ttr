import { describe, expect, it } from "vitest";
import type { Route } from "@ttr/shared";
import {
  buildConnectionHighlight,
  buildOwnedDestinationHighlight,
  sameRoutePair,
} from "../../../src/entities/game/model/highlights";

const routes: Route[] = [
  { id: "r1", from: "London", to: "Dieppe", length: 2, color: "gray", ownerSessionToken: "p1" },
  { id: "r2", from: "Dieppe", to: "Paris", length: 1, color: "gray", ownerSessionToken: "p1" },
  { id: "r3", from: "Paris", to: "Frankfurt", length: 3, color: "white" },
  { id: "r4", from: "Frankfurt", to: "Paris", length: 3, color: "orange" },
];

describe("highlights", () => {
  it("sameRoutePair matches both directions", () => {
    expect(sameRoutePair(routes[2], "Paris", "Frankfurt")).toBe(true);
    expect(sameRoutePair(routes[2], "Frankfurt", "Paris")).toBe(true);
    expect(sameRoutePair(routes[2], "Paris", "London")).toBe(false);
  });

  it("buildConnectionHighlight returns both parallel routes", () => {
    const hl = buildConnectionHighlight(routes, "Paris", "Frankfurt");
    expect(hl.routeIds.sort()).toEqual(["r3", "r4"]);
    expect(hl.cityNames).toEqual(["Paris", "Frankfurt"]);
  });

  it("buildOwnedDestinationHighlight returns built path for owner", () => {
    const hl = buildOwnedDestinationHighlight(routes, "p1", {
      id: "d1",
      from: "London",
      to: "Paris",
      points: 7,
    });
    expect(hl.routeIds.sort()).toEqual(["r1", "r2"]);
    expect(hl.cityNames).toEqual(["London", "Paris"]);
  });

  it("buildOwnedDestinationHighlight falls back to city endpoints if not connected", () => {
    const hl = buildOwnedDestinationHighlight(routes, "p1", {
      id: "d2",
      from: "London",
      to: "Frankfurt",
      points: 8,
    });
    expect(hl.cityNames).toEqual(["London", "Frankfurt"]);
    expect(hl.routeIds).toContain("r1");
    expect(hl.routeIds).toContain("r2");
  });
});

