import { decodeBackup, encodeBackup, type DecodedBackup } from './backup';
import type { Sealer } from './cloudSeal';
import type { SaveState } from './SaveState';

/**
 * Her town kept in the cloud too (V1's S2, decision 323), beside the backup code rather than in
 * place of it. After each write on the phone, a few seconds on, the save goes up (`api/save.ts`)
 * as a backup code sealed with the phone's key, stamped with its `updatedAt`; the newest by that
 * stamp is the one kept (last write wins). With no signal, or the cloud out of reach, the latest
 * waits and goes up on the next write, when the signal's back or the game comes back to the
 * front. Nothing it does can throw, or leave a rejection for the error notes: a walk through a
 * tunnel is no wobble.
 */
export const CLOUD_PATH = '/api/save';
/** A walk across town is one upload, not one a write. */
export const CLOUD_DEBOUNCE_MS = 5000;
/** The function's limit (`MAX_BYTES` in `api/save.ts`). */
export const CLOUD_LIMIT = 256 * 1024;
/** A page going away may only send this much with `keepalive`. */
const KEEPALIVE_LIMIT = 60 * 1024;

/** What the cloud is like from here, for Settings to say. */
export type CloudState =
  /** Not asked yet. */
  | 'unknown'
  | 'ready'
  /** The function is there but its store isn't linked yet (a 503). */
  | 'notSetUp'
  /** No signal, or it didn't answer. */
  | 'offline'
  /** Nothing that answers like the function (a server without it), or a phone with no WebCrypto. */
  | 'unavailable';

/** What the cloud keeps for a key. */
export type Kept = { savedAt: number; data: string };

export type CloudCheck =
  | { kind: 'none' }
  /** The cloud's town is newer than the one the phone opened with. */
  | { kind: 'newer'; savedAt: number }
  | { kind: 'same' }
  | { kind: 'failed'; state: CloudState };

export interface CloudOptions {
  sealer: () => Promise<Sealer | null>;
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  now: () => number;
  online: () => boolean;
  /** After a save went up: Settings' "last backed up" and Cody's nudge count it. */
  backedUp: (at: number) => void;
  /** The cloud keeps a newer town than the phone opened with: she's to be asked. */
  onNewer?: (savedAt: number) => void;
  /** How long after a write it goes up (`CLOUD_DEBOUNCE_MS`). */
  debounceMs?: number;
}

type Got = { ok: true; kept: Kept | null } | { ok: false; state: CloudState };

function isKept(value: unknown): value is Kept {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.savedAt === 'number' && typeof v.data === 'string';
}

/** A response's JSON, or null for anything else, never throwing. */
async function bodyOf(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Asks the cloud what it keeps under a sealer's id. */
export async function fetchKept(
  sealer: Sealer,
  send: CloudOptions['fetch'],
  online: () => boolean,
): Promise<Got> {
  if (!online()) return { ok: false, state: 'offline' };
  let response: Response;
  try {
    // No `Accept: application/json`: a server without the function (Vite's preview) then answers
    // with its page, read as out of reach, rather than a 404 the console would log.
    response = await send(`${CLOUD_PATH}?id=${sealer.id}`, { method: 'GET', cache: 'no-store' });
  } catch {
    return { ok: false, state: 'offline' };
  }
  const body = await bodyOf(response);
  if (response.status === 503 && body?.error === 'not-set-up') {
    return { ok: false, state: 'notSetUp' };
  }
  if (!response.ok) return { ok: false, state: body ? 'offline' : 'unavailable' };
  if (!body || !('save' in body)) return { ok: false, state: 'unavailable' };
  return { ok: true, kept: isKept(body.save) ? body.save : null };
}

/** The town the cloud keeps, opened with its sealer and read through the backup's migrations. */
export async function townFrom(kept: Kept, sealer: Sealer): Promise<DecodedBackup> {
  const code = await sealer.unseal(kept.data);
  if (code === null) {
    return {
      ok: false,
      reason: "That town couldn't be opened with this code. Try typing it again?",
    };
  }
  return decodeBackup(code);
}

export class CloudSave {
  private readonly options: CloudOptions;
  private state: CloudState = 'unknown';
  /**
   * Whether the cloud has said what it has, this time the game was opened. Asked even for a key
   * just made: a server that isn't the function is found out by a GET, before any PUT to it.
   */
  private checked = false;
  private kept: Kept | null = null;
  private pending: SaveState | null = null;
  private sending = false;
  /** While she's asked whether to take a newer town, nothing of this phone's goes up. */
  private held = false;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private keptAt: number | null = null;
  private opened = 0;

  constructor(options: CloudOptions) {
    this.options = options;
  }

  /** What Settings says of it. */
  status(): { state: CloudState; keptAt: number | null } {
    return { state: this.state, keptAt: this.keptAt };
  }

  /**
   * Asks the cloud once what it has, against the stamp of the town the phone opened with. Until
   * that's answered nothing goes up, so a phone that's behind never puts its town over a newer
   * one before she's asked (`onNewer`). A failure is asked again before the next upload.
   */
  async check(openedWith: number): Promise<CloudCheck> {
    this.opened = openedWith;
    if (this.checked) return { kind: this.kept ? 'same' : 'none' };
    const sealer = await this.sealer();
    if (!sealer) return { kind: 'failed', state: this.state };
    const got = await fetchKept(sealer, this.options.fetch, this.options.online);
    if (!got.ok) {
      this.state = got.state;
      return { kind: 'failed', state: got.state };
    }
    this.state = 'ready';
    this.checked = true;
    this.kept = got.kept;
    if (!got.kept) return { kind: 'none' };
    if (got.kept.savedAt <= openedWith) return { kind: 'same' };
    this.held = true;
    this.options.onNewer?.(got.kept.savedAt);
    return { kind: 'newer', savedAt: got.kept.savedAt };
  }

  /** The cloud's newer town, as she's offered it. */
  async newer(): Promise<DecodedBackup | null> {
    const sealer = await this.sealer();
    if (!this.kept || !sealer) return null;
    return townFrom(this.kept, sealer);
  }

  /** She kept the phone's town over the cloud's: it goes up as before, and becomes the newest. */
  keepMine(): void {
    this.held = false;
    if (this.pending) this.schedule();
  }

  /** No more uploads from this page (a restore is about to reload it). */
  stop(): void {
    this.stopped = true;
    this.pending = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  /** The phone just wrote this: it goes up a few seconds on, with whatever's written after. */
  saved(save: SaveState): void {
    if (this.stopped) return;
    this.pending = save;
    this.schedule();
  }

  private schedule(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    const wait = this.options.debounceMs ?? CLOUD_DEBOUNCE_MS;
    this.timer = setTimeout(() => void this.flush(), wait);
  }

  /**
   * Sends what's waiting now: after a write, the signal back, the game back in front, or
   * (`leaving`) the page going away, sent so as to outlive the page when it's small enough.
   */
  async flush(leaving = false): Promise<void> {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (!this.pending || this.sending || this.held || this.stopped) return;
    if (this.state === 'notSetUp' || this.state === 'unavailable') return;
    if (!this.options.online()) {
      this.state = 'offline';
      return;
    }
    this.sending = true;
    try {
      if (!this.checked) {
        const checked = await this.check(this.opened);
        if (checked.kind === 'failed' || checked.kind === 'newer') return;
      }
      await this.send(leaving);
    } catch {
      // Whatever went wrong, the save waits for the next try.
    } finally {
      this.sending = false;
    }
  }

  private async send(leaving: boolean): Promise<void> {
    const save = this.pending;
    const sealer = await this.sealer();
    if (!save || !sealer) return;
    const data = await sealer.seal(await encodeBackup(save));
    const body = JSON.stringify({ savedAt: save.updatedAt, data });
    if (body.length > CLOUD_LIMIT) {
      // Far past anything a town comes to; it stays on the phone and in the backup code.
      if (this.pending === save) this.pending = null;
      return;
    }
    let response: Response;
    try {
      response = await this.options.fetch(`${CLOUD_PATH}?id=${sealer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: leaving && body.length <= KEEPALIVE_LIMIT,
      });
    } catch {
      this.state = 'offline';
      return;
    }
    const answer = await bodyOf(response);
    if (response.ok && answer?.kept === true) {
      this.state = 'ready';
      this.kept = { savedAt: save.updatedAt, data };
      if (this.pending === save) this.pending = null;
      this.keptAt = this.options.now();
      this.options.backedUp(this.keptAt);
    } else if (response.status === 409) {
      // Another phone's town went up after this one was written: the newest is the one kept.
      if (this.pending === save) this.pending = null;
    } else if (response.status === 503 && answer?.error === 'not-set-up') {
      this.state = 'notSetUp';
    } else {
      this.state = answer ? 'offline' : 'unavailable';
    }
  }

  /** The phone's sealer; with none to be had, the cloud is out of reach from here. */
  private async sealer(): Promise<Sealer | null> {
    try {
      const sealer = await this.options.sealer();
      if (!sealer) this.state = 'unavailable';
      return sealer;
    } catch {
      this.state = 'unavailable';
      return null;
    }
  }

  /** Settings is asking: a cloud that wasn't there, or wasn't set up, may be by now. */
  async recheck(): Promise<CloudState> {
    if (this.state === 'ready') return this.state;
    if (!this.checked) {
      await this.check(this.opened);
    } else {
      const sealer = await this.sealer();
      if (sealer) {
        const got = await fetchKept(sealer, this.options.fetch, this.options.online);
        this.state = got.ok ? 'ready' : got.state;
      }
    }
    if (this.state === 'ready' && this.pending && !this.held) this.schedule();
    return this.state;
  }
}
