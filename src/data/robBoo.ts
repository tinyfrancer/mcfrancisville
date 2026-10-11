import type { RobBooPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';
import type { VillagerRow } from './villagers';

/*
 * Rob Boo (V1's P3b, decision 303): the mayor nobody had met. A ghost, and a shy one, who has run
 * McFrancisVille from the town hall for longer than anyone remembers, by letter, because every
 * time he meant to say hello his knees went wobbly. He wears a sash that says MAYOR and a top hat
 * a size too big, goes faintly pink when he's pleased (which is often), clears his throat before
 * he says anything important, stamps APPROVED on whatever he likes, and types on a typewriter
 * whose W sticks. Wes is his assistant. He is met at the castle at the mystery's end, and is a
 * neighbour like the rest from then on (decision 211: the neighbour who comes with this release).
 */

/** What the mayor's rubber stamp says, on everything he likes. */
export const STAMP = 'APPROVED';

export const ROB_BOO: VillagerRow = {
  name: 'Rob Boo',
  creature: 'ghost mayor',
  schedule: {
    weekday: [
      // At his desk from first light, out on the town hall's steps to wave the town good morning,
      // round the square after lunch shaking hands (he's practising), back to his papers, and
      // out by the square of an evening, when he feels least looked at.
      { from: 5, inside: 'mayorsOffice' },
      { from: 8, at: 'townHallSteps' },
      { from: 12, at: 'squareSouthEast' },
      { from: 15, inside: 'mayorsOffice' },
      { from: 18, at: 'squareSouthEast' },
      { from: 22, inside: 'mayorsOffice', stand: 1 },
    ],
    weekend: [
      { from: 5, inside: 'mayorsOffice', stand: 1 },
      { from: 9, at: 'townHallSteps' },
      { from: 12, at: 'squareSouthEast' },
      { from: 16, inside: 'mayorsOffice' },
      { from: 19, at: 'townHallSteps' },
      { from: 23, inside: 'mayorsOffice', stand: 1 },
    ],
  },
  dropsBy:
    "Ahem. Good day, {name}! I was passing. Well. I wasn't passing, I came specially. I've brought you a certificate. It says your house is lovely. It's {name}'s house, so it was always going to be.",
  lines: {
    hello: [
      "Ahem. Hello, {name}! It's me. Rob Boo. The mayor. You knew that. I've just never said it out loud to anyone before. It's very exciting.",
      "I'm sorry I took so long to say hello. Every time I got to your door, my knees went wobbly. They're wobbly now. They're always a bit wobbly. I'm a ghost.",
      'This is my sash. It says MAYOR, in case anyone forgets. Mostly in case I forget. I get very nervous.',
      "My hat's a size too big. It was the only one in the shop that didn't go straight through me.",
      `I've stamped "${STAMP}" on the fountain, the well and three benches. They were all excellent. I stand by it.`,
      "Wes says I should make more eye contact. I'm trying, {name}. You'll have to forgive me if I look at your left ear.",
      "I've been mayor for a hundred and twelve years. Unopposed! Nobody could see me to vote against.",
      "Please don't mind if I go a bit pink. It happens when I'm pleased. I'm pleased quite a lot just now.",
    ],
    friend: [
      'Maude and I are writing a history of the town. Well, Maude is writing it. I keep remembering things that happened before she was born. And after she was born. She was there for most of it.',
      'Agatha says she had me on her corkboard for weeks. I asked if I could keep the string. She said no. Then she gave me the string.',
      "Barty and Rufus both told everyone they weren't R.B. They were very sure. I'm glad. It would have been awkward for us all.",
      `Gourdon built me a new bench for the square. I stamped "${STAMP}" on it twice. He said "Good stamp." I nearly cried.`,
      "I used to watch the town from the top window of the town hall and wave. Nobody waved back. Now everybody does. It's a lot. It's wonderful.",
      'Boothoven and I are both ghosts, so we have a lot to talk about. Mostly doors. Walking through them is rude. We agree on that.',
      "Wes still hides behind trees, even from me. I've told him he can stop now. He says it helps him think.",
      '{name}, I wrote a speech about you. It\'s very short. It goes: "Hooray." I\'m working on the middle bit.',
      'I still have the first letter I ever wrote to you. Well, the four drafts. The bin and I go back a long way.',
    ],
    close: [
      "Ahem. {name}, I've decided to make you a deputy mayor. It doesn't mean anything. It means a great deal to me.",
      "Before you came, I was a ghost who wrote letters. Now I'm a ghost with a friend. It's a much better job.",
      "When I'm with you, my knees hardly wobble at all. That's a mayoral record.",
      `I've stamped "${STAMP}" on a picture of you and kept it in my desk. Is that strange? I think it's strange. I'm keeping it.`,
      "The whole town says hello to me now, {name}, and it started with you. I'll never be able to thank you properly. I'll keep trying, though. Formally.",
      'A hundred and twelve years, and the best one is this one. I checked the records. It is.',
      "I'm going a bit pink. Don't mind me. It's only that I'm very glad you're here.",
      "If McFrancisVille ever needs a new mayor, I'd vote for you. Then I'd go straight back to being mayor, because I like it, but I'd vote for you first.",
    ],
    night: [
      'Good evening, {name}. Night is when I feel most myself. Partly because nobody can see me very well. Partly the moon.',
      'At night I float up to the clock on the town hall and keep it company. It ticks, I hum. We get on.',
      'The lamps are my favourite part of the job. I had them put in so nobody would ever be scared walking home. Not even me.',
      "I glow a little after dark. Only a little. It's very useful for reading.",
      'Once, very late, I signed my name on the moon. Not really. On a postcard of the moon. It felt official.',
      "{name}, look how quiet the square is. Every window lit, everyone safe in. That's all a mayor really wants.",
      "Off home? I'll float along behind you as far as the corner. Not in a spooky way. In a mayoral way.",
      "Wes is asleep under his tree by now. I put a blanket over him. He'll say he wasn't there.",
    ],
    windows: {
      morning:
        "Good morning, {name}! I've been up since five, approving things. The sunrise was excellent. I've written to tell it so.",
      afternoon:
        "Good afternoon, {name}! I'm out shaking hands. Well, I'm out shaking at people. My hand goes through. They're very kind about it.",
      evening:
        'Good evening, {name}! The lamps are coming on all round the square. I like to watch every single one. It makes me feel I did something right.',
    },
  },
  loves: [
    'moonflowerTea',
    'ghostMallow',
    'ghostDoll',
    'blackTulip',
    'lavenderShortbread',
    'moonpetalCake',
    'spiderLily',
  ],
  likes: ['treat', 'flower', 'dish'],
  reactions: {
    loved: `For me? Oh, {name}. I'm going pink. I'm going ever so pink. This is officially ${STAMP}. Officially and forever.`,
    liked:
      'Thank you, {name}! I shall keep it on my desk, next to the stamp, where I keep the important things.',
    fine: 'Ahem. Thank you very kindly, {name}. I shall write you a proper thank-you letter. On the typewriter. Mind the Ws.',
  },
  says: {
    ghostDoll:
      "A little ghost! With a little face! {name}, it looks just like me before I had the hat. I'll give it a tiny sash.",
    moonflowerTea:
      'Moonflower tea. I drink it while I sign letters at midnight. It goes straight through me, but I enjoy the warmth on the way.',
    blackTulip:
      'A black tulip, for the window of the town hall. Very dignified. Very me. I shall stand it beside the ink.',
  },
  favours: [
    {
      item: 'rose',
      count: 3,
      ask: "Ahem. I'm opening the new bench in the square, with a ribbon and everything. Could you bring me {what} for the ceremony? A mayor should have a buttonhole.",
    },
    {
      item: 'wood',
      count: 4,
      ask: 'The town hall stairs creak, and I keep floating over them so I never notice. Could you bring me {what} to mend them, for everyone else?',
    },
    {
      item: 'candyCorn',
      count: 5,
      ask: "It's the town council meeting tonight. It's just me. Could you bring me {what}, so it feels like a proper meeting?",
    },
  ],
  thanks: `Thank you, {name}! ${STAMP}, ${STAMP}, ${STAMP}. And a little something from the town purse, with the mayor's gratitude.`,
  puffs: [
    "*pfft* …Oh dear. That was a draught. Through me. It happens to ghosts, {name}. I'm told it's very distinguished.",
    "*pfft* …Ahem. Let the record show that the mayor did nothing of the sort. Let the record also show that he's gone very pink.",
  ],
  rewards: [
    {
      hearts: 3,
      letter:
        "Dear {name},\n\nI've typed out how to make a typewriter just like mine, for your " +
        "workbench. The W sticks. I tried very hard to leave that part out, and it wouldn't go. " +
        "I think it's part of the design now.\n\nWrite to me on it. I'll know it's you by the " +
        `Ws.\n\nWarmly, and ${STAMP},\nRob Boo\nMayor`,
      gift: { recipe: 'stickyTypewriter' },
    },
    {
      hearts: 6,
      letter:
        'Dear {name},\n\nA top hat, the twin of mine, with the gold band. ' +
        "Yours fits, though. I had it made a size smaller, so it doesn't fall over your eyes the " +
        'way mine does over mine.\n\nWear it to anything official. Or to anything at all. It ' +
        'makes everything feel like an occasion.\n\nHats off (just this once),\nRob Boo\nMayor',
      gift: { outfit: 'mayorHat' },
    },
    {
      hearts: 10,
      letter:
        'Dear {name},\n\nAhem. By the power vested in me by absolutely nobody, because nobody ' +
        'could see me to vest it, I give you the Key to McFrancisVille. It opens nothing. It ' +
        "means everything. It's the only one there is.\n\nYou were the first to read my letters " +
        'all the way to the end, and the first to come and find me. The town is yours as much ' +
        `as mine.\n\nWith all the warmth a ghost can manage, which is more than you'd think,\nRob Boo\nMayor`,
      gift: { furniture: 'keyToTown' },
    },
  ],
  wrote:
    'Dear new neighbour,\n\nWelcome to McFrancisVille! I am the mayor, and I will come round and ' +
    'say hello in person very soon. Tomorrow, probably. Or the day after.\n\nWarmly,\nThe Mayor\n\n' +
    '(Draft forty-one. Not sent. Knees too wobbly.)',
};

/**
 * Rob Boo's pieces: two keepsakes in his office (his ballot box and his hat stand), the typewriter
 * he teaches her to make at three hearts, and the key to the town at ten. Art in
 * `sprites/robBoo.ts`.
 */
export const ROB_BOO_FURNITURE: Record<RobBooPiece, FurnitureRow> = {
  ballotBox: {
    name: 'Ballot box',
    description:
      'A little wooden ballot box with a brass slot and a padlock. There is one vote inside. It says "ROB BOO", in his own hand.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You give the ballot box a shake. One vote rattles about inside, very pleased with itself.',
  },
  topHatStand: {
    name: 'Hat stand',
    description:
      'A tall hat stand with three top hats on its hooks, each a size too big, and a spare sash folded over the top.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Three top hats on the stand, one for best, one for second best, and one for when it rains.',
  },
  stickyTypewriter: {
    name: 'Sticky typewriter',
    description:
      "An old black typewriter with round keys and a little bell, just like the mayor's. Its W sticks. Every W comes out a tiny bit darker.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Click-clack, ding! You type "Wow". The Ws come out darker. It feels like a secret.',
  },
  keyToTown: {
    name: 'Key to McFrancisVille',
    description:
      "A great gold key on a plum velvet cushion, with a bat for a bow and a little tag: FOR A FRIEND OF THE TOWN, WITH THE MAYOR'S LOVE. It opens nothing. It means everything.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The key to the whole town, on its cushion. It catches the light. The bat on its bow looks proud.',
  },
};

/**
 * The unmasking at the castle (V1's P3b): what she sees as she walks into the great hall that
 * evening, one line after another. The mayor is under a dust sheet at the front, shaking like a
 * jelly; the sheet comes off on `REVEAL_AT`, and there he is. `{name}` is her name.
 */
export const REVEAL_LINES: readonly string[] = [
  'The whole town is here, packed into the great hall, whispering. At the front, by the cake, stands something under a big white dust sheet. It is trembling.',
  'Wes clears his throat from behind a pillar. "Ladies, gentlemen, ghouls and Cornelius. Please welcome… the mayor!" Nobody moves. The sheet trembles harder.',
  '"Go on," says Agatha, very gently. Rufus wags. Cody whistles. Somewhere a Cornelius says "Pumpkin." And then, very slowly, the sheet slides off.',
  'Underneath is a ghost. A small, pale, round-faced ghost in a top hat a size too big, with a gold sash across his chest that says MAYOR. He has gone very pink.',
  '"Ahem," says the ghost. "Hello. I\'m Rob Boo. I\'m the mayor. I\'ve been the mayor for a hundred and twelve years, and I\'ve been too shy to say hello for all of them."',
  '"I wrote you letters instead, {name}. And you read every single one. And you came to find me." He takes off his hat, and holds it over his heart. "So: hello. Properly. At last."',
  'The hall erupts. Barty claps so hard a finger flies off. Boothoven plays a fanfare. Hazel throws stardust. Wes, behind his pillar, is crying into his moustache. The mayor waves, and this time, everyone waves back.',
];

/** The line on which the dust sheet comes off and the mayor is seen at last. */
export const REVEAL_AT = 3;

/** What the scene is called, on the sheet's head, before and after the dust sheet comes off. */
export const REVEAL_TITLES = { before: 'The mayor', after: 'Rob Boo, the mayor' } as const;
