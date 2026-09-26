export interface Tile {
  tx: number;
  ty: number;
}

export type Walkable = (tx: number, ty: number) => boolean;

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

const DIAGONAL = Math.SQRT2;

function octile(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return Math.max(dx, dy) + (DIAGONAL - 1) * Math.min(dx, dy);
}

/**
 * A* over the tile grid, eight ways. A diagonal step needs both tiles it squeezes between to be
 * open, so a path never clips the corner of a fence or a house. Returns the tiles to walk through,
 * start excluded and goal included, or null when the goal can't be reached.
 */
export function findPath(
  from: Tile,
  to: Tile,
  walkable: Walkable,
  width: number,
  height: number,
): Tile[] | null {
  if (!walkable(to.tx, to.ty)) return null;
  if (from.tx === to.tx && from.ty === to.ty) return [];

  const key = (tx: number, ty: number) => ty * width + tx;
  const size = width * height;
  const cost = new Float64Array(size).fill(Infinity);
  const cameFrom = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const open = new MinHeap();

  const start = key(from.tx, from.ty);
  const goal = key(to.tx, to.ty);
  cost[start] = 0;
  open.push(start, octile(from.tx, from.ty, to.tx, to.ty));

  while (open.size > 0) {
    const current = open.pop()!;
    if (current === goal) break;
    if (closed[current]) continue;
    closed[current] = 1;
    const cx = current % width;
    const cy = (current - cx) / width;

    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || !walkable(nx, ny)) continue;
      const diagonal = dx !== 0 && dy !== 0;
      if (diagonal && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const next = key(nx, ny);
      if (closed[next]) continue;
      const tentative = cost[current]! + (diagonal ? DIAGONAL : 1);
      if (tentative < cost[next]!) {
        cost[next] = tentative;
        cameFrom[next] = current;
        open.push(next, tentative + octile(nx, ny, to.tx, to.ty));
      }
    }
  }

  if (cameFrom[goal] === -1) return null;
  const path: Tile[] = [];
  for (let at = goal; at !== start; at = cameFrom[at]!) {
    path.push({ tx: at % width, ty: Math.floor(at / width) });
  }
  return path.reverse();
}

/** A binary heap of node ids ordered by priority; stale entries are skipped by the caller. */
class MinHeap {
  private ids: number[] = [];
  private priorities: number[] = [];

  get size(): number {
    return this.ids.length;
  }

  push(id: number, priority: number): void {
    this.ids.push(id);
    this.priorities.push(priority);
    let i = this.ids.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorities[parent]! <= priority) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number | undefined {
    const top = this.ids[0];
    const lastId = this.ids.pop();
    const lastPriority = this.priorities.pop();
    if (this.ids.length > 0 && lastId !== undefined && lastPriority !== undefined) {
      this.ids[0] = lastId;
      this.priorities[0] = lastPriority;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.ids.length && this.priorities[left]! < this.priorities[smallest]!) {
          smallest = left;
        }
        if (right < this.ids.length && this.priorities[right]! < this.priorities[smallest]!) {
          smallest = right;
        }
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.ids[a], this.ids[b]] = [this.ids[b]!, this.ids[a]!];
    [this.priorities[a], this.priorities[b]] = [this.priorities[b]!, this.priorities[a]!];
  }
}
