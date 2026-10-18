import { PHOTO_LINE } from '../data/finale';
import { el, openSheet } from './dom';
import { keepPhoto, photoName } from './keepPhoto';

/**
 * Their photo at the Halloween party (0.2's J4, question 75): a flash, then the picture as a
 * polaroid with its caption. The picture is the game's own, cropped round the two of them by the
 * view, and shown at a whole scale so its pixels stay square. With a `print` (V1's S3), a "Keep
 * it" button hands the print to the phone's share sheet, or downloads it.
 */
export function openPhoto(
  hud: HTMLElement,
  picture: HTMLCanvasElement,
  caption: string,
  print?: () => Promise<Blob | null>,
): void {
  const flash = el('div', { className: 'hud-flash' });
  hud.append(flash);
  flash.addEventListener('animationend', () => flash.remove());
  const sheet = openSheet(hud, {
    title: 'Say "boo"!',
    line: PHOTO_LINE,
    className: 'hud-photo-sheet',
    done: 'Lovely',
  });
  const { body } = sheet;
  const room = Math.min(260, window.innerWidth - 96);
  const scale = Math.max(1, Math.floor(room / picture.width));
  picture.className = 'hud-photo-picture';
  picture.style.width = `${picture.width * scale}px`;
  picture.style.height = `${picture.height * scale}px`;
  body.append(
    el(
      'figure',
      { className: 'hud-polaroid' },
      picture,
      el('figcaption', { textContent: caption }),
    ),
  );
  if (!print) return;
  const keep = el('button', { type: 'button', className: 'hud-photo-keep' }, 'Keep it');
  keep.addEventListener('click', async () => {
    keep.disabled = true;
    const blob = await print();
    const kept = blob ? await keepPhoto(blob, photoName(Date.now())) : 'cancelled';
    keep.textContent = kept === 'downloaded' ? 'Saved!' : 'Keep it';
    keep.disabled = false;
  });
  sheet.actions(keep);
}
