import type { CrawlyPiece, CritterId } from '../types/ids';
import type { CritterRow } from './critters';
import type { FurnitureRow } from './furniture';

/*
 * 0.3's C2: the Cabinet grows from 41 to 60. The creepy-crawlies are a seventh family, most of
 * them at home at Boo Acres among its beds, hay, fences and logs; the farm has a fruit bat in its
 * orchard and a mud puppy and a crawdad in its pond; the bats gain the uncommon and legendary
 * ones they lacked; and winter gets three of its own, so the shelf she plays through this winter
 * has something on it.
 */

/** The creepy-crawlies (0.3's C2): on the ground, never in the air, and none of them in a hurry. */
export const CRAWLIES = {
  pumpkinSnail: {
    name: 'Pumpkin snail',
    family: 'crawly',
    from: 6,
    to: 20,
    habitat: 'crops',
    where: ['booAcres', 'town'],
    rarity: 'common',
    wary: 0,
    value: 25,
    description:
      'Its shell is a tiny ribbed pumpkin, stalk and all. It carries its house about the garden ' +
      'and has never once been late for anything, because it never goes anywhere.',
  },
  booSlug: {
    name: 'Boo slug',
    family: 'crawly',
    from: 19,
    to: 7,
    habitat: 'logs',
    where: ['booAcres', 'town', 'whisperwood', 'hiddenClearing'],
    rarity: 'common',
    wary: 0,
    value: 25,
    description:
      'A slug in a little white sheet with two eyeholes cut out, going boo very slowly. It takes ' +
      'so long to say it that everyone has gone to bed by the end.',
  },
  glowworm: {
    name: 'Glowworm',
    family: 'crawly',
    from: 21,
    to: 3,
    habitat: 'logs',
    where: ['whisperwood', 'booAcres', 'hiddenClearing'],
    rarity: 'uncommon',
    wary: 0,
    value: 75,
    description:
      'A soft little worm with a lantern for a tail. It curls up under the logs at night and ' +
      'glows, just in case anyone gets lost on the way home.',
  },
  woollyBear: {
    name: 'Woolly bear',
    family: 'crawly',
    from: 7,
    to: 18,
    habitat: 'crops',
    where: ['booAcres', 'town'],
    rarity: 'common',
    season: [9, 11],
    wary: 0,
    value: 30,
    description:
      'A fuzzy caterpillar striped black and orange, already dressed for Halloween. Scarah says ' +
      'the wider its middle stripe, the cosier the winter.',
  },
  bowSpider: {
    name: 'Bow spider',
    family: 'crawly',
    from: 15,
    to: 23,
    habitat: 'fences',
    where: ['booAcres'],
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      'A round, fuzzy little spider with big shiny eyes and a pink bow. She sits in her lacy web ' +
      'on the fence and would not dream of moving. She is very proud of the web.',
  },
  moonCricket: {
    name: 'Moon cricket',
    family: 'crawly',
    from: 18,
    to: 3,
    habitat: 'hay',
    where: ['booAcres', 'fairground'],
    rarity: 'common',
    season: [6, 11],
    wary: 0,
    value: 30,
    description:
      'It sits in the hay and sings to the moon all night, the same three notes, and the moon ' +
      'has never once asked it to stop.',
  },
  fiddleHopper: {
    name: 'Fiddle hopper',
    family: 'crawly',
    from: 9,
    to: 18,
    habitat: 'fences',
    where: ['booAcres', 'town'],
    rarity: 'common',
    season: [5, 9],
    wary: 0,
    value: 30,
    description:
      'A green grasshopper who fiddles a tune with its back legs along the fences all summer. ' +
      'It only knows the one, but it plays it with real feeling.',
  },
  twigKnight: {
    name: 'Twig knight',
    family: 'crawly',
    from: 19,
    to: 5,
    habitat: 'trees',
    where: ['castleHill'],
    rarity: 'rare',
    wary: 1,
    value: 200,
    description:
      'A stick insect who stands guard on the castle trees all night, so still that the castle ' +
      'has never noticed it. It takes its duties very seriously.',
  },
  rolyPoly: {
    name: 'Roly-poly',
    family: 'crawly',
    plural: 'roly-polies',
    from: 0,
    to: 24,
    habitat: 'rocks',
    where: ['town', 'whisperwood', 'lanternShore', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 20,
    description:
      'It lives under the rocks and rolls itself into a perfect little ball when it is shy, ' +
      'which is always. Roll it gently back.',
  },
  wiggleWorm: {
    name: 'Wiggle worm',
    family: 'crawly',
    from: 0,
    to: 24,
    habitat: 'crops',
    where: ['booAcres', 'town', 'whisperwood'],
    rarity: 'uncommon',
    weather: 'rain',
    wary: 0,
    value: 80,
    description:
      'A pink earthworm who comes up to dance in the puddles whenever it rains. The gardens love ' +
      'it, and it loves them right back.',
  },
  goldenSnail: {
    name: 'Golden snail',
    family: 'crawly',
    from: 8,
    to: 20,
    habitat: 'crops',
    where: ['booAcres'],
    rarity: 'legendary',
    weather: 'rain',
    wary: 1,
    value: 480,
    description:
      'A snail with a shell of real gold, out among the crops on rainy days only. It leaves a ' +
      'glittery trail, and Scarah says a field it crosses grows twice as sweet.',
  },
} satisfies Partial<Record<CritterId, CritterRow>>;

/** The farm's own, the bats' missing tiers, and winter's (0.3's C2): each in its family's shapes. */
export const MORE_CRITTERS = {
  fruitBat: {
    name: 'Fruit bat',
    family: 'bat',
    from: 18,
    to: 2,
    habitat: 'orchard',
    where: ['booAcres'],
    rarity: 'uncommon',
    season: [8, 11],
    wary: 0,
    value: 70,
    description:
      'A fluffy ginger bat with a fox face, round from the orchard. It hangs upside down in the ' +
      'apple trees and has been known to share.',
  },
  mudPuppy: {
    name: 'Mud puppy',
    family: 'frog',
    from: 17,
    to: 9,
    habitat: 'bank',
    where: ['booAcres'],
    rarity: 'uncommon',
    wary: 0,
    value: 75,
    description:
      'A speckled brown salamander with frilly red gills and a great big grin. It is not a puppy, ' +
      'but nobody has had the heart to tell it.',
  },
  crawdad: {
    name: 'Crawdad',
    family: 'fish',
    from: 0,
    to: 24,
    habitat: 'pond',
    where: ['booAcres'],
    shadow: 1,
    rarity: 'common',
    wary: 0,
    value: 30,
    description:
      'A little red crawdad from the farm pond, waving both claws, mostly to say hello. It walks ' +
      'backwards whenever it is pleased, which is often.',
  },
  longEaredBat: {
    name: 'Long-eared bat',
    family: 'bat',
    from: 19,
    to: 5,
    habitat: 'trees',
    where: ['whisperwood', 'castleHill', 'hiddenClearing'],
    rarity: 'uncommon',
    wary: 0,
    value: 75,
    description:
      'Its ears are as long as the rest of it. It can hear a leaf land on the far side of ' +
      'Whisperwood, and a secret from even further.',
  },
  ghostBat: {
    name: 'Ghost bat',
    family: 'bat',
    from: 18,
    to: 5,
    habitat: 'trees',
    where: ['castleHill'],
    rarity: 'legendary',
    moon: true,
    wary: 1,
    value: 460,
    description:
      'A pale, glowing bat who only comes out round the castle on the night of a full moon. It ' +
      'flies right through the trees, and says sorry to each one.',
  },
  snowMoth: {
    name: 'Snow moth',
    family: 'moth',
    from: 16,
    to: 24,
    habitat: 'lanterns',
    where: ['town', 'lanternShore', 'castleHill', 'booAcres', 'fairground'],
    rarity: 'common',
    season: [12, 2],
    wary: 0,
    value: 35,
    description:
      'White and soft as the first snowflake, and out in the coldest months. It warms its toes ' +
      'by the lanterns and dusts them with frost in thanks.',
  },
  frostBeetle: {
    name: 'Frost beetle',
    family: 'beetle',
    from: 9,
    to: 17,
    habitat: 'logs',
    where: ['whisperwood', 'booAcres', 'hiddenClearing'],
    rarity: 'uncommon',
    season: [12, 2],
    wary: 0,
    value: 80,
    description:
      'An icy blue beetle with a pattern of frost on its shell, out by the logs on winter days. ' +
      'It is cold to hold, and very pleased about it.',
  },
  snowglobeFish: {
    name: 'Snowglobe fish',
    family: 'fish',
    plural: 'snowglobe fish',
    from: 7,
    to: 19,
    habitat: 'pond',
    where: ['booAcres', 'lanternShore'],
    shadow: 1,
    rarity: 'uncommon',
    season: [12, 2],
    wary: 0,
    value: 85,
    description:
      'A round little fish speckled with white, like a snow globe that has just been shaken. It ' +
      'swims in the waters that never freeze over, and loves a winter.',
  },
} satisfies Partial<Record<CritterId, CritterRow>>;

/**
 * A critter for each big holiday but Halloween, which has plenty (V1's R5, decision 310): common
 * while its holiday's decorations are up, and round each full moon the rest of the year, so one
 * missed is never a year away. Each is in a family whose museum case has room.
 */
export const HOLIDAY_CRITTERS = {
  confettiMoth: {
    name: 'Confetti moth',
    family: 'moth',
    from: 18,
    to: 3,
    habitat: 'lanterns',
    where: ['town', 'lanternShore', 'castleHill', 'fairground'],
    rarity: 'common',
    holiday: 'newYear',
    wary: 0,
    value: 45,
    description:
      'Speckled with every colour there is, as if it flew through a party on the way here. It ' +
      'comes out to see the new year in, and stays up far too late.',
  },
  lovebug: {
    name: 'Love bug',
    family: 'beetle',
    from: 8,
    to: 19,
    habitat: 'flowers',
    where: ['town', 'castleHill', 'hiddenClearing', 'fairground', 'booAcres'],
    rarity: 'common',
    holiday: 'valentines',
    wary: 0,
    value: 45,
    description:
      'A round pink beetle with little red hearts for spots. It lands on whoever looks lonely and ' +
      'sits on their sleeve until they are not.',
  },
  luckyFrog: {
    name: 'Lucky frog',
    family: 'frog',
    from: 6,
    to: 20,
    habitat: 'bank',
    where: ['town', 'lanternShore', 'booAcres'],
    rarity: 'common',
    holiday: 'stPatricks',
    wary: 0,
    value: 45,
    description:
      'A bright green frog with a four-leaf clover on its back, which it grew all by itself. ' +
      'Whoever finds one has a lucky day, and so does the frog.',
  },
  bunnyBat: {
    name: 'Bunny bat',
    family: 'bat',
    from: 17,
    to: 2,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'booAcres'],
    rarity: 'common',
    holiday: 'easter',
    wary: 0,
    value: 45,
    description:
      'A soft white bat with long pink bunny ears. Every Easter it hides one jelly bean somewhere ' +
      'in town, and then forgets where, and has to look for it all year.',
  },
  sparklerOrb: {
    name: 'Sparkler orb',
    family: 'orb',
    from: 20,
    to: 2,
    habitat: 'lanterns',
    where: ['town', 'lanternShore', 'fairground'],
    rarity: 'common',
    holiday: 'fourthOfJuly',
    wary: 0,
    value: 45,
    description:
      'A little orb that fizzes red, white and blue, like a sparkler that decided to stay. It ' +
      'crackles when it is happy, which is always.',
  },
  turkeyTailMoth: {
    name: 'Turkey-tail moth',
    family: 'moth',
    from: 15,
    to: 22,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'booAcres'],
    rarity: 'common',
    holiday: 'thanksgiving',
    wary: 0,
    value: 45,
    description:
      "Its wings fan out in stripes of rust and cream and brown, like a turkey's tail, or a very " +
      'good pie crust. It is thankful for everything, and says so.',
  },
  baubleBeetle: {
    name: 'Bauble beetle',
    family: 'beetle',
    from: 9,
    to: 21,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill'],
    rarity: 'common',
    holiday: 'christmas',
    wary: 0,
    value: 45,
    description:
      'Round and red and shiny as a Christmas bauble, with a little gold cap. It hangs in the trees ' +
      'all December and lets everyone think it is a decoration.',
  },
} satisfies Partial<Record<CritterId, CritterRow>>;

/**
 * Three jumping spiders among the crawlies (V1's R5, decision 275), drawn to the spider rules:
 * round, fuzzy, two big front eyes, and a little hop where the others wiggle.
 */
export const JUMPING_SPIDERS = {
  zebraJumper: {
    name: 'Zebra jumper',
    family: 'crawly',
    from: 8,
    to: 18,
    habitat: 'fences',
    where: ['town', 'booAcres'],
    rarity: 'common',
    wary: 0,
    value: 30,
    description:
      'A tiny fuzzy spider striped black and white, with two great big eyes that look right at you. ' +
      'It hops along the fence to see what you are doing, and then hops back to tell everyone.',
  },
  boldJumper: {
    name: 'Bold jumper',
    family: 'crawly',
    from: 9,
    to: 19,
    habitat: 'logs',
    where: ['whisperwood', 'booAcres', 'hiddenClearing'],
    rarity: 'uncommon',
    wary: 0,
    value: 75,
    description:
      'Fluffy and black with white spots and a shiny green smile. It is very brave for its size, ' +
      'which is the size of a pea, and it would like to be friends.',
  },
  peacockJumper: {
    name: 'Peacock jumper',
    family: 'crawly',
    from: 10,
    to: 17,
    habitat: 'yard',
    where: ['town'],
    rarity: 'rare',
    season: [4, 6],
    wary: 1,
    value: 210,
    description:
      'A spider no bigger than a grain of rice, with a fan of blue and orange on its back that it ' +
      'lifts to dance. It dances in your yard in spring, for anyone who stops to watch.',
  },
} satisfies Partial<Record<CritterId, CritterRow>>;

/** What finishing the creepy-crawlies sends her (0.3's C2), from Wrapunzel as the other families' do. */
export const CRAWLY_FURNITURE: Record<CrawlyPiece, FurnitureRow> = {
  framedSnail: {
    name: 'Framed golden snail',
    description: 'A golden snail in a gilt frame, for finishing the creepy-crawlies. It shines.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The golden snail in the frame catches the light. Somewhere, a field grows sweeter.',
  },
  glowwormDome: {
    name: 'Glowworm dome',
    description: "A glowworm under a glass dome, for filling the museum's creepy-crawly case.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The glowworm brightens its tail at you. A night-light that waves.',
  },
};
