import { effectsPass, type Effects } from './effects';
import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';
import { bedsPass } from './garden';
import { dayKey, daylight, hourOf, underFullMoon, type Daylight } from '../systems/clock';
import { isMoonlit } from '../systems/critters';
import type { PropId, TileId } from '../types/ids';
import { tileCentre, tileOf, type World } from '../world/World';
import type { MapZone } from '../world/zones/MapZone';
import { FollowCamera, screenToWorld, worldToScreen, type Point } from './camera';
import { fountainPass } from './fountain';
import { Ground } from './ground';
import { fishingPass } from './fishing';
import { Lighting } from './lighting';
import { rimLit, underMoon } from './moonlight';
import { WEATHER_LOOK } from './weather';
import { holidaysPass } from './holidays';
import { lifeOf, type Life } from './life';
import type { Weather } from '../data/weather';
import { CLUTTER } from '../data/clutter';
import { yardPass, yardPieceHit } from './yard';
import { doorsPass } from './doors';
import { groundLookIdOf, seasonOf } from '../systems/seasons';
import { GROUND_LOOKS, type SeasonId } from '../data/seasons';
import { SEASON_LIGHT } from './grade';
import {
  drawDrawables,
  drawLight,
  onScreen,
  playerDrawable,
  type SceneView,
  type Tapped,
} from './scene';
import {
  butterfliesPass,
  flyersPass,
  leavesPass,
  starsPass,
  type CountingPass,
} from './passes/aloft';
import { Crowns } from './passes/crowns';
import {
  boardsPass,
  candyPass,
  gatesPass,
  geesePass,
  mailboxPass,
  potsPass,
} from './passes/dressed';
import {
  bonePass,
  crittersPass,
  herPass,
  lostPass,
  neighboursPass,
  passersPass,
  petsPass,
  strayPass,
  targetPass,
  wesPass,
} from './passes/folk';
import { giversPass } from './passes/givers';
import { lifePass } from './passes/life';
import { moundsPass } from './passes/mounds';
import { lanternsPass, movingPass, type MovingPass } from './passes/moving';
import { composeLayers, type Frame, type Layer, type Layers, type LitFrame } from './passes/pass';
import { bakeProps, propsPass, turnProps, type BakedProps } from './passes/props';
import { sitesPass } from './passes/sites';
import { snackPass } from './passes/snack';
import { cartPass, popUpPass } from './passes/stalls';
import { weatherPass } from './passes/weather';

export interface OutdoorViewOptions {
  /** Draws the place in the light of this hour instead of the clock's (`?hour=`, for reviewing art). */
  hour?: number | null;
  /** Draws the place in this weather instead of the day's (`?weather=`, for reviewing art). */
  weather?: Weather | null;
  /** How far through its tune the fountain's music box is, in beats, or null while it's quiet. */
  fountainBeat?: () => number | null;
  /** What the moments look like where they happen, drawn over everything (V1's E1). */
  effects?: Effects;
}

/**
 * The order each layer of a frame outdoors is drawn in, by pass (1.1's A4, decision 353). What
 * stands is sorted by its feet once, so where two stand level the one named first is drawn first.
 */
export const OUTDOOR_LAYERS: Readonly<Record<Layer, readonly string[]>> = {
  ground: ['life', 'weather', 'yard', 'fishing', 'target'],
  stand: [
    'props',
    'moving',
    'doors',
    'yard',
    'givers',
    'beds',
    'snack',
    'popUp',
    'sites',
    'mailbox',
    'boards',
    'pots',
    'geese',
    'candy',
    'mounds',
    'holidays',
    'gates',
    'lanterns',
    'butterflies',
    'flyers',
    'leaves',
    'cart',
    'passers',
    'stray',
    'neighbours',
    'wes',
    'critters',
    'pets',
    'bone',
    'her',
  ],
  wanted: ['givers', 'snack', 'mounds', 'holidays', 'neighbours', 'critters', 'pets', 'bone'],
  over: ['yard', 'holidays', 'beds', 'life', 'neighbours', 'critters', 'fishing', 'weather'],
  lights: [
    'props',
    'fountain',
    'critters',
    'popUp',
    'sites',
    'cart',
    'snack',
    'givers',
    'beds',
    'yard',
  ],
  lit: [
    'stars',
    'holidays',
    'fountain',
    'weather',
    'snack',
    'beds',
    'critters',
    'lost',
    'pets',
    'neighbours',
    'fishing',
    'effects',
  ],
};

/**
 * Draws the `World` in one of its places outdoors: the town, Whisperwood, Lantern Shore. It reads
 * it every frame and writes to it only through `tapTile` (decisions.md 9). It lays the ground and
 * works out the light; everything else is drawn by its passes (`render/passes/`, 1.1's A4).
 */
export class OutdoorView implements SceneView {
  private readonly world: World;
  private readonly zone: MapZone;
  /** Whether this is the town, where the stalls, the snack and the critters are. */
  private readonly town: boolean;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ground: Ground;
  /** What moves over the ground: glints on the water, long grass, chimney smoke. */
  private readonly life: Life;
  /**
   * The ground's tiles as they stand (the pond frozen over, the farm's rows built), and the life
   * over them, worked out when they change; null while they're the map's own.
   */
  private reshaped: { tiles: TileId[]; life: Life } | null = null;
  /** What the ground was last baked as: whether the pond was frozen, and how many rows built. */
  private groundShown = 'false:0:0';
  private readonly lighting = new Lighting();
  /** The lit parts of the frame, drawn over the night once they've been covered by what's in front. */
  private readonly glowLayer = document.createElement('canvas');
  private readonly hour: number | null;
  private readonly weatherShown: Weather | null;
  private camera: Point = { x: 0, y: 0 };
  private readonly follower = new FollowCamera();
  /** How faded each tree is that hides something (0.3's A3), eased like the camera. */
  private readonly crowns = new Crowns();
  /** The season the props are baked in (V1's L4), and those it changes, to bake again as it turns. */
  private seasonShown: SeasonId;
  private readonly seasonal: BakedProps['seasonal'];
  /** Each layer's passes, in order. */
  private readonly layers: Layers;
  /** What moves on its own, and what's aloft, as the last frame drew it (V1's E5, smoke). */
  private readonly moving: MovingPass;
  private readonly flyers: CountingPass;
  private readonly leaves: CountingPass;
  private drawnAt = 0;

  constructor(
    world: World,
    zone: MapZone,
    canvas: HTMLCanvasElement,
    options: OutdoorViewOptions = {},
  ) {
    this.world = world;
    this.zone = zone;
    this.town = zone.id === 'town';
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    this.weatherShown = options.weather ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.ground = new Ground(zone.map, CLUTTER[zone.id]);
    const day = dayKey(world.clock.now());
    this.ground.look(groundLookIdOf(day));
    this.seasonShown = seasonOf(day);
    this.life = lifeOf(zone.map);
    const b = bakeProps(zone, this.seasonShown);
    this.seasonal = b.seasonal;
    const { town, hour } = this;
    this.moving = movingPass(b.moving);
    this.flyers = flyersPass(world, zone, b.scarecrows, hour);
    this.leaves = leavesPass(world, b.shedding);
    this.layers = composeLayers(
      [
        lifePass(zone),
        weatherPass(world, this.weatherShown !== null),
        yardPass(world, town),
        targetPass(world),
        propsPass(b),
        this.moving,
        doorsPass(world, zone, b.entrances),
        giversPass(world, b.givers),
        bedsPass(world, zone.id),
        snackPass(world, town),
        popUpPass(zone),
        sitesPass(world, zone),
        mailboxPass(world, b.mailbox),
        boardsPass(world, b.boards),
        potsPass(world, b.pots),
        geesePass(world, b.geese),
        candyPass(world, b),
        moundsPass(world, zone, b.mounds),
        holidaysPass(world, zone, town, b.skellies, b.doors),
        gatesPass(world, zone),
        lanternsPass(b.bobbing),
        butterfliesPass(world, zone, hour),
        starsPass(world, zone, hour),
        this.flyers,
        this.leaves,
        cartPass(zone),
        passersPass(world, zone),
        strayPass(world, zone),
        neighboursPass(world, zone),
        wesPass(world),
        crittersPass(world, zone),
        petsPass(world),
        bonePass(world, zone),
        herPass,
        fountainPass(b.fountains, options.fountainBeat ?? (() => null)),
        lostPass(world, zone),
        fishingPass(world, zone.id),
        effectsPass(world, zone.id, options.effects ?? null),
      ],
      OUTDOOR_LAYERS,
    );
  }

  /**
   * The light the town is in now: the clock's hour, unless the page asked for another, with the
   * lamps lit a little on a grey day, and the night brighter under a full moon.
   */
  daylight(): Daylight {
    const now = this.world.clock.now();
    const hour = this.hour ?? hourOf(now);
    let light = daylight(hour);
    if (isMoonlit(dayKey(now), Math.floor(hour))) light = underFullMoon(light);
    return { ...light, lamps: Math.max(light.lamps, WEATHER_LOOK[this.weather()].lamps) };
  }

  /** Today's weather, unless the page asked for another. */
  weather(): Weather {
    return this.weatherShown ?? this.world.weather.today();
  }

  get mapSize() {
    return { width: this.zone.width * TILE_SIZE, height: this.zone.height * TILE_SIZE };
  }

  /** The photo mode's viewfinder looking away from her (1.5's G5), or back at her with null. */
  pan(by: Point | null): void {
    this.follower.pan(by);
  }

  follow(deltaMs: number): void {
    this.follower.follow(this.world.player, deltaMs);
    this.crowns.step(deltaMs);
  }

  /** The trees drawn see-through now, by the tile each stands on, and how opaque. */
  seeThroughCrowns(): { tx: number; ty: number; alpha: number }[] {
    return this.crowns.faded();
  }

  cameraOrigin(): Point {
    return { ...this.camera };
  }

  /** A tap on the page, in client pixels. */
  tap(clientX: number, clientY: number): Tapped {
    const world = screenToWorld(
      clientX,
      clientY,
      this.canvas.getBoundingClientRect(),
      this.canvas,
      this.camera,
    );
    const under = tileOf(world.x, world.y);
    // A tap on a piece of hers in her yard counts for it wherever her finger lands on its picture
    // (0.3's H5), unless a neighbour, a pet or a critter is in front of it.
    const someone =
      this.world.neighbourhood.villagerAt(under.tx, under.ty) ??
      this.world.petCare.petAt(under.tx, under.ty) ??
      this.world.collecting.critterAt(under.tx, under.ty);
    const hit = this.town && !someone ? yardPieceHit(this.world, world) : null;
    const { tx, ty } = hit ?? under;
    return { went: this.world.tapTile(tx, ty), at: world };
  }

  /** Where on the page the middle of a tile is drawn, for the smoke check to tap it for real. */
  tileToClient(tx: number, ty: number): Point {
    return worldToScreen(
      tileCentre({ tx, ty }),
      this.canvas.getBoundingClientRect(),
      this.canvas,
      this.camera,
    );
  }

  /**
   * A frame: the ground, then each layer's passes in `OUTDOOR_LAYERS`' order, with what stands
   * sorted by its feet once and its crowns faded where they hide her or what she's after, and the
   * light worked out between what's drawn under it and over it.
   */
  draw(nowMs: number): void {
    const { ctx, canvas, layers } = this;
    const player = this.world.player;
    this.drawnAt = nowMs;
    this.camera = this.follower.origin(player, canvas, this.mapSize);
    const cam = this.camera;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.hedgeDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const life = this.season();
    const turned = this.turn();
    this.ground.wet(this.weather() === 'rain');
    this.ground.draw(ctx, cam, canvas);

    const weather = this.weather();
    const me = playerDrawable(this.world, nowMs);
    const f: Frame = {
      nowMs,
      cam,
      canvas,
      weather,
      // In winter the rain falls as snow, onto snow (V1's L4).
      snowing: turned.snow && weather === 'rain',
      season: turned.season,
      life,
      me,
    };
    for (const p of layers.ground) p.ground!(ctx, f);

    const drawables = layers.stand
      .flatMap((p) => p.stand!(f))
      .filter((d) => onScreen(d, cam, canvas));
    drawables.sort((a, b) => a.footY - b.footY);
    this.crowns.fade(
      drawables,
      me,
      layers.wanted.flatMap((p) => p.wanted!()),
    );
    if (rimLit(this.daylight())) underMoon(drawables);
    drawDrawables(ctx, drawables, cam);
    for (const p of layers.over) p.over!(ctx, f);

    const lights = layers.lights.flatMap((p) => p.lights!(f));
    const light = this.daylight();
    const { tint } = WEATHER_LOOK[weather];
    this.lighting.outdoors(cam, nowMs);
    drawLight(
      ctx,
      this.lighting,
      this.glowLayer,
      this.world,
      cam,
      light,
      drawables,
      lights,
      0,
      tint,
      SEASON_LIGHT[turned.season],
    );
    const lit: LitFrame = { ...f, light };
    for (const p of layers.lit) p.lit!(ctx, lit);
  }

  /**
   * The ground as it is today: its pond frozen over in winter (phase U), and the farm's extension
   * rows dug once she has built them (0.2's N1). When either changes, the chunks of ground it
   * touches are baked again; the rest stay as they were.
   */
  private season(): Life {
    const frozen = this.zone.decorations?.frozen ?? false;
    const rows = this.town ? this.world.farm.rows : 0;
    // A built project's deck and beds are ground too (V1's R4).
    const built = this.zone.sites?.shown ?? '0';
    const shown = `${frozen}:${rows}:${built}`;
    if (shown !== this.groundShown) {
      this.groundShown = shown;
      const { map } = this.zone;
      const tiles = this.zone.groundTiles();
      this.reshaped = shown === 'false:0:0' ? null : { tiles, life: lifeOf({ ...map, tiles }) };
      this.ground.retile(tiles);
    }
    return this.reshaped?.life ?? this.life;
  }

  /**
   * The season today (V1's L4), from the day key: the ground baked in its look (let go and baked
   * again when it turns), and the trees, bushes and roofs baked in its colours the first frame
   * after it does. Most days it's a comparison of two strings.
   */
  private turn(): { season: SeasonId; snow: boolean } {
    const day = dayKey(this.world.clock.now());
    const look = groundLookIdOf(day);
    this.ground.look(look);
    const season = seasonOf(day);
    if (season !== this.seasonShown) {
      this.seasonShown = season;
      turnProps(this.seasonal, season);
    }
    return { season, snow: GROUND_LOOKS[look].snow === true };
  }

  /**
   * The season the place is drawn in now (V1's L4), and its lawn's colour as baked: the average of
   * its first few tiles of grass. For the smoke check.
   */
  seasonNow(): { season: SeasonId; look: string; lawn: number[] } {
    const { map } = this.zone;
    const grass: { tx: number; ty: number }[] = [];
    for (let i = 0; i < map.tiles.length && grass.length < 12; i++) {
      if (map.tiles[i] === 'grass')
        grass.push({ tx: i % map.width, ty: Math.floor(i / map.width) });
    }
    const sum = [0, 0, 0];
    for (const t of grass) this.ground.colourAt(t.tx, t.ty).forEach((c, i) => (sum[i]! += c));
    const lawn = sum.map((c) => Math.round(c / Math.max(1, grass.length)));
    return { season: this.seasonShown, look: this.ground.looks, lawn };
  }

  /** She has left: the ground's chunks are let go, and baked again as she comes back. */
  rest(): void {
    this.ground.release();
    this.crowns.clear();
  }

  groundMemory(): { chunks: number; bytes: number } {
    return this.ground.memory;
  }

  /**
   * How many pixels the ground drawn from its chunks differs from the same ground baked whole,
   * as it is today: none, or there's a seam. For the smoke check only.
   */
  groundSeams(): number {
    const { map } = this.zone;
    const whole = new Ground(map, CLUTTER[this.zone.id], Math.max(map.width, map.height));
    if (this.reshaped) whole.retile(this.reshaped.tiles);
    whole.look(this.ground.looks);
    whole.wet(this.weather() === 'rain');
    const a = this.ground.whole();
    const b = whole.whole();
    const pa = a.getContext('2d')!.getImageData(0, 0, a.width, a.height).data;
    const pb = b.getContext('2d')!.getImageData(0, 0, b.width, b.height).data;
    let differ = 0;
    for (let i = 0; i < pa.length; i += 4) {
      if (
        pa[i] !== pb[i] ||
        pa[i + 1] !== pb[i + 1] ||
        pa[i + 2] !== pb[i + 2] ||
        pa[i + 3] !== pb[i + 3]
      )
        differ++;
    }
    return differ;
  }

  /**
   * What moves on its own here as the last frame drew it: each prop's frame, by its id, and how
   * many flyers and falling leaves there were, wherever they were (V1's E5, the smoke check).
   */
  motion(): { props: { id: PropId; frame: number }[]; flyers: number; leaves: number } {
    return {
      props: this.moving.frames(this.drawnAt),
      flyers: this.flyers.drawn(),
      leaves: this.leaves.drawn(),
    };
  }
}
