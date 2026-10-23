/**
 * Rendu des orbes d'énergie — optimisé mobile
 * - Lit directement la Map d'orbes (aucune copie de tableau)
 * - Culling viewport + plafond de 140 orbes
 * - 3 cercles par orbe (halo, corps, reflet)
 */

import React from 'react';
import { G, Circle } from 'react-native-svg';
import { Orb } from '@snakex/shared';

interface OrbsRendererProps {
  orbsMap: Map<string, Orb>;
  toScreenX: (x: number) => number;
  toScreenY: (y: number) => number;
  zoom: number;
  width: number;
  height: number;
}

const MARGIN = 30;
const MAX_VISIBLE_ORBS = 140;

export const OrbsRenderer: React.FC<OrbsRendererProps> = ({
  orbsMap,
  toScreenX,
  toScreenY,
  zoom,
  width,
  height,
}) => {
  const items: React.ReactNode[] = [];
  let count = 0;

  for (const orb of orbsMap.values()) {
    const sx = toScreenX(orb.x);
    if (sx < -MARGIN || sx > width + MARGIN) continue;
    const sy = toScreenY(orb.y);
    if (sy < -MARGIN || sy > height + MARGIN) continue;

    const r = Math.max(4.5, orb.radius * zoom * 1.3);
    items.push(
      <G key={orb.id}>
        <Circle cx={sx} cy={sy} r={r * 1.9} fill={orb.color} opacity={0.3} />
        <Circle cx={sx} cy={sy} r={r} fill={orb.color} stroke="#FFFFFF" strokeWidth={0.8} />
        <Circle cx={sx - r * 0.28} cy={sy - r * 0.28} r={r * 0.35} fill="#FFFFFF" opacity={0.85} />
      </G>
    );
    if (++count >= MAX_VISIBLE_ORBS) break;
  }

  return <G>{items}</G>;
};
