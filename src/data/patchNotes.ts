/**
 * What's new in each version she's given, as the mayor types it up (session B3 of 0.2, decision
 * 142): nobody has met the mayor, so the notes come off their typewriter, warm and a little too
 * busy, like their letters in `mystery.ts`. Oldest first, and only ever added to: the last row is
 * the version on her phone, and a release to `main` adds its row (or finishes the newest one).
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
        'the Cabinet wait behind the ☰ while you are out and about.',
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
      'They held a vote about it. The ☰ abstained.',
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
      'A 👥 by the calendar shows all your neighbours: hearts, birthdays, favourite things, ' +
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
      'Boots go under skirts and dresses now, every shoe peeking out from under its hem, even ' +
        'the ball gown’s, and tall boots still pull up over jeans.',
      'From behind, a cape falls over your boots, not the other way round. Your neighbours ' +
        'in skirts have had their shoes seen to as well.',
      'Your storage chest takes things from your bag now: tap one at home and put it away. ' +
        'The Items tab in the chest gives it back.',
      'Your squishy shelf and dollhouse show the ones you have now, and Cobweb Corner sells ' +
        'bell jars, shadow boxes and more: walk up to one to put a treasure on show.',
      "The vampire cape's collar stands up past any hairdo and tucks your hair in from " +
        'behind. Wings sit on your back, over your gloves and bracelets.',
    ],
    ps: 'P.S. I asked the boots why. They said they only wanted to be seen. I have let it go.',
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
