// Day/night palette interpolation utilities
export const cycleDuration = 120; // seconds - increased for more gradual transitions

export const palettes = {
  dawn: ["#f9d29d", "#f9c46b", "#f39b6d"],
  day: ["#a3d9ff", "#68b7ff", "#4fa3f0"],
  dusk: ["#ffb199", "#ff8e72", "#2d3a63"],
  night: ["#0a1444", "#081a55", "#050d26"],
};

export interface Pal {
  top: string;
  mid: string;
  bot: string;
}

function hexToRgb(h: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
    .join("")}`;
}
function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t
  );
}
const interpPal = (a: string[], b: string[], tt: number): Pal => ({
  top: mix(a[0], b[0], tt),
  mid: mix(a[1], b[1], tt),
  bot: mix(a[2], b[2], tt),
});

export function paletteFor(cycleT: number): Pal {
  const { dawn, day, dusk, night } = palettes;
  // More gradual transitions with longer blend periods
  if (cycleT < 0.2) return interpPal(night, dawn, cycleT / 0.2);
  if (cycleT < 0.35) return interpPal(dawn, day, (cycleT - 0.2) / 0.15);
  if (cycleT < 0.5) return { top: day[0], mid: day[1], bot: day[2] };
  if (cycleT < 0.65) return interpPal(day, dusk, (cycleT - 0.5) / 0.15);
  if (cycleT < 0.8) return interpPal(dusk, night, (cycleT - 0.65) / 0.15);
  return interpPal(night, dawn, (cycleT - 0.8) / 0.2);
}

export function computeDayFactor(cycleT: number) {
  return Math.max(0, Math.sin(cycleT * Math.PI));
}
