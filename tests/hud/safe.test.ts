import { describe, expect, it, vi } from 'vitest';
import { keepPhoto, photoName, type Sharer } from '../../src/hud/keepPhoto';
import {
  openSettings,
  troubleLine,
  type SaveApi,
  type SoundApi,
} from '../../src/hud/SettingsSheet';
import { openGreeting } from '../../src/hud/TalkSheet';

const sound = (trouble: SoundApi['trouble']): SoundApi => ({
  effects: () => true,
  music: () => true,
  ambience: () => true,
  playOnSilent: () => false,
  setEffects() {},
  setMusic() {},
  setAmbience() {},
  setPlayOnSilent() {},
  trouble,
});

function saveApi(): SaveApi & { stamps: number } {
  let at: number | null = null;
  const api = {
    stamps: 0,
    backupCode: () => Promise.resolve('MFV1-abc'),
    restore: () => Promise.resolve({ ok: true as const }),
    status: () => Promise.resolve({ persisted: true, standalone: true }),
    backedUpLine: () => (at === null ? 'never' : 'today'),
    backedUp: () => {
      at = 1;
      api.stamps += 1;
    },
  };
  return api;
}

const tab = (hud: HTMLElement, label: string) =>
  [...hud.querySelectorAll<HTMLButtonElement>('.hud-sheet-tab')].find(
    (b) => b.textContent === label,
  )!;

describe("keeping the town safe in Settings (V1's S3)", () => {
  it('says when this phone last backed up, and again once a code is copied', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const hud = document.createElement('div');
    const api = saveApi();
    const close = openSettings(
      hud,
      api,
      sound(() => null),
      () => {},
    );
    await Promise.resolve();
    await Promise.resolve();
    tab(hud, 'Backup').click();
    const line = () => hud.querySelector('.hud-backed-up')?.textContent;
    expect(line()).toBe('never');
    const copy = [...hud.querySelectorAll('button')].find((b) => b.textContent === 'Copy')!;
    copy.click();
    await vi.waitFor(() => expect(line()).toBe('today'));
    expect(api.stamps).toBe(1);
    close();
  });

  it('mentions something going wrong beside the sound, with a note to copy for Cody', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const hud = document.createElement('div');
    const close = openSettings(
      hud,
      saveApi(),
      sound(() => ({ on: '18 October', note: 'McFrancisVille 0.9\noops' })),
      () => {},
    );
    tab(hud, 'Sound').click();
    expect(hud.querySelector('.hud-trouble')?.textContent).toBe(troubleLine('18 October'));
    hud.querySelector<HTMLButtonElement>('.hud-trouble-copy')!.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('McFrancisVille 0.9\noops'));
    close();
  });

  it('says nothing about trouble when there was none', () => {
    const hud = document.createElement('div');
    const close = openSettings(
      hud,
      saveApi(),
      sound(() => null),
      () => {},
    );
    expect(hud.querySelector('.hud-trouble')).toBeNull();
    close();
  });
});

describe("Cody's nudge under his hello (V1's S3)", () => {
  it('sits under his line when there is one', () => {
    const hud = document.createElement('div');
    const api = { portrait() {}, redOne() {} };
    const card = { from: 'cody' as const, line: 'Hi!', reply: 'Hi, Cody!' };
    openGreeting(hud, api, { ...card, nudge: 'P.S. Back up!' }, () => {});
    expect(hud.querySelector('.hud-nudge')?.textContent).toBe('P.S. Back up!');
    const plain = document.createElement('div');
    openGreeting(plain, api, card, () => {});
    expect(plain.querySelector('.hud-nudge')).toBeNull();
  });
});

describe("the party photo, kept (V1's S3)", () => {
  const blob = new Blob(['png'], { type: 'image/png' });
  const urls = { createObjectURL: () => 'blob:photo', revokeObjectURL: () => {} };

  it("goes to the share sheet where it takes files (an iPhone's Save Image)", async () => {
    const shared: ShareData[] = [];
    const nav: Sharer = {
      canShare: (data) => !!data.files?.length,
      share: async (data) => void shared.push(data),
    };
    expect(await keepPhoto(blob, 'a.png', nav, document, urls)).toBe('shared');
    expect(shared[0]?.files?.[0]?.name).toBe('a.png');
  });

  it('is downloaded where there is no share sheet for files', async () => {
    const clicked: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download);
    });
    expect(await keepPhoto(blob, 'b.png', {}, document, urls)).toBe('downloaded');
    expect(clicked).toEqual(['b.png']);
    click.mockRestore();
  });

  it('takes closing the share sheet as her choice, not a reason to download', async () => {
    const nav: Sharer = {
      canShare: () => true,
      share: () => Promise.reject(new DOMException('no', 'AbortError')),
    };
    expect(await keepPhoto(blob, 'c.png', nav, document, urls)).toBe('cancelled');
  });

  it('is named for the day it was taken', () => {
    expect(photoName(new Date(2026, 9, 31, 21).getTime())).toBe('mcfrancisville-2026-10-31.png');
  });
});
