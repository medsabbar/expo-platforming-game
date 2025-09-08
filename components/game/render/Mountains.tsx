import { Group, Path } from "@shopify/react-native-skia";
import React from "react";

interface MountainsProps {
  far: any[];
  near: any[];
  farColor: string;
  nearColor: string;
  t: number;
  screenW: number;
}

export const Mountains: React.FC<MountainsProps> = ({
  far,
  near,
  farColor,
  nearColor,
  t,
  screenW,
}) => (
  <>
    <Group opacity={0.55}>
      {far.map((pth, i) =>
        pth ? <Path key={i} path={pth} color={farColor} /> : null
      )}
    </Group>
    <Group opacity={0.7}>
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
