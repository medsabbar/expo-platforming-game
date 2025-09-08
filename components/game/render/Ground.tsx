import { Group, Rect } from "@shopify/react-native-skia";
import React from "react";
// Ground made static again (no horizontal scroll)
import { BiomeDef, GroundTile } from "../engine/types";

interface GroundProps {
  activeSet: "A" | "B";
  groundTilesA: GroundTile[];
  groundTilesB: GroundTile[];
  biomeTransition: number;
  transitionDuration: number;
  currentBiome: BiomeDef;
  nextBiome: BiomeDef;
  groundY: number;
  screenW: number;
}

export const Ground: React.FC<GroundProps> = ({
  activeSet,
  groundTilesA,
  groundTilesB,
  biomeTransition,
  transitionDuration,
  currentBiome,
  nextBiome,
  groundY,
  screenW,
}) => {
  const trans =
    biomeTransition > 0 ? Math.min(1, biomeTransition / transitionDuration) : 0;
  const curTiles = activeSet === "A" ? groundTilesA : groundTilesB;
  const nextTiles = activeSet === "A" ? groundTilesB : groundTilesA;
  const mixHex = (a: string, b: string, t: number) => {
    const toRGB = (h: string) => ({
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
    });
    const ca = toRGB(a);
    const cb = toRGB(b);
    const comp = (k: "r" | "g" | "b") =>
      Math.round(ca[k] + (cb[k] - ca[k]) * t)
        .toString(16)
        .padStart(2, "0");
    return `#${comp("r")}${comp("g")}${comp("b")}`;
  };
  const accentMixed =
    trans === 0
      ? currentBiome.accent
      : trans >= 1
      ? nextBiome.accent
      : mixHex(currentBiome.accent, nextBiome.accent, trans);
  return (
    <Group>
      <Group opacity={1 - trans}>
        {curTiles.map((gt, i) => (
          <Rect
            key={`c-${i}`}
            x={gt.x}
            y={gt.y}
            width={40}
            height={40}
            color={gt.color}
          />
        ))}
      </Group>
      {trans > 0 && (
        <Group opacity={trans}>
          {nextTiles.map((gt, i) => (
            <Rect
              key={`n-${i}`}
              x={gt.x}
              y={gt.y}
              width={40}
              height={40}
              color={gt.color}
            />
          ))}
        </Group>
      )}
      <Rect
        x={0}
        y={groundY}
        width={screenW}
        height={4}
        color={accentMixed}
        opacity={0.25}
      />
    </Group>
  );
};
