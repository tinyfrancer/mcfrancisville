# McFrancisVille

A cozy, spooky-cute pixel-art life sim for the phone: dress up, decorate your house, grow pumpkins,
befriend your monster neighbours, and collect critters, pets, furniture and clothes.

It runs in the browser and installs to an iPhone Home Screen (Safari → Share → Add to Home Screen),
which keeps the save safe.

- Plan: [`docs/v0_plan.md`](docs/v0_plan.md)
- Decisions: [`docs/decisions.md`](docs/decisions.md)
- Starting a session: [`docs/handoff.md`](docs/handoff.md)

```bash
npm install
npm run dev
```

## Cloud save

The town is also kept in the cloud (decision 323): `api/save.ts`, a Vercel function over an
Upstash Redis store, keyed by a secret each phone makes once and sealed with it, so the store
holds nothing readable. Until a store is linked, the function answers 503 and Settings → Backup
says "The cloud isn't set up yet"; the game plays exactly as before, on the phone and the backup
code. Setting it up is a one-time job in the Vercel dashboard:

1. Open the McFrancisVille project at [vercel.com](https://vercel.com) and go to its **Storage**
   tab.
2. **Create Database** → pick **Upstash** ("Serverless DB (Redis, Vector, Queue, Search)" in the
   Marketplace list) → **Upstash for Redis** → **Continue**. Accept the Upstash terms if asked.
3. Choose the **Free** plan and the region nearest home (for example `us-east-1` or
   `us-west-1`), name it something like `mcfrancisville-saves`, and **Create**.
4. When it asks which projects to connect, pick **McFrancisVille** with at least the
   **Production** environment ticked, and leave the environment variable prefix as **`KV`**.
   (If it's already made, the store's page has **Connect Project**.)
5. Check the project's **Settings → Environment Variables**: it should now list
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` (and a few more, `KV_URL`, `REDIS_URL`,
   `KV_REST_API_READ_ONLY_TOKEN`, which the game doesn't use). Upstash's own names,
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, work too.
6. Redeploy, since a deployment only sees the variables it was built with: **Deployments** →
   the newest Production deployment → **⋯** → **Redeploy**. (Or let the next patch to `main`
   do it; the function only exists from the patch that brought it, 0.9.)
7. On the phone, Settings → Backup → **Kept in the cloud** should say "Your town goes up to the
   cloud as you play" a few seconds after anything changes in the game.

To check it from a computer: `curl "https://<your-site>/api/save?id=$(printf '0%.0s' {1..64})"`
answers `{"save":null}` once it's linked, or a 503 with `"not-set-up"` before.

Restoring on a new phone: install the game, open Settings → Backup, and type the old phone's
cloud code (or scan its QR with the camera and paste the text) into **Bring a town back from
the cloud**. The new phone then shares that code, and both keep the one town, the newest by
when it was saved.
