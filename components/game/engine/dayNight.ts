// Day/night palette interpolation utilities
export const cycleDuration = 60; // seconds

export const palettes = {
  dawn: ["#ffd29d", "#ffdc6b", "#ffab6d"], // Brighter dawn colors
  sunrise: ["#ffcc66", "#ffaa5c", "#ff8a4d"], // Enhanced sunrise brightness
  day: ["#a3d9ff", "#68b7ff", "#4fa3f0"],
  dusk: ["#ffcc99", "#ffaa72", "#ff8a4d"], // Brighter dusk colors
  sunset: ["#ff8b8a", "#ff6757", "#ff8a4d"], // Enhanced sunset colors
  night: ["#4a5a8a", "#5a6a9a", "#6a7aaa"], // Brighter night colors
};

// Define time periods for smoother transitions with shorter sunrise/sunset
export const timePhases = {
  night: { start: 0.0, end: 0.15 }, // 0-15%: Deep night (longer)
  sunrise: { start: 0.15, end: 0.2 }, // 15-20%: Sunrise transition (shorter)
  dawn: { start: 0.2, end: 0.25 }, // 20-25%: Dawn (shorter)
  day: { start: 0.25, end: 0.7 }, // 25-70%: Full day (much longer)
  dusk: { start: 0.7, end: 0.75 }, // 70-75%: Dusk (shorter)
  sunset: { start: 0.75, end: 0.8 }, // 75-80%: Sunset transition (shorter)
  nightfall: { start: 0.8, end: 1.0 }, // 80-100%: Back to night (longer)
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
  const mixed = {
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  };

  // Ensure minimum brightness to prevent pitch black, especially during transitions
  const minBrightness = 80; // Further increased minimum RGB value for better visibility
  mixed.r = Math.max(minBrightness, mixed.r);
  mixed.g = Math.max(minBrightness, mixed.g);
  mixed.b = Math.max(minBrightness, mixed.b);

  return rgbToHex(Math.round(mixed.r), Math.round(mixed.g), Math.round(mixed.b));
}
const interpPal = (a: string[], b: string[], tt: number): Pal => ({
  top: mix(a[0], b[0], tt),
  mid: mix(a[1], b[1], tt),
  bot: mix(a[2], b[2], tt),
});

export function paletteFor(cycleT: number): Pal {
  const { dawn, sunrise, day, dusk, sunset, night } = palettes;
  const {
    night: nightPhase,
    sunrise: sunrisePhase,
    dawn: dawnPhase,
    day: dayPhase,
    dusk: duskPhase,
    sunset: sunsetPhase,
    nightfall,
  } = timePhases;

  // Normalize cycleT to [0, 1)
  cycleT = cycleT % 1;

  if (cycleT >= nightPhase.start && cycleT < sunrisePhase.start) {
    // Deep night - use the brighter night colors
    const brightNight = ["#6a7aaa", "#7a8abb", "#8a9acc"]; // Consistent with other transitions
    return { top: brightNight[0], mid: brightNight[1], bot: brightNight[2] };
  } else if (cycleT >= sunrisePhase.start && cycleT < dawnPhase.start) {
    // Sunrise transition: smooth transition from bright night to sunrise
    const t =
      (cycleT - sunrisePhase.start) / (sunrisePhase.end - sunrisePhase.start);
    // Use an even brighter intermediate to ensure no black sky
    const brightPreSunrise = ["#6a7aaa", "#7a8abb", "#8a9acc"]; // Very bright pre-sunrise
    return interpPal(brightPreSunrise, sunrise, t);
  } else if (cycleT >= dawnPhase.start && cycleT < dayPhase.start) {
    // Dawn transition: dawn -> day
    const t = (cycleT - dawnPhase.start) / (dawnPhase.end - dawnPhase.start);
    return interpPal(dawn, day, t);
  } else if (cycleT >= dayPhase.start && cycleT < duskPhase.start) {
    // Full day
    return { top: day[0], mid: day[1], bot: day[2] };
  } else if (cycleT >= duskPhase.start && cycleT < sunsetPhase.start) {
    // Dusk transition: day -> dusk
    const t = (cycleT - duskPhase.start) / (duskPhase.end - duskPhase.start);
    return interpPal(day, dusk, t);
  } else if (cycleT >= sunsetPhase.start && cycleT < nightfall.start) {
    // Sunset transition: smooth transition from dusk to sunset
    const t =
      (cycleT - sunsetPhase.start) / (sunsetPhase.end - sunsetPhase.start);
    return interpPal(dusk, sunset, t);
  } else {
    // Nightfall: gradual transition to bright night colors
    const t = (cycleT - nightfall.start) / (nightfall.end - nightfall.start);
    // Use bright intermediate colors to prevent black sky
    const brightPostSunset = ["#8a7aaa", "#7a8abb", "#6a9acc"]; // Very bright post-sunset
    const targetNight = ["#6a7aaa", "#7a8abb", "#8a9acc"]; // Keep night bright
    return interpPal(brightPostSunset, targetNight, Math.min(0.8, t)); // Smooth transition
  }
}

export function computeDayFactor(cycleT: number) {
  // Ensure good visibility throughout all phases
  const { sunrise, sunset } = timePhases;

  cycleT = cycleT % 1;

  if (cycleT >= sunrise.start && cycleT <= sunset.end) {
    // During daylight hours, create a smooth curve
    const dayStart = sunrise.start;
    const dayEnd = sunset.end;
    const dayProgress = (cycleT - dayStart) / (dayEnd - dayStart);

    // Use a sine curve that maintains excellent visibility
    const sineFactor = Math.sin(dayProgress * Math.PI);
    return Math.max(0.5, sineFactor); // Minimum 50% brightness throughout day phases
  } else {
    // Night time - ensure good visibility
    return 0.5; // 50% brightness for consistent night visibility
  }
}

// New function to compute lighting intensity for better mountain visibility
export function computeLightingFactor(cycleT: number) {
  const { sunrise, dawn, day, dusk, sunset } = timePhases;

  cycleT = cycleT % 1;

  if (cycleT >= day.start && cycleT <= day.end) {
    return 1.0; // Full brightness during day
  } else if (cycleT >= dawn.start && cycleT < day.start) {
    // Dawn transition - ensure good visibility
    const t = (cycleT - dawn.start) / (day.start - dawn.start);
    return 0.7 + 0.3 * t; // 70% to 100%
  } else if (cycleT >= dusk.start && cycleT < sunset.end) {
    // Dusk to sunset transition - maintain visibility
    const t = (cycleT - dusk.start) / (sunset.end - dusk.start);
    return 1.0 - 0.3 * t; // 100% to 70%
  } else if (cycleT >= sunrise.start && cycleT < dawn.start) {
    // Sunrise transition - ensure mountains are visible
    const t = (cycleT - sunrise.start) / (dawn.start - sunrise.start);
    return 0.6 + 0.1 * t; // 60% to 70%
  } else {
    // Night time - good visibility
    return 0.6; // 60% brightness for excellent night visibility
  }
}
