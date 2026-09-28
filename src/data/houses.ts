import type { PropId, VillagerId } from '../types/ids';

/** Her neighbours' houses (phase G); Wrapunzel lives over her bakery. */
export type HouseId = 'maudeHouse' | 'rufusHouse' | 'agathaHouse' | 'bartyHouse' | 'codyHouse';

export interface HouseRow {
  owner: VillagerId;
  /** What it's called, as she'd say it. */
  name: string;
  /** What she finds at the door while it's shut: their insides are phase H's. */
  shut: string;
}

/** Whose house is whose, and what's at each door for now. */
export const HOUSES: Record<HouseId, HouseRow> = {
  maudeHouse: {
    owner: 'maude',
    name: "Maude's library",
    shut: "A card on the door says 'Closed for haunting. Back soon. Please return books by moonlight.'",
  },
  rufusHouse: {
    owner: 'rufus',
    name: "Rufus's cottage",
    shut: 'It smells of roses and, very faintly, of damp dog. Nobody answers, but the flowers wave.',
  },
  agathaHouse: {
    owner: 'agatha',
    name: "Agatha's cottage",
    shut: "The cauldron bubbles away all by itself. A note says 'Do NOT stir.' So you don't.",
  },
  bartyHouse: {
    owner: 'barty',
    name: "Barty's cottage",
    shut: "A note on the door: 'In the garden. Always in the garden. Help yourself to a seedling.'",
  },
  codyHouse: {
    owner: 'cody',
    name: "Cody's manor",
    shut: "The knocker is a little iron bat. A note under it says 'Out. Back by sundown, babe.'",
  },
};

export function isHouse(prop: PropId): prop is HouseId {
  return prop in HOUSES;
}
