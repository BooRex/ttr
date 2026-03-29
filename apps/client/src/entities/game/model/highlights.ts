import type { DestinationCard, Route } from "@ttr/shared";

export type RouteHighlight = { routeIds: string[]; cityNames: string[] };

export const sameRoutePair = (route: Route, from: string, to: string): boolean => (
  (route.from === from && route.to === to) || (route.from === to && route.to === from)
);

export const buildConnectionHighlight = (
  routes: Route[],
  from: string,
  to: string,
): RouteHighlight => {
  return {
    routeIds: routes.filter((route) => sameRoutePair(route, from, to)).map((route) => route.id),
    cityNames: [from, to],
  };
};

export const buildOwnedDestinationHighlight = (
  routes: Route[],
  sessionToken: string,
  card: DestinationCard,
): RouteHighlight => {
  const ownedRoutes = routes.filter((route) => route.ownerSessionToken === sessionToken);
  const adjacency = new Map<string, { city: string; routeId: string }[]>();

  for (const route of ownedRoutes) {
    if (!adjacency.has(route.from)) adjacency.set(route.from, []);
    if (!adjacency.has(route.to)) adjacency.set(route.to, []);
    adjacency.get(route.from)?.push({ city: route.to, routeId: route.id });
    adjacency.get(route.to)?.push({ city: route.from, routeId: route.id });
  }

  const queue = [card.from];
  const visited = new Set<string>([card.from]);
  const prev = new Map<string, { city: string; routeId: string }>();

  while (queue.length > 0) {
    const city = queue.shift() as string;
    if (city === card.to) break;
    for (const next of adjacency.get(city) ?? []) {
      if (visited.has(next.city)) continue;
      visited.add(next.city);
      prev.set(next.city, { city, routeId: next.routeId });
      queue.push(next.city);
    }
  }

  if (visited.has(card.to)) {
    const routeIds: string[] = [];
    let current = card.to;
    while (current !== card.from) {
      const step = prev.get(current);
      if (!step) break;
      routeIds.push(step.routeId);
      current = step.city;
    }
    return { routeIds, cityNames: [card.from, card.to] };
  }

  const collectBranchRoutes = (start: string): string[] => {
    const branchQueue = [start];
    const branchVisited = new Set<string>([start]);
    const routeIds = new Set<string>();

    while (branchQueue.length > 0) {
      const city = branchQueue.shift() as string;
      for (const next of adjacency.get(city) ?? []) {
        routeIds.add(next.routeId);
        if (!branchVisited.has(next.city)) {
          branchVisited.add(next.city);
          branchQueue.push(next.city);
        }
      }
    }

    return [...routeIds];
  };

  return {
    routeIds: [...new Set([...collectBranchRoutes(card.from), ...collectBranchRoutes(card.to)])],
    cityNames: [card.from, card.to],
  };
};

