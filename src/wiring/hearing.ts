import { ambienceFor, Footfalls, groundOf, waterNear } from '../audio/ambience';
import type { SoundBoard } from '../audio/SoundBoard';
import { tileAt } from '../systems/grid';
import { tileOf, type World } from '../world/World';

/** How often the ambience is read again while she stands still, for the hour and the weather. */
const RECHECK_MS = 60_000;

/**
 * What she hears of where she is (V1's S1, decision 321): the place's ambience, read again only
 * when it could have changed (she steps onto another tile or into another place, or a minute
 * passes), and a footstep each time she puts a foot down, on the ground she's on. `main.ts`'s
 * tick calls it; it reads the world and never changes it.
 */
export class Hearing {
  private readonly footfalls = new Footfalls();
  private zone = '';
  private tx = -1;
  private ty = -1;
  private recheckAt = 0;

  step(world: World, sound: SoundBoard, now: number): void {
    const { tx, ty } = tileOf(world.player.x, world.player.y);
    const zone = world.scene;
    const outdoor = world.zones.outdoor(zone);
    if (zone !== this.zone || tx !== this.tx || ty !== this.ty || now >= this.recheckAt) {
      this.zone = zone;
      this.tx = tx;
      this.ty = ty;
      this.recheckAt = now + RECHECK_MS;
      const date = new Date(now);
      const water = outdoor
        ? waterNear(tx, ty, (x, y) =>
            outdoor.slippery(x, y) ? 'ice' : tileAt(outdoor.map, x, y) === 'water' ? 'water' : null,
          )
        : 0;
      sound.setAmbience(
        ambienceFor({
          zone,
          outdoors: outdoor !== undefined,
          hour: date.getHours(),
          month: date.getMonth() + 1,
          weather: world.weather.today(),
          stormy: world.weather.stormy(),
          water,
        }),
      );
    }
    const foot = this.footfalls.step(world.player);
    if (foot === null) return;
    const ground = outdoor
      ? groundOf(tileAt(outdoor.map, tx, ty), true, outdoor.slippery(tx, ty))
      : groundOf(undefined, false, false);
    sound.footstep(ground, foot);
  }
}
