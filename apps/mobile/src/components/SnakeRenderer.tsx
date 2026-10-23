/**
 * Rendu des serpents SnakeX — style Slither.io, optimisé mobile
 * - 4 tracés SVG seulement par serpent (halo, contour, corps, bandes d'écailles en pointillés)
 * - Aucun hook : le composant est rendu à chaque frame d'interpolation, tout est calculé à la volée
 * - Décimation des segments pour les longs serpents (courbe lissée Catmull-Rom conservée)
 */

import React from 'react';
import { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { TickPayload, LeaderboardEntry } from '@snakex/shared';
import { buildSmoothPath, Point } from '../utils/curveSmoothing';

interface SnakeRendererProps {
  snake: TickPayload['players'][0];
  isLocal: boolean;
  toScreenX: (x: number) => number;
  toScreenY: (y: number) => number;
  zoom: number;
  leaderboard?: LeaderboardEntry[];
  rank?: number;
  /** Couleurs du skin choisi (joueur local) */
  colors?: { primary: string; secondary: string };
}

const PALETTES = [
  { primary: '#00FF66', secondary: '#00E5FF' },
  { primary: '#00E5FF', secondary: '#3B82F6' },
  { primary: '#FF1744', secondary: '#FF5252' },
  { primary: '#FF9100', secondary: '#FFD700' },
  { primary: '#D500F9', secondary: '#E040FB' },
  { primary: '#FFD700', secondary: '#FFA000' },
  { primary: '#3B82F6', secondary: '#8B5CF6' },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const SnakeRenderer: React.FC<SnakeRendererProps> = ({
  snake,
  isLocal,
  toScreenX,
  toScreenY,
  zoom,
  leaderboard = [],
  colors,
}) => {
  if (!snake.isAlive || snake.body.length === 0) return null;

  const body = snake.body;
  const head = body[0];
  const headSx = toScreenX(head.x);
  const headSy = toScreenY(head.y);

  const palette = colors || PALETTES[hashId(snake.id) % PALETTES.length];
  const baseColor = palette.primary;
  const secondaryColor = palette.secondary;

  const snakeRadius = Math.max(9, snake.radius * zoom * 1.05);

  // Décimation : 1 point sur 2 au-delà de 60 segments (garde toujours la queue)
  const stride = body.length > 60 ? 2 : 1;
  const pts: Point[] = [];
  for (let i = 0; i < body.length; i += stride) {
    pts.push({ x: toScreenX(body[i].x), y: toScreenY(body[i].y) });
  }
  const last = body[body.length - 1];
  if ((body.length - 1) % stride !== 0) {
    pts.push({ x: toScreenX(last.x), y: toScreenY(last.y) });
  }
  const path = buildSmoothPath(pts);

  // Yeux
  const eyeDist = snakeRadius * 0.55;
  const eyeR = snakeRadius * 0.4;
  const pupilR = snakeRadius * 0.22;
  const cosA = Math.cos(snake.angle);
  const sinA = Math.sin(snake.angle);
  const off = 0.54;
  const lx = headSx + Math.cos(snake.angle - off) * eyeDist;
  const ly = headSy + Math.sin(snake.angle - off) * eyeDist;
  const rx = headSx + Math.cos(snake.angle + off) * eyeDist;
  const ry = headSy + Math.sin(snake.angle + off) * eyeDist;
  const look = eyeR * 0.35;

  const entry = leaderboard.find((l) => l.id === snake.id);
  const label = isLocal ? '' : entry?.name || '';

  const dash = `${(snakeRadius * 0.9).toFixed(1)},${(snakeRadius * 1.1).toFixed(1)}`;

  return (
    <G>
      {/* Halo néon (plus intense en boost) */}
      <Path
        d={path}
        fill="none"
        stroke={snake.isBoosting ? '#FFFFFF' : baseColor}
        strokeWidth={snakeRadius * (snake.isBoosting ? 2.9 : 2.5)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={snake.isBoosting ? 0.4 : 0.22}
      />
      {/* Contour sombre */}
      <Path
        d={path}
        fill="none"
        stroke="#030712"
        strokeWidth={snakeRadius * 2 + 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corps */}
      <Path
        d={path}
        fill="none"
        stroke={baseColor}
        strokeWidth={snakeRadius * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bandes d'écailles (pointillés) */}
      <Path
        d={path}
        fill="none"
        stroke={secondaryColor}
        strokeWidth={snakeRadius * 1.45}
        strokeLinecap="butt"
        strokeDasharray={dash}
        opacity={0.6}
      />

      {/* Tête */}
      <Circle cx={headSx} cy={headSy} r={snakeRadius} fill={baseColor} stroke="#030712" strokeWidth={1.5} />
      <Circle cx={headSx} cy={headSy} r={snakeRadius * 0.8} fill={secondaryColor} opacity={0.45} />
      <Circle
        cx={headSx - snakeRadius * 0.28}
        cy={headSy - snakeRadius * 0.3}
        r={snakeRadius * 0.34}
        fill="#FFFFFF"
        opacity={0.3}
      />

      {/* Yeux */}
      <Circle cx={lx} cy={ly} r={eyeR} fill="#FFFFFF" stroke="#040810" strokeWidth={1} />
      <Circle cx={lx + cosA * look} cy={ly + sinA * look} r={pupilR} fill="#040810" />
      <Circle cx={rx} cy={ry} r={eyeR} fill="#FFFFFF" stroke="#040810" strokeWidth={1} />
      <Circle cx={rx + cosA * look} cy={ry + sinA * look} r={pupilR} fill="#040810" />

      {/* Nom des adversaires */}
      {label ? (
        <SvgText
          x={headSx}
          y={headSy - snakeRadius - 8}
          fill="#FFFFFF"
          fontSize={11}
          fontWeight="bold"
          textAnchor="middle"
          opacity={0.9}
        >
          {label}
        </SvgText>
      ) : null}
    </G>
  );
};
