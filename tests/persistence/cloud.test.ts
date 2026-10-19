/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handle, type Store } from '../../api/save';
import { CloudSave, type CloudOptions } from '../../src/persistence/cloud';
import { makeCode } from '../../src/persistence/cloudKey';
import { sealerFor, type Sealer } from '../../src/persistence/cloudSeal';
import { newSave, type SaveState } from '../../src/persistence/SaveState';

const BASE = newSave(1_700_000_000_000, { tx: 12, ty: 30, facing: 'up', zone: 'town' });
const at = (updatedAt: number, tx = 12): SaveState => ({
  ...BASE,
  updatedAt,
  player: { ...BASE.player, tx },
});

/**
 * The function itself over a store in memory, reached by a `fetch` that can be cut off, made to
 * fail, or made to answer like something that isn't the function at all.
 */
function cloud() {
  const kept = new Map<string, string>();
  const store: Store = {
    get: async (key) => kept.get(key) ?? null,
    set: async (key, value) => void kept.set(key, value),
  };
  const net = {
    online: true,
    failing: false,
    setUp: true,
    html: false,
    calls: [] as { method: string; keepalive: boolean }[],
  };
  const fetch: CloudOptions['fetch'] = async (url, init) => {
    net.calls.push({ method: init?.method ?? 'GET', keepalive: init?.keepalive === true });
    if (!net.online || net.failing) throw new TypeError('Failed to fetch');
    if (net.html) return new Response('<!doctype html><p>a page</p>', { status: 200 });
    return handle(new Request(`https://mcfrancisville.test${url}`, init), net.setUp ? store : null);
  };
  return { kept, net, fetch };
}

type Cloud = ReturnType<typeof cloud>;

async function phone(
  c: Cloud,
  code: string,
  extra: Partial<CloudOptions> = {},
): Promise<{ sync: CloudSave; backedUp: number[]; newer: number[]; sealer: Sealer }> {
  const sealer = (await sealerFor(code))!;
  const backedUp: number[] = [];
  const newer: number[] = [];
  const sync = new CloudSave({
    sealer: async () => sealer,
    fetch: c.fetch,
    now: () => 5_000_000,
    online: () => c.net.online,
    backedUp: (t) => backedUp.push(t),
    onNewer: (t) => newer.push(t),
    debounceMs: 20,
    ...extra,
  });
  return { sync, backedUp, newer, sealer };
}

const puts = (c: Cloud) => c.net.calls.filter((call) => call.method === 'PUT').length;

describe('the cloud save on the phone', () => {
  let rejections: unknown[];
  const noted = (reason: unknown) => rejections.push(reason);
  beforeEach(() => {
    rejections = [];
    process.on('unhandledRejection', noted);
  });
  afterEach(() => {
    process.off('unhandledRejection', noted);
    // Every expected failure is caught where it happens: none reaches the error notes.
    expect(rejections).toEqual([]);
  });

  it('round-trips a save through the function: up from one phone, offered and opened on another', async () => {
    const c = cloud();
    const code = makeCode();
    const first = await phone(c, code);
    first.sync.saved(at(2000, 21));
    await first.sync.flush();
    expect(first.backedUp).toEqual([5_000_000]);
    expect(first.sync.status()).toEqual({ state: 'ready', keptAt: 5_000_000 });
    // What the store holds is sealed: no town in it, and filed under a hash, not the key.
    const [name, value] = [...c.kept][0]!;
    expect(name).not.toContain(code);
    // A backup code's whole prefix: sealed text is base64url, so three letters alone ("MFV") turn
    // up in it now and then by chance.
    expect(value).not.toMatch(/player|wardrobe|MFV[01]-/);

    const second = await phone(c, code);
    expect(await second.sync.check(1000)).toEqual({ kind: 'newer', savedAt: 2000 });
    expect(second.newer).toEqual([2000]);
    const town = await second.sync.newer();
    expect(town).toEqual({ ok: true, save: at(2000, 21) });
  });

  it('waits a few seconds after a write, then sends the latest once', async () => {
    const c = cloud();
    const { sync } = await phone(c, makeCode());
    sync.saved(at(2000, 1));
    sync.saved(at(2001, 2));
    sync.saved(at(2002, 3));
    expect(puts(c)).toBe(0);
    await vi.waitFor(() => expect(sync.status().keptAt).not.toBeNull());
    expect(puts(c)).toBe(1);
  });

  it('sends nothing before the cloud has said what it has', async () => {
    const c = cloud();
    const code = makeCode();
    const a = await phone(c, code);
    a.sync.saved(at(9000, 5));
    await a.sync.flush();
    // A phone behind it, opened with no signal, writes before it's heard back.
    c.net.online = false;
    const b = await phone(c, code);
    expect(await b.sync.check(1000)).toEqual({ kind: 'failed', state: 'offline' });
    b.sync.saved(at(9500, 6));
    await b.sync.flush();
    expect(b.sync.status().state).toBe('offline');
    // Signal back: it asks first, finds the newer town, asks her, and sends nothing.
    c.net.online = true;
    await b.sync.flush();
    expect(b.newer).toEqual([9000]);
    expect(b.backedUp).toEqual([]);
    expect(await b.sync.newer()).toEqual({ ok: true, save: at(9000, 5) });
    // She keeps the phone's: it goes up, and is the newest now.
    b.sync.keepMine();
    await b.sync.flush();
    expect(b.backedUp).toHaveLength(1);
    const c2 = await phone(c, code);
    expect(await c2.sync.check(9000)).toEqual({ kind: 'newer', savedAt: 9500 });
  });

  it('with no signal keeps the latest, and sends it when the signal is back', async () => {
    const c = cloud();
    const { sync, backedUp } = await phone(c, makeCode());
    c.net.online = false;
    sync.saved(at(2000, 1));
    await sync.flush();
    sync.saved(at(2100, 2));
    await sync.flush();
    expect(c.net.calls).toEqual([]);
    expect(sync.status().state).toBe('offline');
    c.net.online = true;
    await sync.flush();
    expect(backedUp).toHaveLength(1);
    expect(puts(c)).toBe(1);
  });

  it('a failed send is tried again with the next write, and the newest goes', async () => {
    const c = cloud();
    const code = makeCode();
    const { sync, backedUp } = await phone(c, code);
    c.net.failing = true;
    sync.saved(at(2000, 1));
    await sync.flush();
    expect(backedUp).toEqual([]);
    c.net.failing = false;
    sync.saved(at(2200, 2));
    await sync.flush();
    expect(backedUp).toHaveLength(1);
    const other = await phone(c, code);
    await other.sync.check(0);
    expect(await other.sync.newer()).toEqual({ ok: true, save: at(2200, 2) });
  });

  it('sends with keepalive as the page goes away', async () => {
    const c = cloud();
    const { sync } = await phone(c, makeCode());
    sync.saved(at(2000));
    await sync.flush(true);
    expect(c.net.calls).toEqual([
      { method: 'GET', keepalive: false },
      { method: 'PUT', keepalive: true },
    ]);
  });

  it('asks the cloud before its first upload, even with a key just made', async () => {
    const c = cloud();
    c.net.html = true;
    const { sync } = await phone(c, makeCode());
    sync.saved(at(2000));
    await sync.flush();
    // A server that isn't the function (a preview, a dev server) is never sent a town.
    expect(c.net.calls).toEqual([{ method: 'GET', keepalive: false }]);
    expect(sync.status().state).toBe('unavailable');
  });

  it('last write wins: a stale phone can’t put an older town over a newer one', async () => {
    const c = cloud();
    const code = makeCode();
    const a = await phone(c, code);
    const b = await phone(c, code);
    // Both open with nothing in the cloud; then the one with the later town gets there first.
    expect(await a.sync.check(0)).toEqual({ kind: 'none' });
    expect(await b.sync.check(0)).toEqual({ kind: 'none' });
    a.sync.saved(at(3000, 1));
    await a.sync.flush();
    b.sync.saved(at(2500, 2));
    await b.sync.flush();
    expect(b.backedUp).toEqual([]);
    expect(c.net.calls.filter((call) => call.method === 'PUT')).toHaveLength(2);
    const reader = await phone(c, code);
    await reader.sync.check(0);
    expect(await reader.sync.newer()).toEqual({ ok: true, save: at(3000, 1) });
    // And nothing is offered to a phone that opened with the cloud's own town.
    const same = await phone(c, code);
    expect(await same.sync.check(3000)).toEqual({ kind: 'same' });
    expect(same.newer).toEqual([]);
  });

  it('until the store is set up, says so, and stops trying', async () => {
    const c = cloud();
    c.net.setUp = false;
    const code = makeCode();
    const { sync } = await phone(c, code);
    expect(await sync.check(0)).toEqual({ kind: 'failed', state: 'notSetUp' });
    sync.saved(at(2000));
    await sync.flush();
    expect(puts(c)).toBe(0);
    expect(await sync.recheck()).toBe('notSetUp');
    // Then it is: Settings asking again finds it, and what's waiting goes up.
    c.net.setUp = true;
    expect(await sync.recheck()).toBe('ready');
    await sync.flush();
    expect(puts(c)).toBe(1);
  });

  it('where nothing answers like the function, it is out of reach and asks no more', async () => {
    const c = cloud();
    c.net.html = true;
    const { sync } = await phone(c, makeCode());
    expect(await sync.check(0)).toEqual({ kind: 'failed', state: 'unavailable' });
    sync.saved(at(2000));
    await sync.flush();
    expect(c.net.calls).toHaveLength(1);
  });

  it('a phone with no way to seal is out of reach, quietly', async () => {
    const c = cloud();
    const sync = new CloudSave({
      sealer: async () => {
        throw new Error('no WebCrypto here');
      },
      fetch: c.fetch,
      now: () => 0,
      online: () => true,
      backedUp: () => {},
    });
    sync.saved(at(2000));
    await sync.flush();
    expect(sync.status().state).toBe('unavailable');
    expect(c.net.calls).toEqual([]);
  });

  it('after stop, nothing more goes up from this page', async () => {
    const c = cloud();
    const { sync } = await phone(c, makeCode());
    sync.saved(at(2000));
    sync.stop();
    sync.saved(at(2100));
    await sync.flush();
    await new Promise((r) => setTimeout(r, 40));
    expect(c.net.calls).toEqual([]);
  });
});
