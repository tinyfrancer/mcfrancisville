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
      'The frozen creek is now officially slippery. Skates are required. Falling over is ' +
        'optional, but historically very popular.',
      "Messages now wait politely until you've finished reading them, and leave the moment " +
        'you tap. We had a word with them.',
      'October is now the Halloween Festival, all month, with a banner we are very proud of. ' +
        'Knock on doors after dark. Bring a bag.',
      'Every outfit now says what it is. The Tigers jersey would like it known that it comes ' +
        'in one colour only, and that it is the right one.',
      'Certain remarks about a certain man behind a certain tree have been reworded. He knows ' +
        'what he did.',
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
