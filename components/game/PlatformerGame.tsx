import { Canvas, Circle, Group, Rect, Skia } from "@shopify/react-native-skia";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

// Storage utility for best score
import { GameStorage } from "@/utils/storage";

// Extracted types & helpers
import { BIOME_DURATION, BIOME_TRANSITION, BIOMES } from "./engine/biomes";
import { computeDayFactor, cycleDuration, paletteFor } from "./engine/dayNight";
import { buildGroundTiles } from "./engine/ground";
import { BiomeDef, GroundTile, Particle, Platform } from "./engine/types";
import { Clouds } from "./render/Clouds";
import { Ground } from "./render/Ground";
import { Mountains } from "./render/Mountains";
import { ParticlesLayer } from "./render/Particles";
import { Sky } from "./render/Sky";

/**
 * Simple endless platformer demonstration rendered with Skia.
 * Not optimized – prioritizes clarity over performance.
 */
export const PlatformerGame: React.FC = () => {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Simulation refs (mutable, not causing re-renders directly)
  const player = useRef({
    x: 80,
    y: 0, // top-left position
    w: 40,
    h: 40,
    vy: 0,
    onGround: false,
  });

  const gravity = 1700; // slightly stronger for a snappier arc
  const jumpVelocity = -780; // faster initial lift for a smoother perceived jump
  const scrollSpeed = 180; // slowed platform speed for calmer motion
  const platforms = useRef<Platform[]>([]);
  const score = useRef(0);
  const bestScore = useRef(0);
  const gameOver = useRef(false);
  const spawnCounter = useRef(0);
  const nextPlatformId = useRef(1);

  // Particles (biome-based: embers, snowflakes)
  const particles = useRef<Particle[]>([]);
  const nextParticleId = useRef(1);
  const emberSpawnAcc = useRef(0);
  const snowSpawnAcc = useRef(0);

  // Dummy state to trigger re-render each frame (lightweight)
  const [, setFrame] = useState(0);
  // Removed obsolete tick-based cloud movement; using elapsed time instead
  const timeRef = useRef(0); // elapsed seconds
  // (moved to engine/dayNight)

  // Stars (night) generated once
  const stars = useRef<{ x: number; y: number; r: number; tw: number }[]>([]);
  const buildStars = useCallback(() => {
    const arr: { x: number; y: number; r: number; tw: number }[] = [];
    const count = Math.min(60, Math.max(40, Math.round(screenW / 12)));
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * screenW,
        y: Math.random() * screenH * 0.5,
        r: 1 + Math.random() * 1.6,
        tw: 0.5 + Math.random() * 1.5, // twinkle speed factor
      });
    }
    stars.current = arr;
  }, [screenH, screenW]);

  // Mountain layers (generated once per dimension change)
  type SkPath = ReturnType<typeof Skia.Path.MakeFromSVGString>;
  const farMountains = useRef<SkPath[]>([]);
  const nearMountains = useRef<SkPath[]>([]);

  const buildMountains = useCallback(() => {
    const makeTriangle = (
      x: number,
      w: number,
      baseY: number,
      peakY: number
    ) => {
      return `M${x} ${baseY} L${x + w / 2} ${peakY} L${x + w} ${baseY} Z`;
    };
    const far: SkPath[] = [];
    const near: SkPath[] = [];
    const baseFar = screenH * 0.72;
    const baseNear = screenH * 0.8;
    let cursor = -80;
    while (cursor < screenW + 160) {
      const w = 180 + Math.random() * 140; // width range
      const h = 120 + Math.random() * 90; // height
      const peakY = baseFar - h;
      const path = Skia.Path.MakeFromSVGString(
        makeTriangle(cursor, w, baseFar, peakY)
      );
      if (path) far.push(path);
      cursor += w * 0.6; // overlap for ridge effect
    }
    cursor = -60;
    while (cursor < screenW + 160) {
      const w = 200 + Math.random() * 160;
      const h = 160 + Math.random() * 120;
      const peakY = baseNear - h;
      const path = Skia.Path.MakeFromSVGString(
        makeTriangle(cursor, w, baseNear, peakY)
      );
      if (path) near.push(path);
      cursor += w * 0.55;
    }
    farMountains.current = far;
    nearMountains.current = near;
  }, [screenH, screenW]);

  // Init level
  const init = useCallback(() => {
    platforms.current = [];
    const baseY = Math.min(screenH - 120, screenH * 0.75);
    // starter flat section
    let cursorX = 0;
    for (let i = 0; i < 6; i++) {
      const w = 160;
      platforms.current.push({
        id: nextPlatformId.current++,
        x: cursorX,
        y: baseY,
        w,
        h: 24,
      });
      cursorX += w;
    }
    player.current.y = baseY - player.current.h;
    player.current.vy = 0;
    player.current.onGround = true;
    doubleJumpAvailable.current = false; // disarm at start
    score.current = 0;
    gameOver.current = false;
    spawnCounter.current = 0;
  }, [screenH]);

  // Load best score on component mount
  useEffect(() => {
    const loadBestScore = async () => {
      bestScore.current = await GameStorage.getBestScore();
    };
    loadBestScore();
  }, []);

  useEffect(() => {
    init();
    buildMountains();
    buildStars();
  }, [init, buildMountains, buildStars]);

  // Spawning new platforms as we scroll
  const maybeSpawnPlatforms = (furthestRight: number) => {
    const targetAhead = screenW * 2; // keep 2 screens of platforms buffered
    while (furthestRight < screenW + targetAhead) {
      const last = platforms.current[platforms.current.length - 1];
      const gapMin = 80;
      const gapMax = 260;
      const gap = gapMin + Math.random() * (gapMax - gapMin);
      const platformWidth = 140 + Math.random() * 140; // 140-280
      const verticalJitter = 140; // max up/down movement
      const baseY = Math.min(screenH - 120, screenH * 0.78);
      let nextY = baseY + (Math.random() * verticalJitter - verticalJitter / 2);
      nextY = Math.max(120, Math.min(nextY, screenH - 100));
      const x = last ? last.x + last.w + gap : furthestRight + gap;
      platforms.current.push({
        id: nextPlatformId.current++,
        x,
        y: nextY,
        w: platformWidth,
        h: 24,
      });
      furthestRight = x + platformWidth;
    }
  };

  const lastJumpTime = useRef(0);
  const doubleJumpAvailable = useRef(false); // armed after initial jump while airborne
  const handleJump = () => {
    if (gameOver.current) {
      init();
      return;
    }
    const now = performance.now();
    if (player.current.onGround || now - lastJumpTime.current < 110) {
      player.current.vy = jumpVelocity;
      player.current.onGround = false;
      lastJumpTime.current = now;
      doubleJumpAvailable.current = true;
    } else if (doubleJumpAvailable.current) {
      player.current.vy = jumpVelocity * 0.85; // reduced force for second jump
      player.current.onGround = false;
      doubleJumpAvailable.current = false;
      lastJumpTime.current = now;
    }
  };

  // Input also via overlay Pressable (for accessibility / web fallback)
  const onPress = () => handleJump();

  // Game loop via requestAnimationFrame
  useEffect(() => {
    let mounted = true;
    let last = performance.now();
    const loop = (now: number) => {
      if (!mounted) return;
      const dt = Math.min(0.033, (now - last) / 1000); // clamp delta (avoid spikes)
      last = now;
      if (!gameOver.current) update(dt);
      timeRef.current += dt;
      // Force a re-render so Skia receives updated refs
      setFrame((f) => (f + 1) & 0xffff);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      mounted = false;
    };
    // update is stable because it doesn't capture changing state (only refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (dt: number) => {
    // Biome timing & cross-fade management
    if (biomeTransitionRef.current > 0) {
      biomeTransitionRef.current += dt;
      if (biomeTransitionRef.current >= BIOME_TRANSITION) {
        // finalize transition
        biomeTransitionRef.current = 0;
        biomeIndexRef.current = nextBiomeIndexRef.current;
        nextBiomeIndexRef.current = biomeIndexRef.current + 1;
        biomeTimerRef.current = 0;
        // swap active ground buffer
        activeGroundSet.current = activeGroundSet.current === "A" ? "B" : "A";
        // preload following biome into inactive buffer
        buildGroundForBiome(
          nextBiomeIndexRef.current,
          activeGroundSet.current === "A" ? "B" : "A"
        );
      }
    } else {
      biomeTimerRef.current += dt;
      if (biomeTimerRef.current >= BIOME_DURATION) {
        biomeTransitionRef.current = 0.00001; // start transition next frame
        buildGroundForBiome(
          nextBiomeIndexRef.current,
          activeGroundSet.current === "A" ? "B" : "A"
        );
      }
    }

    // Wind evolution
    windRef.current =
      Math.sin(timeRef.current * 0.12) * 28 +
      Math.sin(timeRef.current * 0.53) * 6;
    // Scroll platforms left
    let furthestRight = 0;
    for (const p of platforms.current) {
      p.x -= scrollSpeed * dt;
      furthestRight = Math.max(furthestRight, p.x + p.w);
    }

    // Remove off-screen platforms
    platforms.current = platforms.current.filter((p) => p.x + p.w > -200);

    maybeSpawnPlatforms(furthestRight);

    // Physics: apply gravity
    const pl = player.current;
    // Apply gravity with a mild ease-out near jump apex (manual damping)
    const beforeVy = pl.vy;
    pl.vy += gravity * dt;
    // If moving upward (beforeVy < 0) taper gravity slightly for smoother arc
    if (beforeVy < 0) {
      pl.vy = beforeVy + (pl.vy - beforeVy) * 0.82;
    }
    pl.y += pl.vy * dt;
    pl.onGround = false;

    // Collision detection (simple AABB, only resolving from top)
    for (const plat of platforms.current) {
      if (
        pl.x < plat.x + plat.w &&
        pl.x + pl.w > plat.x &&
        pl.y + pl.h > plat.y &&
        pl.y + pl.h < plat.y + plat.h + 40 && // allow some tolerance below top
        pl.vy >= 0
      ) {
        // Landed
        pl.y = plat.y - pl.h;
        pl.vy = 0;
        pl.onGround = true;
        doubleJumpAvailable.current = false; // landing disarms until next primary jump
      }
      // Scoring when player passes center of platform
      if (!plat.passed && plat.x + plat.w < pl.x) {
        plat.passed = true;
        score.current += 1;
      }
    }

    // Fail condition: falls below screen
    if (pl.y > screenH + 40) {
      gameOver.current = true;
      // Update best score when game ends
      GameStorage.updateBestScoreIfHigher(score.current).then((updated) => {
        if (updated) {
          bestScore.current = score.current;
        }
      });
    }

    // Particle spawning & update
    const biome = biomeByIndex(biomeIndexRef.current);
    const cycleTNow = (timeRef.current % cycleDuration) / cycleDuration; // before increment in loop
    const isNight = cycleTNow >= 0.7 || cycleTNow < 0.15 || cycleTNow >= 0.85; // matches star phases

    // Spawn rates per second
    if (particlesEnabledRef.current && biome.name === "volcanic") {
      emberSpawnAcc.current += dt * 8; // 8 embers/sec
      while (emberSpawnAcc.current >= 1) {
        emberSpawnAcc.current -= 1;
        const id = nextParticleId.current++;
        const x = Math.random() * screenW;
        const y = groundYApprox - 8 - Math.random() * 40;
        const vx = (Math.random() - 0.5) * 20; // gentle horizontal drift
        const vy = -40 - Math.random() * 60; // rise
        const life = 0;
        const maxLife = 1.2 + Math.random() * 0.8;
        particles.current.push({
          id,
          type: "ember",
          x,
          y,
          vx,
          vy,
          life,
          maxLife,
          seed: Math.random() * 1000,
        });
      }
    } else if (
      particlesEnabledRef.current &&
      biome.name === "snow" &&
      isNight
    ) {
      snowSpawnAcc.current += dt * 14; // 14 flakes/sec at night
      while (snowSpawnAcc.current >= 1) {
        snowSpawnAcc.current -= 1;
        const id = nextParticleId.current++;
        const x = Math.random() * screenW;
        const y = -10; // top spawn
        const vx = (Math.random() - 0.5) * 15 + windRef.current * 0.2; // wind drift
        const vy = 30 + Math.random() * 25; // fall
        const life = 0;
        const maxLife = (screenH + 40) / vy; // long enough to reach bottom
        particles.current.push({
          id,
          type: "snow",
          x,
          y,
          vx,
          vy,
          life,
          maxLife,
          seed: Math.random() * 1000,
        });
      }
    }

    // Update existing particles
    const newParticles: Particle[] = [];
    for (const part of particles.current) {
      part.life += dt;
      if (part.life > part.maxLife) continue;
      // Motion
      if (part.type === "ember") {
        // Slight horizontal wiggle
        part.x += part.vx * dt + Math.sin((part.life + part.seed) * 6) * 5 * dt;
        part.y += part.vy * dt;
      } else if (part.type === "snow") {
        part.x +=
          part.vx * dt +
          Math.sin((part.life + part.seed) * 2) * 8 * dt +
          windRef.current * dt * 0.5;
        part.y += part.vy * dt;
      }
      // Cull if off-screen
      if (part.x < -30 || part.x > screenW + 30 || part.y > screenH + 30)
        continue;
      newParticles.push(part);
    }
    // Limit particle count
    if (newParticles.length > 220)
      newParticles.splice(0, newParticles.length - 220);
    particles.current = newParticles;
  };

  const pl = player.current; // direct reference (values mutated each frame)

  // Player squash & stretch based on vertical velocity
  const vy = pl.vy;
  const stretch = Math.max(0.78, Math.min(1.25, 1 - vy / 1600)); // when going up (vy negative) > 1
  const invStretch = 1 / stretch;

  // Cloud path factory (simple puffy shape)
  const cloudPath = useRef(
    Skia.Path.MakeFromSVGString(
      "M20 30 C10 30 5 22 8 16 C4 5 18 2 24 8 C28 2 40 4 39 14 C48 14 50 22 46 27 C52 40 34 44 30 36 C26 40 16 40 14 34 C10 38 2 36 4 28 Z"
    )
  );
  const t = timeRef.current; // seconds
  const cycleT = (t % cycleDuration) / cycleDuration; // 0..1

  // Utility color helpers
  const hexToRgb = (h: string) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
    };
  };
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")}`;
  const mix = (a: string, b: string, t: number) => {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return rgbToHex(
      ca.r + (cb.r - ca.r) * t,
      ca.g + (cb.g - ca.g) * t,
      ca.b + (cb.b - ca.b) * t
    );
  };

  const pal = paletteFor(cycleT);

  // Sun visibility and position only during daytime-ish (0.15..0.70)
  let sunOpacity = 0;
  let sunX = 0;
  let sunY = 0;
  if (cycleT >= 0.15 && cycleT <= 0.7) {
    const dayPhase = (cycleT - 0.15) / (0.7 - 0.15); // 0..1
    sunOpacity = 0.85;
    sunX = screenW * (0.1 + 0.8 * dayPhase);
    sunY = screenH * (0.55 - Math.sin(Math.PI * dayPhase) * 0.3);
  }

  // Stars opacity ramp up from 0.70 -> 0.85, full until 0.85.. then down 0.85->1/0.15
  let starAlpha = 0;
  if (cycleT >= 0.7 && cycleT < 0.85) {
    starAlpha = (cycleT - 0.7) / 0.15; // 0..1
  } else if (cycleT >= 0.85 || cycleT < 0.15) {
    starAlpha = 1;
  } else if (cycleT >= 0.15 && cycleT < 0.25) {
    starAlpha = 1 - (cycleT - 0.15) / 0.1; // fade out dawn
  }

  // Day factor to tint mountains (more vivid during day)
  const dayFactor = computeDayFactor(cycleT);
  const farBaseDay = "#4b8cc5";
  const farBaseNight = "#20344a";
  const nearBaseDay = "#6fb4e6";
  const nearBaseNight = "#2d4f75";
  const farColor = mix(farBaseNight, farBaseDay, dayFactor);
  const nearColor = mix(nearBaseNight, nearBaseDay, dayFactor);

  // Ground strip color blend

  // Player shadow (ellipse) size based on vertical velocity & altitude
  const groundYApprox = Math.min(screenH - 40, screenH * 0.82);
  const heightAboveGround = Math.max(0, groundYApprox - (pl.y + pl.h));
  const shadowScale = Math.max(0.4, 1 - heightAboveGround / 600);

  // --- Ground (Minecraft-style tiles) ---
  // Dual buffers for cross-fade between biomes
  const groundTilesA = useRef<GroundTile[]>([]);
  const groundTilesB = useRef<GroundTile[]>([]);
  const activeGroundSet = useRef<"A" | "B">("A");
  const biomeIndexRef = useRef(0); // current biome index
  const nextBiomeIndexRef = useRef(1); // forthcoming biome index
  const biomeTimerRef = useRef(0); // time spent in current biome (not counting transition)
  const biomeTransitionRef = useRef(0); // time since transition started (0 means no transition)
  // (Durations now imported from engine/biomes)
  const windRef = useRef(0); // wind strength for snow
  const particlesEnabledRef = useRef(true); // simple flag for toggling particles

  // Biome definitions (grass, desert, snow, volcanic, alien)
  const biomesRef = useRef<BiomeDef[]>(BIOMES);

  // Biome helpers & ground generation (reintroduced for dual-buffer system)
  const biomeByIndex = useCallback((idx: number) => {
    const arr = biomesRef.current;
    return arr[((idx % arr.length) + arr.length) % arr.length];
  }, []);
  const currentBiome = useCallback(
    () => biomeByIndex(biomeIndexRef.current),
    [biomeByIndex]
  );

  const buildGroundForBiome = useCallback(
    (biomeIdx: number, target: "A" | "B") => {
      const tiles = buildGroundTiles(
        biomeByIndex(biomeIdx),
        screenW,
        groundYApprox,
        dayFactor
      );
      if (target === "A") groundTilesA.current = tiles;
      else groundTilesB.current = tiles;
    },
    [biomeByIndex, screenW, groundYApprox, dayFactor]
  );

  useEffect(() => {
    buildGroundForBiome(biomeIndexRef.current, activeGroundSet.current);
    buildGroundForBiome(
      nextBiomeIndexRef.current,
      activeGroundSet.current === "A" ? "B" : "A"
    );
  }, [buildGroundForBiome]);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.full}
        onPress={onPress}
        android_ripple={{ color: "#444" }}
      >
        <Canvas style={{ width: screenW, height: screenH }}>
          <Sky
            screenW={screenW}
            screenH={screenH}
            pal={pal}
            stars={stars.current}
            starAlpha={starAlpha}
            sunOpacity={sunOpacity}
            sunX={sunX}
            sunY={sunY}
          />
          <Mountains
            far={farMountains.current}
            near={nearMountains.current}
            farColor={farColor}
            nearColor={nearColor}
            t={t}
            screenW={screenW}
          />
          <Clouds cloudPath={cloudPath.current!} screenW={screenW} t={t} />
          <Ground
            activeSet={activeGroundSet.current}
            groundTilesA={groundTilesA.current}
            groundTilesB={groundTilesB.current}
            biomeTransition={biomeTransitionRef.current}
            transitionDuration={BIOME_TRANSITION}
            currentBiome={currentBiome()}
            nextBiome={biomeByIndex(nextBiomeIndexRef.current)}
            groundY={groundYApprox}
            screenW={screenW}
          />
          {/* Platforms (merge visually if near ground) */}
          {platforms.current.map((p) => {
            const biome = currentBiome();
            const nearGround = p.y > groundYApprox - 24;
            const color = nearGround ? biome.dirt[1] : biome.platformColor;
            return (
              <Rect
                key={p.id}
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                color={color}
              />
            );
          })}
          <ParticlesLayer particles={particles.current} />
          {/* Player */}
          <Group
            transform={[
              { translateX: pl.x + pl.w / 2 },
              { translateY: pl.y + pl.h / 2 },
              { scaleY: stretch },
              { scaleX: invStretch },
              { translateX: -(pl.w / 2) },
              { translateY: -(pl.h / 2) },
            ]}
          >
            <Rect
              x={0}
              y={0}
              width={pl.w}
              height={pl.h}
              color={pl.onGround ? "#ffcc00" : "#ff8c42"}
            />
          </Group>
          {/* Player shadow */}
          <Group
            opacity={0.25 * (0.6 + 0.4 * dayFactor)}
            transform={[
              { translateX: pl.x + pl.w / 2 },
              { translateY: groundYApprox - 4 },
              { scaleX: shadowScale * 1.4 },
              { scaleY: shadowScale * 0.55 },
              { translateX: -pl.w / 2 },
              { translateY: -pl.h / 2 },
            ]}
          >
            <Circle cx={pl.w / 2} cy={pl.h / 2} r={pl.w / 2} color="#000000" />
          </Group>
        </Canvas>
      </Pressable>
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.score}>Score {score.current}</Text>
        <Text style={styles.bestScore}>Best {bestScore.current}</Text>
        {gameOver.current && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOver}>Game Over – tap to restart</Text>
            {score.current === bestScore.current && score.current > 0 && (
              <Text style={styles.newBest}>🎉 New Best Score! 🎉</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  full: { flex: 1 },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 50,
  },
  score: {
    color: "#00375f",
    fontSize: 24,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bestScore: {
    color: "#ffd700",
    fontSize: 18,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 4,
  },
  gameOverContainer: {
    alignItems: "center",
    marginTop: 18,
  },
  gameOver: {
    color: "#ff7675",
    fontSize: 18,
    fontWeight: "500",
  },
  newBest: {
    color: "#ffd700",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default PlatformerGame;
