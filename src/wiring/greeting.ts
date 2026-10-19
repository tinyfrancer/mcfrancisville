import { voiceOf } from '../audio/cues';
import type { SoundBoard } from '../audio/SoundBoard';
import { SAFE_KEEPING } from '../data/greetings';
import type { Hud } from '../hud/Hud';
import { visitLine } from '../hud/messages';
import { runningStandalone } from '../persistence/persist';
import { markNudged, readBackedUpAt, readNudgedAt } from '../safekeeping';
import { nudgeFor } from '../systems/backupNudge';
import { greetingFeeling } from '../systems/moods';
import { bandOf } from '../systems/remembering';
import type { Welcome } from '../world/services/Visits';
import type { World } from '../world/World';
import type { Keeping } from './keeping';

/** What going in reads: the town, the HUD to greet her on, the sound, and her kept town. */
export interface Entering {
  world: World;
  hud: Hud;
  sound: SoundBoard;
  keeping: Keeping;
  /** When she last played, from the town that was loaded, for Cody's welcome back. */
  lastPlayedAt: number | null;
  /** Something changed that the next save should keep. */
  changed: () => void;
}

/**
 * Going in, once past the title (decisions.md 24, 114, 115): the creator for a new town, then Cody's
 * hello; after that, his welcome back each time, with what today's visit brought.
 */
export function enterer({ world, hud, sound, keeping, lastPlayedAt, changed }: Entering) {
  const { autosave } = keeping;
  // A word under Cody's hello about keeping the town safe, about once a week, never on the first
  // (V1's S3); when it's said is the phone's, never the save's.
  const nudgeNow = (kind: string): string | null => {
    const now = Date.now();
    const standalone = runningStandalone();
    const keeps = { now, standalone, backedUpAt: readBackedUpAt(), nudgedAt: readNudgedAt() };
    const nudge = kind === 'first' ? null : nudgeFor({ ...keeps, since: keeping.createdAt() });
    if (nudge) markNudged(now);
    return nudge && SAFE_KEEPING[nudge];
  };
  // Cody's greeting, with what today's visit brought (decisions.md 24, 114, 115).
  const greet = ({ greeting, visit }: Welcome) => {
    const nudge = nudgeNow(greeting.kind);
    hud.greet({
      ...(nudge && { nudge }),
      from: 'cody',
      line: greeting.line,
      // His face on the card is his line's (1.0.1).
      feel: greetingFeeling(greeting.line, bandOf(world.friends.hearts('cody'), 'cody')),
      reply: greeting.reply,
      ...(visit && { gift: visitLine(visit.count, visit.gift) }),
      ...(greeting.after && { after: greeting.after }),
      ...(greeting.kind === 'redOne' && { redOne: true }),
      // A new town's first hello is followed by his list for her first day (V1's R1).
      ...(greeting.kind === 'first' && { then: () => hud.openFirstDay() }),
    });
    changed();
  };
  // No look yet means she hasn't met the creator: a new game, or a save from before phase 3. Once
  // she has, Cody says hello; after that, he welcomes her back each time.
  return () => {
    if (!world.wardrobe.created) {
      hud.openCreator(() => {
        autosave.flush();
        const welcome = world.visits.welcome(null);
        greet(welcome);
        sound.cue(voiceOf('cody', welcome.greeting.line));
      });
    } else {
      greet(world.visits.welcome(lastPlayedAt));
    }
  };
}
