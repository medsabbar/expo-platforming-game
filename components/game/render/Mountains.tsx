import { Group, Path } from "@shopify/react-native-skia";
import React from "react";

interface MountainsProps {
  far: any[];
  near: any[];
  farColor: string;
  nearColor: string;
  t: number;
  screenW: number;
  dayFactor: number;
}

export const Mountains: React.FC<MountainsProps> = ({
  far,
  near,
  farColor,
  nearColor,
  t,
  screenW,
  dayFactor,
}) => {
  // Improve visibility at night by ensuring minimum opacity
  const farOpacity = Math.max(0.35, 0.55 * (0.6 + 0.4 * dayFactor));
  const nearOpacity = Math.max(0.45, 0.7 * (0.6 + 0.4 * dayFactor));
  
  return (
    <>
      <Group opacity={farOpacity}>
        {far.map((pth, i) =>
          pth ? <Path key={i} path={pth} color={farColor} /> : null
        )}
      </Group>
      <Group opacity={nearOpacity}>
        {near.map((pth, i) =>
          pth ? (
            <Group
              key={i}
              transform={[
                { translateX: ((t * 5 + i * 40) % (screenW + 300)) * 0.03 - 20 },
              ]}
            >
              <Path path={pth} color={nearColor} />
            </Group>
          ) : null
        )}
      </Group>
    </>
  );
};
