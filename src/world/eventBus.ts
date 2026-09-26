/**
 * State the HUD re-renders from, out of the world (decisions.md 9). Moments (a catch, a harvest)
 * go the other way, as what `update()` returns; this is for "the bag is now this".
 */
export class EventBus<Events extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof Events, Set<(value: never) => void>>();

  /** Returns a function that stops listening. */
  on<K extends keyof Events>(key: K, handler: (value: Events[K]) => void): () => void {
    let set = this.handlers.get(key);
    if (!set) {
      set = new Set();
      this.handlers.set(key, set);
    }
    set.add(handler as (value: never) => void);
    return () => set.delete(handler as (value: never) => void);
  }

  emit<K extends keyof Events>(key: K, value: Events[K]): void {
    for (const handler of this.handlers.get(key) ?? []) (handler as (v: Events[K]) => void)(value);
  }
}
