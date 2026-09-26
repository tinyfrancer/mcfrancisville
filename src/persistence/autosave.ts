/** How long after the last change the save waits, so a walk across town is one write, not twenty. */
export const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * Saves soon after something changes, and at once when asked. `write` builds and stores the save;
 * the saver only decides when.
 */
export class AutoSaver {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly write: () => void;

  constructor(write: () => void) {
    this.write = write;
  }

  markDirty(): void {
    if (this.stopped) return;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), AUTOSAVE_DEBOUNCE_MS);
  }

  /** Saves now, whether or not anything is pending: the page may be about to go away. */
  flush(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (!this.stopped) this.write();
  }

  /**
   * No more saves from this page. Restoring a backup stores the restored town and reloads; without
   * this, the reload's `pagehide` would save the old town right back over it.
   */
  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.stopped = true;
  }
}
