import type { HomeApi } from '../../hud/HomeSheets';
import type { DisplayApi } from '../../hud/DisplaySheet';
import { isDisplayPiece } from '../../data/display';
import { CUES } from '../../audio/cues';
import { drawFurnitureIcon, drawShowcaseIcon, drawSurfaceIcon } from '../../render/furniture';
import { drawItemIcon } from '../../render/items';
import type { ApiWiring, SheetApis } from './shared';

/** Her home: decorating, the chest, and what her display pieces show. */
export function homeApis({
  world,
  sound,
  changed,
}: ApiWiring): Pick<SheetApis, 'home' | 'display'> {
  const home: HomeApi = {
    indoors: () => world.scene === 'home',
    inYard: () => world.decorating.canDecorateYard,
    outdoors: () => world.decorating.outdoors,
    onChange(listener) {
      const stops = [
        world.events.on('scene', listener),
        world.events.on('decorating', listener),
        world.events.on('home', listener),
        world.events.on('yard', listener),
        world.events.on('inYard', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    // Out in her yard, only what may stand outdoors comes out (0.3's H5).
    stored: () =>
      world.decorating.outdoors
        ? world.home.stored.filter((s) => world.decorating.fits(s.id))
        : world.home.stored,
    selected: () => (world.decorating.state ? world.decorating.state.selected : undefined),
    startDecorating: () => world.decorating.start(),
    stopDecorating: () => world.decorating.stop(),
    takeOut: (id) => world.decorating.takeOut(id),
    turn: () => world.decorating.turnSelected(),
    putAway: () => world.decorating.putAwaySelected(),
    wallpapers: () => world.home.wallpapers,
    floorings: () => world.home.floorings,
    wallpaper: () => world.home.wallpaper,
    flooring: () => world.home.flooring,
    paper(id) {
      if (world.home.paper(id)) changed();
    },
    lay(id) {
      if (world.home.lay(id)) changed();
    },
    isNew: (id) => world.novelty.isNew('storage', id),
    seen: () => world.novelty.seen('storage'),
    icon: drawFurnitureIcon,
    surfaceIcon: drawSurfaceIcon,
    items: () => world.chest.items,
    takeOutItem(id, count) {
      if (!world.chest.takeOut(id, count)) return false;
      changed();
      sound.cue(CUES.goOut);
      return true;
    },
    itemIcon: drawItemIcon,
  };
  const display: DisplayApi = {
    piece() {
      const piece = world.display.piece;
      if (!piece || !isDisplayPiece(piece.id)) return null;
      return { id: piece.id, shows: piece.shows ?? null };
    },
    offers: () => world.display.offers(),
    show(id) {
      if (!world.display.show(id)) return false;
      changed();
      sound.cue(CUES.pick);
      return true;
    },
    empty() {
      if (!world.display.empty()) return false;
      changed();
      sound.cue(CUES.goOut);
      return true;
    },
    picture(canvas) {
      const piece = world.display.piece;
      if (piece && isDisplayPiece(piece.id)) {
        drawShowcaseIcon(canvas, piece.id, world.display.contents(piece));
      }
    },
    itemIcon: drawItemIcon,
  };
  return {
    home,
    display,
  };
}
