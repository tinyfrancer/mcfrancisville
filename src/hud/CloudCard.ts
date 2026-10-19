import { button, el, openSheet } from './dom';
import { qrPicture } from './qr';

/**
 * The cloud save as Settings shows it (V1's S2, decision 323): how it's going, this phone's code
 * as words and a QR to keep, and a field to bring a town back from another phone's code.
 */
export type CloudShown = 'unknown' | 'ready' | 'notSetUp' | 'offline' | 'unavailable';

export interface CloudApi {
  /** This phone's cloud code in fours, or null if the phone can't keep one. */
  code(): string | null;
  /** How the cloud is, asked again where it wasn't there before. */
  status(): Promise<{ state: CloudShown; keptAt: number | null }>;
  /** The town kept under that code, put on this phone. Resolves only on failure: success reloads. */
  restore(code: string): Promise<{ ok: false; reason: string } | { ok: true }>;
}

/** What's said of the cloud, by how it is. */
export function cloudLine(state: CloudShown, keptAt: number | null): string {
  switch (state) {
    case 'ready':
      return keptAt === null
        ? 'Your town goes up to the cloud as you play.'
        : `Your town goes up to the cloud as you play. Last kept at ${clock(keptAt)}.`;
    case 'notSetUp':
      return "The cloud isn't set up yet. Until it is, your town is kept on this phone and in the code above.";
    case 'offline':
      return "The cloud can't be reached just now. Your town goes up when there's signal again.";
    case 'unavailable':
      return "The cloud can't be reached from here, so your town is kept on this phone and in the code above.";
    case 'unknown':
      return 'Asking the cloud…';
  }
}

const clock = (at: number) =>
  new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** The Cloud section of Settings' Backup tab. */
export function cloudSection(api: CloudApi): HTMLElement {
  const section = el('div', { className: 'hud-cloud' });
  const line = el('p', { className: 'hud-cloud-line' }, cloudLine('unknown', null));
  section.append(el('h3', {}, 'Kept in the cloud'), line);
  void api.status().then(({ state, keptAt }) => (line.textContent = cloudLine(state, keptAt)));

  const code = api.code();
  if (code) {
    const copied = el('p', { className: 'hud-message' });
    const copy = button('Copy cloud code', async () => {
      try {
        await navigator.clipboard.writeText(code);
        copied.textContent = 'Copied!';
      } catch {
        copied.textContent = 'Write it down, or scan the square with another phone.';
      }
    });
    copy.classList.add('hud-cloud-copy');
    section.append(
      el(
        'p',
        {},
        'This is your cloud code. With it, any phone can bring your town back, so keep it somewhere safe and just for you.',
      ),
      el('p', { className: 'hud-cloud-code' }, code),
      el('div', { className: 'hud-cloud-qr' }, qrPicture(code, 5)),
      el('div', { className: 'hud-row' }, copy),
      copied,
    );
  }

  const field = el('input', {
    type: 'text',
    className: 'hud-cloud-field',
    placeholder: 'A cloud code, like 7KQ2-M9XA-…',
    autocomplete: 'off',
    spellcheck: false,
  });
  field.setAttribute('autocapitalize', 'characters');
  const said = el('p', { className: 'hud-message' });
  const restore = button('Bring it back', async () => {
    const text = field.value.trim();
    if (!text) {
      said.textContent = 'Type or paste a cloud code first.';
      return;
    }
    if (
      !window.confirm('This replaces the town on this phone with the one in the cloud. Go ahead?')
    ) {
      return;
    }
    said.textContent = 'Asking the cloud…';
    const result = await api.restore(text);
    if (!result.ok) said.textContent = result.reason;
  });
  restore.classList.add('hud-cloud-restore');
  section.append(
    el('h3', {}, 'Bring a town back from the cloud'),
    field,
    el('div', { className: 'hud-row' }, restore),
    said,
  );
  return section;
}

/** The answers to the offer of a newer town from the cloud. */
export interface CloudOffer {
  /** Take the cloud's: resolves with why not, if it couldn't be (success reloads). */
  take(): Promise<string | null>;
  /** Keep the phone's. */
  keep(): void;
}

/**
 * The cloud has a newer town than this phone opened with (another phone's, most likely): she's
 * asked, never left to find it swapped (decision 323). Either way, `then` once it's settled.
 */
export function offerCloud(
  hud: HTMLElement,
  savedAt: number,
  offer: CloudOffer,
  then: () => void = () => {},
): void {
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    then();
  };
  const said = el('p', { className: 'hud-message' });
  const sheet = openSheet(hud, {
    title: 'A newer town in the cloud',
    line: `Kept ${new Date(savedAt).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}`,
    className: 'hud-cloud-offer',
    dismissable: false,
    done: null,
    onClose: () => {
      offer.keep();
      settle();
    },
  });
  let taking = false;
  const take = button(
    'Take the cloud’s',
    async () => {
      if (taking) return;
      taking = true;
      said.textContent = 'Bringing it down…';
      const why = await offer.take();
      taking = false;
      if (why !== null) said.textContent = why;
    },
    true,
  );
  take.classList.add('hud-cloud-take');
  const keep = button('Keep this phone’s', () => sheet.close());
  keep.classList.add('hud-cloud-keep');
  sheet.body.append(
    el(
      'p',
      {},
      'The cloud has your town from a little later than this phone does, played on another phone perhaps. Which would you like?',
    ),
    said,
  );
  sheet.actions(keep, take);
}
