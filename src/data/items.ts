import type { ItemId } from '../types/ids';

/** What a thing in the bag is, which decides where it sits in the bag and what it's good for later. */
export type ItemKind =
  'material' | 'flower' | 'treat' | 'snack' | 'crop' | 'seed' | 'squishy' | 'record';

export interface ItemRow {
  name: string;
  kind: ItemKind;
  /** Shown when she taps it in her bag. Warm and a little silly, never snarky. */
  description: string;
  /** How it's said in a sentence when there's more than one, where that isn't just an "s". */
  plural?: string;
}

/**
 * Everything she can carry. "Purse butter" is Cody's name for the mints she keeps in her purse
 * (personal_touches.md, "Her days"); the snacks turn up after dark, because late-night snackies
 * are her favourite.
 */
export const ITEMS: Record<ItemId, ItemRow> = {
  wood: {
    name: 'Wood',
    kind: 'material',
    description: 'Good, sturdy wood, shaken loose by a friendly tree.',
  },
  stone: {
    name: 'Stone',
    kind: 'material',
    description: 'A handful of smooth grey stone. Some of it sparkles if you squint.',
  },
  moonpetal: {
    name: 'Moonpetal',
    kind: 'flower',
    description: 'A lavender bloom that glows softly whenever the moon is out.',
  },
  forgetMeBoo: {
    name: 'Forget-me-boo',
    kind: 'flower',
    description: 'A tiny blue flower. Nobody who is given one ever forgets it, which is the point.',
  },
  ghostDaisy: {
    name: 'Ghost daisy',
    kind: 'flower',
    plural: 'ghost daisies',
    description: "A daisy so pale it's nearly see-through. It says boo, very quietly.",
  },
  purseButter: {
    name: 'Purse butter',
    kind: 'treat',
    description:
      'Little foil-wrapped mint chocolates from the bottom of your purse. Cody insists they are ' +
      'purse butter, and honestly, they do look like it.',
  },
  midnightPizza: {
    name: 'Midnight pizza slice',
    kind: 'snack',
    description: 'Still warm, somehow. The best slice is always the one you find after dark.',
  },
  batWingCookie: {
    name: 'Bat-wing cookie',
    kind: 'snack',
    description: 'A chocolate cookie with little wings. It tries to flap away, but not very hard.',
  },
  pumpkinPudding: {
    name: 'Pumpkin pudding cup',
    kind: 'snack',
    description: 'Spiced, silky, and topped with a tiny whipped-cream ghost.',
  },
  ghostMallow: {
    name: 'Toasted ghost mallow',
    kind: 'snack',
    description: 'Golden outside, gooey inside, and it giggles a little when you eat it.',
  },
  pumpkin: {
    name: 'Pumpkin',
    kind: 'crop',
    description: 'A big, proper pumpkin, round as a full moon. It is already thinking about faces.',
  },
  ghostPepper: {
    name: 'Ghost pepper',
    kind: 'crop',
    description:
      'A little white pepper with a surprised face. Its bark is much worse than its bite.',
  },
  candyCorn: {
    name: 'Candy corn',
    kind: 'crop',
    plural: 'candy corn',
    description: 'Grown on a stalk, striped by the sun, and sweet all the way through.',
  },
  batWingBean: {
    name: 'Bat-wing bean',
    kind: 'crop',
    description: 'A plum-coloured pod shaped like a folded wing. It flutters if you shake it.',
  },
  rose: {
    name: 'Rose',
    kind: 'flower',
    description: 'A soft pink rose. It smells like a summer evening in the garden.',
  },
  blueRose: {
    name: 'Blue rose',
    kind: 'flower',
    description:
      'The rarest bloom in McFrancisVille, blue as a midnight sky. Some gardeners wait years for one.',
  },
  moonflower: {
    name: 'Moonflower',
    kind: 'flower',
    description: 'It opens at dusk and glows all night, like it swallowed a little moonlight.',
  },
  snapdragon: {
    name: 'Skull snapdragon',
    kind: 'flower',
    description:
      "A spire of pink blossoms. When they fade, the seed pods look like tiny skulls. It's true!",
  },
  spiderLily: {
    name: 'Spider lily',
    kind: 'flower',
    plural: 'spider lilies',
    description: 'Long, curling red petals, like fireworks. Not a single spider was harmed.',
  },
  hosta: {
    name: 'Hosta',
    kind: 'crop',
    description: 'A big clump of leaves that loves the shade. Hosta la vista, baby.',
  },
  batFlower: {
    name: 'Bat flower',
    kind: 'flower',
    description:
      'A real flower, truly: dark wings, a little face, and whiskers down to here. It hangs upside down to sleep.',
  },
  pumpkinSeed: {
    name: 'Pumpkin seed',
    kind: 'seed',
    description: 'Easy to grow and quick to ripen. Ready in 2 days, or 1 if watered.',
  },
  ghostPepperSeed: {
    name: 'Ghost pepper seed',
    kind: 'seed',
    description: 'Grows a bush of shy little peppers. Ready in 3 days, sooner if watered.',
  },
  candyCornSeed: {
    name: 'Candy-corn seed',
    kind: 'seed',
    description: 'Grows a tall, stripy stalk. Ready in 4 days, sooner if watered.',
  },
  batWingBeanSeed: {
    name: 'Bat-wing bean seed',
    kind: 'seed',
    description: 'Climbs a little pole and hangs its pods upside down. Ready in 3 days.',
  },
  roseSeed: {
    name: 'Rose seed',
    kind: 'seed',
    description: 'Grows a rose bush. Ready in 4 days. Every so often, one blooms blue.',
  },
  moonflowerSeed: {
    name: 'Moonflower seed',
    kind: 'seed',
    description: 'Grows a vine of flowers that glow at night. Ready in 3 days.',
  },
  snapdragonSeed: {
    name: 'Snapdragon seed',
    kind: 'seed',
    description: 'Grows a spire of pink skull snapdragons. Ready in 3 days.',
  },
  spiderLilyBulb: {
    name: 'Spider lily bulb',
    kind: 'seed',
    description: 'A papery bulb that becomes a burst of red petals. Ready in 4 days.',
  },
  hostaDivision: {
    name: 'Hosta division',
    kind: 'seed',
    description:
      'A clump split off a big hosta, which is how hostas like to be shared. Ready in 2 days.',
  },
  batFlowerSeed: {
    name: 'Bat flower seed',
    kind: 'seed',
    description: 'Grows a flower shaped like a little bat, whiskers and all. Ready in 3 days.',
  },
  jackOLanternPizza: {
    name: "Jack-o'-lantern pizza",
    kind: 'snack',
    description:
      'A whole pizza with a pepperoni face grinning up at you. It seems very pleased to be dinner.',
  },
  // The squishies are the gooey squeeze-ball and dumpling kind she loves (personal_touches.md).
  ghostGooBall: {
    name: 'Ghost goo ball',
    kind: 'squishy',
    description: 'A squeezy ball of ghostly goo. Squish it and it goes "ooooo", very softly.',
  },
  pumpkinGooBall: {
    name: 'Pumpkin goo ball',
    kind: 'squishy',
    description:
      'Squeeze it and its little pumpkin face squishes into a grin. Smells faintly of pie.',
  },
  blueMoonGooBall: {
    name: 'Blue moon goo ball',
    kind: 'squishy',
    description: 'Deep blue goo with glitter swirled through it, like a squeezable night sky.',
  },
  swampGooBall: {
    name: 'Swamp goo ball',
    kind: 'squishy',
    description: 'Gummy green goo from the bottom of a very friendly swamp. Satisfyingly squelchy.',
  },
  eyeballSquish: {
    name: 'Eyeball squish',
    kind: 'squishy',
    description: 'It keeps an eye on things for you. Squeeze it and it blinks. Probably.',
  },
  booBao: {
    name: 'Boo bao',
    kind: 'squishy',
    description:
      'A soft steamed-bun squishy with a sleepy ghost face. Rises back slowly after a squeeze.',
  },
  xiaoLongBoo: {
    name: 'Xiao long boo',
    kind: 'squishy',
    description:
      'A soup-dumpling squishy with a pleated top. Please do not try to eat it. It knows.',
  },
  batGyoza: {
    name: 'Bat gyoza',
    kind: 'squishy',
    plural: 'bat gyoza',
    description: 'A dumpling squishy with little bat wings. It flaps them when squeezed, a bit.',
  },
  // Her band tees, as albums (personal_touches.md): no real names, all puns.
  recordGhoulyParton: {
    name: 'Ghouly Parton record',
    kind: 'record',
    description:
      '"Nine to Five Feet Under", on butterfly-pink vinyl. Tumble out of bed and stumble to the crypt.',
  },
  recordLadyGhoulga: {
    name: 'Lady Ghoul-ga record',
    kind: 'record',
    description: '"Bat Romance", on lightning-yellow vinyl. Rah-rah-ah-ah-ahh, bat-bat-oh-la-la.',
  },
  recordFleetwoodMacabre: {
    name: 'Fleetwood Mac-abre record',
    kind: 'record',
    description:
      '"Rumours from the Crypt", on moonlight vinyl. Thunder only happens when it\'s haunting.',
  },
  recordScreamDion: {
    name: 'Scream Dion record',
    kind: 'record',
    description: '"My Heart Will Ghost On", on blue vinyl. Near, far, wherever you are.',
  },
  recordBoneJovi: {
    name: 'Bone Jovi record',
    kind: 'record',
    description: '"Livin\' on a Scare", on bone-white vinyl. Whoa-oh, we\'re halfway there.',
  },
  recordBoolafonte: {
    name: 'Harry Boo-lafonte record',
    kind: 'record',
    description: '"Day-O from the Great Beyond". Play it at dinner and see who starts dancing.',
  },
};

/**
 * What a new bag holds: a few purse butters, as her real purse always does, and seeds for her
 * garden. Every harvest gives its seed back (decisions.md 39), so these are enough forever.
 */
export const STARTER_BAG: readonly { id: ItemId; count: number }[] = [
  { id: 'purseButter', count: 5 },
  { id: 'pumpkinSeed', count: 4 },
  { id: 'roseSeed', count: 2 },
  { id: 'moonflowerSeed', count: 2 },
  { id: 'ghostPepperSeed', count: 2 },
  { id: 'candyCornSeed', count: 2 },
  { id: 'batWingBeanSeed', count: 2 },
  { id: 'snapdragonSeed', count: 2 },
  { id: 'spiderLilyBulb', count: 2 },
  { id: 'hostaDivision', count: 2 },
  { id: 'batFlowerSeed', count: 2 },
];
