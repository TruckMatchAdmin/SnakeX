/**
 * Moteur de rendu SnakeX
 * - Boucle requestAnimationFrame (~45 FPS max) INDÉPENDANTE des ticks réseau (30 Hz)
 * - Interpolation entre snapshots avec ~100 ms de retard de rendu : mouvement fluide malgré ping/jitter
 * - Seul ce composant se re-rend à chaque frame (App/HUD ne bougent plus)
 * - Culling des serpents hors écran
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { Orb, LeaderboardEntry, TickPayload } from '@snakex/shared';
import { HexagonArena } from './HexagonArena';
import { SnakeRenderer } from './SnakeRenderer';
import { OrbsRenderer } from './OrbsRenderer';
import type { TimedSnapshot } from '../hooks/useGameSocket';
import { MutableRefObject, useRef } from 'react';
import { LocalPredictor, LocalInput } from '../utils/prediction';

type Players = TickPayload['players'];

interface GameCanvasProps {
  width: number;
  height: number;
  myPlayerId: string | null;
  snapshotsRef: MutableRefObject<TimedSnapshot[]>;
  inputRef: MutableRefObject<LocalInput>;
  latencyRef: MutableRefObject<number>;
  orbsMapRef: MutableRefObject<Map<string, Orb>>;
  leaderboard?: LeaderboardEntry[];
  localColors?: { primary: string; secondary: string };
}

// Retard de rendu : ~3 ticks serveur de marge contre le jitter réseau
const INTERPOLATION_DELAY_MS = 100;
// Plafond de FPS de rendu (le SVG ne tient pas 60 FPS de façon stable sur mobile)
const MIN_FRAME_INTERVAL_MS = 22;

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/** Interpole les serpents entre deux snapshots encadrant l'instant de rendu */
function interpolate(buf: TimedSnapshot[], renderTime: number): Players {
  const n = buf.length;
  if (n === 0) return [];
  if (n === 1 || renderTime <= buf[0].t) return buf[0].players;
  if (renderTime >= buf[n - 1].t) return buf[n - 1].players;

  let i = 0;
  while (i < n - 2 && buf[i + 1].t < renderTime) i++;
  const a = buf[i];
  const b = buf[i + 1];
  const span = b.t - a.t;
  const t = span > 0 ? Math.min(1, Math.max(0, (renderTime - a.t) / span)) : 1;

  const prev = new Map<string, Players[0]>();
  for (const p of a.players) prev.set(p.id, p);

  return b.players.map((p) => {
    const q = prev.get(p.id);
    if (!q || q.body.length === 0) return p;
    const body = new Array(p.body.length);
    for (let k = 0; k < p.body.length; k++) {
      const pa = q.body[k] || q.body[q.body.length - 1];
      const pb = p.body[k];
      body[k] = { x: pa.x + (pb.x - pa.x) * t, y: pa.y + (pb.y - pa.y) * t };
    }
    return { ...p, body, angle: lerpAngle(q.angle, p.angle, t) };
  });
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  myPlayerId,
  snapshotsRef,
  inputRef,
  latencyRef,
  orbsMapRef,
  leaderboard = [],
  localColors,
}) => {
  const [players, setPlayers] = useState<Players>([]);
  const predictorRef = useRef(new LocalPredictor());

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const predictor = predictorRef.current;
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (ts - last < MIN_FRAME_INTERVAL_MS) return;
      last = ts;
      const buf = snapshotsRef.current;
      if (buf.length === 0) {
        predictor.reset();
        return;
      }
      const now = Date.now();
      const frame = interpolate(buf, now - INTERPOLATION_DELAY_MS);

      // Prédiction locale : remplace le serpent du joueur par sa version prédite
      const latest = buf[buf.length - 1];
      const serverMe = myPlayerId ? latest.players.find((p) => p.id === myPlayerId) : undefined;
      if (serverMe) {
        const predicted = predictor.update(
          now,
          inputRef.current,
          serverMe,
          now - latest.t,
          latencyRef.current
        );
        const idx = frame.findIndex((p) => p.id === myPlayerId);
        if (idx >= 0) frame[idx] = predicted;
        else frame.push(predicted);
      } else {
        predictor.reset();
      }
      setPlayers(frame);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [snapshotsRef, inputRef, latencyRef, myPlayerId]);

  const localSnake = players.find((p) => p.id === myPlayerId);
  const cameraX = localSnake?.body[0]?.x ?? 0;
  const cameraY = localSnake?.body[0]?.y ?? 0;

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Caméra panoramique, dézoom progressif selon le score
  const zoom = Math.max(0.4, 0.56 - Math.sqrt(localSnake?.score || 0) * 0.002);

  const toScreenX = (wx: number) => (wx - cameraX) * zoom + halfWidth;
  const toScreenY = (wy: number) => (wy - cameraY) * zoom + halfHeight;

  // Culling : on ne dessine que les serpents dont la boîte englobante touche l'écran
  const pad = 80;
  const visibleOthers = players.filter((p) => {
    if (p.id === myPlayerId || p.body.length === 0) return false;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (let i = 0; i < p.body.length; i += 3) {
      const b = p.body[i];
      if (b.x < minX) minX = b.x;
      if (b.x > maxX) maxX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.y > maxY) maxY = b.y;
    }
    const sx1 = toScreenX(minX) - pad;
    const sx2 = toScreenX(maxX) + pad;
    const sy1 = toScreenY(minY) - pad;
    const sy2 = toScreenY(maxY) + pad;
    return sx2 >= 0 && sx1 <= width && sy2 >= 0 && sy1 <= height;
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <HexagonArena
          width={width}
          height={height}
          cameraX={cameraX}
          cameraY={cameraY}
          zoom={zoom}
        />

        <OrbsRenderer
          orbsMap={orbsMapRef.current}
          toScreenX={toScreenX}
          toScreenY={toScreenY}
          zoom={zoom}
          width={width}
          height={height}
        />

        {visibleOthers.map((snake) => (
          <SnakeRenderer
            key={snake.id}
            snake={snake}
            isLocal={false}
            toScreenX={toScreenX}
            toScreenY={toScreenY}
            zoom={zoom}
            leaderboard={leaderboard}
          />
        ))}

        {localSnake && (
          <SnakeRenderer
            key={localSnake.id}
            snake={localSnake}
            isLocal={true}
            toScreenX={toScreenX}
            toScreenY={toScreenY}
            zoom={zoom}
            leaderboard={leaderboard}
            colors={localColors}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040711',
    overflow: 'hidden',
  },
});
