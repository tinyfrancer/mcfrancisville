import type { OutfitId, VillagerId } from '../types/ids';
import type { FestivalId } from './calendar';
import type { HolidayLetter } from './holidays';

/**
 * The Halloween Festival's finale on the 31st (0.2's J4, decision 157): the costume contest she
 * judges (personal_touches.md, question 48), the party round the well with white chicken chili
 * (questions 28 and 76), Cody in the other half of her costume (question 44), their photo
 * (question 75), and his letter the next morning with it framed (question 77).
 */

export const FINALE_FESTIVAL: FestivalId = 'halloweenFestival';

/** What Cody can go as at the party: his own lion, or the other half of hers. */
export type CodyHalf =
  'lion' | 'butterfly' | 'bugCatcher' | 'ringmaster' | 'scaredy' | 'clueFinder';

/**
 * What a neighbour is dressed as: their own costume for the festival, or for Cody at its finale,
 * the other half of hers.
 */
export type Costume = 'own' | CodyHalf;

/**
 * Each of her couples' costume pieces, to the half Cody wears with it: the bug catcher and the
 * butterfly, the lion tamer and the lion, the two meddling kids.
 */
export const OTHER_HALF: Partial<Record<OutfitId, CodyHalf>> = {
  bugCatcherHat: 'butterfly',
  bugCatcherShirt: 'butterfly',
  butterflyAntennae: 'bugCatcher',
  butterflyWings: 'bugCatcher',
  ringmasterHat: 'lion',
  ringmasterCoat: 'lion',
  lionMane: 'ringmaster',
  clueTurtleneck: 'scaredy',
  clueGlasses: 'scaredy',
  scaredyTee: 'clueFinder',
};

/** What each half is, as the photo's caption says it: "a butterfly". */
export const HALF_NAMES: Record<CodyHalf, string> = {
  lion: 'a lion',
  butterfly: 'a butterfly',
  bugCatcher: 'a bug catcher',
  ringmaster: 'a lion tamer',
  scaredy: 'a scaredy-cat',
  clueFinder: 'a clue-finder',
};

/** The contest's prize, which the winner takes home. */
export const PRIZE = 'the Golden Gourd';

/** How much closer crowning someone brings her to them: as much as a gift they love. */
export const CROWN_POINTS = 50;

/** What each says, crowned best costume. `{name}` is her name. */
export const CROWNED: Record<VillagerId, string> = {
  cody: "Me?! Babe, you can't pick your husband. …You can? Then I accept. Graciously. Loudly.",
  maude:
    "Oh! Oh my. A ghost hunter, crowned by a ghost's friend. I shall put it on the shelf with the good books.",
  rufus: "I WON?! I WON! I'M A SHEEP AND I WON! {name}, this is the best night of my WHOLE LIFE!",
  wrapunzel:
    'Me, dear? Oh, my wings are all a-flutter! Wait till I tell the museum. It will be very quiet about it.',
  agatha: "Best costume. Well. I did say cats were the height of fashion. I'll allow a small purr.",
  barty: 'A scarecrow, crowned! The crows will never believe it. Thank you, {name}. Truly.',
  ollie: 'Ladies and gentlemen, ghouls and goblins… ME! Signed, sealed and delivered, {name}!',
  nessa: "Me? Really? I'm… I'm going to go and be very happy by the lake for a minute.",
  gourdon: 'Won. Good. The bug catcher takes the Golden Gourd home. Carefully. It rolls.',
  hazel: 'Jinkies! A mystery solved: who wins best costume? Me! Thank you, {name}!',
  boothoven:
    'Best costume! A standing ovation, for me? Bravo, bravissimo! Thank you, {name}. I shall compose a fanfare.',
};

/** What the others say when someone else wins: good sports, every one. `{winner}` is who won. */
export const GOOD_SPORTS: Record<VillagerId, string> = {
  cody: 'Cody whistles for {winner}. "Deserved. Next year, though, babe. Next year."',
  maude: 'Maude claps with both see-through hands. "Well deserved, {winner}. Truly."',
  rufus: 'Rufus claps loudest of all. "YAY {winner}! I\'m SO happy! I\'m not even a bit sad!"',
  wrapunzel: 'Wrapunzel dabs her eyes with a bandage. "Oh, well done, {winner}, dear."',
  agatha: 'Agatha nods at {winner}. "A fair judge. Rare. I approve."',
  barty: 'Barty rattles a cheer for {winner}. A bone falls off. He puts it back.',
  ollie: 'Ollie salutes {winner}. "I\'ll deliver the news to everyone who missed it!"',
  nessa: 'Nessa gives {winner} a shy little wave, and a big smile.',
  gourdon: 'Gourdon nods at {winner}. "Good costume. Well built."',
  hazel: 'Hazel writes it down in her notebook: "{winner}. Best costume. Case closed."',
  boothoven: 'Boothoven plays a little fanfare for {winner} on an invisible piano. "Bravo!"',
};

/** Cody, as she asks for a photo at the party. */
export const PHOTO_LINE = 'Photo, babe! Us in our costumes. Squeeze in, and say "boo"!';

/** The photo's caption: `{her}` and `{him}` are what they went as, `{year}` the year. */
export const PHOTO_CAPTION = 'Halloween {year}: {her} and {him}';

/** Each half's other half: what she went as, if Cody went as this. */
export const PARTNER: Record<CodyHalf, CodyHalf> = {
  lion: 'ringmaster',
  ringmaster: 'lion',
  butterfly: 'bugCatcher',
  bugCatcher: 'butterfly',
  scaredy: 'clueFinder',
  clueFinder: 'scaredy',
};

/** Who she is in the caption, when she isn't in a couple's costume. */
export const HER_PLAIN = 'you';

/** Cody's letter the morning after, with the photo framed. */
export const FINALE_LETTER: HolidayLetter = {
  from: 'cody',
  letter:
    'Mi amor,\n\nBest Halloween yet. You, me, the whole town in costume, and white chicken chili ' +
    "till we couldn't move.\n\nI had our photo framed. It's going on the wall. Your wall. Our " +
    'wall.\n\nSame time next year?\n\nLove you,\nCody',
  gift: { furniture: 'halloweenPhoto' },
};
