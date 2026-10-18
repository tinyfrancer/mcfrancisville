import type { VillagerId } from '../types/ids';
import type { SeasonFestivalId } from './greetings';

/**
 * What a neighbour says first in a festival week a season (V1's R3), on its first day and on the
 * Saturday of its beat, as a holiday's line is said (`dayLine`). Not everyone has one: those who
 * don't say what they always do. `{name}` is her name.
 */
export const FESTIVAL_LINES: Record<SeasonFestivalId, Partial<Record<VillagerId, string>>> = {
  blossomWeek: {
    cody: "Blossom week, honey bunny. I've a petal stuck to my fang. I'm leaving it. It's spring.",
    rufus: "{name}! The trees went PINK! All of them! Overnight! I didn't do it! I wish I did it!",
    barty: 'Blossom week, {name}! Every year the petals fill my ribs. I rattle like a bouquet.',
    wrapunzel:
      "Blossom week, dear! I've iced every bun pink. Even the savoury ones. Especially those.",
    maude:
      'The blossom drifts right through me, {name}. It is the nicest thing a tree can do to a ghost.',
    scarah:
      "Blossom week! Cornelius thinks the petals are snow. He's been trying to catch one all morning.",
  },
  fireworksWeek: {
    cody: "Fireworks week, booby. I've made the bats little earmuffs. They hate them. They're wearing them.",
    ollie: "Fireworks week, {name}! I'm delivering sparklers. Very carefully. With oven gloves on.",
    gourdon: 'Fireworks week. Built the sparkler box. Lid fits. Good.',
    nessa:
      'The lake loves fireworks week, {name}. Everything happens twice on it. Once up, once down.',
    hazel:
      '{name}, fireworks spoil my stars all week. I mind a bit. Then they go bang and I mind less.',
    rufus:
      "SPARKLERS! {name}! I'm allowed one! Gourdon says only one! I've already planned which hand!",
  },
  lightsWeek: {
    cody: "Lights week, mi amor. I strung up so many our house hums. I like to think it's humming for you.",
    nessa:
      "Every window's lit this week, {name}. Even mine. I'm not hiding. I'm glowing. It's different.",
    hazel:
      "Lights week, {name}. The town looks like the sky came down for a visit. I've drawn a chart.",
    boothoven:
      "Winter lights week! {name}, every lit window has a note in it. I'm writing them down.",
    maude:
      'Lights week, {name}. A candle in every window of the library. The books read better by them.',
    agatha:
      "{name}, I charmed every candle in town to last the week. Mostly. The bakery's sparkles a bit.",
  },
};
