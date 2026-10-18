/**
 * Notes of what went wrong on this phone (V1's S3): the last few errors the page didn't catch,
 * kept beside the save (never in it) so Settings can say something went wrong and offer a note to
 * copy for Cody. Nothing here may throw: a game that breaks while noting that it broke is worse
 * than one that forgets.
 */
export const ERRORS_KEY = 'mcfrancisville:errors';

/** How many notes are kept, the newest last. */
export const MOST_NOTES = 5;

/** A note older than this isn't mentioned in Settings any more, though it's still kept. */
export const NOTE_SHOWN_FOR_MS = 30 * 24 * 60 * 60 * 1000;

const MESSAGE_LENGTH = 300;
const STACK_LENGTH = 1200;

export interface ErrorNote {
  /** When it last happened. */
  at: number;
  message: string;
  /** The file and line, when the browser says. */
  where?: string;
  stack?: string;
  /** How many times in a row it happened. */
  times: number;
}

export interface Caught {
  message: string;
  where?: string;
  stack?: string;
}

function isNote(value: unknown): value is ErrorNote {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.at === 'number' &&
    typeof n.message === 'string' &&
    typeof n.times === 'number' &&
    (n.where === undefined || typeof n.where === 'string') &&
    (n.stack === undefined || typeof n.stack === 'string')
  );
}

export function readErrorNotes(
  storage: Storage | undefined = globalThis.localStorage,
): ErrorNote[] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(ERRORS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isNote) : [];
  } catch {
    return [];
  }
}

/** Keeps a note of `caught`, or counts it again if it's the same as the last. */
export function noteError(
  caught: Caught,
  at: number,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    const notes = readErrorNotes(storage);
    const message = caught.message.slice(0, MESSAGE_LENGTH) || 'Something unnamed';
    const last = notes[notes.length - 1];
    if (last && last.message === message && last.where === caught.where) {
      last.at = at;
      last.times += 1;
    } else {
      notes.push({
        at,
        message,
        ...(caught.where && { where: caught.where }),
        ...(caught.stack && { stack: caught.stack.slice(0, STACK_LENGTH) }),
        times: 1,
      });
    }
    storage?.setItem(ERRORS_KEY, JSON.stringify(notes.slice(-MOST_NOTES)));
  } catch {
    // Storage full or blocked: forgotten, and the game goes on.
  }
}

/** What a thrown thing or a rejection's reason says about itself. */
export function caughtFrom(thrown: unknown, where?: string): Caught {
  try {
    if (thrown instanceof Error) {
      return {
        message: `${thrown.name}: ${thrown.message}`,
        ...(where && { where }),
        ...(thrown.stack && { stack: thrown.stack }),
      };
    }
    const message = typeof thrown === 'string' ? thrown : JSON.stringify(thrown);
    return { message: message ?? String(thrown), ...(where && { where }) };
  } catch {
    return { message: 'Something that would not say what it was' };
  }
}

/**
 * Notes every error the page doesn't catch and every promise rejected with nobody listening. It
 * never stops them reaching the console. Returns a function that stops listening.
 */
export function catchErrors(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>,
  now: () => number = Date.now,
  storage: Storage | undefined = globalThis.localStorage,
): () => void {
  const onError = (event: Event) => {
    try {
      const e = event as ErrorEvent;
      const where = e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined;
      const caught = e.error !== undefined && e.error !== null ? caughtFrom(e.error, where) : null;
      noteError(
        caught ?? { message: e.message ?? 'Error', ...(where && { where }) },
        now(),
        storage,
      );
    } catch {
      // Never a second error from the first.
    }
  };
  const onRejection = (event: Event) => {
    try {
      noteError(caughtFrom((event as PromiseRejectionEvent).reason), now(), storage);
    } catch {
      // As above.
    }
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}

/** What Settings says, and the note it copies: null when nothing has gone wrong lately. */
export interface Trouble {
  /** "18 October". */
  on: string;
  /** Every note kept, newest last, for Cody. */
  note: string;
}

export function troubleOf(
  notes: readonly ErrorNote[],
  now: number,
  about: { version: string; userAgent: string },
): Trouble | null {
  const newest = notes[notes.length - 1];
  if (!newest || now - newest.at > NOTE_SHOWN_FOR_MS) return null;
  const on = new Date(newest.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  const lines = notes.map((n) =>
    [
      `${new Date(n.at).toISOString()}${n.times > 1 ? ` (x${n.times})` : ''} ${n.message}`,
      ...(n.where ? [`  at ${n.where}`] : []),
      ...(n.stack ? [n.stack.replace(/^/gm, '  ')] : []),
    ].join('\n'),
  );
  return { on, note: [`McFrancisVille ${about.version}`, about.userAgent, ...lines].join('\n') };
}
