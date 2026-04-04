import { describe, expect, it } from "vitest";
import type { TrainCard } from "@ttr/shared";
import { buildClaimOptions } from "../../../src/entities/game/claimOptions";

const hand = (...colors: TrainCard["color"][]): TrainCard[] => colors.map((color) => ({ color }));

describe("buildClaimOptions", () => {
  it("строит варианты для обычного серого маршрута с миксом цветных и локомотивов", () => {
    const options = buildClaimOptions(
      hand("red", "red", "locomotive", "locomotive", "locomotive", "locomotive"),
      { color: "gray", length: 4, routeType: "normal" },
    );

    expect(options).toContainEqual({ baseColor: "red", colorCount: 2, locoCount: 2 });
    expect(options).toContainEqual({ baseColor: "locomotive", colorCount: 0, locoCount: 4 });
  });

  it("не предлагает паром без обязательного числа локомотивов", () => {
    const options = buildClaimOptions(
      hand("orange", "orange", "orange", "orange", "locomotive"),
      { color: "gray", length: 5, routeType: "ferry", ferryLocomotives: 2 },
    );

    expect(options).toEqual([]);
  });

  it("предлагает только легальные комбинации для парома", () => {
    const options = buildClaimOptions(
      hand("orange", "orange", "orange", "locomotive", "locomotive"),
      { color: "gray", length: 5, routeType: "ferry", ferryLocomotives: 2 },
    );

    expect(options).toContainEqual({ baseColor: "orange", colorCount: 3, locoCount: 2 });
    expect(options.every((option) => option.locoCount >= 2)).toBe(true);
  });

  it("для туннеля требует минимум 1 локомотив", () => {
    const options = buildClaimOptions(
      hand("yellow", "yellow", "locomotive"),
      { color: "yellow", length: 2, routeType: "tunnel" },
    );

    expect(options).toContainEqual({ baseColor: "yellow", colorCount: 1, locoCount: 1 });
    expect(options).not.toContainEqual({ baseColor: "yellow", colorCount: 2, locoCount: 0 });
  });
});

