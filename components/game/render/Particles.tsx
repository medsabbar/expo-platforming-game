import { Circle, Group } from "@shopify/react-native-skia";
import React from "react";
import { Particle } from "../engine/types";

interface ParticlesProps {
  particles: Particle[];
}

export const ParticlesLayer: React.FC<ParticlesProps> = ({ particles }) => (
  <Group>
    {particles.map((pt) => {
      const lifeT = pt.life / pt.maxLife;
      if (pt.type === "ember") {
        const base = lifeT < 0.5 ? "#ffb347" : "#ff5c33";
        const fade = 1 - lifeT;
        const r = 3 + Math.sin((pt.life + pt.seed) * 12) * 1.2;
        return (
          <Circle
            key={pt.id}
            cx={pt.x}
            cy={pt.y}
            r={r}
            color={base}
            opacity={fade}
          />
        );
      }
      const fade = lifeT < 0.9 ? 1 : 1 - (lifeT - 0.9) / 0.1;
      const r = 2 + Math.sin((pt.life + pt.seed) * 5) * 0.4;
      return (
        <Circle
          key={pt.id}
          cx={pt.x}
          cy={pt.y}
          r={r}
          color="#ffffff"
          opacity={fade * 0.85}
        />
      );
    })}
  </Group>
);
