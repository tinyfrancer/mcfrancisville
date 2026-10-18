/**
 * The cloud save (V1's S2, decision 323): the one thing in the game a server answers. A Vercel
 * function on the Node runtime, over an Upstash Redis store (Vercel's KV) spoken to through its
 * REST API with plain `fetch`, so it needs no package.
 *
 *   GET  /api/save?id=<64 hex>  → 200 { save: { savedAt, data } | null }
 *   PUT  /api/save?id=<64 hex>  { savedAt, data } → 200 { kept: true, savedAt },
 *                                or 409 { kept: false, savedAt } when what's kept is newer
 *
 * The id is a hash of the phone's key and the data is sealed with another (`src/persistence/
 * cloudSeal.ts`), so nothing here can read her town. It keeps the newest by `savedAt` (last write
 * wins), refuses anything but a well-formed id and a save under 256 KB, and never logs a save.
 * Until the store is linked to the project (README's "Cloud save"), every call is a 503 saying so.
 */

/** What a store must do: keep a string under a name and give it back. */
export interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export const MAX_BYTES = 256 * 1024;
const ID = /^[0-9a-f]{64}$/;
const PREFIX = 'mcfrancisville:save:';

interface Kept {
  savedAt: number;
  data: string;
}

type Env = Record<string, string | undefined>;

/**
 * The store the env vars name, or null if they're missing. Vercel sets `KV_REST_API_URL` and
 * `KV_REST_API_TOKEN` when an Upstash store is linked; Upstash's own names work too.
 */
export function storeFromEnv(env: Env, send: typeof fetch = fetch): Store | null {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const command = async (args: string[]): Promise<unknown> => {
    const response = await send(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const body = (await response.json()) as { result?: unknown; error?: string };
    if (!response.ok || body.error !== undefined) throw new Error('the store said no');
    return body.result;
  };
  return {
    async get(key) {
      const result = await command(['GET', key]);
      return typeof result === 'string' ? result : null;
    },
    async set(key, value) {
      await command(['SET', key, value]);
    },
  };
}

function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isKept(value: unknown): value is Kept {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.savedAt === 'number' &&
    Number.isFinite(v.savedAt) &&
    v.savedAt > 0 &&
    typeof v.data === 'string' &&
    v.data.length > 0 &&
    /^[A-Za-z0-9_-]+$/.test(v.data)
  );
}

function parseKept(text: string | null): Kept | null {
  if (text === null) return null;
  try {
    const value: unknown = JSON.parse(text);
    return isKept(value) ? { savedAt: value.savedAt, data: value.data } : null;
  } catch {
    return null;
  }
}

/** Every call, with the store to use (null when it isn't set up yet). */
export async function handle(request: Request, store: Store | null): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'PUT') return answer(405, { error: 'method' });
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!ID.test(id)) return answer(400, { error: 'id' });
  if (!store) {
    return answer(503, {
      error: 'not-set-up',
      message: "The cloud save's store isn't linked to this project yet (see README: Cloud save).",
    });
  }
  const name = PREFIX + id;
  try {
    if (method === 'GET') return answer(200, { save: parseKept(await store.get(name)) });

    const length = Number(request.headers.get('content-length') ?? '0');
    if (length > MAX_BYTES) return answer(413, { error: 'too-big' });
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BYTES) return answer(413, { error: 'too-big' });
    let incoming: unknown;
    try {
      incoming = JSON.parse(text);
    } catch {
      return answer(400, { error: 'body' });
    }
    if (!isKept(incoming)) return answer(400, { error: 'body' });
    const kept = parseKept(await store.get(name));
    if (kept && kept.savedAt > incoming.savedAt) {
      return answer(409, { kept: false, savedAt: kept.savedAt });
    }
    await store.set(name, JSON.stringify({ savedAt: incoming.savedAt, data: incoming.data }));
    return answer(200, { kept: true, savedAt: incoming.savedAt });
  } catch {
    // Never what was sent: a save is hers, even in a log.
    return answer(502, { error: 'store' });
  }
}

/** The function's environment, read without Node's types (it runs on Node; the tests don't). */
function env(): Env {
  return (globalThis as { process?: { env?: Env } }).process?.env ?? {};
}

export function GET(request: Request): Promise<Response> {
  return handle(request, storeFromEnv(env()));
}

export function PUT(request: Request): Promise<Response> {
  return handle(request, storeFromEnv(env()));
}
