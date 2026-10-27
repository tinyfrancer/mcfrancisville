import type { ItemId, WellThingId } from '../types/ids';
import type { DecorId } from './holidays';
import type { ItemRow } from './items';
import type { SeasonId } from './milestones';
import type { Weather } from './weather';

/*
 * The wishing well on the square (1.7's Y2, decision 389): once a day she may toss in a Candy,
 * and a wish comes back as a line, dealt from the day key (`wishOn` in `systems/well.ts`), never
 * the same two days running. Now and then something comes back up with it. Nothing is lost but
 * the Candy, and nothing about it is saved: the day's toss is kept in her takings.
 */

/** When a wish is said: in a season, while a holiday's decorations are up, or in a weather. */
export type WishWhen = { season: SeasonId } | { decor: DecorId } | { weather: Weather };

export interface Wish {
  /** What comes back up, `{name}` filled with hers. */
  line: string;
  /** Said only then; any day without. */
  when?: WishWhen;
}

/**
 * Every wish, in the well's own gentle nonsense. A day takes from the lines at its own parity
 * (even or odd by its place in the list), so two days running never share one; the lines for a
 * season, a holiday or a weather come in pairs, one of each parity, so every such day has one.
 */
export const WISHES: readonly Wish[] = [
  { line: 'Plink! Far below, a frog says "Noted," and goes back to sleep.' },
  { line: 'The well hums your wish back to you, a little off-key, to show it was listening.' },
  { line: 'An echo comes up: "…ish …ish …ish." It is working on it.' },
  { line: "A ghost at the bottom gives you a thumbs up. You can't see it, but you can tell." },
  { line: 'The water ripples into a heart, then a pumpkin, then a heart again.' },
  { line: 'Your wish has been filed under "Lovely" by the well\'s tiny librarian.' },
  { line: 'Somewhere deep down, someone small and damp gives a cheer.' },
  { line: 'The well says yours is a good one. It has heard a lot of wishes. It would know.' },
  { line: 'A bubble floats up and pops with a tiny "yes."' },
  { line: 'The bucket creaks happily, as if it once wished the very same thing.' },
  { line: 'Your Candy lands with a plink. The well will spend it wisely, probably on moss.' },
  { line: 'The echo says your name back, {name}, very fondly, three times.' },
  { line: 'Down in the dark, a glow-worm writes your wish down in its best handwriting.' },
  {
    line: 'The well will keep your wish safe. It has never told anyone anything, not even the frogs.',
  },
  { line: 'A cool breath comes up smelling of rain and toffee. That is a very good sign.' },
  { line: 'The well gurgles something that sounds a lot like "Ooh, nice one."' },
  { line: 'The stars in the water wobble, then settle a little brighter than before.' },
  { line: 'Your wish sinks slowly, turning over and over, taking its time like a leaf.' },
  { line: "The well's tummy rumbles. It's digesting your wish. This is normal for wells." },
  { line: 'A friendly bat pokes its head out, reads your wish over your shoulder, and nods.' },
  {
    line: "Plonk! Your Candy joins a very old button, a marble and a sock that's been wished on before.",
  },
  { line: "The well says wishes take time, like bread, and yours smells like it's rising." },
  { line: 'Your wish echoes all the way down and comes back up wearing a little hat.' },
  { line: 'Something at the bottom winks. Wells can wink. Not many people know.' },
  {
    line: 'The water goes still as glass, and for a moment you look exactly as happy as you will be.',
  },
  { line: 'A tiny voice from below: "One wish, extra sprinkles. Coming right up!"' },
  { line: 'The well sighs contentedly. It loves a wish even more than it loves rain.' },
  { line: 'Your reflection waves at you first. Cheeky, but sweet.' },
  { line: "The rope sways with no wind at all, the way a cat's tail does when it's pleased." },
  { line: "Plink! The well adds your wish to its collection. It's the shiniest one this week." },
  { line: 'The echo comes back a little louder than it went down, which means it is coming true.' },
  { line: 'A newt surfaces, blinks at you approvingly, and sinks again.' },
  { line: "The well promises to keep your wish warm until it's ready, {name}." },
  { line: 'Deep down, a little bell rings once. That is the well\'s way of saying "Received!"' },
  // The seasons'.
  {
    line: 'A crisp leaf spins down after your Candy, as if it wanted to make a wish too.',
    when: { season: 'autumn' },
  },
  {
    line: 'The well smells of woodsmoke and apples, and agrees that autumn is the best time for wishing.',
    when: { season: 'autumn' },
  },
  {
    line: 'Your breath makes a little cloud over the well, and your wish rides it all the way down.',
    when: { season: 'winter' },
  },
  {
    line: 'Frost sparkles round the rim as your wish goes in. The well wraps it in a scarf.',
    when: { season: 'winter' },
  },
  { line: 'A petal drifts down after your wish, to keep it company.', when: { season: 'spring' } },
  {
    line: "Something down there is blooming. The well won't say what. It's a surprise.",
    when: { season: 'spring' },
  },
  {
    line: 'A firefly drifts up out of the well, blinking your wish like a tiny lighthouse.',
    when: { season: 'summer' },
  },
  {
    line: 'The water is cool on a warm day, and so is your wish. Very cool, the well says.',
    when: { season: 'summer' },
  },
  // The holidays'.
  {
    line: 'A spooky moan rises from the well, then a giggle. It is practising for the 31st.',
    when: { decor: 'halloween' },
  },
  {
    line: 'The ghost at the bottom has dressed up as a slightly different ghost, just for you.',
    when: { decor: 'halloween' },
  },
  {
    line: 'Sleigh bells jingle faintly from the bottom of the well. It is not saying who.',
    when: { decor: 'christmas' },
  },
  {
    line: 'The well hums a carol and tucks your wish in beside its stocking.',
    when: { decor: 'christmas' },
  },
  // The weather's.
  {
    line: 'The rain plinks into the well beside your Candy, and they sound lovely together.',
    when: { weather: 'rain' },
  },
  {
    line: 'The well is having a wonderful day. It is full of rain, and now a wish.',
    when: { weather: 'rain' },
  },
  {
    line: 'The fog curls down the well after your wish, to see it gets there safely.',
    when: { weather: 'fog' },
  },
  { line: 'In the fog the echo comes back softer, like a secret.', when: { weather: 'fog' } },
];

/** Said after the wish when the lucky penny comes up with her very first one. */
export const WELL_PENNY_LINE =
  'And with your very first wish, something bobs back up: a lucky penny, warm as anything. Keep it close.';

/** Said after the wish when something else comes back up with it: its name goes after. */
export const WELL_BACK = 'Something bobs back up with it:';

/** What a wish costs: one Candy, tossed in. */
export const WISH_CANDY = 1;

/** One toss in this many brings something back up, dealt from the day. */
export const WELL_ODDS = 7;

/**
 * What comes back up, and how often of those times: mostly a pretty pebble, now and then a bead
 * someone lost off a bracelet. Worth less on average than the Candy tossed for it, so wishing is
 * never a way to make Candy (`tests/data/economy.test.ts`).
 */
export const WELL_FINDS: readonly { item: ItemId; weight: number }[] = [
  { item: 'wellPebble', weight: 4 },
  { item: 'heartBead', weight: 1 },
  { item: 'smileyBead', weight: 1 },
  { item: 'ghostBead', weight: 1 },
];

/** The lucky penny that comes up with her very first wish, hers to keep. */
export const WELL_PENNY: WellThingId = 'wellPenny';

export const WELL_ITEMS = {
  wellPebble: {
    name: 'Wishing pebble',
    kind: 'material',
    description:
      'A smooth little pebble the wishing well sent back up, still cool and a bit shiny. It has heard every wish in town and kept every one of them.',
  },
  wellPenny: {
    name: 'Lucky penny',
    kind: 'keepsake',
    plural: 'lucky pennies',
    description:
      'An old penny the wishing well sent back up with your very first wish. On one side, a bat. On the other, a bat. Lucky either way.',
  },
} as const satisfies Record<WellThingId, ItemRow>;

/** What Cobweb Corner pays: a pebble is small change, and the penny isn't for sale. */
export const WELL_VALUES = { wellPebble: 2, wellPenny: 0 } as const;
