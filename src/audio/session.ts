/*
 * The silent switch (V1's S1, decision 321). On an iPhone, Web Audio plays in the "ambient"
 * category, which the ring/silent switch mutes, so a phone on silent heard nothing of the game.
 * Two ways round it, in the order the phone supports: iOS 17 and later take a hint, the
 * `audioSession`'s type set to `playback`; before that, an `<audio>` element playing (silence, on
 * a loop) moves the page's whole audio session to playback, Web Audio with it. The element has to
 * be started from inside her touch, before the context is made or resumed in the same touch.
 */

/** The bit of an `<audio>` element this needs, so a test can stand in for one. */
export interface Silence {
  readonly paused: boolean;
  play(): Promise<void> | void;
  pause(): void;
}

/** What of the phone the fix reads: its audio session, if it has one, and how to make silence. */
export interface Phone {
  audioSession?: { type: string };
  silence(): Silence;
}

/** How long the silence is before it loops, in seconds, and how finely it's sampled. */
const SILENCE_S = 1;
const SILENCE_RATE = 8000;

/** A second of silence as a WAV: 8-bit mono, every sample the middle (128). Made, not a file. */
export function silentWav(): string {
  const samples = SILENCE_S * SILENCE_RATE;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i);
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SILENCE_RATE, true);
  view.setUint32(28, SILENCE_RATE, true); // bytes a second
  view.setUint16(32, 1, true); // bytes a sample
  view.setUint16(34, 8, true); // bits a sample
  text(36, 'data');
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/** The phone as the browser has it: its navigator's audio session, and a looping silent element. */
export function browserPhone(): Phone {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  return {
    ...(session && { audioSession: session }),
    silence() {
      const audio = document.createElement('audio');
      // Kept off AirPlay and out of the remote controls: it's not something to play elsewhere.
      audio.setAttribute('x-webkit-airplay', 'deny');
      audio.setAttribute('playsinline', '');
      audio.disableRemotePlayback = true;
      audio.controls = false;
      audio.preload = 'auto';
      audio.loop = true;
      audio.src = silentWav();
      return audio;
    },
  };
}

/** Plays the game's sound through the silent switch, as far as this phone lets it. */
export class SilentSwitch {
  private readonly phone: Phone;
  private silence: Silence | null = null;

  constructor(phone: Phone) {
    this.phone = phone;
  }

  /** Whether the phone takes the hint, so no silent element is needed. */
  get hinted(): boolean {
    return this.phone.audioSession !== undefined;
  }

  /**
   * Called first thing in each touch, before the audio context is made or resumed: the hint where
   * the phone takes one, otherwise the silence started (again, if the page was hidden).
   */
  unlock(): void {
    const session = this.phone.audioSession;
    if (session) {
      try {
        if (session.type !== 'playback') session.type = 'playback';
      } catch {
        // A phone that refuses the hint plays as it always has.
      }
      return;
    }
    this.silence ??= this.phone.silence();
    if (!this.silence.paused) return;
    try {
      const started = this.silence.play();
      if (started) started.catch(() => {});
    } catch {
      // Not allowed yet: the next touch tries again.
    }
  }

  /** The page hidden: the silence stops, so the phone's audio session can rest. */
  hide(): void {
    if (this.silence && !this.silence.paused) this.silence.pause();
  }
}
