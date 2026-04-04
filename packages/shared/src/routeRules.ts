type RouteType = "normal" | "tunnel" | "ferry" | "double" | undefined;

export const getMinRequiredLocomotives = (_route: {
  routeType?: RouteType;
  ferryLocomotives?: number;
}): number => {
  if (_route.routeType === "ferry") {
    return Math.max(1, _route.ferryLocomotives ?? 1);
  }
  if (_route.routeType === "tunnel") {
    return 1;
  }
  return 0;
};

export const getStationBuildCost = (stationsLeft: number): number => {
  const usedStations = Math.max(0, 3 - stationsLeft);
  return Math.min(3, usedStations + 1);
};

