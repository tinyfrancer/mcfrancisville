/** One step of the simulation: 120 a second, so a 60Hz or a 120Hz screen gets whole steps a frame. */
export const STEP_MS = 1000 / 120;

/**
 * A frame this much short of a whole step still takes it, and runs the next one that much in
 * debt. A browser's frame times wobble around the refresh by a fraction of a millisecond, and
 * without this a 60Hz frame of 16.5ms would take one step and the next of 16.8ms three.
 */
const SLACK_MS = 1;

/** Most steps a frame, so a slow phone catching up can't fall further behind by trying to. */
const MAX_STEPS = 12;

/**
 * Turns frames of whatever length into steps of one length, so a walk is the same walk on every
 * phone and the pixels she moves each frame are as even as the screen allows.
 */
export class FixedStep {
  private owed = 0;

  /** Runs `step` once for each whole step `deltaMs` brings due, and says how many that was. */
  advance(deltaMs: number, step: (stepMs: number) => void): number {
    this.owed = Math.min(this.owed + deltaMs, MAX_STEPS * STEP_MS);
    let steps = 0;
    while (this.owed >= STEP_MS - SLACK_MS) {
      step(STEP_MS);
      this.owed -= STEP_MS;
      steps++;
    }
    return steps;
  }
}
