import { getMinRequiredLocomotives, type CardColor, type Route, type TrainCard } from "@ttr/shared";

const ALL_COLORS: CardColor[] = ["red", "blue", "green", "yellow", "black", "white", "orange", "pink", "locomotive"];

export type ClaimOpt = {
  baseColor: CardColor;
  colorCount: number;
  locoCount: number;
};

const uniqByKey = (options: ClaimOpt[]): ClaimOpt[] => (
  options.filter((opt, idx, arr) => (
    arr.findIndex((candidate) => (
      candidate.baseColor === opt.baseColor
      && candidate.colorCount === opt.colorCount
      && candidate.locoCount === opt.locoCount
    )) === idx
  ))
);

export const buildClaimOptions = (
  hand: TrainCard[],
  route: Pick<Route, "color" | "length" | "routeType" | "ferryLocomotives">,
): ClaimOpt[] => {
  const locoInHand = hand.filter((card) => card.color === "locomotive").length;
  const minSpecialLocos = getMinRequiredLocomotives(route);

  const options: ClaimOpt[] = [];

  if (route.color === "gray") {
    for (const color of ALL_COLORS.filter((candidate) => candidate !== "locomotive")) {
      const colorInHand = hand.filter((card) => card.color === color).length;
      const minColor = Math.max(0, route.length - locoInHand);
      const maxColor = Math.min(route.length, colorInHand);

      for (let colorCount = maxColor; colorCount >= minColor; colorCount -= 1) {
        const locoCount = route.length - colorCount;
        if (locoCount > locoInHand) continue;
        if (locoCount < minSpecialLocos) continue;
        // Avoid duplicate visuals: pure locomotive combo should be represented once.
        if (colorCount === 0) continue;
        if (colorCount === 0 && locoCount === 0) continue;
        options.push({ baseColor: color, colorCount, locoCount });
      }
    }

    if (locoInHand >= route.length && route.length >= minSpecialLocos) {
      options.push({ baseColor: "locomotive", colorCount: 0, locoCount: route.length });
    }
  } else {
    const routeColor = route.color as CardColor;
    const colorInHand = hand.filter((card) => card.color === routeColor).length;
    const minColor = Math.max(0, route.length - locoInHand);
    const maxColor = Math.min(route.length, colorInHand);

    for (let colorCount = maxColor; colorCount >= minColor; colorCount -= 1) {
      const locoCount = route.length - colorCount;
      if (locoCount > locoInHand) continue;
      if (locoCount < minSpecialLocos) continue;
      options.push({ baseColor: routeColor, colorCount, locoCount });
    }
  }

  return uniqByKey(options);
};

