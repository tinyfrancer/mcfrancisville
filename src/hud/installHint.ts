/** A dismissed hint stays away this long before offering again. */
export const INSTALL_HINT_SNOOZE_MS = 24 * 60 * 60 * 1000;

export const INSTALL_HINT_KEY = 'mcfrancisville:installHintDismissedAt';

export interface InstallContext {
  userAgent: string;
  /** iPadOS reports itself as a Mac; touch points are what give it away. */
  maxTouchPoints: number;
  standalone: boolean;
  dismissedAt: number | null;
  now: number;
}

/**
 * Whether to suggest adding the game to the Home Screen: on an iPhone or iPad, in the browser rather
 * than the installed app, and not in the day after she said "got it". Installed is what keeps her
 * save from Safari's seven-day wipe (decisions.md 5).
 */
export function shouldShowInstallHint(ctx: InstallContext): boolean {
  if (ctx.standalone) return false;
  const ios =
    /iPhone|iPad|iPod/.test(ctx.userAgent) ||
    (/Macintosh/.test(ctx.userAgent) && ctx.maxTouchPoints > 1);
  if (!ios) return false;
  return ctx.dismissedAt === null || ctx.now - ctx.dismissedAt >= INSTALL_HINT_SNOOZE_MS;
}

export function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(INSTALL_HINT_KEY);
    const at = raw === null ? NaN : Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    return null;
  }
}

export function writeDismissedAt(now: number): void {
  try {
    localStorage.setItem(INSTALL_HINT_KEY, String(now));
  } catch {
    // A hint that comes back tomorrow is no harm.
  }
}
