import { BiomeDef } from "./types";

export const BIOMES: BiomeDef[] = [
  {
    name: "grass",
    grassTop: ["#3da93f", "#2e8d31", "#48c14c"],
    dirt: ["#7a4d22", "#5e3a18", "#8f592b"],
    accent: "#d6f7b1",
    platformColor: "#3ddc97",
  },
  {
    name: "desert",
    grassTop: ["#e4c56a", "#d9b24d", "#f0d283"],
    dirt: ["#c89b48", "#b48436", "#d6ae62"],
    accent: "#fff2b0",
    platformColor: "#e8c76a",
  },
  {
    name: "snow",
    grassTop: ["#e8f7ff", "#d2eefc", "#ffffff"],
    dirt: ["#9aa7b5", "#7b8692", "#b9c3cf"],
    accent: "#ffffff",
    platformColor: "#b2e2ff",
  },
  {
    name: "volcanic",
    grassTop: ["#4d1f1f", "#5c2622", "#712d25"],
    dirt: ["#331313", "#47201c", "#5a2620"],
    accent: "#ff8a40",
    platformColor: "#ff5c33",
  },
  {
    name: "alien",
    grassTop: ["#4d236b", "#5f2d85", "#73379d"],
    dirt: ["#2a123d", "#34184d", "#422060"],
    accent: "#c05bff",
    platformColor: "#9d5cff",
  },
];

export const BIOME_DURATION = 45; // seconds before transition
export const BIOME_TRANSITION = 5.5; // fade seconds
