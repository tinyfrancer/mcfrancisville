import type { CalendarId } from '../data/calendar';
import { el, moving } from './dom';
import { glyph } from './glyph';
import { batFrames } from '../sprites/ui';

/**
 * The bats over the title (V1's L5): how far down the sky each flies (a percentage of the
 * picture's height), where it hangs when nothing moves, how long a crossing takes and when it
 * sets off.
 */
const BATS = [
  { y: 3, x: 18, seconds: 11, after: 0.4 },
  { y: 8, x: 62, seconds: 15, after: 4 },
  { y: 5, x: 40, seconds: 19, after: 9 },
] as const;

/** How long the title takes to fade into the town (V1's E4); `styles.ts`'s `hud-title-out`. */
export const TITLE_FADE_MS = 420;

/** What the title screen shows, and remembers per phone. */
export interface TitleApi {
  /** Draws the title's picture, at 1×. */
  art(canvas: HTMLCanvasElement): void;
  /** His words to her, who signs them, and her answer. */
  dedication: { line: string; signed: string; reply: string };
  /** The festival on, if one is ("The Halloween Festival"), its mark, and its countdown. */
  festival(): { mark: CalendarId; name: string; countdown: string } | null;
}

export const DEDICATION_SEEN_KEY = 'mcfrancisville:dedicationSeen';

function seen(): boolean {
  try {
    return localStorage.getItem(DEDICATION_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(DEDICATION_SEEN_KEY, '1');
  } catch {
    // A phone that won't keep it shows him saying it again, which is no hardship.
  }
}

/**
 * The title screen (phase V): the town's name over her house, and a tap to begin. The first time,
 * his dedication to her follows it on a card of its own; after that it's written on the title,
 * so he greets her every time she opens the game (personal_touches.md, "After phase V").
 */
export function openTitle(hud: HTMLElement, api: TitleApi, onStart: () => void): void {
  const { dedication } = api;
  const art = el('canvas', { className: 'hud-title-picture' });
  api.art(art);
  // At a whole scale of her pixels that fits the phone, so every one of them stays square.
  // On its side the picture stands beside the words, so it's the height it has to fit.
  const sideways = window.innerWidth > window.innerHeight && window.innerHeight <= 560;
  const room = sideways ? window.innerHeight - 40 : Math.min(window.innerWidth, 480) - 48;
  const along = sideways ? art.height : art.width;
  const scale = Math.max(1, Math.floor(room / Math.max(1, along)));
  art.style.width = `${art.width * scale}px`;
  // Bats cross its night sky (V1's L5), at its own scale, in the game's own pixels.
  const scene = el('div', { className: 'hud-title-art' }, art);
  scene.style.setProperty('--scale', String(scale));
  BATS.forEach(({ y, x, seconds, after }, k) => {
    const bat = el('span', { className: 'hud-title-bat' });
    const [up, down] = batFrames();
    bat.append(el('img', { src: up!, alt: '' }), el('img', { src: down!, alt: '' }));
    bat.style.setProperty('--y', String(y));
    bat.style.setProperty('--x', String(x));
    bat.style.setProperty('--seconds', `${seconds}s`);
    bat.style.setProperty('--after', `${after}s`);
    bat.setAttribute('aria-hidden', 'true');
    bat.dataset.bat = String(k);
    scene.append(bat);
  });
  const begin = el('button', {
    type: 'button',
    className: 'hud-primary hud-title-begin',
    textContent: 'Tap to begin',
  });
  const screen = el(
    'div',
    { className: 'hud-title' },
    el('h1', { textContent: 'McFrancisVille' }),
    el('p', { className: 'hud-title-line', textContent: 'a cozy little spooky town' }),
    scene,
  );
  const festival = api.festival();
  if (festival) {
    screen.append(
      el(
        'p',
        { className: 'hud-title-festival' },
        glyph({ mark: festival.mark }),
        ' ',
        festival.name,
        el('small', {}, festival.countdown),
      ),
    );
  }
  const known = seen();
  if (known) {
    screen.append(el('p', { className: 'hud-title-dedication', textContent: dedication.line }));
  }
  screen.append(begin);
  hud.append(screen);

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    // It fades into the town rather than vanishing, out of reach of a second tap as it goes.
    if (moving()) {
      screen.classList.add('hud-title-leaving');
      setTimeout(() => screen.remove(), TITLE_FADE_MS);
    } else screen.remove();
    if (known) onStart();
    else openDedication(hud, dedication, onStart);
  };
  screen.addEventListener('click', start);
}

/** His words to her, the whole screen to themselves, until she answers. */
function openDedication(hud: HTMLElement, dedication: TitleApi['dedication'], onDone: () => void) {
  const reply = el('button', {
    type: 'button',
    className: 'hud-primary hud-dedication-reply',
  });
  // Her answer (`reply`, a heart) in the game's own pixels, not the phone's (V1's L5).
  reply.append(glyph('heart', 32));
  reply.setAttribute('aria-label', 'Love you too');
  const card = el(
    'div',
    { className: 'hud-dedication' },
    el('p', { className: 'hud-dedication-line', textContent: dedication.line }),
    el('p', { className: 'hud-dedication-signed', textContent: dedication.signed }),
    reply,
  );
  hud.append(card);
  reply.addEventListener('click', () => {
    markSeen();
    card.remove();
    onDone();
  });
}
