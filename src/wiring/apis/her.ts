import type { BagApi, FreshApi } from '../../hud/BagSheet';
import { ateToast } from '../../hud/messages';
import type { QuickApi } from '../../hud/QuickBar';
import type { LookApi } from '../../hud/pickers';
import { CUES } from '../../audio/cues';
import { OUTFITS } from '../../data/outfits';
import { drawDollPreview, drawWornDetail } from '../../render/doll';
import { drawBroomIcon, drawItemIcon, drawRodIcon, drawToolIcon } from '../../render/items';
import { paintedRod, paintRod } from '../../render/scene';
import { readRodColour, writeRodColour } from '../../persistence/rod';
import type { RodApi } from '../../hud/RodSheet';
import { isBracelet, wear, WRIST_MAX } from '../../systems/wardrobe';
import { holdablesIn, type ApiWiring, type SheetApis } from './shared';

/** Her look, her bag, what's new on it, the quick bar in her hands, and her rod's paint. */
export function herApis({
  world,
  sound,
  changed,
  play,
}: ApiWiring): Pick<SheetApis, 'looks' | 'bag' | 'fresh' | 'quick' | 'rod'> {
  const looks: LookApi = {
    look: () => world.wardrobe.look,
    owned: () => world.wardrobe.owned,
    bracelets: () =>
      world.bag.contents.flatMap((s) => (isBracelet(s.id) ? [{ id: s.id, count: s.count }] : [])),
    apply(look) {
      world.wardrobe.setLook(look);
      changed();
    },
    preview: drawDollPreview,
    detail(canvas, look, outfit) {
      const owned = [...world.wardrobe.owned, outfit];
      drawWornDetail(canvas, wear(look, outfit, owned), OUTFITS[outfit].slot);
    },
    isNew: (id) => world.novelty.isNew('closet', id),
    seen: () => world.novelty.seen('closet'),
  };
  const bag: BagApi = {
    contents: () => world.bag.contents,
    canEat: (id) => world.kitchen.canEat(id),
    eat(id) {
      const ate = world.kitchen.eat(id);
      if (!ate || ate.kind !== 'ate') return null;
      play([ate]);
      return ateToast(ate.item, ate.effect, ate.until).text;
    },
    worn: (id) => world.wardrobe.wearing(id),
    canWear: (id) =>
      isBracelet(id) && world.bag.spare(id) > 0 && world.wardrobe.look.wrist.length < WRIST_MAX,
    wear(id) {
      if (!isBracelet(id) || !world.wardrobe.wearBracelet(id)) return false;
      changed();
      return true;
    },
    takeOff(id) {
      if (!isBracelet(id) || !world.wardrobe.takeOffBracelet(id)) return false;
      changed();
      return true;
    },
    icon: (canvas, id) =>
      id === 'broom' ? drawBroomIcon(canvas, world.broom.look) : drawItemIcon(canvas, id),
    canPutAway: (id) => world.chest.canPutAway(id),
    putAway(id, count) {
      if (!world.chest.putAway(id, count)) return false;
      changed();
      sound.cue(CUES.goIn);
      return true;
    },
    isNew: (id) => world.novelty.isNew('bag', id),
    seen: () => world.novelty.seen('bag'),
  };
  const fresh: FreshApi = {
    counts: () => world.novelty.counts(),
    onChange: (listener) => world.events.on('fresh', listener),
  };
  const quick: QuickApi = {
    held: () => world.hands.held,
    seeds: () => holdablesIn(world),
    hold(held) {
      if (world.hands.hold(held)) changed();
    },
    shown: () => world.zones.outdoor(world.scene) !== undefined,
    onChange(listener) {
      const stops = [
        world.events.on('held', listener),
        world.events.on('bag', listener),
        world.events.on('scene', listener),
        world.events.on('broom', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    toolIcon: drawToolIcon,
    itemIcon: drawItemIcon,
    hasBroom: () => world.broom.has,
    flyHome() {
      if (world.broom.flyHome()) changed();
    },
    broomIcon: (canvas) => drawBroomIcon(canvas, world.broom.look),
  };
  paintRod(readRodColour());
  const rod: RodApi = {
    colour: paintedRod,
    paint(colour) {
      paintRod(colour);
      writeRodColour(colour);
    },
    icon: drawRodIcon,
  };
  return {
    looks,
    bag,
    fresh,
    quick,
    rod,
  };
}
