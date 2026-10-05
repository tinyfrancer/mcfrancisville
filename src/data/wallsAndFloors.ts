import type { SetFlooringId, WallpaperId, WindowPaperId } from '../types/ids';
import type { SurfaceRow } from './furniture';

/*
 * Walls and floors that came with the second four furniture sets (0.3's S4): six wallpapers with
 * windows in them, which show the sky outside at the hour and in the day's weather, and four
 * floorings, one for each set's room.
 */

/** The wallpapers with windows. Each hangs a window every few tiles along her back wall. */
export const WINDOW_WALLPAPERS: Record<WindowPaperId, SurfaceRow> = {
  archWindow: { name: 'Arched windows on cream', price: 560 },
  roundWindow: { name: 'Round windows on teal', price: 580 },
  latticeWindow: { name: 'Cottage windows on sage', price: 600 },
  gothicWindow: { name: 'Gothic windows on plum stone', price: 640 },
  laceWindow: { name: 'Lace-curtained windows on rose', price: 620 },
  ivyWindow: { name: 'Ivy windows on brick', price: 600 },
};

/** The floorings: a bathroom's tiles, a garden room's terracotta, a starry carpet, parquet. */
export const SET_FLOORINGS: Record<SetFlooringId, SurfaceRow> = {
  pennyTiles: { name: 'Mint penny tiles', price: 400 },
  terracotta: { name: 'Terracotta tiles', price: 380 },
  starCarpet: { name: 'Starry carpet', price: 420 },
  chevron: { name: 'Chevron parquet', price: 460 },
};

/** The look of the sky through a window. */
export type WindowSky =
  'dawn' | 'day' | 'golden' | 'dusk' | 'night' | 'rain' | 'fog' | 'rainyNight';

export const WINDOW_SKIES: readonly WindowSky[] = [
  'dawn',
  'day',
  'golden',
  'dusk',
  'night',
  'rain',
  'fog',
  'rainyNight',
];

export const WINDOW_PAPER_IDS = Object.keys(WINDOW_WALLPAPERS) as WindowPaperId[];
export const SET_FLOORING_IDS = Object.keys(SET_FLOORINGS) as SetFlooringId[];

export function isWindowPaper(id: WallpaperId): id is WindowPaperId {
  return id in WINDOW_WALLPAPERS;
}
