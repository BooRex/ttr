import type { DestinationCard, GameState, Route } from "@ttr/shared";

const buildAdjacency = (state: GameState, sessionToken: string): Map<string, Set<string>> => {
  const adjacency = new Map<string, Set<string>>();
  for (const route of state.routes) {
    if (route.ownerSessionToken !== sessionToken) continue;
    if (!adjacency.has(route.from)) adjacency.set(route.from, new Set<string>());
    if (!adjacency.has(route.to)) adjacency.set(route.to, new Set<string>());
    adjacency.get(route.from)?.add(route.to);
    adjacency.get(route.to)?.add(route.from);
  }
  return adjacency;
};

const isConnected = (adjacency: Map<string, Set<string>>, from: string, to: string): boolean => {
  if (from === to) return true;
  if (!adjacency.has(from) || !adjacency.has(to)) return false;

  const visited = new Set<string>([from]);
  const queue: string[] = [from];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const next of neighbors) {
      if (next === to) return true;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }

  return false;
};

export const isDestinationCompleted = (
  state: GameState,
  sessionToken: string,
  destination: Pick<DestinationCard, "from" | "to">,
): boolean => {
  const baseAdjacency = buildAdjacency(state, sessionToken);
  if (isConnected(baseAdjacency, destination.from, destination.to)) return true;

  const stationCities = state.stations
    .filter((station) => station.ownerSessionToken === sessionToken)
    .map((station) => station.city);
  if (stationCities.length === 0) return false;

  const stationOptions: (Route | null)[][] = stationCities.map((city) => {
    const options = state.routes.filter((route) => {
      if (!route.ownerSessionToken || route.ownerSessionToken === sessionToken) return false;
      return route.from === city || route.to === city;
    });
    return [null, ...options];
  });

  const tryCombination = (index: number, picked: Route[]): boolean => {
    if (index >= stationOptions.length) {
      const adjacency = new Map<string, Set<string>>();
      for (const [city, neighbors] of baseAdjacency.entries()) {
        adjacency.set(city, new Set(neighbors));
      }
      for (const route of picked) {
        if (!adjacency.has(route.from)) adjacency.set(route.from, new Set<string>());
        if (!adjacency.has(route.to)) adjacency.set(route.to, new Set<string>());
        adjacency.get(route.from)?.add(route.to);
        adjacency.get(route.to)?.add(route.from);
      }
      return isConnected(adjacency, destination.from, destination.to);
    }

    for (const option of stationOptions[index] ?? []) {
      if (!option && tryCombination(index + 1, picked)) return true;
      if (option && tryCombination(index + 1, [...picked, option])) return true;
    }

    return false;
  };

  return tryCombination(0, []);
};

