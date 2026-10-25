import { PHOTO_LINE } from '../data/finale';
import { el, openSheet } from './dom';
import { keepPhoto, photoName } from './keepPhoto';

/** What a photo's card says, and what happens after it, where it isn't the party's. */
export interface PhotoWords {
  title?: string;
  line?: string;
  done?: string;
  /** A button back to take another, named so (1.5's G5). */
  another?: string;
  /** The card is gone: `again` if it went by Another. */
  closed?: (again: boolean) => void;
  /** When it was taken, for the kept file's name. */
  takenAt?: () => number;
}

/**
 * Their photo at the Halloween party (0.2's J4, question 75): a flash, then the picture as a
 * polaroid with its caption. The picture is the game's own, cropped round the two of them by the
 * view, and shown at a whole scale so its pixels stay square. With a `print` (V1's S3), a "Keep
 * it" button hands the print to the phone's share sheet, or downloads it. The photo mode's
 * (1.5's G5) says its own words, and has an Another, back to the viewfinder.
 */
export function openPhoto(
  hud: HTMLElement,
  picture: HTMLCanvasElement,
  caption: string,
  print?: () => Promise<Blob | null>,
  words: PhotoWords = {},
): void {
  const flash = el('div', { className: 'hud-flash' });
  hud.append(flash);
  flash.addEventListener('animationend', () => flash.remove());
  let again = false;
  const sheet = openSheet(hud, {
    title: words.title ?? 'Say "boo"!',
    line: words.line ?? PHOTO_LINE,
    className: 'hud-photo-sheet',
    done: words.done ?? 'Lovely',
    onClose: () => words.closed?.(again),
  });
  const { body } = sheet;
  const room = Math.min(260, window.innerWidth - 96);
  // A whole scale where it fits; a photo wider than the card (the photo mode's) is shown smaller,
  // and kept at its own size in the print.
  const scale = Math.max(1, Math.floor(room / picture.width));
  const shown = Math.min(picture.width * scale, Math.max(room, 1));
  picture.className = 'hud-photo-picture';
  picture.style.width = `${shown}px`;
  picture.style.height = `${Math.round((shown * picture.height) / picture.width)}px`;
  body.append(
    el(
      'figure',
      { className: 'hud-polaroid' },
      picture,
      el('figcaption', { textContent: caption }),
    ),
  );
  const another = words.another
    ? el('button', { type: 'button', className: 'hud-photo-another' }, words.another)
    : null;
  another?.addEventListener('click', () => {
    again = true;
    sheet.close();
  });
  if (!print) {
    if (another) sheet.actions(another);
    return;
  }
  const keep = el('button', { type: 'button', className: 'hud-photo-keep' }, 'Keep it');
  keep.addEventListener('click', async () => {
    keep.disabled = true;
    const blob = await print();
    const at = words.takenAt?.() ?? Date.now();
    const kept = blob ? await keepPhoto(blob, photoName(at)) : 'cancelled';
    keep.textContent = kept === 'downloaded' ? 'Saved!' : 'Keep it';
    keep.disabled = false;
  });
  sheet.actions(keep, ...(another ? [another] : []));
}
