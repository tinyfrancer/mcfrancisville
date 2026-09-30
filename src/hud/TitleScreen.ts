import { el } from './dom';

/** What the title screen shows, and remembers per phone. */
export interface TitleApi {
  /** Draws the title's picture, at 1×. */
  art(canvas: HTMLCanvasElement): void;
  /** His words to her, who signs them, and her answer. */
  dedication: { line: string; signed: string; reply: string };
  /** The festival on, if one is, and its countdown: "🦇 The Halloween Festival · 26 days to Halloween". */
  festival(): string | null;
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
  const art = el('canvas', { className: 'hud-title-art' });
  api.art(art);
  // At a whole scale of her pixels that fits the phone, so every one of them stays square.
  const room = Math.min(window.innerWidth, 480) - 48;
  const scale = Math.max(1, Math.floor(room / Math.max(1, art.width)));
  art.style.width = `${art.width * scale}px`;
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
    art,
  );
  const festival = api.festival();
  if (festival) screen.append(el('p', { className: 'hud-title-festival', textContent: festival }));
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
    screen.remove();
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
    textContent: dedication.reply,
  });
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
