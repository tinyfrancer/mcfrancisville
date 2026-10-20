/**
 * How far a finger may wander and still be a tap (from the MMO). However long it rests is a tap
 * too: a slow thumb is still a tap (V1's E4, decision 283).
 */
const TAP_SLOP_PX = 8;

/**
 * Her touches on the canvas: one finger at a time, a tap where it lifts if it hardly moved
 * (`tap`), and `lifted` after every finger that lifts, tap or not.
 */
export function listenForTaps(
  canvas: HTMLCanvasElement,
  tap: (clientX: number, clientY: number) => void,
  lifted: () => void,
): void {
  let press: { id: number; x: number; y: number; travel: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (press) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, travel: 0 };
  });
  // A held press is a tap, never the phone's own: no callout, no menu.
  canvas.style.setProperty('-webkit-touch-callout', 'none');
  canvas.style.setProperty('-webkit-user-select', 'none');
  canvas.style.setProperty('user-select', 'none');
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    press.travel += Math.hypot(e.clientX - press.x, e.clientY - press.y);
    press.x = e.clientX;
    press.y = e.clientY;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const tapped = press.travel <= TAP_SLOP_PX;
    press = null;
    if (tapped) tap(e.clientX, e.clientY);
    lifted();
  });
  canvas.addEventListener('pointercancel', () => (press = null));
}
