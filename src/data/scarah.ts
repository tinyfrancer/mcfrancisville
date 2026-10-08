import type { ItemId, ScarahPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';
import { ITEMS } from './items';
import type { Ware } from './shop';
import type { VillagerRow } from './villagers';

/*
 * Scarah (0.3's F3, decision 214): the scarecrow in Boo Acres' far field who woke up one harvest
 * moon and sneezed, and has been alive ever since. Burlap and stitches, a straw bob, a patched
 * sundress and her straw hat, with Cornelius the crow on her shoulder, who says one word. She lives
 * in the farmhouse, minds the seed cart, and is hopeless at scaring anything.
 */

/** The one word Cornelius says, about everything. */
export const CORNELIUS_SAYS = 'Pumpkin';

/** Every seed there is, a packet each: what Scarah sends at three hearts, her favourite first. */
const EVERY_SEED: readonly Ware[] = (Object.keys(ITEMS) as ItemId[])
  .filter((id) => ITEMS[id].kind === 'seed' && id !== 'sweetcornSeed')
  .map((item) => ({ item }));

export const SCARAH: VillagerRow = {
  name: 'Scarah',
  creature: 'scarecrow',
  schedule: {
    weekday: [
      // Out in the fields at first light, then minding her cart, picking in the orchard after
      // lunch, and on the porch at dusk with Cornelius on the rail.
      { from: 5, zone: 'booAcres', at: 'fields', doing: 'watering' },
      { from: 9, zone: 'booAcres', at: 'seedCart' },
      { from: 13, zone: 'booAcres', at: 'orchard', doing: 'watering' },
      { from: 17, zone: 'booAcres', at: 'porch' },
      { from: 20, inside: 'scarahFarmhouse' },
    ],
    weekend: [
      { from: 5, zone: 'booAcres', at: 'byTheWell' },
      // Into town of a weekend, with a basket of whatever's ripe for Cobweb Corner.
      { from: 10, at: 'shopSide' },
      { from: 15, zone: 'booAcres', at: 'seedCart' },
      { from: 18, zone: 'booAcres', at: 'porch' },
      { from: 21, inside: 'scarahFarmhouse', stand: 1 },
    ],
  },
  dropsBy:
    `Howdy, {name}! I brought you a turnip, and Cornelius came to see your house. He says ` +
    `"${CORNELIUS_SAYS}." He likes it!`,
  lines: {
    hello: [
      `Howdy! I'm Scarah, and this is Cornelius. Say hello, Cornelius. …He says "${CORNELIUS_SAYS}." That's hello.`,
      "I was the scarecrow in the far field till one harvest moon, when I woke up and sneezed. I've been alive ever since!",
      "{name}, I'm stuffed with the very best straw. If a bit falls out, just pop it back in. Anywhere's fine.",
      "Cornelius was meant to be scared of me. He sat on my hat and stayed. We've been best friends ever since.",
      'Welcome to Boo Acres! Rows and rows, every one planted with love and a little bit of hoping.',
      "I'm hopeless at scaring things. The crows think I'm the friendliest thing in the field. They're not wrong!",
      "Seeds are just plants that haven't heard the good news yet. I tell them every morning.",
      '{name}, mind the lettuce! Not for my sake. The beetles are having a meeting in it.',
    ],
    friend: [
      "Barty taught me which end of a seed goes up. There isn't one! I was so relieved.",
      'Rufus comes to sniff the blossom at the weekend. He says the pears smell like Tuesdays. He might be right.',
      "{name}, I've saved you the sunniest bed in the field. I sat in it all morning to warm it up.",
      `Cornelius has been practising a second word. So far it's "${CORNELIUS_SAYS}" again, but louder. I'm so proud.`,
      'Wrapunzel and I compared stitches. Hers are three thousand years old. Mine are a few harvests old. We both hold together nicely.',
      'Gourdon mended my fence and wouldn\'t take a thing for it. He said "Good fence," and left. I love him.',
      "Agatha says I'm the only scarecrow she knows who came to life by accident. She says it's the best way to do it.",
      'When I get in a flap, I stand very still in the field with my arms out. Old habit. It helps!',
      'Pimp Daddy Francis bought every pumpkin on my cart and said they were all for you. I gave him a free one for being sweet.',
    ],
    close: [
      "{name}, before the harvest moon I was only straw. Now I'm straw and a friend of yours. That's a much better recipe.",
      'If I could plant one thing and watch it grow forever, it would be this. Us two, chatting by the cart.',
      `Cornelius only says the one word, but he says it about you all the time. "${CORNELIUS_SAYS}." That's high praise.`,
      "I've stitched a little heart inside my patched pocket. It's for you. Sometimes I give it a pat.",
      "{name}, you make the whole farm feel like the morning after rain. Everything's greener when you're about.",
      "Somebody told me scarecrows are meant to keep folks away. I'm so glad I never learned how.",
      'When the wind blows through me it sounds like your name. Well. It sounds like "whoosh". But I hear your name.',
      "You're the best thing that ever grew at Boo Acres, {name}. And I once grew a turnip the size of the cart.",
    ],
    night: [
      '{name}, the moon is up. A moon just like this one woke me. I always say thank you to it.',
      'At night I go and stand in the field for a while. Old habits. The owls come and tell me the news.',
      `Cornelius sleeps in my hat. He snores. It sounds like "${CORNELIUS_SAYS}", very slowly.`,
      'Crops grow in the dark, you know. Quietly, so as not to wake anybody. I whisper encouragement.',
      "Straw doesn't need much sleep. I count the stars instead, then the seeds, then the stars again.",
      '{name}, look at the fields by moonlight. All silver, like somebody tucked a sheet over them.',
      'The barn owl and I have an understanding. She keeps the mice in order, and I keep her company.',
      "Off home soon? If you see little glowing faces on the way, that's just the pumpkins saying goodnight.",
    ],
    windows: {
      morning:
        "Morning, {name}! Up with the rooster? I've been up since before him. I like to tell him the time.",
      afternoon:
        "Afternoon, {name}! The sun's on the fields and everything's having a good long drink. Of sunshine, mostly.",
      evening: 'Evening, {name}! The golden hour. The whole farm goes the colour of a pumpkin pie.',
    },
  },
  loves: ['sweetcorn', 'sunflower', 'ladybug', 'jewelBeetle', 'mossBeetle', 'pear', 'applePie'],
  likes: ['crop', 'seed', 'critter'],
  reactions: {
    loved: `Oh, {name}! For me? I'm so happy a bit of straw's come loose. Cornelius says "${CORNELIUS_SAYS}!" He means thank you.`,
    liked: "That's lovely! I'll keep it in my pocket. The one with the patch. It's my best pocket.",
    fine: "Thank you kindly, {name}! Everything's a treasure when you're as new to the world as I am.",
  },
  says: {
    sweetcorn:
      "Sweetcorn! My very favourite. Every kernel a little bit of sunshine. Cornelius, don't you dare.",
    ladybug: 'A ladybird! Hello, little one. You can live on my hat as long as you like.',
    jewelBeetle:
      'A jewel beetle! Look at it shine. I shall call it Sir Glimmer and tell it all my secrets.',
    pear: 'A pear from my orchard, given back to me with a bow on. Somehow that makes it taste even better.',
  },
  favours: [
    {
      item: 'sweetcorn',
      count: 3,
      ask: "The crows have been at my sweetcorn again. I let them, they're my friends. Could you bring me {what} for supper?",
    },
    {
      item: 'wood',
      count: 5,
      ask: 'My fence by the pond has gone all wobbly. Could you bring me {what} to mend it? Cornelius will supervise.',
    },
    {
      item: 'apple',
      count: 4,
      ask: 'I promised Barty an apple pie, then I ate the apples. Could you bring me {what}? Our secret.',
    },
  ],
  thanks: `Thank you, {name}! You're a proper farmhand. Here, a little something from the cart's tin.`,
  puffs: [
    "*pfft* …Oh! That's only straw settling, {name}. It happens to the best of us.",
    `*pfft* …Cornelius! That was Cornelius. …He says "${CORNELIUS_SAYS}." He doesn't deny it.`,
  ],
  rewards: [
    {
      hearts: 3,
      letter:
        'Dear {name},\n\nA packet of every seed there is, one of each, from the tin on my cart. ' +
        'Plant them somewhere sunny and tell them I said hello. Cornelius has pecked none of ' +
        'them. Well. One.\n\nYour friend in the fields,\nScarah',
      gift: { item: 'sweetcornSeed' },
      also: EVERY_SEED,
      called: 'A packet of every seed',
    },
    {
      hearts: 6,
      letter:
        "Dear {name},\n\nMy straw hat's twin! I wove it from the very bale I'm stuffed with, so " +
        "we're practically family now. Cornelius tried it on first. It suits you better. Don't " +
        'tell him.\n\nHats off to you (not really, I need mine),\nScarah',
      gift: { outfit: 'scarahHat' },
    },
    {
      hearts: 10,
      letter:
        "Dear {name},\n\nI've written down how I was made: the straw, the stitches, the patches " +
        'and the little wooden crow. Make her at your workbench and stand her in your yard. If a ' +
        "harvest moon comes and she sneezes, you'll know what's happened. Show her the " +
        'sunflowers.\n\nWith all my stuffing,\nScarah',
      gift: { recipe: 'strawFriend' },
    },
  ],
};

/**
 * Scarah's pieces: two keepsakes in her farmhouse, and the straw friend she teaches her to make at
 * ten hearts, which stands out in her yard (`OUTDOOR` in `data/yard.ts`). Art in
 * `sprites/scarah.ts`.
 */
export const SCARAH_FURNITURE: Record<ScarahPiece, FurnitureRow> = {
  crowPerch: {
    name: 'Crow perch',
    description:
      'A wooden perch on a stand, a nest of straw on top and a little brass bell to ring for breakfast.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: `You ring the little bell. From somewhere outside, a crow says "${CORNELIUS_SAYS}."`,
  },
  harvestQuilt: {
    name: 'Harvest moon quilt',
    description:
      'A patchwork quilt with a big gold harvest moon stitched in the middle, over rows of tiny cross-stitched corn.',
    layer: 'wall',
    size: { w: 2, h: 1 },
    says: 'The moon on the quilt is stitched in gold thread. It looks warm enough to sleep under.',
  },
  strawFriend: {
    name: 'Straw friend',
    description:
      "A little scarecrow in a patched sundress, with a straw bob and a wooden crow on her shoulder. She hasn't woken up. Yet.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The straw friend smiles her stitched smile. The wooden crow looks ready to say something.',
  },
};
