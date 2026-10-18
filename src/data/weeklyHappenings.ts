import type { WeeklyId } from '../types/ids';
import type { HappeningRow } from './happenings';

/*
 * A happening a week for those who had none (V1's P4, `docs/v1_analysis.md` finding 2's
 * "Happenings are watched"), each at the job their lines already talk of, and Nessa lighting the
 * lanterns every dusk for anyone who'd like to watch. What she does at each is
 * `data/happeningVerbs.ts`.
 */
export const WEEKLY_HAPPENINGS: Record<WeeklyId, HappeningRow> = {
  // Every evening at dusk: she walks the pier lighting the lanterns, and anyone may watch.
  lanternLighting: {
    name: 'Lighting the lanterns',
    icon: '🏮',
    place: 'on the pier at Lantern Shore',
    on: { weekdays: [0, 1, 2, 3, 4, 5, 6] },
    from: 18,
    until: 19,
    where: { zone: 'lanternShore', at: 'pierMiddle' },
    who: ['nessa'],
    doing: 'lantern',
    says: {
      nessa:
        'Oh! {name}, you came to watch. One lantern at a time, all along the pier. They like to be lit in order. Bob first. Always Bob.',
    },
  },
  // Mondays: every lantern lit at once and floated out, a wish in each.
  lanternNight: {
    name: 'Lantern night',
    icon: '🪔',
    place: 'at the end of the pier',
    on: { weekdays: [1] },
    from: 20,
    until: 23,
    where: { zone: 'lanternShore', at: 'pierEnd' },
    who: ['nessa', 'ollie'],
    doing: 'lantern',
    says: {
      nessa:
        'Lantern night, {name}. We write a wish on a lantern and let the lake carry it. The lake is very good at keeping secrets.',
      ollie:
        "I deliver letters all week, {name}. Once a week I get to send one somewhere I've never been. Out there!",
    },
  },
  // Tuesdays: Boothoven plays for whoever comes, and takes requests.
  recital: {
    name: "Boothoven's recital",
    icon: '🎼',
    place: "in Boothoven's parlour",
    on: { weekdays: [2] },
    from: 19,
    until: 21,
    where: { inside: 'boothovenParlour' },
    who: ['boothoven', 'maude', 'wrapunzel'],
    doing: 'conducting',
    says: {
      boothoven:
        "{name}! Welcome to the recital. Tonight's programme is whatever you ask for. I take requests. I take them very seriously.",
      maude: 'Front row, {name}. Ghosts get the front row. It is the only perk.',
      wrapunzel:
        "I've brought shortbread for the interval, dear. There's always an interval. Boothoven needs a sit.",
    },
    welcome:
      "The parlour's full of candles and borrowed chairs. Boothoven is warming up his fingers.",
  },
  // Thursdays: the week's parcels sorted at Ollie's, every pile very important.
  parcelDay: {
    name: 'Parcel day',
    icon: '📦',
    place: "at Ollie's cottage",
    on: { weekdays: [4] },
    from: 10,
    until: 13,
    where: { inside: 'ollieCottage' },
    who: ['ollie', 'barty'],
    doing: 'post',
    says: {
      ollie:
        "Parcel day, {name}! The whole week's post on one table. Fancy helping? Three piles: NOW, SOON and GHOSTS.",
      barty: "{name}! I'm here for my seed catalogue. And moral support. Mostly the catalogue.",
    },
    welcome: 'Parcels to the ceiling, string everywhere, and Ollie humming as he sorts.',
  },
  // Thursday nights, when the sky is clear: Hazel's telescope out at the lookout for anyone.
  stargazing: {
    name: 'Stargazing at the lookout',
    icon: '🔭',
    place: 'up at the lookout',
    on: { weekdays: [4] },
    clear: true,
    from: 21,
    until: 24,
    // At her own telescope spot, clear of the moon howl's on a full-moon Thursday.
    where: { at: 'lookoutEast' },
    who: ['hazel', 'nessa'],
    doing: 'telescope',
    says: {
      hazel:
        "A clear night, {name}! Have a look. There's one up there nobody's named yet. Somebody ought to.",
      nessa:
        "I like it up here, {name}. Nobody looks at you when everybody's looking at the stars.",
    },
  },
  // Saturday afternoons: Gourdon's workshop door open, sawdust and all.
  openDay: {
    name: 'Workshop open day',
    icon: '🔨',
    place: "at Gourdon's workshop",
    on: { weekdays: [6] },
    from: 13,
    until: 16,
    where: { inside: 'gourdonPumpkin' },
    who: ['gourdon', 'hazel'],
    doing: 'sawing',
    says: {
      gourdon:
        "Open day. Come in. Mind the sawdust. You pick what I build next week, {name}. I build it. That's the deal.",
      hazel:
        "{name}, he's making me a telescope stand. It's the third. The first two were too good to stand on.",
    },
    welcome: "Gourdon's workshop, door wide open, smelling of pine and pumpkin.",
  },
};
