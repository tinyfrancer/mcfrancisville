import { dayKey } from '../../systems/clock';
import { fill, letterOf, lettersOn, yearsMarried } from '../../systems/friendship';
import type { WorldContext } from '../context';
import type { MailView } from '../events';
import type { Letters } from '../Letters';
import type { Wardrobe } from '../Wardrobe';
import type { Belongings } from './Belongings';

/**
 * Her mailbox: letters posted to it (friendship rewards, special days, holidays, the mayor), reading them,
 * and taking out what came with one the first time it's opened.
 */
export class Mailbox {
  private readonly ctx: WorldContext;
  readonly letters: Letters;
  private readonly belongings: Belongings;
  private readonly wardrobe: Wardrobe;
  /** The last day a special day's letter was looked for, so it's looked for once a day. */
  private checkedOn: string | null = null;

  constructor(ctx: WorldContext, letters: Letters, belongings: Belongings, wardrobe: Wardrobe) {
    this.ctx = ctx;
    this.letters = letters;
    this.belongings = belongings;
    this.wardrobe = wardrobe;
  }

  get unread(): number {
    return this.letters.unread;
  }

  /** Posts a letter, unless it has come already or isn't a letter this build knows. */
  post(id: string, day: string): void {
    const letter = letterOf(id);
    if (!letter || !this.letters.send(id, day)) return;
    this.ctx.moments.push({ kind: 'mail', from: letter.from });
    this.ctx.events.emit('mail', this.letters.unread);
  }

  /** A special day's or a holiday's letter, the first time the world is stepped on that day. */
  checkSpecialDay(): void {
    const day = dayKey(this.ctx.clock.now());
    if (day === this.checkedOn) return;
    this.checkedOn = day;
    for (const id of lettersOn(day)) this.post(id, day);
  }

  /** Her mail, newest first, as she reads it. */
  view(): MailView[] {
    const name = this.wardrobe.look.name;
    return this.letters.all
      .map((m) => {
        const letter = letterOf(m.id)!;
        const text = fill(letter.text, { name, years: yearsMarried(m.on) });
        return { ...letter, text, ...m };
      })
      .reverse();
  }

  /**
   * Opens a letter: the first time, whatever came with it goes where it belongs, and the rest of
   * the world hears it was opened. False if there's no such letter or it was already open.
   */
  open(id: string): boolean {
    if (!this.letters.open(id)) return false;
    const letter = letterOf(id);
    if (letter?.gift) this.belongings.receive(letter.gift);
    this.ctx.signals.emit('opened', { letter: id });
    if (letter?.from === 'cody') this.ctx.signals.emit('thrilled', { by: 'letter' });
    this.ctx.events.emit('mail', this.letters.unread);
    return true;
  }
}
