import { BiomeDef, GroundTile } from "./types";

// Shared tile size so render & game logic can stay in sync
export const TILE_SIZE = 40;

// Internal helpers for color mixing
const toRGB = (h: string) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
});
const mixColor = (a: string, b: string, t: number) => {
  const ca = toRGB(a);
  const cb = toRGB(b);
  const comp = (k: "r" | "g" | "b") =>
    Math.round(ca[k] + (cb[k] - ca[k]) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${comp("r")}${comp("g")}${comp("b")}`;
};

const rand = (seed: number) => {
  const x = Math.sin(seed * 9999) * 43758.5453;
  return x - Math.floor(x);
};

const pick = (arr: string[], seed: number) => arr[Math.floor(rand(seed) * arr.length) % arr.length];

/**
 * Build a ground tile grid. colsOverride lets us request a specific
 * number of columns for pooling (e.g. screenCols + buffer).
 */
export function buildGroundTiles(
  biome: BiomeDef,
  screenW: number,
  topY: number,
  dayFactor: number,
  colsOverride?: number
): GroundTile[] {
  const tiles: GroundTile[] = [];
  const tileSize = TILE_SIZE;
  const rows = 4;
  const cols = colsOverride ?? Math.ceil(screenW / tileSize) + 4; // add small buffer
  for (let c = 0; c < cols; c++) {
    const baseX = c * tileSize;
    for (let r = 0; r < rows; r++) {
      const y = topY + r * tileSize;
      if (r === 0) {
        const g1 = pick(biome.grassTop, c * 17.17 + r * 13.3);
        const g2 = pick(biome.grassTop, c * 21.91 + r * 7.77 + 99);
        const mixT = rand(c * 1.37 + r * 0.17);
        const color = mixColor(g1, g2, mixT);
        tiles.push({ x: baseX, y, color, col: c });
      } else {
        const d1 = pick(biome.dirt, c * 11.11 + r * 2.3);
        const d2 = pick(biome.dirt, c * 3.31 + r * 4.7 + 55);
        const tVar = rand(c * 11.11 + r * 23.7);
        let color = mixColor(d1, d2, tVar);
        const brighten = 0.15 * dayFactor;
        const rgb = toRGB(color);
        rgb.r = Math.min(255, Math.round(rgb.r * (1 + brighten)));
        rgb.g = Math.min(255, Math.round(rgb.g * (1 + brighten)));
        rgb.b = Math.min(255, Math.round(rgb.b * (1 + brighten)));
        color = `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
          .toString(16)
          .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
        tiles.push({ x: baseX, y, color, col: c });
      }
    }
  }
  return tiles;
}

/**
 * Recycle any ground tile columns that scrolled off the left, moving them
 * to the right edge and regenerating their colors deterministically based
 * on the new logical column index (col).
 */
export function recycleGroundTiles(
  tiles: GroundTile[],
  biome: BiomeDef,
  leftX: number,
  rightEdge: number,
  dayFactor: number
) {
  const tileSize = TILE_SIZE;
  const rows = 4;
  // Determine current max column logical index
  let maxCol = 0;
  for (const t of tiles) if (t.col !== undefined) maxCol = Math.max(maxCol, t.col);
  for (let c = 0; c < tiles.length; c += rows) {
    const colGroup = tiles.slice(c, c + rows);
    if (colGroup.length < rows) continue;
    // If this column is fully left of leftX, move it to the right
    if (colGroup[0].x + tileSize < leftX) {
      const newCol = maxCol + 1;
      const newBaseX = rightEdge + tileSize; // place just beyond current right edge
      maxCol = newCol;
      for (let r = 0; r < rows; r++) {
        const tile = colGroup[r];
        tile.x = newBaseX;
        tile.col = newCol;
        // Recompute color
        if (r === 0) {
          const g1 = pick(biome.grassTop, newCol * 17.17 + r * 13.3);
          const g2 = pick(biome.grassTop, newCol * 21.91 + r * 7.77 + 99);
          const mixT = rand(newCol * 1.37 + r * 0.17);
          tile.color = mixColor(g1, g2, mixT);
        } else {
          const d1 = pick(biome.dirt, newCol * 11.11 + r * 2.3);
          const d2 = pick(biome.dirt, newCol * 3.31 + r * 4.7 + 55);
          const tVar = rand(newCol * 11.11 + r * 23.7);
          let color = mixColor(d1, d2, tVar);
          const brighten = 0.15 * dayFactor;
          const rgb = toRGB(color);
          rgb.r = Math.min(255, Math.round(rgb.r * (1 + brighten)));
          rgb.g = Math.min(255, Math.round(rgb.g * (1 + brighten)));
          rgb.b = Math.min(255, Math.round(rgb.b * (1 + brighten)));
          tile.color = `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
            .toString(16)
            .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
        }
      }
    }
  }
}
