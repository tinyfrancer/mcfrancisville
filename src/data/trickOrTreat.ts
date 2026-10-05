import type { ItemId, VillagerId } from '../types/ids';
import type { FestivalId } from './calendar';

/**
 * Trick or treat (0.2's J2, decision 144): every evening of the Halloween Festival, a knock at
 * each neighbour's door gets her a sweet, once a day a door. Her favourite is the gummy cluster
 * (personal_touches.md, question 43), so it's the one she hopes for: the rarest in the bowl.
 */

/** The festival whose evenings are for trick or treat. */
export const TRICK_OR_TREAT_FESTIVAL: FestivalId = 'halloweenFestival';

/** What's in the bowls, and how often each comes out of one. */
export const SWEETS: readonly { item: ItemId; weight: number }[] = [
  { item: 'chewyDots', weight: 4 },
  { item: 'sourGhouls', weight: 4 },
  { item: 'candyCorn', weight: 3 },
  { item: 'gummyCluster', weight: 1 },
];

/** The one she hopes for, made a little fuss of when it comes. */
export const BEST_SWEET: ItemId = 'gummyCluster';

/**
 * What each neighbour says, answering the door. Out, they leave a bowl on the step and a note
 * (`BOWL_NOTE`). `{sweet}` is what she's handed, as "a gummy cluster".
 */
export const AT_THE_DOOR: Record<VillagerId, string> = {
  cody: 'Cody opens the door in his cape. "Trick or treat? Treat, obviously, mi amor." He hands you {sweet}, and a kiss.',
  maude:
    'Maude floats to the door. "Oh, a trick-or-treater! Well, well." She hands you {sweet}, and tells you to read something scary tonight.',
  rufus:
    'Rufus flings the door open. "TRICK OR TREAT! No wait, that\'s yours to say! Here!" He hands you {sweet}. And another look at the bowl.',
  wrapunzel:
    'Wrapunzel opens the door with flour on her bandages. "There you are, my darling!" She hands you {sweet} from a bowl as big as a cauldron.',
  agatha:
    'Agatha opens the door a crack. "Treat. I\'m out of tricks till Thursday." She hands you {sweet}.',
  barty:
    'Barty rattles to the door. "Evening, {name}! Grew these myself. Well. Not these." He hands you {sweet}.',
  ollie:
    'Ollie opens the door, satchel still on. "Special delivery!" He hands you {sweet}, and asks you to sign for it.',
  nessa:
    'Nessa opens the door with a lantern in her hand. "I hoped it\'d be you." She hands you {sweet}, a little damp from the lake.',
  gourdon:
    'Gourdon opens the door, his face lit from inside. "Trick or treat. Good. Take one." He hands you {sweet}.',
  hazel:
    'Hazel opens the door with her telescope under her arm. "Trick or treat under a clear sky!" She hands you {sweet}.',
  boothoven:
    'Boothoven opens the door with a dramatic chord on the piano behind him. "Trick or treat, fortissimo!" He hands you {sweet}.',
  scarah:
    'Scarah opens the farmhouse door, Cornelius on her shoulder. "Trick or treat! Oh, I love this bit!" She hands you {sweet}, and a little straw.',
};

/** Left on the step when nobody's home. `{who}` is whose door it is. */
export const BOWL_NOTE =
  'Nobody\'s home, but there\'s a bowl on the step and a note: "Take one! Happy Halloween! —{who}". You take {sweet}.';
