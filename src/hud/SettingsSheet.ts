/** What the sheet may ask of the game. It never reaches the world directly. */
export interface SaveApi {
  backupCode(): Promise<string>;
  /** Replaces the save with the code's town. Resolves only on failure: success reloads the page. */
  restore(code: string): Promise<{ ok: false; reason: string } | { ok: true }>;
  status(): Promise<{ persisted: boolean; standalone: boolean }>;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** The backup code, restoring from one, and whether this phone is keeping the town safe. */
export function openSettings(hud: HTMLElement, api: SaveApi): () => void {
  const backdrop = el('div', { className: 'hud-backdrop' });
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

  const sheet = el(
    'div',
    { className: 'hud-sheet', role: 'dialog' },
    el('h2', {}, 'Settings'),
    status,
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

  const close = () => {
    backdrop.remove();
    sheet.remove();
  };
  backdrop.addEventListener('click', close);
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

  hud.append(backdrop, sheet);
  return close;
}
