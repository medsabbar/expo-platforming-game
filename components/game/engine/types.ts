// Shared game types
export interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  passed?: boolean;
}

export interface Particle {
  id: number;
  type: "ember" | "snow";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  seed: number;
}

export interface BiomeDef {
  name: string;
  grassTop: string[];
  dirt: string[];
  accent: string;
  platformColor: string;
}

export interface GroundTile {
  x: number;
  y: number;
  color: string;
  /**
   * Logical column index used for deterministic color variation when
   * recycling tiles for infinite scrolling. Starts at 0 and increments
   * each time the tile is moved to the right edge.
   */
  col?: number;
}
