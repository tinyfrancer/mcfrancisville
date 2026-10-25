import { ACTIVITIES } from '../data/activities';
import { CRITTERS, HABITAT_NAMES } from '../data/critters';
import type { Glyph } from '../data/glyphs';
import { HAPPENINGS } from '../data/happenings';
import { ITEMS } from '../data/items';
import { PASSERS, RARE_EVENTS } from '../data/rareEvents';
import { PROJECTS } from '../data/projects';
import { VILLAGERS } from '../data/villagers';
import { ZONES } from '../data/zones';
import { clockHour } from '../systems/critters';
import { venueOf } from '../systems/happenings';
import type { TodayLine } from '../systems/today';
import type { VillagerId, ZoneId } from '../types/ids';
import { asked, candy, wantedLine } from './messages';
import { placeOf } from './NeighboursSheet';

/** A line of Today in words (V1's R2): what it says, a little more under it, and its picture. */
export interface TodayWords {
  text: string;
  small: string;
  glyph: Glyph;
}

const IN: Partial<Record<ZoneId, string>> = {
  town: 'in town',
  home: 'at your house',
  whisperwood: 'in Whisperwood',
  hiddenClearing: 'in the hidden clearing',
};

/** "in town", "at Boo Acres", "at the greenhouse". */
export function whereWords(zone: ZoneId): string {
  return IN[zone] ?? `at ${ZONES[zone].name.replace(/^The /, 'the ')}`;
}

/** "Maude", "Maude and Agatha", "Cody, Rufus and Wrapunzel". */
function list(words: readonly string[]): string {
  return words.length < 2
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

const nameOf = (id: VillagerId) => VILLAGERS[id].name;
const capital = (words: string) => `${words.slice(0, 1).toUpperCase()}${words.slice(1)}`;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** What a line of Today says. */
export function todayWords(line: TodayLine): TodayWords {
  switch (line.kind) {
    case 'firstDay':
      return {
        text: `Cody's list for your first day: ${line.done} of ${line.of} done`,
        small: 'His card waits in the tray behind More.',
        glyph: 'scroll',
      };
    case 'tree':
      return {
        text: `The candy tree is holding ${candy(line.candy)}`,
        small: 'Give it a shake, by your house.',
        glyph: 'tree',
      };
    case 'stall':
      return {
        text: `The honesty stall's tin has ${candy(line.candy)} in it`,
        small: `${line.sold} ${plural(line.sold, 'thing', 'things')} sold since you came by.`,
        glyph: 'candy',
      };
    case 'ripe':
      return {
        text: `${line.beds} ${plural(line.beds, 'bed is', 'beds are')} ripe ${whereWords(line.zone)}`,
        small: 'Ready to pick!',
        glyph: { item: line.crop },
      };
    case 'notes':
      return {
        text: `${line.open} ${plural(line.open, 'note is', 'notes are')} up on the noticeboard`,
        small: `From ${list([...new Set(line.from)].map(nameOf))}.`,
        glyph: 'pin',
      };
    case 'favour': {
      const where = line.zone ? placeOf(line.zone, line.who, true) : 'somewhere about';
      return {
        text: `${nameOf(line.who)} is asking for ${asked(line.item, line.count)}`,
        small: `${nameOf(line.who)} is ${where}.`,
        glyph: { item: line.item },
      };
    }
    case 'mounds':
      return {
        text: `${plural(line.zones.length, 'A mound', `${line.zones.length} mounds`)} to dig today`,
        small: `${capital(list(line.zones.map(whereWords)))}.`,
        glyph: 'here',
      };
    case 'callers': {
      const name = nameOf(line.who);
      return line.now
        ? {
            text: `${name} is round at yours now`,
            small: `Until ${clockHour(line.until)}.`,
            glyph: 'house',
          }
        : {
            text: `${name} is coming round to yours at ${clockHour(line.from)}`,
            small: `Until ${clockHour(line.until)}.`,
            glyph: 'house',
          };
    }
    case 'happening': {
      const row = HAPPENINGS[line.id];
      const when = line.now ? 'is on now' : `at ${clockHour(row.from)}`;
      return {
        text: `${row.name} ${when}`,
        small: `${capital(venueOf(line.id).place)}, with ${list(row.who.map(nameOf))}.`,
        glyph: row.icon,
      };
    }
    case 'critters': {
      const n = line.visiting.length;
      const fresh = line.fresh.slice(0, 3).map((id) => ITEMS[id].name.toLowerCase());
      const more = line.fresh.length - fresh.length;
      return {
        text: `${n} ${plural(n, 'critter is', 'critters are')} visiting out of season`,
        small:
          fresh.length > 0
            ? `New to you: ${list(more > 0 ? [...fresh, `${more} more`] : fresh)}.`
            : 'The day after a full or new moon, they come to call.',
        glyph: { item: line.fresh[0] ?? line.visiting[0]! },
      };
    }
    case 'visitsSoon':
      return {
        text: `Critters come visiting out of season ${line.days === 1 ? 'tomorrow' : `in ${line.days} days`}`,
        small: 'The day after a full or new moon.',
        glyph: 'evening',
      };
    case 'wanted':
      return {
        text: wantedLine(line.items),
        small: 'Cobweb Corner pays double for them.',
        glyph: { item: line.items[0]! },
      };
    // 1.4's G1: a shiny about where she is, never said which.
    case 'shiny':
      return {
        text: `Something glittered ${HABITAT_NAMES[CRITTERS[line.critter].habitat]}`,
        small: "It's a shiny one! Creep up and see what it is, before the hour's out.",
        glyph: 'sparkle',
      };
    // V1's R3: what's out of the ordinary today.
    case 'rare': {
      const row = RARE_EVENTS[line.id];
      return {
        text:
          line.id === 'wanderingStall' ? 'The wandering stall is in town till Sunday' : row.name,
        small: row.small,
        glyph: row.glyph,
      };
    }
    case 'peddler':
      return line.shop === 'moonPie'
        ? {
            text: "The Moon Pie Man's cart is in town today",
            small: 'Chocolate. Banana. Watermelon. Moon pie.',
            glyph: { item: 'moonPie' },
          }
        : {
            text: 'Spirit Halloweenie has popped up in town today',
            small: 'Costumes and spooky decor, for a season that never ends.',
            glyph: 'skull',
          };
    case 'passer': {
      const row = PASSERS[line.who];
      const where = whereWords(line.zone);
      return {
        text:
          line.who === 'moira'
            ? `Moira is staying ${where} this week`
            : `A wayfarer is passing through ${where}`,
        small: line.now
          ? `Go and say hello, by ${clockHour(row.until)}.`
          : `About from ${clockHour(row.from)} to ${clockHour(row.until)}.`,
        glyph: line.who === 'moira' ? 'shell' : 'footprints',
      };
    }
    // V1's R4: the town project she's funding.
    case 'project':
      return {
        text: `${PROJECTS[line.id].name} is ${line.percent}% of the way there`,
        small: 'Give a little more at the noticeboard, whenever you like.',
        glyph: 'hammer',
      };
    // 1.0.1: the fair's free go.
    case 'freeGo':
      return {
        text: `Your first go at the ${ACTIVITIES[line.id].name.toLowerCase()} is free today`,
        small: line.open
          ? 'Over at the Hollow Fairground, whenever you like.'
          : 'At the Hollow Fairground, once its stall opens.',
        glyph: 'wheel',
      };
    case 'stray':
      return line.carrying
        ? {
            text: `Take ${line.name} home to ${nameOf(line.owner)}`,
            small: `${capital(line.name)} is riding along with you.`,
            glyph: { item: line.critter },
          }
        : {
            text: `${nameOf(line.owner)}'s ${ITEMS[line.critter].name.toLowerCase()}, ${line.name}, has wandered off`,
            small: `Someone saw it ${whereWords(line.zone)}.`,
            glyph: 'lookingGlass',
          };
  }
}
