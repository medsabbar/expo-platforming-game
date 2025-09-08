import { BiomeDef, GroundTile } from "./types";

export function buildGroundTiles(
  biome: BiomeDef,
  screenW: number,
  topY: number,
  dayFactor: number
): GroundTile[] {
  const tiles: GroundTile[] = [];
  const tileSize = 40;
  const rows = 4;
  const cols = Math.ceil(screenW / tileSize) + 2;
  const rand = (seed: number) => {
    const x = Math.sin(seed * 9999) * 43758.5453;
    return x - Math.floor(x);
  };
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  for (let c = 0; c < cols; c++) {
    const baseX = c * tileSize;
    for (let r = 0; r < rows; r++) {
      const y = topY + r * tileSize;
      if (r === 0) {
        const g1 = pick(biome.grassTop);
        const g2 = pick(biome.grassTop);
        const mixT = rand(c * 1.37);
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
        const color = mixColor(g1, g2, mixT);
        tiles.push({ x: baseX, y, color });
      } else {
        const d1 = pick(biome.dirt);
        const d2 = pick(biome.dirt);
        const tVar = rand(c * 11.11 + r * 23.7);
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
        let color = mixColor(d1, d2, tVar);
        const brighten = 0.15 * dayFactor;
        const rgb = toRGB(color);
        rgb.r = Math.min(255, Math.round(rgb.r * (1 + brighten)));
        rgb.g = Math.min(255, Math.round(rgb.g * (1 + brighten)));
        rgb.b = Math.min(255, Math.round(rgb.b * (1 + brighten)));
        color = `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
          .toString(16)
          .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
        tiles.push({ x: baseX, y, color });
      }
    }
  }
  return tiles;
}
