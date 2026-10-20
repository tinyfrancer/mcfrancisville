import { TILE_SIZE } from '../../config/world';
import { bake } from '../../sprites/bake';
import { HONESTY_STALL, HONESTY_STALL_PALETTE, noticeboardLook } from '../../sprites/clutter';
import { GOOSE_ART } from '../../sprites/geese';
import { POT_ART } from '../../sprites/houses';
import {
  CANDY_SAPLING,
  CANDY_TREE,
  CANDY_TREE_PALETTE,
  SAPLING_PALETTE,
} from '../../sprites/nature';
import { PUMPKIN_PATCH_ART, PUMPKIN_PATCH_PALETTE } from '../../sprites/pumpkinPatch';
import { GATE_OPEN, GATE_PALETTE, GATE_SHUT } from '../../sprites/wilds';
import type { PlacedProp } from '../../systems/grid';
import { gateOf } from '../../systems/zones';
import type { World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import type { Drawable } from '../scene';
import { crownOf } from './crowns';
import type { Pass } from './pass';
import type { BakedProps } from './props';

/*
 * The props that wear the day: her mailbox, the noticeboards, her pots, the porch geese, the candy
 * tree, the honesty stall and the pumpkin patch, and the gates across ways out.
 */

/** How often the noticeboards read what's pinned up, in the world's milliseconds. */
const BOARD_READ_MS = 1000;

/** How long the candy tree shakes for, once she shakes it. */
const SHAKE_MS = 600;

/** Her mailbox, its flag up while a letter waits in it. */
export function mailboxPass(world: World, mailbox: BakedProps['mailbox']): Pass {
  return {
    name: 'mailbox',
    stand() {
      if (!mailbox) return [];
      const { drawable, full } = mailbox;
      // Up once Ollie has put it in, if he's walking it over (V1's P4).
      const up = world.letters.unread > 0 && !world.postRound.carrying;
      return [up ? { ...drawable, sprite: full } : drawable];
    },
  };
}

/**
 * The noticeboard wearing what's pinned on it now (1.0.1): a note for each of the window's notes
 * she hasn't answered, and a poster while the day has an event on. Read off the world a second
 * at a time of its clock, as the board's notes change only by the window or as she answers one.
 */
export function boardsPass(world: World, boards: readonly Drawable[]): Pass {
  let pinned: { at: number; open: number; poster: boolean } | null = null;
  return {
    name: 'boards',
    stand({ season }) {
      if (boards.length === 0) return [];
      const now = world.clock.now();
      if (!pinned || Math.abs(now - pinned.at) >= BOARD_READ_MS) {
        const board = world.noticeboard;
        const open = board.notices().filter((n) => !n.done).length;
        pinned = { at: now, open, poster: board.posters().length > 0 };
      }
      const winter = season === 'winter';
      const { key, source, palette } = noticeboardLook(pinned.open, pinned.poster, winter);
      const sprite = bake(key, source, palette);
      return boards.map((d) => ({ ...d, sprite }));
    },
  };
}

/** Her pots, with what's growing in them now. */
export function potsPass(world: World, pots: readonly Drawable[]): Pass {
  return {
    name: 'pots',
    stand() {
      const plant = world.porch.plant;
      const art = POT_ART[plant];
      const sprite = bake(`pot:${plant}`, art.source, art.palette);
      return pots.map((d) => ({ ...d, sprite }));
    },
  };
}

/** The porch geese in what they're wearing today. */
export function geesePass(world: World, geese: readonly Drawable[]): Pass {
  return {
    name: 'geese',
    stand: () =>
      geese.map((d, i) => {
        const outfit = world.holidays.goose(i === 0 ? 0 : 1);
        const art = GOOSE_ART[outfit];
        return { ...d, sprite: bake(`goose:${outfit}`, art.source, art.palette) };
      }),
  };
}

/**
 * The candy tree, bare, with a few sweets or laden, and giving a little shake as she shakes it;
 * the rings of earth in her yard; the honesty stall, its crates full while anything is on it; and
 * the pumpkin patch, as it's coming on today.
 */
export function candyPass(world: World, b: BakedProps): Pass {
  /** How far a candy tree leans as it's shaken, a pixel either way for a moment. */
  const wiggle = (shaken: number | null): number => {
    const since = shaken === null ? Infinity : world.clock.now() - shaken;
    return since < SHAKE_MS ? (Math.floor(since / 70) % 2 === 0 ? 1 : -1) : 0;
  };
  /** A ring of earth in her yard as it is now: waiting, a sapling, or a candy tree (0.2's E1). */
  const plotDrawable = (prop: PlacedProp, d: Drawable): Drawable => {
    const stage = world.candyTree.stage(prop);
    const sprite =
      stage === 'plot'
        ? d.sprite
        : stage === 'sapling'
          ? bake('candySapling', CANDY_SAPLING, SAPLING_PALETTE)
          : bake(`candyTree:${stage}`, CANDY_TREE[stage], CANDY_TREE_PALETTE);
    const shake = wiggle(world.candyTree.shakenAtSpot(prop));
    const x = prop.tx * TILE_SIZE + (TILE_SIZE - sprite.width) / 2 + shake;
    const grown = stage !== 'plot' && stage !== 'sapling';
    return {
      footY: d.footY,
      sprite,
      x,
      y: d.footY - sprite.height,
      ...(grown ? crownOf(prop) : {}),
    };
  };
  return {
    name: 'candy',
    stand() {
      const look = world.candyTree.look();
      const tree = bake(`candyTree:${look}`, CANDY_TREE[look], CANDY_TREE_PALETTE);
      const shake = wiggle(world.candyTree.shakenAt);
      const stocked = world.stall.stocked ? 'stocked' : 'empty';
      const stall = bake(`honestyStall:${stocked}`, HONESTY_STALL[stocked], HONESTY_STALL_PALETTE);
      const stage = world.pumpkinPatch.stage();
      const patch = bake(`pumpkinPatch:${stage}`, PUMPKIN_PATCH_ART[stage], PUMPKIN_PATCH_PALETTE);
      return [
        ...b.candyTrees.map((d) => ({ ...d, sprite: tree, x: d.x + shake })),
        ...b.saplingPlots.map(({ prop, drawable }) => plotDrawable(prop, drawable)),
        ...b.stalls.map((d) => ({ ...d, sprite: stall })),
        ...b.patches.map((d) => ({ ...d, sprite: patch })),
      ];
    },
  };
}

/**
 * The gates across ways out: shut, standing in the way, while the place beyond is, and swung back
 * against their posts once it opens.
 */
export function gatesPass(world: World, zone: MapZone): Pass {
  return {
    name: 'gates',
    stand() {
      const shut = bake('gate:shut', GATE_SHUT, GATE_PALETTE);
      const open = bake('gate:open', GATE_OPEN, GATE_PALETTE);
      return zone.map.exits
        .filter((e) => e.gate)
        .map((e) => {
          const at = gateOf(e, zone);
          const sprite = world.travel.isOpen(e.to) ? open : shut;
          const footY = (at.ty + at.h) * TILE_SIZE;
          const x = at.tx * TILE_SIZE + (at.w * TILE_SIZE - sprite.width) / 2;
          return { footY, sprite, x, y: footY - sprite.height };
        });
    },
  };
}
