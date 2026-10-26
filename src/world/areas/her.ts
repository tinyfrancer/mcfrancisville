import { CRITTER_IDS } from '../../data/critters';
import { FIXTURES, INTERIORS, isInterior } from '../../data/interiors';
import type { Collecting } from '../services/Collecting';
import type { Decorator } from '../services/Decorator';
import type { Fishing } from '../services/Fishing';
import { Hands } from '../services/Hands';
import { Kite } from '../services/Kite';
import type { Mailbox } from '../services/Mailbox';
import { Milestones } from '../services/Milestones';
import type { Talk } from '../services/Talk';
import { Novelty } from '../services/Novelty';
import type { PetCare } from '../services/PetCare';
import { Poses } from '../services/Poses';
import type { RecordPlayer } from '../services/RecordPlayer';
import { Sitting } from '../services/Sitting';
import type { Workbench } from '../services/Workbench';
import type { Shared } from './shared';

/** What she holds, what's new to her, her shelves to finish, and how she stands and sits. */
export interface Her {
  hands: Hands;
  novelty: Novelty;
  milestones: Milestones;
  sitting: Sitting;
  poses: Poses;
  /** Her kite up on the wind (1.6's X6). */
  kite: Kite;
}

/** The workbench and mailbox, and what keeps her from idling: talking, patting, and the rest. */
interface HerParts {
  workbench: Workbench;
  mailbox: Mailbox;
  talk: Talk;
  petCare: PetCare;
  decorating: Decorator;
  recordPlayer: RecordPlayer;
  fishing: Fishing;
  /** Her net's swing, which moves her arm (V1's E2). */
  collecting: Collecting;
}

export function her(s: Shared, parts: HerParts): Her {
  const { ctx, options, bag, wardrobe, home, cabinet } = s;
  const hands = new Hands(
    ctx,
    bag,
    options.held,
    () => {
      const here = s.town.scene();
      return here !== 'home' && !isInterior(here);
    },
    () => {
      const here = s.town.scene();
      return isInterior(here) && INTERIORS[here].fixtures.some((f) => FIXTURES[f.id].fishing);
    },
  );
  const novelty = new Novelty(
    ctx,
    {
      // What comes back out of her chest (0.3's H1) was hers before, so it isn't new.
      bag: () => [...bag.contents, ...home.items].map((st) => st.id),
      closet: () => wardrobe.owned,
      storage: () => [
        ...home.rooms.everyPiece.map((p) => p.id),
        ...home.stored.map((st) => st.id),
        ...s.yard.placed.map((p) => p.id),
      ],
      cabinet: () => CRITTER_IDS.filter((id) => cabinet.caughtOn(id) !== null),
      recipes: () => parts.workbench.known,
    },
    options.fresh,
  );
  novelty.mark('closet', wardrobe.added);
  const milestones = new Milestones(
    ctx,
    { bag, cabinet, mailbox: parts.mailbox },
    options.collected,
  );
  const sitting = new Sitting(s.town.scene);
  const kite = new Kite(ctx, {
    bag,
    hands,
    scene: s.town.scene,
    tile: () => s.movement().tile,
  });
  const poses = new Poses(ctx, {
    moving: () => s.movement().player.moving,
    seated: () => sitting.seat !== null,
    // Holding her kite's string up while it flies (1.6's X6).
    holding: () => (kite.flying ? 'holdUp' : null),
    busy: () =>
      parts.talk.talkingTo !== null ||
      parts.petCare.pettingNow !== null ||
      parts.decorating.state !== null ||
      parts.recordPlayer.dance() !== null ||
      parts.fishing.line !== null,
    swinging: () => parts.collecting.netSwing(),
  });
  return { hands, novelty, milestones, sitting, poses, kite };
}
