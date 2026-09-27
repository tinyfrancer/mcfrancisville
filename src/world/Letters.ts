import { letterOf } from '../systems/friendship';

/** A letter in her mailbox, by its id (see `letterOf`), the day it came, and whether she's read it. */
export interface MailEntry {
  id: string;
  on: string;
  opened: boolean;
}

/** The letters in her mailbox. A letter, once it has come, stays for good. */
export class Letters {
  private readonly letters: MailEntry[];

  /** A letter a later build wrote, that this one doesn't know, is left out. */
  constructor(saved: readonly MailEntry[] = []) {
    this.letters = saved
      .filter((m) => letterOf(m.id) !== null)
      .map((m) => ({ id: m.id, on: m.on, opened: m.opened === true }));
  }

  get all(): readonly MailEntry[] {
    return this.letters;
  }

  get unread(): number {
    return this.letters.filter((m) => !m.opened).length;
  }

  has(id: string): boolean {
    return this.letters.some((m) => m.id === id);
  }

  /** The day a letter came, or null if it hasn't. */
  cameOn(id: string): string | null {
    return this.letters.find((m) => m.id === id)?.on ?? null;
  }

  /** Puts a letter in her mailbox, unless it's already come. */
  send(id: string, on: string): boolean {
    if (this.has(id) || letterOf(id) === null) return false;
    this.letters.push({ id, on, opened: false });
    return true;
  }

  /** Marks a letter read. True the first time, which is when its gift is taken out. */
  open(id: string): boolean {
    const entry = this.letters.find((m) => m.id === id);
    if (!entry || entry.opened) return false;
    entry.opened = true;
    return true;
  }

  snapshot(): { mail: MailEntry[] } {
    return { mail: this.letters.map((m) => ({ ...m })) };
  }
}
