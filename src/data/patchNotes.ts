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
