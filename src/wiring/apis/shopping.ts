import type { ShopApi } from '../../hud/ShopSheet';
import type { CatalogueApi } from '../../hud/CatalogueSheet';
import { OUTFITS } from '../../data/outfits';
import { drawWornDetail } from '../../render/doll';
import { drawFurnitureIcon, drawSurfaceIcon } from '../../render/furniture';
import { drawItemIcon } from '../../render/items';
import { drawAccessoryIcon } from '../../render/pets';
import { drawRecipeIcon } from '../../render/recipes';
import { wear } from '../../systems/wardrobe';
import type { ApiWiring, SheetApis } from './shared';

/** The shops' counters, and Ollie's catalogue. */
export function shoppingApis({ world, play }: ApiWiring): Pick<SheetApis, 'shop' | 'catalogue'> {
  const shop: ShopApi = {
    candy: () => world.wallet.candy,
    onCandy: (listener) => world.events.on('candy', listener),
    stock: (id) => world.shops.stock(id),
    bag: () => world.bag.spares,
    owns: (ware) => world.belongings.owns(ware),
    sellValue: (item) => world.shops.pays(item),
    wanted: () => world.shops.wanted(),
    buy(id, ware) {
      const bought = world.shops.buy(id, ware);
      if (bought) play([bought]);
      return bought !== null;
    },
    sell(item, count) {
      const sold = world.shops.sell(item, count);
      if (sold) play([sold]);
      return sold !== null;
    },
    book: () => world.workshop.book(),
    orderMade(piece) {
      const ordered = world.workshop.order(piece);
      if (ordered) play([ordered]);
      return ordered !== null;
    },
    onTheWay: () => world.deliveries.onTheWay(),
    carvings: () => world.figurines.carvings(),
    carve(thing) {
      const carved = world.figurines.carve(thing);
      if (!carved) return null;
      play([carved]);
      return { first: carved.kind === 'carved' && carved.first };
    },
    icon: drawItemIcon,
    pieceIcon: drawFurnitureIcon,
    recipeIcon: drawRecipeIcon,
    surfaceIcon: drawSurfaceIcon,
    accessoryIcon: drawAccessoryIcon,
    tryOn(canvas, outfit) {
      const owned = [...world.wardrobe.owned, outfit];
      drawWornDetail(canvas, wear(world.wardrobe.look, outfit, owned), OUTFITS[outfit].slot);
    },
  };
  const catalogue: CatalogueApi = {
    candy: () => world.wallet.candy,
    entries: () => world.catalogue.entries(),
    onTheWay: () => world.deliveries.onTheWay(),
    count: (id) => world.bag.count(id),
    owns: (ware) => world.belongings.owns(ware),
    order(ware) {
      const ordered = world.catalogue.order(ware);
      if (ordered) play([ordered]);
      return ordered !== null;
    },
    icon: drawItemIcon,
    pieceIcon: drawFurnitureIcon,
    recipeIcon: drawRecipeIcon,
    surfaceIcon: drawSurfaceIcon,
    accessoryIcon: drawAccessoryIcon,
    tryOn: shop.tryOn,
  };
  return {
    shop,
    catalogue,
  };
}
