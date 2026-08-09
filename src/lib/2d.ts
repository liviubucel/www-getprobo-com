export type Position = {
  x: number;
  y: number;
};

/**
 * Generates a normalized vector representing the direction between 2 positions
 */
export function normalVec(a: Position, b: Position): Position {
  return {
    x: (b.x - a.x) / Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),
    y: (b.y - a.y) / Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),
  };
}

/**
 * Find the distance between 2 points
 */
export function distanceSquared(a: Position, b: Position): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
