/**
 * What's new in each version she's given, as the mayor types it up (session B3 of 0.2, decision
 * 142): nobody has met the mayor, so the notes come off their typewriter, warm and a little too
 * busy, like their letters in `mystery.ts`. Oldest first, and only ever added to: the last row is
 * the version on her phone, and a release to `main` adds its row (or finishes the newest one).
 * A row her phone never saw may be folded into the next one (1.0 holds 0.6 to 0.9, decision 324;
 * 1.2 holds 1.0.1 and 1.1, decision 356; 1.3 holds 1.2.1, decision 366),
 * so she reads one card; a row she has seen is never changed (but for L5's emoji, put in words,
 * decision 295).
 */
export interface PatchNotes {
  /** How the version is named on the card: "0.2". Unique, and never reused. */
  version: string;
  /** What changed, three to five lines, each a small joke with a true thing in it. */
  lines: readonly string[];
  /** A last word under the signature. */
  ps: string;
}

export const NOTES: readonly PatchNotes[] = [
  {
    version: '0.2',
    lines: [
      'October is the Halloween Festival, all month: doors to knock on after dark, pumpkins ' +
        'on your farm, films on Saturdays, and a story from me in the post.',
      'The 31st is the party, and the costume contest needs a judge. We have chosen you. No ' +
        'pressure. Well, some pressure.',
      'Agatha has something for you in the post that flies you home, and every way out of ' +
        'town has a signpost now. One of them only whispers.',
      'The critters have gone shy, the rarest keeping to their season, weather or moon. ' +
        'Everyone else has had a touch-up, and has a great deal more to say.',
      "The frozen creek now needs skates, messages wait until you've read them, and a certain " +
        'man behind a certain tree has been reworded. He knows what he did.',
    ],
    ps: 'P.S. Still terribly busy. We will meet soon. Probably.',
  },
  {
    version: '0.2.1',
    lines: [
      'The buttons along the bottom have budged up into one tidy row. The closet, the map and ' +
        'the Cabinet wait in the tray while you are out and about.',
      'Turn your phone on its side and the town turns with you now, buttons down either side. ' +
        'We had the whole town practise.',
      'Some trees by the frozen creek were standing on a certain little key. They have been ' +
        'asked to move, and have, with only a small amount of muttering.',
    ],
    ps:
      'P.S. The ice wants skates. Cody posted you a pair when you first found Whisperwood, ' +
      'so do check your mailbox.',
  },
  {
    version: '0.2.2',
    lines: [
      'With your phone on its side, the buttons have tucked themselves into one slim strip ' +
        'along the bottom, so you can see right across town again.',
      'They held a vote about it. The three little lines abstained.',
      'Everything else is just where you left it. Cody would like it noted that he did not ' +
        'touch anything.',
    ],
    ps: 'P.S. Do tell me if anything else is in your way. I will have it moved, politely.',
  },
  {
    version: '0.2.3',
    lines: [
      'A weekly boutique, bigger museum cases, a paintable rod (tap it twice), music all over, ' +
        'a fountain that plays after dark, and chairs to sit in (one so comfy).',
      'Neighbours chat about the rain, your day, your catch and your pet, never about folk not ' +
        'moved in yet (a stargazer? Befriend Maude). Sideways, menus fit.',
      'Wear three bracelets on one wrist (a friend wears the one you give them). Finish a ' +
        'Cabinet shelf or a museum wing for a gift, and collect the monster dolls.',
      'Fences turn corners, storms thunder, geese dress up, and beds grow by the creek, the ' +
        'lake, new rows and planters, with twelve new crops. Spaghetti, anyone?',
      'Wrapunzel would love a hand baking. The stall sells what you make, Cobweb Corner pays ' +
        'double for its wanted list, and the candy tree has saplings!',
    ],
    ps: 'P.S. I have also not moved here yet, technically. I am allowed to mention myself.',
  },
  {
    version: '0.2.4',
    lines: [
      'Every window is redone: bigger writing and pictures, tabs where it gets busy, the ways ' +
        'out around you on the map, and birthdays on the calendar.',
      'The two friends up top show all your neighbours: hearts, birthdays, favourite things, ' +
        'gifts to come and where they are now. Tap Find to go and say hello!',
      'Boothoven the ghost composer moves in east of the square, welcome party at the well! ' +
        'Pianos, his and yours (a card at Cobweb Corner), play a new tune each go.',
      'Once you are friends, Boothoven teaches piano, a tune a day. Very close friends might ' +
        'hear something special at the castle on your anniversary.',
      'Meet him and the gate past the park opens onto the Hollow Fairground: ring toss, ' +
        'hook-a-ghost, fortunes, fried pickles, and the big parties move there too!',
    ],
    ps: 'P.S. The tabs were my idea. Cody says folders are not "a whole personality". We differ.',
  },
  {
    version: '0.2.5',
    lines: [
      'Everybody has moved in! Ollie, Nessa, Gourdon, Hazel and Boothoven are all here now, ' +
        'houses up and kettles on. Do go and say hello.',
      'Every gate stands open: Lantern Shore, the castle on the hill, its great hall and the ' +
        'Hollow Fairground. Your skates are in your bag, laces and all.',
      'Agatha sends your broom on your very first day, and Boothoven will teach you piano ' +
        'whenever you pop by his parlour. No need to be best friends first.',
      'From now on, new neighbours arrive with new versions, each with something of their own ' +
        'to bring. I am told some of them are already packing.',
    ],
    ps: 'P.S. The keys you dig up still fit their locks. The locks are simply very relaxed now.',
  },
  {
    version: '0.3',
    lines: [
      "Boots tuck under every hem, the neighbours' too, yet still pull up over jeans. Cape " +
        'collars stand up past any hairdo, and wings sit over gloves.',
      'Trees go see-through when they hide you. Food says what it does, with a little chip up ' +
        'top while it works. And your chest now takes things from your bag!',
      'Shelves show off what you own, bell jars hold a treasure, trinkets sit on tables, and ' +
        "there's a back room to build and a yard to fill. I ran out of chairs.",
      'Scarah farms Boo Acres, west of town: fruit trees, every seed at her cart, a barn that ' +
        'sprinkles, a greenhouse always in season. The lake path goes all round!',
      "A fossil mound a day, nineteen new critters, two museum cases, figurines at Gourdon's " +
        "bench, his book, Ollie's catalogue, eight sets and windows on the sky.",
    ],
    ps: 'P.S. Anything you order comes next morning with Ollie. He says the second chair was the heaviest, emotionally.',
  },
  {
    version: '0.4',
    lines: [
      "The town has scooted in closer to see everyone's faces (Settings, View, Far steps it " +
        'back), and every room sits snug in a little house of its own.',
      'Hold − or + and it counts by itself, faster and faster. The greenhouse beds show your ' +
        'seeds now, and outfits come in colours that suit them, bat wings in red!',
      'The town sounds like a place now: crickets at night, rain, the lake, your footsteps. ' +
        'Every tune has a second part, and a sleepy one after ten.',
      'Taps twinkle back, doors open in a little circle, menus slide, and you can see your ' +
        'broom fly! Tap a hedge and you will shrug. Hedges are like that.',
      'No critter is ever more than a month off now, and the Cabinet says when. Seven holiday ' +
        'critters have come to stay, and three tiny jumping spiders!',
    ],
    ps: 'P.S. Nothing actually moved. I measured.',
  },
  {
    version: '0.5',
    lines: [
      'Whatever you find flies to you now, with confetti for a finished shelf, and little ' +
        'bubbles pop up over you and the neighbours. Gifts they love show hearts.',
      'You turn to whatever you walk up to now, crouch for a stone, tip your can, wave hello ' +
        'and hold up what you find. You also blink. We checked.',
      'The light is redone: sunny cloud shadows by day, soft glowing lamps at night, silver under a full moon, puddles in the rain. Nights are best. I checked.',
      "The neighbours aren't statues now: they stroll, breathe, blink, wave hello, chat in " +
        'pairs, sit on benches and do their jobs. Maude floats properly too.',
      'The town moves on its own: the fountain splashes, the big wheel turns, candles ' +
        'flicker, doors open for you, crows and bats fly over and leaves fall in autumn.',
    ],
    ps: 'P.S. If your phone asks for less motion, everything here keeps very still. Mostly.',
  },
  {
    version: '1.0',
    lines: [
      'The ground is all new, and the town turns with the seasons: blossom in spring, green ' +
        'summers, leaves piling up in autumn and snow all winter. Somebody skates!',
      'Your neighbours remember what you gave, wore and grew, ask you things, keep your ' +
        'answers, and their faces show how they feel. And I have said hello, in person!',
      "Cody is married to you (he asked me to type it in bold; I can't) and round most " +
        'evenings to ask how your day was. Birthdays are parties now!',
      "Today says what's waiting, the weeks bring surprises (a meteor shower, if you're " +
        'lucky), and the noticeboard has things for the whole town to build!',
      'Fish come in sizes, the fair wants a well-timed tap, and pets grow fond enough to help ' +
        'on walks and learn a trick. Every button has a little drawing now.',
    ],
    ps: 'P.S. A big one, so I typed it on my best paper. The W still sticks. It always will.',
  },
  {
    version: '1.2',
    lines: [
      'The little switch on the side of your phone hushes the whole town now. Want us anyway? ' +
        "Settings has Play on silent, and we'll play right through.",
      'The crickets have learnt to take a breath, a little song then a long rest. An Ambience ' +
        'switch hushes the wind, rain and crickets; the music stays.',
      'The square is flagstones now, with two benches and a ring round the well. The woods ' +
        'wander at their edges, and the ice has cracks, a shine and floes.',
      "Some neighbours are sturdier and some slimmer (I'm told I am; I had a new sash made). " +
        'Pets trot straight to you, and planters grow in the back room too.',
      "Today says which fair stall's first go is free, a card asks before your greenhouse " +
        "moves things, October has surprises, and winter's pumpkins are snow lanterns.",
    ],
    ps: 'P.S. Typed very quietly, in case your phone is on silent. The W still sticks.',
  },
  {
    version: '1.3',
    lines: [
      "The moon sends visitors twice a month now, the day after it's full and the day after " +
        "it's new. Only a fussy full-moon few still wait the month.",
      'The Cabinet and Today say which day is next, so nobody has to ask the moon. It was ' +
        'getting tired of being asked, and it is very far up.',
      'Bats have proper wings, moths two pairs, fish have tails you can see in their shadows, ' +
        'orbs are little wisps, and Fibi and Dolly have soft grey muzzles.',
      "The town's trees have all their leaves back. The bare and crooked ones moved out to the " +
        "woods' edges, which suits them, and one stayed by the graves.",
      'The town runs a little lighter on your phone. This is my last typed note for a while, ' +
        "but we'll all be right here every day, just as you left us.",
    ],
    ps: 'P.S. I shall keep the typewriter oiled, just in case. The W still sticks. I have grown rather fond of it.',
  },
  {
    version: '1.4',
    lines: [
      // 1.4's G1: the shinies.
      'Once in a while a critter is the wrong colour on purpose, and prettier for it. Look for ' +
        'a twinkle: a shiny one is about.',
      "A shiny is worth twice as much, takes its museum case in the plain one's place, and " +
        'Wrapunzel has two new shelves just for them.',
      // 1.4's G2: the winter wardrobe and sets.
      'Cobweb Corner has winter woollies from November, a snug look each week: duffel coats, ' +
        'mittens, bobble hats and, I am told, a bat onesie.',
      'Two new sets for long evenings: a Cosy Cabin with a crackling log stove, and a Midnight ' +
        'Observatory whose telescope hums to the stars.',
      // 1.4's G3: ice fishing and the ice hut.
      'When the pond freezes, the fish carry on underneath: fish through the ice for four ' +
        'winter ones, or help Gourdon build his ice hut, stove and all.',
    ],
    ps: 'P.S. The typewriter keys are cold in the mornings now. I type in mittens. Please excuse the typos.',
  },
  {
    version: '1.5',
    lines: [
      // 1.5's G4: the night sky.
      'There is a telescope by the castle gate now. On a clear night, look through it: a ' +
        'constellation a month, and three more for the holidays.',
      'Tap its stars in order and it lights up. Tap the wrong one and it only twinkles at you. ' +
        "The stars are very forgiving. I've checked.",
      'Every one you trace goes on your star chart, in the Cabinet. Hazel would like you to ' +
        'know she has been waiting years for someone to say so.',
    ],
    ps: 'P.S. Hazel has asked me to say: the stars come out after eight, and so should you. Wrap up warm.',
  },
];

/** The top of every card, and how it's signed. */
export const NOTES_HEAD = {
  from: 'From the desk of the Mayor',
  dear: 'Dear {name},',
  intro: "A few things have changed around town since you were last here. I've typed them up.",
  signed: 'Warmly,\nThe Mayor',
  /** Her answer, on the button. */
  reply: 'Thank you, Mayor!',
};
