type RouteType = "normal" | "tunnel" | "ferry" | "double" | undefined;

export const getMinRequiredLocomotives = (_route: {
  routeType?: RouteType;
  ferryLocomotives?: number;
}): number => {
  // Ferries and tunnels are treated equally — no mandatory locomotive requirement.
  // Locomotives can still be used as wildcards.
  return 0;
};

export const getStationBuildCost = (stationsLeft: number): number => {
  const usedStations = Math.max(0, 3 - stationsLeft);
  return Math.min(3, usedStations + 1);
};

