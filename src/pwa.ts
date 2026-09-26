/**
 * Registers `public/sw.js`, which lets the installed app open with no signal. Production only: in
 * dev a cached page would hide the change being worked on.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // No offline support is a missing nicety, not a reason to stop the game booting.
    });
  });
}
