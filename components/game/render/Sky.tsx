import {
  Circle,
  Group,
  LinearGradient,
  Rect,
} from "@shopify/react-native-skia";
import React from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
}

interface SkyProps {
  screenW: number;
  screenH: number;
  pal: { top: string; mid: string; bot: string };
  stars: Star[];
  starAlpha: number;
  sunOpacity: number;
  sunX: number;
  sunY: number;
}

export const Sky: React.FC<SkyProps> = ({
  screenW,
  screenH,
  pal,
  stars,
  starAlpha,
  sunOpacity,
  sunX,
  sunY,
}) => (
  <>
    <Rect x={0} y={0} width={screenW} height={screenH}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: screenH }}
        colors={[pal.top, pal.mid, pal.bot]}
      />
    </Rect>
    {starAlpha > 0 && (
      <Group opacity={starAlpha * 0.9}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="#ffffff" />
        ))}
      </Group>
    )}
    {sunOpacity > 0 && (
      <Group opacity={sunOpacity}>
        <Circle cx={sunX} cy={sunY} r={screenH * 0.09} color="#ffe9a3" />
        <Circle
          cx={sunX}
          cy={sunY}
          r={screenH * 0.09}
          color="#ffe9a3"
          opacity={0.4}
        />
      </Group>
    )}
  </>
);
