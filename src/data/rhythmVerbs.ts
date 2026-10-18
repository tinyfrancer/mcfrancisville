import type { RhythmId } from '../types/ids';
import type { VerbChoice, VerbRow } from './happeningVerbs';

/*
 * What she does at the weeks' new beats (V1's R3), one verb each as P4's are. A choice's `id` is
 * kept in the save once she has picked it: never change one once out.
 */

const pick = (id: string, say: string, back: string, called: string): VerbChoice => ({
  id,
  say,
  back,
  called,
});

export const RHYTHM_VERBS: Record<RhythmId, VerbRow> = {
  marketRound: {
    label: "Pick the week's star crop",
    glyph: { item: 'pumpkinSeed' },
    ask: '{name}, which goes on the sign this week? The star crop gets a gold star. Cornelius drew it.',
    deal: 3,
    choices: [
      pick(
        'pumpkin',
        'Pumpkins',
        "Pumpkins! A classic. Cornelius approves. He's sitting on one.",
        'the pumpkins',
      ),
      pick(
        'moonpetal',
        'Moonpetals',
        "Moonpetals! They'll glow on the sign all night. Folk will come just to look.",
        'the moonpetals',
      ),
      pick(
        'turnip',
        'Turnips',
        'Turnips! Nobody ever picks the turnips. They will be so pleased, {name}.',
        'the turnips',
      ),
      pick(
        'strawberry',
        'Strawberries',
        "Strawberries! Rufus, put that one back. That's the sign's.",
        'the strawberries',
      ),
      pick(
        'garlic',
        'Garlic',
        "Garlic! Bold. Cody will keep his distance. He's a vampire about it.",
        'the garlic',
      ),
    ],
    remembers:
      '{name}! Last week you picked {choice} for the sign, and every last one went. Pick again?',
  },
  cloudWatching: {
    label: 'Name a cloud',
    glyph: 'fog',
    ask: "That big one, {name}, over the castle. What's it look like to you?",
    deal: 3,
    choices: [
      pick(
        'bat',
        'A sleepy bat',
        'A sleepy bat! Upside down, wings folded. Oh, it yawned. Did you see?',
        'the sleepy bat',
      ),
      pick(
        'teacup',
        'A teacup',
        'A teacup, with steam! I wrote it down. Clouds hate being written down. They change.',
        'the teacup',
      ),
      pick(
        'codyHair',
        "Cody's hair",
        "Cody's hair! Exactly! The swoop and everything. He would be so flattered.",
        "the cloud like Cody's hair",
      ),
      pick(
        'pumpkin',
        'A pumpkin',
        'A pumpkin! A round one, going pink at the edges. That one is staying, I can tell.',
        'the pumpkin',
      ),
      pick(
        'ghost',
        'A shy ghost',
        'A shy ghost, peeking out. Very like our mayor, {name}. Very like.',
        'the shy ghost',
      ),
    ],
    remembers:
      "{name}! I've been looking for {choice} all week. Clouds don't come back, but I keep hoping.",
  },
  herbWalk: {
    label: "Choose today's herb",
    glyph: 'plant',
    ask: "{name}, what goes in the basket today? Choose well. Or don't. That's half the fun.",
    deal: 3,
    choices: [
      pick(
        'mint',
        'Moon mint',
        'Moon mint! For a brew that makes your breath glow. Very useful in the dark.',
        'the moon mint',
      ),
      pick(
        'toadstool',
        'A toadstool',
        "A toadstool. For a brew that makes you hiccup bubbles. I'll test it on Barty.",
        'the toadstool',
      ),
      pick(
        'thyme',
        'Witch thyme',
        "Witch thyme! It's the only herb that tells the time. Badly. It's always twelve.",
        'the witch thyme',
      ),
      pick(
        'fogfern',
        'Fogfern',
        'Fogfern. A brew for a cosy fog round the cottage. I do love a cosy fog.',
        'the fogfern',
      ),
    ],
    remembers:
      '{name}! You chose {choice} last week. Best brew of the month. The cauldron purred. They do that.',
  },
  blossomPicnic: {
    label: 'Catch a petal',
    glyph: 'blossom',
    done: "You caught one, {name}! A petal caught on blossom week is a wish. I won't ask what.",
    remembers:
      "{name}, you caught a petal last blossom week. I pressed mine in a book. It's still pink.",
  },
  sparklerNight: {
    label: 'Write your name in sparks',
    glyph: 'sparkle',
    done: 'Your name, in the air! All of it! You got further than me, {name}. I always lose the end.',
    remembers:
      '{name}, last sparkler night you wrote your whole name. I still talk about it. To the post.',
  },
  lightsWalk: {
    label: 'Choose the best window',
    glyph: 'lantern',
    ask: 'Which window wins this year, {name}? Everyone gets one vote. Boothoven votes twice. Hums.',
    choices: [
      pick(
        'library',
        "Maude's library",
        'The library! Candles in every window and a ghost reading by each. Maude will glow. More.',
        "Maude's library",
      ),
      pick(
        'crumbs',
        'Crumbs & Curios',
        'Crumbs & Curios! The gingerbread in the window has little lit windows of its own!',
        'Crumbs & Curios',
      ),
      pick(
        'yours',
        'Your house',
        "Yours, {name}! I knew it. I told Hazel it would be. It's the best one. It always is.",
        'your house',
      ),
    ],
    remembers:
      "{name}! {choice} won the lights walk last year, because of you. They've hung even more.",
  },
};
