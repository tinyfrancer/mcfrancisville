/** How long her Candy takes to count to what she has now (V1's L5), at most. */
export const COUNT_MS = 640;

/** How far through a count the number is, easing out so it settles on the last few. */
export function countAt(from: number, to: number, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return Math.round(from + (to - from) * (1 - (1 - k) ** 3));
}

export interface Counter {
  /** Counts to this from wherever it's showing; at once, with reduced motion. */
  to(value: number): void;
  /** What it will show once it's done. */
  value(): number;
}

/**
 * A number that counts to each new value rather than jumping (V1's L5): her Candy ticking up as
 * a sale lands, or down as she spends, with `hud-counting` on while it runs.
 */
export function countUp(element: HTMLElement, start: number, moves: () => boolean): Counter {
  let shown = start;
  let target = start;
  let frame = 0;
  element.textContent = String(start);
  return {
    value: () => target,
    to(value) {
      target = value;
      cancelAnimationFrame(frame);
      if (!moves() || shown === value) {
        shown = value;
        element.textContent = String(value);
        element.classList.remove('hud-counting');
        return;
      }
      const from = shown;
      const began = performance.now();
      element.classList.add('hud-counting');
      const step = (now: number) => {
        const t = (now - began) / COUNT_MS;
        shown = countAt(from, value, t);
        element.textContent = String(shown);
        if (t < 1) frame = requestAnimationFrame(step);
        else element.classList.remove('hud-counting');
      };
      frame = requestAnimationFrame(step);
    },
  };
}
