import { CROPS } from '../data/crops';
import type { RareYield, Yield } from '../data/gathering';
import type { CropId, ItemId } from '../types/ids';
import { dayKey } from './clock';
import { hashString } from './random';
import { weatherOn } from './weather';

/**
 * A crop in the ground. Nothing ticks while the game is closed (decisions.md 4): how far it has
 * grown is worked out from when it was planted and how often it was watered, whenever it's asked.
 */
export interface Planting {
  crop: CropId;
  /** Epoch milliseconds. */
  plantedAt: number;
  /** How many days it has been watered on, counting today if it has been. */
  waterings: number;
  /** The day key it was last watered on. */
  lastWatered: string | null;
  /** Planted where it grows best (`CropRow.thrives`), so a day sooner (0.2's N1). */
  quick?: true;
}

/** How many days of growth a planting needs to ripen: a day fewer where it thrives, never none. */
export function ripeDays(p: Planting): number {
  const days = CROPS[p.crop].days;
  return p.quick ? Math.max(1, days - 1) : days;
}

export type Stage = 'seed' | 'sprout' | 'growing' | 'ripe';

/** Whole days from one day key to another, by the calendar, so a clock change can't skew it. */
export function daysBetween(from: string, to: string): number {
  const utc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y!, m! - 1, d!);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** The day key `days` after another, by the calendar. */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const at = new Date(Date.UTC(y!, m! - 1, d! + days));
  const mm = String(at.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(at.getUTCDate()).padStart(2, '0');
  return `${at.getUTCFullYear()}-${mm}-${dd}`;
}

/** Whether it rains on a day, which waters every bed as well as her can would (phase L). */
export function rainsOn(day: string): boolean {
  return weatherOn(day) === 'rain';
}

/**
 * The day key a sprinkler has watered a bed from, each morning since, or null if none reaches it
 * (phase P). Sprinklers are counted from the stored day they went in, never ticked.
 */
export type Sprinkled = string | null;

/**
 * Whether a planting was watered on day `day` by the rain or a sprinkler, rather than her can. The
 * day she last watered it by hand is hers, so a sprinkler fitted after she watered can't count it
 * twice (she can't water a sprinkled bed, so no other day can overlap).
 */
function wateredFor(p: Planting, day: string, sprinkled: Sprinkled): boolean {
  if (rainsOn(day)) return true;
  return sprinkled !== null && day >= sprinkled && day !== p.lastWatered;
}

/**
 * Days of growth: every morning since it went in, and one more for each day it was watered, by
 * her, the rain or a sprinkler. A watering counts from the next morning, so a seed doesn't sprout
 * while the can is still dripping. Only as many days are looked at as could matter before it's ripe.
 */
export function growth(p: Planting, now: number, sprinkled: Sprinkled = null): number {
  const today = dayKey(now);
  const planted = dayKey(p.plantedAt);
  const mornings = Math.max(0, daysBetween(planted, today));
  const wateredToday = p.lastWatered !== null && p.lastWatered >= today ? 1 : 0;
  let helped = 0;
  const looked = Math.min(mornings, ripeDays(p));
  for (let d = 0; d < looked; d++) if (wateredFor(p, addDays(planted, d), sprinkled)) helped++;
  return mornings + Math.max(0, p.waterings - wateredToday) + helped;
}

export function stageOf(p: Planting, now: number, sprinkled: Sprinkled = null): Stage {
  const days = ripeDays(p);
  const g = growth(p, now, sprinkled);
  if (g >= days) return 'ripe';
  if (g === 0) return 'seed';
  return g / days < 0.5 ? 'sprout' : 'growing';
}

/** Mornings until it's ripe if she leaves it be; watering only brings the day closer. */
export function daysToRipe(p: Planting, now: number, sprinkled: Sprinkled = null): number {
  const left = ripeDays(p) - growth(p, now, sprinkled);
  return Math.max(0, left - (wateredToday(p, now, sprinkled) ? 1 : 0));
}

/** What has watered a bed today, if anything: her can, the rain or a sprinkler. */
export type Watered = 'can' | 'rain' | 'sprinkler';

export function wateredBy(
  p: Planting | null,
  now: number,
  sprinkled: Sprinkled = null,
): Watered | null {
  const today = dayKey(now);
  if (p?.lastWatered === today) return 'can';
  if (rainsOn(today)) return 'rain';
  if (sprinkled !== null && sprinkled <= today) return 'sprinkler';
  return null;
}

/** Whether it has had a drink today, from her can, the rain or a sprinkler. */
export function wateredToday(p: Planting, now: number, sprinkled: Sprinkled = null): boolean {
  return wateredBy(p, now, sprinkled) !== null;
}

/** A crop can be watered once a day while it's growing; there's no need once it's ripe. */
export function canWater(p: Planting, now: number, sprinkled: Sprinkled = null): boolean {
  return !wateredToday(p, now, sprinkled) && stageOf(p, now, sprinkled) !== 'ripe';
}

export function water(p: Planting, now: number): Planting {
  return { ...p, waterings: p.waterings + 1, lastWatered: dayKey(now) };
}

/**
 * A planting whose sprinkler has been taken out (or moved) keeps what it did: each day it watered
 * this bed, and doesn't under `after`, becomes a watering of its own. Nothing she grew is undone
 * (decisions.md 11).
 */
export function keepSprinkling(
  p: Planting,
  now: number,
  before: Sprinkled,
  after: Sprinkled,
): Planting {
  if (before === null) return p;
  const today = dayKey(now);
  const planted = dayKey(p.plantedAt);
  let kept = 0;
  let keptToday = false;
  const from = before > planted ? before : planted;
  for (let day = from; day <= today; day = addDays(day, 1)) {
    const still = after !== null && day >= after;
    if (still || rainsOn(day) || day === p.lastWatered) continue;
    kept++;
    if (day === today) keptToday = true;
  }
  if (kept === 0) return p;
  return {
    ...p,
    waterings: p.waterings + kept,
    lastWatered: keptToday ? today : p.lastWatered,
  };
}

/**
 * Whether something rare comes up this time. It's a hash rather than a roll, so the answer is
 * fixed the moment a rose is planted (and it can bloom blue in the bed before she picks it).
 */
export function isRare(rare: RareYield | undefined, seed: string): boolean {
  return rare !== undefined && hashString(seed) % rare.oneIn === 0;
}

/** What a yield gives this time: its usual, or one of its rare thing. */
export function yieldOf(give: Yield, seed: string): { item: ItemId; count: number } {
  if (give.rare && isRare(give.rare, seed)) return { item: give.rare.item, count: 1 };
  return { item: give.item, count: give.count };
}

/**
 * Something found as well as a yield this time, if anything: one of its bonus, now and then, and
 * `luck` times as often on a lucky day.
 */
export function bonusOf(give: Yield, seed: string, luck = 1): ItemId | null {
  const bonus = give.bonus;
  if (!bonus || bonus.from.length === 0) return null;
  const h = hashString(`bonus:${seed}`);
  if (h % Math.max(1, Math.round(bonus.oneIn / luck)) !== 0) return null;
  return bonus.from[(h >>> 8) % bonus.from.length]!;
}

/** The seed a planting's rarity is read from: where it is and the moment it went in. */
export function plantingSeed(key: string, p: Planting): string {
  return `${key}@${p.plantedAt}`;
}

/** Whether this planting will come up rare, which the bed shows once it's ripe. */
export function plantingIsRare(key: string, p: Planting): boolean {
  return isRare(CROPS[p.crop].harvest.rare, plantingSeed(key, p));
}
