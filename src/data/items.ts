import type { CritterId, ItemId } from '../types/ids';
import { CRITTERS } from './critters';

/** What a thing in the bag is, which decides where it sits in the bag and what it's good for later. */
export type ItemKind =
  | 'material'
  | 'flower'
  | 'treat'
  | 'snack'
  | 'crop'
  | 'seed'
  | 'squishy'
  /** A monster doll (0.2's F2), to collect the set of. */
  | 'doll'
  | 'record'
  | 'bead'
  | 'bracelet'
  | 'critter'
  | 'bone'
  | 'keepsake'
  /** Made for the farm, and held to put in place: a sprinkler (phase P). */
  | 'gear'
  /** Cooked at a stove (phase R), to eat or to give. */
  | 'dish';

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
  // Her monster dolls (personal_touches.md, question 5): the game's own, never a brand's.
  vampDoll: {
    name: 'Countessa Fangtastic',
    kind: 'doll',
    description:
      'A vampire doll with a pink bob, a tiny cape and one fang out. Comes with a coffin-shaped purse.',
  },
  stitchDoll: {
    name: 'Patchwork Polly',
    kind: 'doll',
    description:
      'Stitched together from the cutest bits, mint from head to toe, with bolts for earrings.',
  },
  wolfDoll: {
    name: 'Lupa Moonfluff',
    kind: 'doll',
    description: 'A werewolf girl with fluffy ears, a fluffier tail and a hairbrush, just in case.',
  },
  mummyDoll: {
    name: 'Wrapsody',
    kind: 'doll',
    description:
      'A mummy doll in glittery wraps, ever so slightly unravelling. Wrapunzel says she is a fan.',
  },
  ghostDoll: {
    name: 'Boolinda',
    kind: 'doll',
    description: 'A ghost girl in a veil, see-through and shy. You can read a book through her.',
  },
  witchDoll: {
    name: 'Hexanne',
    kind: 'doll',
    description:
      'A witch doll with a teeny pointed hat and a broom that really does hover. Barely.',
  },
  gorgonDoll: {
    name: 'Medoozy',
    kind: 'doll',
    description:
      'A gorgon girl whose little snakes hiss compliments. You look great today, apparently.',
  },
  seaDoll: {
    name: 'Marina Ghoulsby',
    kind: 'doll',
    description: 'A sea ghoul with pearly fins and a shell purse. Smells faintly of the seaside.',
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
  // Beads for friendship bracelets, of what she'd string on one: love, smiles and football, in her
  // teams' colours (personal_touches.md, "Crafting"). Colours only, no logos.
  heartBead: {
    name: 'Heart bead',
    kind: 'bead',
    description: 'A little pink heart bead. Every bracelet is better with one.',
  },
  loveBeads: {
    name: 'LOVE beads',
    kind: 'bead',
    plural: 'sets of LOVE beads',
    description: 'Four letter beads, L, O, V and E, still in the right order. For now.',
  },
  smileyBead: {
    name: 'Smiley bead',
    kind: 'bead',
    description: 'A sunny yellow bead with a big smile. It is having a lovely day.',
  },
  tigerFootballBead: {
    name: 'Tiger-stripe football bead',
    kind: 'bead',
    description: 'A tiny football in orange with black stripes. Ready for game day.',
  },
  scarletFootballBead: {
    name: 'Scarlet & grey football bead',
    kind: 'bead',
    description: 'A tiny football in scarlet and grey. It cheers, very quietly, on Saturdays.',
  },
  batBead: {
    name: 'Bat bead',
    kind: 'bead',
    description: 'A little black bat bead with its wings folded, fast asleep.',
  },
  ghostBead: {
    name: 'Ghost bead',
    kind: 'bead',
    description: 'A glow-in-the-dark ghost bead. It says boo, but only to friends.',
  },
  loveBracelet: {
    name: 'LOVE bracelet',
    kind: 'bracelet',
    description: 'L-O-V-E between two pink hearts. It says it all, in four little beads.',
  },
  smileyBracelet: {
    name: 'Smiley bracelet',
    kind: 'bracelet',
    description: 'Three smiley beads in a row. Impossible to wear and stay grumpy.',
  },
  friendshipBracelet: {
    name: 'Friendship bracelet',
    kind: 'bracelet',
    description:
      'A heart, a smile, a bat and a ghost, on bright woven thread. Made to be given away.',
  },
  tigersBracelet: {
    name: 'Game-day bracelet',
    kind: 'bracelet',
    description: 'Tiger-stripe footballs either side of a heart. Every day is game day.',
  },
  scarletBracelet: {
    name: 'Scarlet & grey bracelet',
    kind: 'bracelet',
    description: 'Scarlet and grey footballs either side of a heart, for a Saturday in the fall.',
  },
  spookyBracelet: {
    name: 'Spooky bracelet',
    kind: 'bracelet',
    description: 'Bats and ghosts, taking turns. Spooky, but mostly cute.',
  },
  // Given, never sold: Cody's nod to the song they danced to the night they met
  // (personal_touches.md, "The shop, and things to come").
  recordWalkTheTomb: {
    name: 'Walk the Tomb record',
    kind: 'record',
    description:
      '"Shut Up and Dance (With the Dead)", on moon-blue vinyl. Cody says it was playing the ' +
      'night you met. He has not stopped humming it since.',
  },
  // Cody's favourite, and a chipotle is only a smoked pepper, so no shop's name is taken.
  burritoBowl: {
    name: 'Chipotle burrito bowl',
    kind: 'snack',
    description: 'Rice, beans, the works, and far too much guac. Somebody in town lives for these.',
  },
  moonPie: {
    name: 'Chocolate Banana Watermelon Moon Pie',
    kind: 'snack',
    description:
      'Chocolate, banana and watermelon, all at once, in one moon pie. Nobody knows how he does ' +
      'it. Nobody asks.',
  },
  moonPieMini: {
    name: 'Bag of moon pie bites',
    kind: 'snack',
    plural: 'bags of moon pie bites',
    description: 'Bite-sized moon pies in a paper bag, for sharing. Or for not sharing.',
  },
  ...critterItems(),
  fibisBone: {
    name: "Fibi's bone",
    kind: 'bone',
    description:
      "One of Fibi's bones, found somewhere it had no business being. She will want it back!",
  },
  // Their first date was ice skating (personal_touches.md, "After phase D").
  iceSkates: {
    name: 'Ice skates',
    kind: 'keepsake',
    plural: 'pairs of ice skates',
    description:
      'The skates from your first date, laces still knotted. They get you across the frozen creek ' +
      'to Lantern Shore.',
  },
  broom: {
    name: 'Your broom',
    kind: 'keepsake',
    plural: 'brooms',
    description:
      'Your very own broom, with a ribbon tied on. Tap it on the quick bar to swoop home, and ' +
      'walk up to its stand by your door to fly out again.',
  },
  // 0.2's E1: kept, never sold or given, until she plants it.
  candySapling: {
    name: 'Candy sapling',
    kind: 'keepsake',
    description:
      'A tiny candy tree, dropped by the big one. Plant it in a ring of earth in your yard and ' +
      'in a few days it will grow sweets of its own.',
  },
  // The places beyond the town (phase I).
  toadstool: {
    name: 'Toadstool',
    kind: 'material',
    description:
      "A red-capped toadstool from Whisperwood, spotted like it's dressed up for something. " +
      'Its spots glow a little in the dark.',
  },
  milkweed: {
    name: 'Milkweed',
    kind: 'flower',
    description:
      'Soft pink clusters from the castle garden. The monarch butterflies adore it, and will ' +
      'follow you about hopefully.',
  },
  // Phase P: made at the workbench, and fitted in a bed's corner from the quick bar.
  sprinkler: {
    name: 'Bat-eared sprinkler',
    kind: 'gear',
    description:
      'A little brass sprinkler with bat ears. Fit it in a bed and it waters that bed and every ' +
      'bed touching it, each morning, so you never have to.',
  },
  // Phase R: cooked at her stove, or Wrapunzel's oven. Each does a small, cozy thing when she eats
  // it (`data/dishes.ts`).
  pumpkinSoup: {
    name: 'Pumpkin soup',
    kind: 'dish',
    plural: 'bowls of pumpkin soup',
    description:
      'Velvety, orange and steaming, with a swirl of cream shaped like a little ghost. A bowl of ' +
      'this and you could skip all the way to the lake.',
  },
  fishChowder: {
    name: 'Fish chowder',
    kind: 'dish',
    plural: 'bowls of fish chowder',
    description:
      'Creamy, peppery, and full of whatever the pond gave you. The fish can smell it on you ' +
      "afterwards, and they're ever so curious.",
  },
  moonpetalCake: {
    name: 'Moonpetal cake',
    kind: 'dish',
    description:
      'A lavender sponge that glows faintly by moonlight. Moths find it irresistible, and honestly, ' +
      'so does everyone.',
  },
  midnightPlate: {
    name: 'Midnight snackie plate',
    kind: 'dish',
    description:
      'Every late-night snack you had, arranged very nicely on one plate. Only ever made after ' +
      'dark, which is the rule. Something glowy always comes to see.',
  },
  ghostChili: {
    name: 'Ghost pepper chili',
    kind: 'dish',
    plural: 'bowls of ghost pepper chili',
    description:
      'Bat-wing beans and ghost peppers, simmered till they stop saying boo. It puts a real spring ' +
      'in your step.',
  },
  pumpkinPie: {
    name: 'Batty pumpkin pie',
    kind: 'dish',
    description:
      'Spiced pumpkin under a lattice crust with little bat cut-outs. The bats in town think it is ' +
      'a party, and they are right.',
  },
  toadstoolStew: {
    name: 'Toadstool stew',
    kind: 'dish',
    plural: 'bowls of toadstool stew',
    description:
      'Earthy and warming, with red-capped toadstools bobbing on top. Every frog nearby wants to ' +
      'know what smells so good.',
  },
  roseJam: {
    name: 'Rose-petal jam',
    kind: 'dish',
    plural: 'jars of rose-petal jam',
    description:
      'Pink, sweet and smelling of a summer garden, in a jar with a gingham lid. Beetles adore it.',
  },
  moonflowerTea: {
    name: 'Moonflower tea',
    kind: 'dish',
    plural: 'cups of moonflower tea',
    description:
      'A pale, glowing cup that makes you ever so patient. The fish seem to know, and bite ' +
      'sooner.',
  },
  castleKey: {
    name: 'Castle key',
    kind: 'keepsake',
    description:
      'An old iron key with a butterfly on its bow, dug up in a hidden clearing. It opens the ' +
      'gate up to the castle on the hill.',
  },
  // The holidays (phase U).
  chocolateEgg: {
    name: 'Chocolate egg',
    kind: 'treat',
    description:
      'A little chocolate egg wrapped in bright foil, found where Barty hid it. Probably. He hid ' +
      'a lot of things.',
  },
  chocolateHeart: {
    name: 'Chocolate heart',
    kind: 'treat',
    description: 'A chocolate heart in pink foil. Somebody has had a tiny nibble. It was Cody.',
  },
  shamrock: {
    name: 'Shamrock',
    kind: 'flower',
    description:
      'A little three-leaf clover from the graveyard garden. Lucky, Barty says. He checked.',
  },
  icePop: {
    name: 'Ice pop',
    kind: 'treat',
    description: 'Red, white and blue, and melting faster than you can say "fireworks".',
  },
  gingerbreadBat: {
    name: 'Gingerbread bat',
    kind: 'treat',
    description:
      "Wrapunzel's gingerbread, cut like a bat, with icing fangs. It smells like Christmas.",
  },
  hallKey: {
    name: 'Heart key',
    kind: 'keepsake',
    description:
      'A little brass key with a heart for its bow, found by the frozen creek. It opens the ' +
      'great doors of Castle Mac-A-Boo.',
  },
  // October's sweets (0.2's J2), from the neighbours' doors in the evenings.
  gummyCluster: {
    name: 'Gummy cluster',
    kind: 'treat',
    description:
      'A soft gummy heart rolled in tiny crunchy rainbow sprinkles. The very best one in the bowl.',
  },
  chewyDots: {
    name: 'Box of chewy dots',
    kind: 'treat',
    plural: 'boxes of chewy dots',
    description:
      'A little box of chewy gumdrops in every colour. They stick to your teeth, lovingly.',
  },
  sourGhouls: {
    name: 'Bag of sour ghouls',
    kind: 'treat',
    plural: 'bags of sour ghouls',
    description: 'Little ghost-shaped gummies, sour first and then sweet. Just like Agatha.',
  },
  // Film night's popcorn (0.2's J3), from the table on the avenue.
  popcorn: {
    name: 'Tub of popcorn',
    kind: 'snack',
    plural: 'tubs of popcorn',
    description:
      'Warm, buttery and heaped over the top of a striped tub. Wrapunzel made all of it. Every bit.',
  },
  // The Halloween party's chili (0.2's J4, question 76).
  whiteChickenChili: {
    name: 'Bowl of white chicken chili',
    kind: 'snack',
    plural: 'bowls of white chicken chili',
    description:
      'Creamy, a little spicy, with beans and a squeeze of lime. The best thing at the party, and there is a lot at the party.',
  },
  // The pick of the pumpkin patch on the farm (0.2's J3), there for carving.
  patchPumpkin: {
    name: 'Patch pumpkin',
    kind: 'crop',
    description:
      "The roundest pumpkin in the patch, picked by you. It's asking to be carved into something " +
      'with whiskers.',
  },
};

/** Whether something is hers to keep rather than give away: Fibi's bone, and her keepsakes. */
export function isKept(id: ItemId): boolean {
  const kind = ITEMS[id].kind;
  return kind === 'bone' || kind === 'keepsake';
}

/** Each critter as something in her bag: its rows live with the rest of it in `data/critters.ts`. */
function critterItems(): Record<CritterId, ItemRow> {
  const rows = {} as Record<CritterId, ItemRow>;
  for (const [id, c] of Object.entries(CRITTERS) as [CritterId, (typeof CRITTERS)[CritterId]][]) {
    rows[id] = { name: c.name, kind: 'critter', description: c.description };
    if (c.plural) rows[id].plural = c.plural;
  }
  return rows;
}

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
