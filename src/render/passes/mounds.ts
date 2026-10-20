import { TILE_SIZE } from '../../config/world';
import { bake } from '../../sprites/bake';
import { PROP_ART } from '../../sprites/props';
import type { PlacedProp } from '../../systems/grid';
import type { World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import { glowOf, type Drawable } from '../scene';
import type { Pass } from './pass';

/**
 * The mounds where something is buried, glinting until she digs each up and a hole after, and the
 * day's mound (0.3's C1); any not yet dug is what she might want behind a crown.
 */
export function moundsPass(
  world: World,
  zone: MapZone,
  mounds: readonly { prop: PlacedProp; drawable: Drawable; dug: HTMLCanvasElement }[],
): Pass {
  /** Each mound, glinting until she digs up what's under it, and a hole after. */
  const buried = (): Drawable[] =>
    mounds.map(({ prop, drawable, dug }) => {
      if (!world.digging.isDug(zone.id, prop)) return drawable;
      const hole: Drawable = { ...drawable, sprite: dug };
      delete hole.glow;
      return hole;
    });
  /**
   * The day's mound (0.3's C1), glinting until she digs it, and the hole it leaves until morning:
   * the same mound as the keys were buried under.
   */
  const todayMound = (): Drawable[] => {
    const prop = zone.mounds?.today();
    if (!prop) return [];
    const art = PROP_ART.mound;
    const dug = world.fossils.isDug(zone.id);
    const sprite = dug
      ? bake('prop:mound:dug', art.spent!, art.palette)
      : bake('prop:mound:0', art.source, art.palette);
    const footY = (prop.ty + 1) * TILE_SIZE;
    const x = prop.tx * TILE_SIZE + (TILE_SIZE - sprite.width) / 2;
    const d: Drawable = { footY, sprite, x, y: footY - sprite.height };
    if (!dug && art.glow) d.glow = glowOf('glow:mound:0', art.source, art.palette, art.glow);
    return [d];
  };
  let stood: Drawable[] = [];
  let today: Drawable[] = [];
  return {
    name: 'mounds',
    stand() {
      stood = buried();
      today = todayMound();
      return [...stood, ...today];
    },
    wanted: () => [
      ...stood.filter((d, i) => d.sprite !== mounds[i]!.dug),
      ...(world.fossils.isDug(zone.id) ? [] : today),
    ],
  };
}
