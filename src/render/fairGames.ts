import { ACTIVITIES, type ActivityId, type Game } from '../data/activities';
import { bake } from '../sprites/bake';
import {
  GAME_BACKDROPS,
  GAME_PALETTES,
  GAME_PIECES,
  POLE,
  SHELF_Y,
  STAGE_H,
  STAGE_W,
  WATER_Y,
  type GamePiece,
} from '../sprites/fairGames';
import { PALETTE } from '../sprites/palette';
import { spriteSize } from '../sprites/sprite';
import { ducksAt, ghostsAt, patternOf, puckAt, ringAt, type Pattern } from '../systems/activities';
import type { Round, Thrown } from '../world/services/Activities';

/** How long the burst where a throw lands shows, ms: big, then fading. */
const HIT_MS = 520;

/** The stage as it stands: the go under way (if any), the last throw, and now on the game's clock. */
export interface FairStage {
  activity: ActivityId;
  round: Round | null;
  last: Thrown | null;
  now: number;
}

const gameOf = (id: ActivityId): Game['game'] => {
  const does = ACTIVITIES[id].does;
  if (!('game' in does)) throw new Error(`${id} isn't a game`);
  return does.game;
};

/**
 * Draws a fairground game's stage into a canvas of the HUD's (V1's R6b), at the art's own pixels
 * for CSS to scale by a whole number: its stall's inside, and the moving thing where the rules say
 * it is now (`systems/activities.ts`, the same reads that score her tap), or where the last throw
 * went, with a burst where it landed. Between goes, a go's worth of it idles so the stall looks open.
 */
export function drawFairGame(canvas: HTMLCanvasElement, stage: FairStage): void {
  const game = gameOf(stage.activity);
  const palette = GAME_PALETTES[stage.activity]!;
  if (canvas.width !== STAGE_W || canvas.height !== STAGE_H) {
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  ctx.drawImage(bake(`fairStage:${stage.activity}`, GAME_BACKDROPS[game.motion], palette), 0, 0);
  const put = (piece: GamePiece, x: number, y: number) => {
    const source = GAME_PIECES[piece];
    const sprite = bake(`fairPiece:${stage.activity}:${piece}`, source, palette);
    const { width, height } = spriteSize(source);
    ctx.drawImage(sprite, Math.round(x - width / 2), Math.round(y - height), width, height);
  };

  const { round, last, now } = stage;
  const next = round?.next ?? null;
  // Showing where the last throw went until the next one starts moving, and after the last.
  const showLast =
    last !== null && (next === null || next.startedAt === null || now < next.startedAt);
  const lastPattern = last?.pattern ?? null;
  const live: { pattern: Pattern; ms: number } = next
    ? { pattern: next.pattern, ms: next.startedAt === null ? 0 : now - next.startedAt }
    : { pattern: patternOf(game, `idle:${stage.activity}`, 0), ms: now % 600_000 };
  const settled = showLast && lastPattern ? lastPattern : live.pattern;
  // Where things were as she tapped, while the last throw shows; else where they are now.
  const frozen = showLast && last ? last.ms : live.ms;

  switch (game.motion) {
    case 'swing': {
      const p = settled;
      for (let i = 0; i < p.targets; i++) {
        const x = ((i + 0.5) / p.targets) * STAGE_W;
        put('bottle', x, SHELF_Y);
        // The glint twinkles: on most of the time, off now and then, so it reads as a sparkle.
        if (i === p.glint && (next || showLast) && Math.floor(now / 180) % 5 !== 0) {
          put('glint', x + 3, SHELF_Y - 12);
        }
      }
      if (showLast && last) {
        const x = last.grade > 0 ? p.target * STAGE_W : last.at * STAGE_W;
        put('ring', x, last.grade > 0 ? SHELF_Y - 9 : SHELF_Y);
        put('trolley', x, 9);
        hit(put, last, now, x, SHELF_Y - 10);
      } else {
        const x = ringAt(live.pattern, live.ms) * STAGE_W;
        put('trolley', x, 9);
        line(ctx, x, 9, 18);
        put('ring', x, 24);
      }
      break;
    }
    case 'bob': {
      const hookX = STAGE_W / 2;
      const xs = ghostsAt(settled, frozen);
      xs.forEach((x, k) => {
        if (showLast && last && last.grade > 0 && k === last.at) return;
        const bob = Math.round(Math.sin(x * Math.PI * 8 + now / 400));
        wrap(x, (px) => put('ghost', px, WATER_Y + 3 + bob));
      });
      if (showLast && last && last.grade > 0) {
        line(ctx, hookX, 4, 14);
        put('hook', hookX + 1, 26);
        put('ghost', hookX, 38);
        hit(put, last, now, hookX, 34);
      } else if (showLast && last) {
        line(ctx, hookX, 4, 28);
        put('hook', hookX + 1, 40);
        put('splash', hookX, WATER_Y + 1);
      } else {
        line(ctx, hookX, 4, 20);
        put('hook', hookX + 1, 32);
      }
      break;
    }
    case 'ducks': {
      const xs = ducksAt(settled, frozen);
      xs.forEach((x, k) => {
        if (showLast && last && k === last.at) return;
        const bob = Math.round(Math.sin(x * Math.PI * 6 + now / 500));
        wrap(x, (px) => put('duck', px, WATER_Y - 1 + bob));
      });
      if (showLast && last) {
        const x = Math.min(STAGE_W - 8, Math.max(8, (xs[last.at] ?? 0.5) * STAGE_W));
        const under = (['duckPlain', 'duckStar', 'duckCrown'] as const)[last.grade];
        put(under, x, 22);
        hit(put, last, now, x, 18);
      }
      break;
    }
    case 'bell': {
      const x = POLE.x + 2;
      const travel = POLE.foot - POLE.top - 6;
      const h = showLast && last ? last.at : next?.startedAt ? puckAt(live.pattern, live.ms) : 0;
      const ringing = showLast && last !== null && last.grade === 2 && now - last.tappedAt < 1200;
      put(ringing && Math.floor(now / 90) % 2 === 0 ? 'bellRinging' : 'bell', x, POLE.top + 1);
      put('puck', x, POLE.foot - Math.round(h * travel));
      if (showLast && last) hit(put, last, now, x, POLE.foot - Math.round(h * travel) - 4);
      break;
    }
  }
}

/** Draws something on a loop round the stage twice where it runs off one edge onto the other. */
function wrap(x: number, draw: (px: number) => void): void {
  const px = x * STAGE_W;
  draw(px);
  if (px < 8) draw(px + STAGE_W);
  if (px > STAGE_W - 8) draw(px - STAGE_W);
}

/** A cord or a line, a pixel wide, from (x, y0) down `length`. */
function line(ctx: CanvasRenderingContext2D, x: number, y0: number, length: number): void {
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(Math.round(x), y0, 1, length);
}

/** The burst where a throw went: for a good or better one, while it's fresh. */
function hit(
  put: (piece: GamePiece, x: number, y: number) => void,
  last: Thrown,
  now: number,
  x: number,
  y: number,
): void {
  const since = now - last.tappedAt;
  if (last.grade === 0 || since > HIT_MS) return;
  put(since < HIT_MS / 2 ? 'hit' : 'hitFading', x, y + 6);
}
