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
 * The sound and music switches, the backup code, restoring from one, and whether this phone is
 * keeping the town safe.
 */
export function openSettings(hud: HTMLElement, api: SaveApi, sound: SoundApi): () => void {
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
  const status = el('p', { className: 'hud-status' });
  const done = el('button', { type: 'button', textContent: 'Done' });

  const { sheet, close } = openSheet(hud);
  sheet.append(
    el('h2', {}, 'Settings'),
    status,
    el('h3', {}, 'Sound'),
    el(
      'div',
      { className: 'hud-row' },
      toggle('Sounds', sound.effects, sound.setEffects),
      toggle('Music', sound.music, sound.setMusic),
    ),
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
    el('div', { className: 'hud-row' }, done),
  );

  done.addEventListener('click', close);

  void api.backupCode().then((text) => (code.value = text));
  void api.status().then(({ persisted, standalone }) => {
    status.textContent =
      persisted || standalone
        ? 'Your town is saved on this phone, and kept safe. ✓'
        : 'Your town is saved on this phone. Add the game to your Home Screen to keep it safe.';
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

  return close;
}
