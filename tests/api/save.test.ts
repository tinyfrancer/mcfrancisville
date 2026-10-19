import { describe, expect, it, vi } from 'vitest';
import { GET, handle, MAX_BYTES, PUT, storeFromEnv, type Store } from '../../api/save';

/** A store in memory, which also remembers every call, to show nothing else was asked of it. */
function memoryStore() {
  const kept = new Map<string, string>();
  const calls: string[] = [];
  const store: Store = {
    async get(key) {
      calls.push(`get ${key}`);
      return kept.get(key) ?? null;
    },
    async set(key, value) {
      calls.push(`set ${key}`);
      kept.set(key, value);
    },
  };
  return { store, kept, calls };
}

const ID = 'a'.repeat(64);
const url = (id = ID) => `https://mcfrancisville.test/api/save?id=${id}`;
const put = (body: unknown, id = ID) =>
  new Request(url(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('the cloud save function', () => {
  it('keeps a save under its id and gives it back', async () => {
    const { store, kept } = memoryStore();
    const empty = await handle(new Request(url()), store);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ save: null });

    const stored = await handle(put({ savedAt: 1000, data: 'c2VhbGVk' }), store);
    expect(stored.status).toBe(200);
    expect(await stored.json()).toEqual({ kept: true, savedAt: 1000 });
    expect([...kept.keys()]).toEqual([`mcfrancisville:save:${ID}`]);

    const back = await handle(new Request(url()), store);
    expect(await back.json()).toEqual({ save: { savedAt: 1000, data: 'c2VhbGVk' } });
    expect(back.headers.get('Cache-Control')).toBe('no-store');
  });

  it('keeps the newest by its stamp: an older one is refused, a newer one replaces it', async () => {
    const { store } = memoryStore();
    await handle(put({ savedAt: 2000, data: 'bmV3' }), store);
    const older = await handle(put({ savedAt: 1500, data: 'b2xk' }), store);
    expect(older.status).toBe(409);
    expect(await older.json()).toEqual({ kept: false, savedAt: 2000 });
    expect(await (await handle(new Request(url()), store)).json()).toEqual({
      save: { savedAt: 2000, data: 'bmV3' },
    });
    expect((await handle(put({ savedAt: 2000, data: 'c2FtZQ' }), store)).status).toBe(200);
    expect((await handle(put({ savedAt: 2500, data: 'bmV3ZXI' }), store)).status).toBe(200);
    expect(await (await handle(new Request(url()), store)).json()).toEqual({
      save: { savedAt: 2500, data: 'bmV3ZXI' },
    });
  });

  it('refuses anything but a well-formed id, and asks nothing of the store for it', async () => {
    const { store, calls } = memoryStore();
    for (const id of ['', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), `${'a'.repeat(63)}g`]) {
      expect((await handle(new Request(url(id)), store)).status).toBe(400);
      expect((await handle(put({ savedAt: 1, data: 'eA' }, id), store)).status).toBe(400);
    }
    expect((await handle(new Request('https://x.test/api/save'), store)).status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('refuses a body that is not a sealed save', async () => {
    const { store, kept } = memoryStore();
    for (const body of [
      'not json',
      {},
      { savedAt: 'soon', data: 'eA' },
      { savedAt: 1, data: '' },
      { savedAt: 1, data: 'has spaces and {braces}' },
      { savedAt: -1, data: 'eA' },
      { savedAt: Number.NaN, data: 'eA' },
      [1, 2],
    ]) {
      expect((await handle(put(body), store)).status).toBe(400);
    }
    expect(kept.size).toBe(0);
  });

  it('refuses a save of 256 KB or more, by its length or its size', async () => {
    const { store, kept } = memoryStore();
    const big = { savedAt: 1, data: 'x'.repeat(MAX_BYTES) };
    expect((await handle(put(big), store)).status).toBe(413);
    const claimed = new Request(url(), {
      method: 'PUT',
      headers: { 'Content-Length': String(MAX_BYTES + 1) },
      body: '{}',
    });
    expect((await handle(claimed, store)).status).toBe(413);
    const fits = { savedAt: 1, data: 'x'.repeat(MAX_BYTES - 100) };
    expect((await handle(put(fits), store)).status).toBe(200);
    expect(kept.size).toBe(1);
  });

  it('answers only GET and PUT', async () => {
    const { store } = memoryStore();
    for (const method of ['POST', 'DELETE', 'PATCH']) {
      expect((await handle(new Request(url(), { method }), store)).status).toBe(405);
    }
  });

  it('says clearly that it is not set up while the store is not linked', async () => {
    const response = await handle(new Request(url()), null);
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe('not-set-up');
    expect(body.message).toMatch(/README/);
    // The exported handlers read the env vars, which a test run has none of.
    expect((await GET(new Request(url()))).status).toBe(503);
    expect((await PUT(put({ savedAt: 1, data: 'eA' }))).status).toBe(503);
  });

  it('says the store failed without saying what was sent, and never logs', async () => {
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    const failing: Store = {
      get: () => Promise.reject(new Error('down')),
      set: () => Promise.reject(new Error('down')),
    };
    const response = await handle(put({ savedAt: 1, data: 'c2VjcmV0' }), failing);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('c2VjcmV0');
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});

describe('the store from the env vars', () => {
  it('is none without both the URL and the token', () => {
    expect(storeFromEnv({})).toBeNull();
    expect(storeFromEnv({ KV_REST_API_URL: 'https://kv.test' })).toBeNull();
    expect(storeFromEnv({ KV_REST_API_TOKEN: 't' })).toBeNull();
  });

  it("speaks Upstash's REST API with plain fetch: a command a POST, with the token", async () => {
    const sent: { url: string; init: RequestInit }[] = [];
    const redis = new Map<string, string>();
    const send = (async (url: string, init: RequestInit) => {
      sent.push({ url, init });
      const [command, key, value] = JSON.parse(String(init.body)) as string[];
      if (command === 'SET') redis.set(key!, value!);
      const result = command === 'SET' ? 'OK' : (redis.get(key!) ?? null);
      return new Response(JSON.stringify({ result }));
    }) as typeof fetch;
    const store = storeFromEnv(
      { KV_REST_API_URL: 'https://kv.test', KV_REST_API_TOKEN: 'tok' },
      send,
    )!;
    expect(await store.get('k')).toBeNull();
    await store.set('k', 'v');
    expect(await store.get('k')).toBe('v');
    expect(sent[0]!.url).toBe('https://kv.test');
    expect(sent[0]!.init.method).toBe('POST');
    expect((sent[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(JSON.parse(String(sent[1]!.init.body))).toEqual(['SET', 'k', 'v']);
  });

  it("takes Upstash's own names too, and treats the store's error as a failure", async () => {
    const send = (async () =>
      new Response(JSON.stringify({ error: 'WRONGPASS' }), { status: 401 })) as typeof fetch;
    const store = storeFromEnv(
      { UPSTASH_REDIS_REST_URL: 'https://u.test', UPSTASH_REDIS_REST_TOKEN: 't' },
      send,
    )!;
    await expect(store.get('k')).rejects.toThrow();
    expect((await handle(new Request(url()), store)).status).toBe(502);
  });
});
