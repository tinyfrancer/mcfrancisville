import { CROPS, inSeason } from '../data/crops';
import { INTERIORS, isInterior } from '../data/interiors';
import type { CropId, ZoneId } from '../types/ids';
import { dayKey } from './clock';

/** Whether a place is under glass (0.3's F2): the greenhouse at Boo Acres. */
export function underGlass(zone: ZoneId): boolean {
  return isInterior(zone) && INTERIORS[zone].underGlass === true;
}

/**
 * Whether a crop planted in `zone` at `at` grows a day sooner (`Planting.quick`): where it thrives
 * (0.2's N1), or under glass, where every crop grows as if in its own season (decision 242). In its
 * season already, the glass adds nothing more: it is that season's day, not another.
 */
export function growsQuick(crop: CropId, zone: ZoneId, at: number): boolean {
  if (CROPS[crop].thrives?.some((place) => place === zone)) return true;
  return underGlass(zone) && !inSeason(crop, Number(dayKey(at).slice(5, 7)));
}
