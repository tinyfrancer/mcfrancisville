import { describe, expect, it } from 'vitest';
import { puddlesOf } from '../../src/render/puddles';
import { underfootOn } from '../../src/wiring/underfoot';
import { harness } from '../world/harness';

describe('what’s underfoot outdoors (1.6’s X4)', () => {
  const town = harness().world.zones.outdoor('town')!;
  const puddle = puddlesOf(town.map)[0]!;
  const lawn = town.map.tiles.findIndex((t) => t === 'grass');
  const lawnTile = { tx: lawn % town.map.width, ty: Math.floor(lawn / town.map.width) };

  it('is snow on the lawn in winter, and a puddle on the path only in the rain', () => {
    expect(underfootOn(town, lawnTile.tx, lawnTile.ty, '2027-01-15', 'clear')).toBe('snow');
    expect(underfootOn(town, lawnTile.tx, lawnTile.ty, '2027-05-15', 'clear')).toBeNull();
    expect(underfootOn(town, puddle.tx, puddle.ty, '2027-05-15', 'rain')).toBe('puddle');
    expect(underfootOn(town, puddle.tx, puddle.ty, '2027-05-15', 'clear')).toBeNull();
    // Winter's rain falls as snow: no puddles stand on it, and a path isn't snow to step in.
    expect(underfootOn(town, puddle.tx, puddle.ty, '2027-01-15', 'rain')).toBeNull();
  });
});
