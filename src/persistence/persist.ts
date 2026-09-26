/**
 * Asks the browser to keep this site's storage through storage pressure. Safari's seven-day wipe
 * is the bigger threat and only the Home Screen install avoids it (decisions.md 5), but this is
 * free and covers the rest. Resolves false wherever it isn't supported; never throws.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    const storage = navigator.storage;
    if (!storage?.persist) return false;
    if (await storage.persisted?.()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Whether the game is running as the installed Home Screen app rather than in a Safari tab. */
export function runningStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}
