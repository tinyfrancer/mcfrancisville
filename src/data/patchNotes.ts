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
      'A 👥 by the calendar shows all your neighbours: their hearts, birthdays, favourite things, ' +
        'gifts to come and where they are right now.',
      'Boothoven the composer moves in east of the square, welcome party at the well! Pianos, ' +
        'his and yours (a card at Cobweb Corner), play a new tune each time.',
      'Boothoven teaches piano, a tune a day, and plays a duet on your anniversary. Meet him, and the gate past the park opens onto the Hollow Fairground!',
      'At the fair: ring toss, hook-a-ghost, a fortune from Agatha, and corn dogs, fried pickles ' +
        'and vinegar fries!',
    ],
    ps: 'P.S. The tabs were my idea. Cody says folders are not "a whole personality". We differ.',
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
