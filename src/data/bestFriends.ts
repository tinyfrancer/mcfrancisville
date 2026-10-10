import type { VillagerId } from '../types/ids';

/**
 * What being best friends brings, after ten hearts (V1's P2, decision 301): missing her when
 * she's been away three days or more (`missed`, which a best friend says instead of `away`), an
 * invitation to a happening of theirs later today (`invite`, instead of `happening`), a call at
 * her house by choice now and then (`BEST_CALLS`), and a letter now and then (`BEST_LETTERS`).
 * Cody's call and letters are his session's (P5): he's married to her.
 *
 * `{away}` is how long it's been ("three days", "a whole week"), and `{happening}` and `{place}`
 * what's on and where, as in `smallTalk.ts`. `{name}` is her name.
 */
export type BestTopic = 'missed' | 'invite';

export const BEST_TALK: Record<BestTopic, Record<VillagerId, readonly string[]>> = {
  missed: {
    cody: [
      "Babe. It's been {away}. The manor echoes when you're not about. I talked to the bats.",
      "Mi amor, {away}! I've been sat by the window like a sad portrait. Come here.",
      "Honey bunny, it's been {away}. I counted. I'm a vampire. I've got time to count.",
    ],
    maude: [
      "{name}! It's been {away}. I read the same page forty times. I wasn't reading. I was missing you.",
      "Oh, there you are. It's been {away}. The library was far too quiet. Even for a library.",
      "It's been {away}, {name}. I kept your chair by the fire. I shooed three moths off it.",
    ],
    rufus: [
      "{name}!!! It's been {away}!!! I MISSED YOU SO MUCH! I howled! Not sad howling! Just howling!",
      "You're BACK! It's been {away}! I waited by the well! Every day! Well. Most days. Lots of days!",
      "It's been {away}! I made you a bouquet every day! I ate most of them! Sorry! I missed you!",
    ],
    wrapunzel: [
      "My darling! It's been {away}. I baked for two every morning, just in case. Rufus ate yours.",
      "There you are, dear. It's been {away}. The shop smelt of cinnamon, and still something was missing.",
      "It's been {away}, {name}. I'm not cross. I'm a mummy. I've waited longer. I didn't enjoy it.",
    ],
    agatha: [
      "It's been {away}, {name}. Not that I counted. I counted.",
      "Oh. You. It's been {away}. I missed you. There. Don't make me say it again.",
      "{name}, it's been {away}. I read your tea leaves every morning. They said you'd be back.",
    ],
    barty: [
      "There she is! It's been {away}, {name}. The garden's been asking. So have I.",
      "It's been {away}. Missed you something rotten, and I'm a skeleton. I know rotten.",
      "Welcome back, {name}. It's been {away}. Felt like a bed with no seeds in it.",
    ],
    ollie: [
      "{name}! It's been {away}! I rang my bell at your mailbox every day. Just in case.",
      "You're back! It's been {away}. I kept the round going. It wasn't the same without you to wave at.",
      "It's been {away}, {name}! I wrote you a letter about missing you. Then I remembered I'd see you.",
    ],
    nessa: [
      "{name}… it's been {away}. I lit your lantern every night. It bobbed and bobbed. It missed you.",
      "Oh. You're here. It's been {away}. I came up every evening, hoping. I'm glad I kept hoping.",
      "It's been {away}. The carp asked where you'd got to. I said you'd come back. You did.",
    ],
    gourdon: [
      "{name}. It's been {away}. Missed you. Built three chairs about it.",
      "Back, then. It's been {away}. Town felt a plank short.",
      "It's been {away}. Kept your bench dusted. Didn't have to. Wanted to.",
    ],
    hazel: [
      "{name}! It's been {away}. I looked for you in the sky every night. Silly of me. Here you are!",
      "It's been {away}. The stars were lovely, but they're not much for conversation. I missed you.",
      "Oh, it's been {away}, {name}! Even Pip looked dimmer. I'm sure of it. I checked.",
    ],
    boothoven: [
      "{name}! It's been {away}! The whole town was in a minor key. Now we're back in C major!",
      "It's been {away}. I wrote a lament about it. It was very long. I shan't make you hear it.",
      "There you are! It's been {away}. Every tune I wrote came out a little sadder. Not now!",
    ],
    scarah: [
      "{name}! It's been {away}! I stood at the gate with my arms out every evening. In case you came.",
      'It\'s been {away}! Cornelius kept saying "Pumpkin" at the road. I think he meant you.',
      "Oh, there you are! It's been {away}. The fields missed you. I missed you more. Straw doesn't lie.",
    ],
  },
  invite: {
    cody: [
      "Come with me to {happening} {place} later, mi amor. I'll save you the seat next to me.",
      "Booby, {happening} {place}, later on. Come with me. I'll be less grumpy if you're there.",
      "There's {happening} {place} later. Come? Honey bunny, I'll hold your hand the whole time.",
    ],
    maude: [
      "{name}, will you come to {happening} {place} later? I've kept you a place. Next to mine.",
      "There's {happening} {place} later on. It wouldn't be the same without you. Do come.",
      "I'd love it if you came to {happening} later. It's {place}. I'll glow, so you can find me.",
    ],
    rufus: [
      "{name}! {name}! Come to {happening} {place} later! PLEASE! It's better with you! Everything is!",
      "Are you coming to {happening}?! It's {place}! Later! I'll wait for you! I'll wag!",
      "There's {happening} {place} later and you HAVE to come! I've told everyone you're coming!",
    ],
    wrapunzel: [
      "Come to {happening} {place} later, my darling. I'll bring something warm, just for you.",
      "Will you come to {happening} later, dear? It's {place}. It's always nicer with you there.",
      "{name}, there's {happening} {place} later. Come and sit by me. I've brought a cushion.",
    ],
    agatha: [
      "There's {happening} {place} later. Come. I'm not asking. Well. I am asking. Come?",
      "{name}, {happening} later, {place}. I'd like you there. That's all.",
      "You'll come to {happening}, won't you? It's {place}. I've told them you would.",
    ],
    barty: [
      "Come along to {happening} {place} later, {name}. Wouldn't be the same without you.",
      "There's {happening} later, {place}. Bring yourself. That's all I want.",
      "You coming to {happening}? It's {place}. I'll save you a spot by me.",
    ],
    ollie: [
      "{name}! Come to {happening} {place} later? I'll ring my bell when it starts!",
      "There's {happening} later, {place}. Please come. I'd hand-deliver the invitation, but you're here.",
      "Will you come to {happening}? It's {place}. I'll keep a spot. First class.",
    ],
    nessa: [
      "{name}… would you come to {happening} later? It's {place}. I'll be less shy if you're there.",
      "There's {happening} {place} later. I'd like it very much if you came. Very much.",
      "Will you come to {happening} {place}? I'll light a lantern so you know where I am.",
    ],
    gourdon: [
      "There's {happening} later. It's {place}. Come. Built you a seat.",
      "You'll come to {happening}? It's {place}. Better with you there.",
      "There's {happening} {place} later. Come along. I'll be the one glowing.",
    ],
    hazel: [
      "Come to {happening} {place} later, {name}! I'll show you which stars are out.",
      "There's {happening} later. It's {place}. I'd love you there. The sky would too.",
      "Will you come to {happening}? It's {place}. I've told Pip you're coming.",
    ],
    boothoven: [
      "{name}! Come to {happening} {place} later! I've written you a little entrance tune.",
      "There's {happening} later, {place}. Do come. It's a duet, and you're the other half.",
      "Will you come to {happening}? It's {place}. I'll play your theme when you arrive.",
    ],
    scarah: [
      'Come to {happening} {place} later, {name}! Cornelius is coming. He\'s very excited. "Pumpkin."',
      "There's {happening} later, {place}. I've saved you the sunniest spot. Do come!",
      "Will you come to {happening}? It's {place}. I'll wave both arms. Arms out!",
    ],
  },
};

/** What a best friend says when they call at her house by choice, not on the town's visits. */
export const BEST_CALLS: Partial<Record<VillagerId, string>> = {
  maude: "I didn't have a reason to float by, {name}. I just wanted to. Is that alright?",
  rufus: "I came to see you! No reason! Just you! You're the reason! Hi!",
  wrapunzel: "I was passing, dear. I wasn't passing. I came on purpose. I've brought a bun.",
  agatha: "Don't make a fuss. I was in the neighbourhood. I came all the way to the neighbourhood.",
  barty: 'Just popped round, {name}. Nothing wants weeding. I wanted to see you.',
  ollie: 'No post today, {name}. I came anyway. I wanted to say hello without a parcel in the way.',
  nessa:
    'I walked all the way up from the lake. Dripping. I wanted to see you. Sorry about the mat.',
  gourdon: 'No reason. Wanted to see you. Wiped my feet.',
  hazel: 'I should be asleep, {name}. I came to see you instead. Much better use of an afternoon.',
  boothoven: 'I came to hear how your house sounds with you in it. A lovely warm G. As I thought.',
  scarah:
    'I walked all the way from the farm! Cornelius rode on my hat. We just wanted to see you!',
};

/**
 * A best friend's letters, one now and then, a little about nothing: what best friends write.
 * `{name}` is her name.
 */
export const BEST_LETTERS: Partial<Record<VillagerId, readonly string[]>> = {
  maude: [
    'Dear {name},\n\nI found a pressed flower in a book today. Someone had kept it for sixty years. I thought: that is how I feel about you.\n\nFondly, Maude',
    'Dear {name},\n\nNothing to report. I simply wanted to write your name at the top of a page. It looks very well there.\n\nFondly, Maude',
    'Dear {name},\n\nThe moths send their regards. I send more than regards.\n\nFondly, Maude',
  ],
  rufus: [
    'Hi {name}!!!\n\nNo reason! I just wanted to send you a letter! This is it! Hi!\n\nYour best pal,\nRUFUS',
    "Hi {name}!!!\n\nI found a really good stick today and thought of you. I've named it after you. It's the best stick. Obviously.\n\nYour best pal,\nRUFUS",
    'Hi {name}!!!\n\nThe moon was so big last night! I told it about you again! It glowed again!\n\nYour best pal,\nRUFUS',
  ],
  wrapunzel: [
    "My darling {name},\n\nI tried a new bun today and the first thing I thought was, she'd like this. So I'm writing to say so.\n\nWith love and flour,\nWrapunzel",
    'My darling {name},\n\nThree thousand years, and a letter to a friend is still my favourite thing to write.\n\nWith love and flour,\nWrapunzel',
    "My darling {name},\n\nDo eat something today. A proper something. I'll know if you haven't.\n\nWith love and flour,\nWrapunzel",
  ],
  agatha: [
    "{name},\n\nThis is a letter. It says I'm glad you're about. That's all it says. Don't read anything into it.\n\nAgatha",
    "{name},\n\nThe creeper was behind the willow again. I thought you'd want to know. I also wanted to write to you.\n\nAgatha",
    "{name},\n\nI flew past your house last night. Not in a straight line. I waved. You'll have been asleep.\n\nAgatha",
  ],
  barty: [
    "G'day {name},\n\nHostas are up, worms are happy, Terry says hello. That's the news. Thought you'd like it.\n\nCheers,\nBarty",
    "G'day {name},\n\nWas planting bulbs and thinking how lucky this old skeleton is to have a mate like you.\n\nCheers,\nBarty",
    "G'day {name},\n\nRain's coming. Good for the beds. Better for a cuppa. Pop by.\n\nCheers,\nBarty",
  ],
  ollie: [
    'Dear {name},\n\nA letter from your postie, delivered by your postie, again. I just like writing to you.\n\nFirst class,\nOllie',
    'Dear {name},\n\nParcel and I went the long way round today, past your house twice. No reason. Every reason.\n\nFirst class,\nOllie',
    "Dear {name},\n\nI've run out of news, so here is a stamp I drew of you. It's not very good. It's very fond.\n\nFirst class,\nOllie",
  ],
  nessa: [
    'Dear {name},\n\nThe lake was very still this morning, and I thought of you. That is all. That is a lot, for me.\n\nShyly,\nNessa',
    'Dear {name},\n\nI said the bit of my name for your lantern last night, and then I said yours.\n\nShyly,\nNessa',
    "Dear {name},\n\nA moon carp blew a bubble shaped like a heart today. I think it was for you. I'm passing it on.\n\nShyly,\nNessa",
  ],
  gourdon: [
    'Dear {name},\n\nMade a shelf. Thought of you. Thought you should know.\n\nYour friend,\nGourdon',
    "Dear {name},\n\nNot much for letters. Good friend, though. You. That's the letter.\n\nYour friend,\nGourdon",
    'Dear {name},\n\nMy candle burned extra bright last night. Thinking about good friends does that.\n\nYour friend,\nGourdon',
  ],
  hazel: [
    'Dear {name},\n\nPip was very bright last night. I think it was waving at you. I waved too.\n\nLooking up,\nHazel',
    "Dear {name},\n\nI saw a shooting star and wished something for you. I shan't say what, or it won't come.\n\nLooking up,\nHazel",
    "Dear {name},\n\nThe moon's full soon. Come up to the hill and we'll look at it together.\n\nLooking up,\nHazel",
  ],
  boothoven: [
    'Dear {name},\n\nI wrote eight bars this morning and every one of them was cheerful. I blame you entirely.\n\nYours, fortissimo,\nBoothoven',
    'Dear {name},\n\nA little letter in three-four time. One, two, three: I am glad you are my friend.\n\nYours, fortissimo,\nBoothoven',
    "Dear {name},\n\nI heard your laugh across the square today and wrote it down. It's in G.\n\nYours, fortissimo,\nBoothoven",
  ],
  scarah: [
    'Dear {name},\n\nThe sunflowers are taller than me now! I stood next to them and thought of you.\n\nWith all my stuffing,\nScarah',
    'Dear {name},\n\nCornelius has said "Pumpkin" at your house every day this week. I think he wants you to visit.\n\nWith all my stuffing,\nScarah',
    "Dear {name},\n\nA bit of straw fell out of me today and I planted it, just to see. I'll tell you if it grows.\n\nWith all my stuffing,\nScarah",
  ],
};
