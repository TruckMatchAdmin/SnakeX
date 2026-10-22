/**
 * Moteur de rendu 2D React Native Svg pour l'arène SnakeX
 * Caméra centrée sur le joueur, interpolation visuelle, effets néon et arène circulaire
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ARENA_RADIUS, Orb } from '@snakex/shared';
import { COLORS } from '../theme/colors';
import { TickPayload } from '@snakex/shared';

interface GameCanvasProps {
  width: number;
  height: number;
  myPlayerId: string | null;
  players: TickPayload['players'];
  orbs: Orb[];
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  myPlayerId,
  players,
  orbs,
}) => {
  // Trouver le joueur local pour centrer la caméra
  const mySnake = players.find((p) => p.id === myPlayerId) || players[0];

  const cameraX = mySnake?.body[0]?.x ?? 0;
  const cameraY = mySnake?.body[0]?.y ?? 0;

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Conversion Coordonnées Monde -> Coordonnées Écran
  const toScreenX = (wx: number) => wx - cameraX + halfWidth;
  const toScreenY = (wy: number) => wy - cameraY + halfHeight;

  // Filtrage des éléments visibles pour les performances d'affichage
  const margin = 100;
  const visibleOrbs = orbs.filter((orb) => {
    const sx = toScreenX(orb.x);
    const sy = toScreenY(orb.y);
    return sx >= -margin && sx <= width + margin && sy >= -margin && sy <= height + margin;
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="arenaGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="90%" stopColor="#0B1528" stopOpacity="0" />
            <Stop offset="100%" stopColor={COLORS.DANGER} stopOpacity="0.4" />
          </RadialGradient>
        </Defs>

        {/* 1. Limite circulaire de l'arène de jeu */}
        <Circle
          cx={toScreenX(0)}
          cy={toScreenY(0)}
          r={ARENA_RADIUS}
          fill="url(#arenaGlow)"
          stroke={COLORS.DANGER}
          strokeWidth={8}
          strokeDasharray="16, 8"
        />

        {/* 2. Affichage des Orbes d'énergie */}
        {visibleOrbs.map((orb) => {
          const sx = toScreenX(orb.x);
          const sy = toScreenY(orb.y);
          return (
            <Circle
              key={orb.id}
              cx={sx}
              cy={sy}
              r={orb.radius}
              fill={orb.color}
              opacity={0.9}
            />
          );
        })}

        {/* 3. Affichage des Serpents */}
        {players.map((snake) => {
          if (!snake.isAlive || snake.body.length === 0) return null;

          const isLocal = snake.id === myPlayerId;
          const head = snake.body[0];
          const headSx = toScreenX(head.x);
          const headSy = toScreenY(head.y);

          const mainColor = isLocal ? COLORS.PRIMARY_NEON : COLORS.SECONDARY_CYAN;
          const eyeColor = isLocal ? COLORS.SECONDARY_CYAN : COLORS.PRIMARY_NEON;

          // Yeux orientés dans la direction du déplacement
          const eyeDistance = snake.radius * 0.55;
          const eyeOffsetAngle = 0.55;
          const eye1X = headSx + Math.cos(snake.angle + eyeOffsetAngle) * eyeDistance;
          const eye1Y = headSy + Math.sin(snake.angle + eyeOffsetAngle) * eyeDistance;
          const eye2X = headSx + Math.cos(snake.angle - eyeOffsetAngle) * eyeDistance;
          const eye2Y = headSy + Math.sin(snake.angle - eyeOffsetAngle) * eyeDistance;

          return (
            <G key={snake.id}>
              {/* Corps (segments inversés pour afficher la tête par-dessus) */}
              {snake.body
                .slice()
                .reverse()
                .map((seg, idx) => {
                  const segSx = toScreenX(seg.x);
                  const segSy = toScreenY(seg.y);
                  const isHeadSeg = idx === snake.body.length - 1;

                  // Dégradé léger vers la queue
                  const factor = (snake.body.length - idx) / snake.body.length;
                  const radius = isHeadSeg ? snake.radius : snake.radius * (0.85 + factor * 0.15);

                  return (
                    <Circle
                      key={`${snake.id}_seg_${idx}`}
                      cx={segSx}
                      cy={segSy}
                      r={radius}
                      fill={mainColor}
                      stroke={snake.isBoosting ? '#FFFFFF' : '#050811'}
                      strokeWidth={snake.isBoosting ? 2.5 : 1}
                      opacity={isHeadSeg ? 1 : 0.88}
                    />
                  );
                })}

              {/* Yeux sur la tête */}
              <Circle cx={eye1X} cy={eye1Y} r={snake.radius * 0.28} fill="#FFFFFF" />
              <Circle cx={eye1X} cy={eye1Y} r={snake.radius * 0.14} fill={eyeColor} />
              <Circle cx={eye2X} cy={eye2Y} r={snake.radius * 0.28} fill="#FFFFFF" />
              <Circle cx={eye2X} cy={eye2Y} r={snake.radius * 0.14} fill={eyeColor} />

              {/* Étiquette Score & Joueur au-dessus de la tête */}
              <SvgText
                x={headSx}
                y={headSy - snake.radius - 10}
                fill={COLORS.TEXT_LIGHT}
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
              >
                {`${isLocal ? '⭐ VOUS' : ''} [${snake.score}]`}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND,
    overflow: 'hidden',
  },
});
