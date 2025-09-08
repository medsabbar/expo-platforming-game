import { Group, Path } from "@shopify/react-native-skia";
import React from "react";

interface MountainsProps {
  far: any[];
  near: any[];
  farColor: string;
  nearColor: string;
  t: number;
  screenW: number;
  lightingFactor?: number; // Optional lighting factor for dynamic opacity
}

export const Mountains: React.FC<MountainsProps> = ({
  far,
  near,
  farColor,
  nearColor,
  t,
  screenW,
  lightingFactor = 1.0,
}) => {
  // Make mountains fully opaque - rely on color changes for day/night effect
  const farOpacity = 0.85; // Increased base opacity
  const nearOpacity = 1.0; // Full opacity for near mountains

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
                {
                  translateX: ((t * 5 + i * 40) % (screenW + 300)) * 0.03 - 20,
                },
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
