/**
 * Arène honeycomb — style Slither.io, ultra-léger
 * - Une seule dalle hexagonale dessinée via <Pattern> : plus aucun recalcul JS de la grille à chaque frame
 * - Le défilement de la caméra ne fait que décaler l'origine du motif
 * - Bordure circulaire rougeoyante de l'arène
 */

import React from 'react';
import { G, Path, Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { ARENA_RADIUS } from '@snakex/shared';

interface HexagonArenaProps {
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
  zoom: number;
}

function hexPath(cx: number, cy: number, r: number): string {
  let d = '';
  for (let a = 0; a < 6; a++) {
    const ang = (Math.PI / 3) * a + Math.PI / 6;
    d += `${a === 0 ? 'M' : 'L'}${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)} `;
  }
  return d + 'Z';
}

export const HexagonArena: React.FC<HexagonArenaProps> = ({
  width,
  height,
  cameraX,
  cameraY,
  zoom,
}) => {
  // Rayon d'une dalle (px écran), arrondi pour éviter de reconstruire le motif à chaque micro-zoom
  const r = Math.max(16, Math.round(36 * zoom * 2) / 2);
  const tileW = Math.sqrt(3) * r;
  const tileH = 3 * r;

  // Origine du motif = position monde (0,0) projetée à l'écran
  const originX = width / 2 - cameraX * zoom;
  const originY = height / 2 - cameraY * zoom;

  const half = tileW / 2;
  const inner = r * 0.78;

  const centers: Array<[number, number]> = [
    [0, 0],
    [tileW, 0],
    [0, tileH],
    [tileW, tileH],
    [half, tileH / 2],
    [half, -tileH / 2],
    [half, tileH * 1.5],
  ];

  const arenaCx = originX;
  const arenaCy = originY;
  const arenaR = ARENA_RADIUS * zoom;

  return (
    <G>
      <Defs>
        <Pattern
          id="hexTile"
          x={originX}
          y={originY}
          width={tileW}
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          <Rect x={0} y={0} width={tileW} height={tileH} fill="#070C16" />
          {centers.map(([cx, cy], i) => (
            <G key={i}>
              <Path d={hexPath(cx, cy, r)} fill="#0A1222" stroke="#02040A" strokeWidth={2} />
              <Path d={hexPath(cx, cy, inner)} fill="#0D1829" opacity={0.9} />
            </G>
          ))}
        </Pattern>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} fill="url(#hexTile)" />

      {/* Bordure énergétique de l'arène */}
      <Circle
        cx={arenaCx}
        cy={arenaCy}
        r={arenaR}
        fill="none"
        stroke="#FF0055"
        strokeWidth={Math.max(4, 8 * zoom)}
        strokeDasharray="24, 16"
        opacity={0.7}
      />
      <Circle
        cx={arenaCx}
        cy={arenaCy}
        r={arenaR + 10 * zoom}
        fill="none"
        stroke="#FF0033"
        strokeWidth={2}
        opacity={0.3}
      />
    </G>
  );
};
