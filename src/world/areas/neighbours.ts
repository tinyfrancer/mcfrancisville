import { dayKey } from '../../systems/clock';
import type { Around } from '../../systems/dialogue';
import type { Belongings } from '../services/Belongings';
import { Baking } from '../services/Baking';
import { Interiors } from '../services/Interiors';
import { Joining } from '../services/Joining';
import { PostRound } from '../services/PostRound';
import type { TuneId } from '../../data/instruments';
import type { Mailbox } from '../services/Mailbox';
import { Neighbourhood } from '../services/Neighbourhood';
import { Noticeboard } from '../services/Noticeboard';
import { SmallEvents } from '../services/SmallEvents';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** Her neighbours: their walks and talks, what they ask of her, baking, and their homes inside. */
export interface Neighbours {
  smallEvents: SmallEvents;
  neighbourhood: Neighbourhood;
  noticeboard: Noticeboard;
  baking: Baking;
  interiors: Interiors;
  /** Joining in at their happenings, and what they remember of it (V1's P4). */
  joining: Joining;
  /** Ollie walking her post to her mailbox (V1's P4). */
  postRound: PostRound;
}

interface NeighbourParts {
  mailbox: Mailbox;
  belongings: Belongings;
  zones: Zones;
  /** What's going on round her, for what a neighbour brings up (0.2's D2, V1's P1). */
  talk: () => Around;
  /** The tunes she has learnt from Boothoven, for his recital's requests (V1's P4). */
  learnt: () => readonly TuneId[];
}

export function neighbours(s: Shared, parts: NeighbourParts): Neighbours {
  const { ctx, town, bag, wallet, takings } = s;
  const { mailbox } = parts;
  // Made after the neighbourhood, which asks it what a host remembers (V1's P4).
  let joining: Joining | null = null;
  let postRound: PostRound | null = null;
  const smallEvents = new SmallEvents(
    ctx,
    { wallet, takings, thank: town.thank },
    s.options.errand,
  );
  const neighbourhood = new Neighbourhood(
    ctx,
    {
      friends: s.friends,
      bag,
      wallet,
      mailbox,
      wardrobe: s.wardrobe,
      takings,
      smallEvents,
      scene: parts.talk,
      recall: (happening, id) => joining?.recall(happening, id) ?? null,
      errand: (id) => postRound?.errandOf(id) ?? null,
    },
    parts.zones,
    s.peopled,
    town.scene,
  );
  // What she does that they remember (V1's P1), kept with the day she did it.
  const today = () => dayKey(ctx.clock.now());
  ctx.signals.on('harvested', ({ crop }) => s.lately.harvested(crop, today()));
  ctx.signals.on('donated', ({ thing }) => s.lately.donated(thing, today()));
  ctx.signals.on('placed', ({ piece }) => s.lately.placed(piece, today()));
  const noticeboard = new Noticeboard(ctx, { bag, wallet, takings, thank: town.thank });
  const baking = new Baking(
    ctx,
    { bag, wallet, takings },
    { ...town, bakerAt: () => town.zoneOf('wrapunzel') },
  );
  const interiors = new Interiors(ctx, {
    keepsakes: s.keepsakes,
    belongings: parts.belongings,
    hearts: town.hearts,
    name: town.name,
  });
  joining = new Joining(ctx, bag, { ...town, learnt: parts.learnt }, s.options.happenings);
  postRound = new PostRound(ctx, {
    here: town.scene,
    talkingTo: () => neighbourhood.talkingTo,
    postman: () => neighbourhood.neighbours.find((n) => n.id === 'ollie') ?? null,
  });
  return { smallEvents, neighbourhood, noticeboard, baking, interiors, joining, postRound };
}
