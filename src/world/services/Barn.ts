import { SPRINKLER } from '../../systems/beds';
import { fieldsOf, sprinklersFor, type Field } from '../../systems/barn';
import type { MapZoneId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Plot } from '../Farm';
import type { Garden } from './Garden';

/** A field as the barn's wall shows it. */
export interface FieldView {
  /** The first and last of the place's rows of beds it takes in, from 1 at the top. */
  rows: [number, number];
  beds: number;
  /** How many of its beds a sprinkler reaches. */
  watered: number;
  /** How many sprinklers it would take to reach the rest. */
  needs: number;
  /** How many sprinklers stand in it. */
  standing: number;
}

/** Her sprinklers and the farm's fields, as the barn's wall shows them. */
export interface Wall {
  inBag: number;
  /** Where her sprinklers stand, a count for each place. */
  standing: { zone: ZoneId; count: number }[];
  fields: FieldView[];
}

/**
 * The barn at Boo Acres (0.3's F2, decision 242): walking up to it shows the wall where her tools
 * hang, with her sprinklers, and offers each of the farm's fields to sprinkle whole, from her bag,
 * with as few as it takes, or to bring its sprinklers in again. Nothing of its own is saved; the
 * sprinklers are the garden's, as if she had stood each one herself.
 */
export class Barn {
  private readonly bag: Bag;
  private readonly garden: Garden;
  private readonly place: MapZoneId;

  constructor(bag: Bag, garden: Garden, place: MapZoneId = 'booAcres') {
    this.bag = bag;
    this.garden = garden;
    this.place = place;
  }

  /** The farm's fields, the rows she has built among them, top first. */
  private fields(): Field[] {
    return fieldsOf(this.garden.farm.bedsIn(this.place));
  }

  private plots(field: Field): Plot[] {
    return field.beds.map((t) => ({ zone: this.place, tx: t.tx, ty: t.ty }));
  }

  /** Where sprinklers would go to water a field whole. */
  private toWater(field: Field): Plot[] {
    const farm = this.garden.farm;
    const at = (t: { tx: number; ty: number }) => ({ zone: this.place, ...t });
    return sprinklersFor(
      field.beds,
      (t) => farm.sprinkled(at(t)) !== null,
      (t) => farm.hasSprinkler(at(t)),
    ).map(at);
  }

  wall(): Wall {
    const farm = this.garden.farm;
    const counts = new Map<ZoneId, number>();
    for (const s of farm.sprinklersIn) counts.set(s.zone, (counts.get(s.zone) ?? 0) + 1);
    return {
      inBag: this.bag.count(SPRINKLER),
      standing: [...counts].map(([zone, count]) => ({ zone, count })),
      fields: this.fields().map((field) => {
        const beds = this.plots(field);
        return {
          rows: field.rows,
          beds: beds.length,
          watered: beds.filter((b) => farm.sprinkled(b) !== null).length,
          needs: this.toWater(field).length,
          standing: beds.filter((b) => farm.hasSprinkler(b)).length,
        };
      }),
    };
  }

  /** Stands sprinklers from her bag to water field `n` whole, as far as she has them. How many. */
  sprinkle(n: number): number {
    const field = this.fields()[n];
    return field ? this.garden.fitAll(this.toWater(field)) : 0;
  }

  /** Brings the sprinklers in field `n` back into her bag. How many. */
  bringIn(n: number): number {
    const field = this.fields()[n];
    if (!field) return 0;
    return this.garden.unfitAll(this.plots(field));
  }
}
