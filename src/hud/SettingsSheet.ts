import { NOTES, type PatchNotes } from '../data/patchNotes';
import type { Closeness } from '../types/view';
import { el, openSheet } from './dom';

/** What the sheet may ask of the game. It never reaches the world directly. */
export interface SaveApi {
  backupCode(): Promise<string>;
  /** Replaces the save with the code's town. Resolves only on failure: success reloads the page. */
  restore(code: string): Promise<{ ok: false; reason: string } | { ok: true }>;
  status(): Promise<{ persisted: boolean; standalone: boolean }>;
}

/** Whether this phone plays the game's sounds and music. */
export interface SoundApi {
  effects(): boolean;
  music(): boolean;
  setEffects(on: boolean): void;
  setMusic(on: boolean): void;
}

/** How close the camera is on this phone (decision 290). */
export interface ViewApi {
  closeness(): Closeness;
  setCloseness(closeness: Closeness): void;
}

/** What each closeness is called, and what it's like. */
const CLOSENESS: readonly { id: Closeness; label: string; line: string }[] = [
  { id: 'close', label: 'Close', line: 'Up close, to see faces and little things.' },
  { id: 'far', label: 'Far', line: 'Farther out, to see more of the town at once.' },
];

/** Close and Far side by side, the one she has chosen pressed, and what it's like under them. */
function closenessPicker(view: ViewApi): HTMLElement {
  const line = el('p', { className: 'hud-view-line' });
  const chips = CLOSENESS.map((c) => {
    const chip = el('button', { type: 'button', className: 'hud-chip hud-view-chip' }, c.label);
    chip.dataset.closeness = c.id;
    chip.addEventListener('click', () => {
      view.setCloseness(c.id);
      show();
    });
    return chip;
  });
  const show = () => {
    const now = view.closeness();
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.closeness === now));
    }
    line.textContent = CLOSENESS.find((c) => c.id === now)?.line ?? '';
  };
  show();
  return el('div', {}, el('div', { className: 'hud-row' }, ...chips), line);
}

/** A switch that says what it is and whether it's on, big enough for a thumb. */
function toggle(label: string, on: () => boolean, set: (on: boolean) => void): HTMLButtonElement {
  const button = el('button', { type: 'button', className: 'hud-toggle' });
  const show = () => {
    button.textContent = `${label}: ${on() ? 'on' : 'off'}`;
    button.setAttribute('aria-pressed', String(on()));
  };
  button.addEventListener('click', () => {
    set(!on());
    show();
  });
  show();
  return button;
}

/**
 * Settings (0.2's U4), on the sheet frame: whether this phone is keeping the town safe under the
 * title, then a tab each for how close the camera is (decision 290), the sound and music switches, the mayor's notes on this version to
 * read again, and the backup code with restoring from one.
 */
export function openSettings(
  hud: HTMLElement,
  api: SaveApi,
  sound: SoundApi,
  readNotes: (notes: PatchNotes) => void,
  view?: ViewApi,
): () => void {
  const newest = NOTES[NOTES.length - 1]!;
  const notes = el('button', {
    type: 'button',
    className: 'hud-read-notes',
    textContent: `What's new in ${newest.version}`,
  });
  notes.addEventListener('click', () => readNotes(newest));
  const code = el('textarea', {
    readOnly: true,
    className: 'hud-code',
    value: 'Making your code…',
  });
  const copyMessage = el('p', { className: 'hud-message' });
  const copy = el('button', { type: 'button', textContent: 'Copy' });
  const share = el('button', { type: 'button', textContent: 'Share' });
  const paste = el('textarea', {
    className: 'hud-paste',
    placeholder: 'Paste a code that starts with MFV',
  });
  const restore = el('button', {
    type: 'button',
    textContent: 'Restore',
    className: 'hud-restore',
  });
  const restoreMessage = el('p', { className: 'hud-message' });
  const sheet = openSheet(hud, {
    title: 'Settings',
    line: 'Your town is saved on this phone.',
    tabs: [
      ...(view ? [{ id: 'view', label: 'View' }] : []),
      { id: 'sound', label: 'Sound' },
      { id: 'notes', label: 'News' },
      { id: 'backup', label: 'Backup' },
    ],
    memory: 'settings',
    className: 'hud-settings-sheet',
  });
  if (view) {
    sheet.panel('view').append(el('p', {}, 'Just for this phone.'), closenessPicker(view));
  }
  sheet
    .panel('sound')
    .append(
      el('p', {}, 'Just for this phone.'),
      el(
        'div',
        { className: 'hud-row' },
        toggle('Sounds', sound.effects, sound.setEffects),
        toggle('Music', sound.music, sound.setMusic),
      ),
    );
  sheet
    .panel('notes')
    .append(
      el('p', {}, 'The mayor types up what has changed in town each time the game does.'),
      el('div', { className: 'hud-row' }, notes),
    );
  sheet
    .panel('backup')
    .append(
      el('h3', {}, 'Keep your town safe'),
      el(
        'p',
        {},
        'Copy this code somewhere safe, like Notes. It can bring your town back on any phone.',
      ),
      code,
      el('div', { className: 'hud-row' }, copy, ...('share' in navigator ? [share] : [])),
      copyMessage,
      el('h3', {}, 'Bring a town back'),
      paste,
      el('div', { className: 'hud-row' }, restore),
      restoreMessage,
    );

  void api.backupCode().then((text) => (code.value = text));
  void api.status().then(({ persisted, standalone }) => {
    sheet.line(
      persisted || standalone
        ? 'Your town is saved on this phone, and kept safe. ✓'
        : 'Your town is saved on this phone. Add the game to your Home Screen to keep it safe.',
    );
  });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.value);
      copyMessage.textContent = 'Copied!';
    } catch {
      code.select();
      copyMessage.textContent = 'Select the code above and copy it.';
    }
  });
  share.addEventListener('click', () => {
    navigator.share?.({ title: 'McFrancisVille backup', text: code.value }).catch(() => {});
  });
  restore.addEventListener('click', async () => {
    const text = paste.value.trim();
    if (!text) {
      restoreMessage.textContent = 'Paste a code first.';
      return;
    }
    if (
      !window.confirm('This replaces the town on this phone with the one in the code. Go ahead?')
    ) {
      return;
    }
    const result = await api.restore(text);
    if (!result.ok) restoreMessage.textContent = result.reason;
  });

  return sheet.close;
}
