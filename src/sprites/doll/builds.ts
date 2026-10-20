import type { Build } from '../../data/builds';
import {
  BODY,
  frontBody,
  measured,
  REGULAR_MEASURE,
  REGULAR_PARTS,
  sideBody,
  type Grid,
  type Measure,
  type Parts,
  type View,
} from './body';
import { SLIGHT_MEASURE, SLIGHT_PARTS, slightReach } from './slight';
import { STOUT_MEASURE, STOUT_PARTS, stoutReach } from './stout';

/*
 * A body for every build (1.1's A5a, decision 354): how its parts are drawn, what its cuts measure
 * against, where an arm drawn for her lands on it, and its standing and walking bodies.
 */

export type Point = readonly [number, number];

export interface Physique {
  parts: Parts;
  measure: Measure;
  /** Where a point of an arm drawn for her body lands on this one. */
  reach: (p: Point, view: View) => Point;
  /** Standing, then two walk frames, by view: her `BODY` for her build. */
  body: Record<View, readonly Grid[]>;
}

/** A build's standing and walking bodies, each measured as that build's. */
function bodiesOf(parts: Parts, measure: Measure): Record<View, readonly Grid[]> {
  const front = ([0, -1, 1] as const).map((lift) => measured(frontBody(lift, parts), measure));
  return {
    front,
    back: front,
    side: [0, 1, 2].map((frame) => measured(sideBody(frame, parts), measure)),
  };
}

export const PHYSIQUES: Record<Build, Physique> = {
  regular: { parts: REGULAR_PARTS, measure: REGULAR_MEASURE, reach: (p) => p, body: BODY },
  slight: {
    parts: SLIGHT_PARTS,
    measure: SLIGHT_MEASURE,
    reach: slightReach,
    body: bodiesOf(SLIGHT_PARTS, SLIGHT_MEASURE),
  },
  stout: {
    parts: STOUT_PARTS,
    measure: STOUT_MEASURE,
    reach: stoutReach,
    body: bodiesOf(STOUT_PARTS, STOUT_MEASURE),
  },
};

/** A build's standing and walking bodies, by view. */
export function bodyOf(build: Build): Record<View, readonly Grid[]> {
  return PHYSIQUES[build].body;
}
