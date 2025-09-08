import { Group, Path } from "@shopify/react-native-skia";
import React from "react";

interface CloudsProps {
  cloudPath: any;
  screenW: number;
  t: number;
}

export const Clouds: React.FC<CloudsProps> = ({ cloudPath, screenW, t }) => (
  <Group opacity={0.92}>
    {[0, 1, 2, 3].map((i) => {
      const baseSpeed = 6 + i * 2;
      const scale = 0.9 + i * 0.35;
      const xRange = screenW + 260;
      const x = ((t * baseSpeed + i * 50) % xRange) - 130;
      const y = 70 + i * 68 + Math.sin(t * 0.4 + i) * 8;
      return (
        <Group
          key={i}
          transform={[{ translateX: x }, { translateY: y }, { scale }]}
        >
          <Path path={cloudPath} color="#ffffff" opacity={0.85 - i * 0.12} />
        </Group>
      );
    })}
  </Group>
);
