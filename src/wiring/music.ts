import { isNight, musicFor, tuneOf, type MusicKey } from '../audio/music';
import type { SoundBoard } from '../audio/SoundBoard';
import { dayKey, windowOf, type Clock } from '../systems/clock';
import { specialDayOf } from '../systems/friendship';
import type { World } from '../world/World';

/**
 * The music, told where she is rather than what happened (decisions 172, 173): a `MusicKey` from
 * the place, the window and the occasion, crossfaded to by the `SoundBoard` when it changes.
 */
export class Music {
  private readonly world: World;
  private readonly sound: SoundBoard;
  private readonly clock: Clock;
  private musicKey: MusicKey | null = null;

  constructor(world: World, sound: SoundBoard, clock: Clock) {
    this.world = world;
    this.sound = sound;
    this.clock = clock;
  }

  /** Names the music for now and has it played, after every step. */
  play(): void {
    const { world, clock } = this;
    this.musicKey = musicFor(world.scene, windowOf(clock.now()), {
      festivals: world.holidays.festivals(),
      decor: world.holidays.decor(),
      fountain: world.fountain.playing(),
      special: specialDayOf(dayKey(clock.now())),
      night: isNight(new Date(clock.now()).getHours()),
    });
    this.sound.setMusic(this.musicKey);
  }

  /**
   * The fountain's lights pulse to its music box, on the beat it's playing, or (with the music
   * off) to the beat it would be (0.2's H2).
   */
  fountainBeat = (): number | null => {
    const { musicKey, sound } = this;
    if (!musicKey?.endsWith('@musicBox')) return null;
    const heard = sound.musicPlaying === musicKey ? sound.musicBeat() : null;
    return heard ?? (performance.now() / 60_000) * tuneOf(musicKey).bpm;
  };
}
