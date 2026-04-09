import type { MapLayout } from "./mapLayoutTypes";
import { EUROPE_LAYOUT } from "./maps/europeLayout";

export const MAP_LAYOUTS: Record<string, MapLayout> = {
  europe: {
    ...EUROPE_LAYOUT,
  },
};

