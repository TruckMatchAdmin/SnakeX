/**
 * Mini-Map Radar Circulaire (Inspiré de la référence Slither.io)
 * Positionné au-dessus du bouton Boost, indique la position des serpents et du Roi dans l'arène
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ARENA_RADIUS, TickPayload, LeaderboardEntry } from '@snakex/shared';
import { COLORS } from '../theme/colors';

interface MiniRadarProps {
  players: TickPayload['players'];
  myPlayerId: string | null;
  leaderboard?: LeaderboardEntry[];
  size?: number;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({
  players,
  myPlayerId,
  leaderboard = [],
  size = 90,
}) => {
  const radius = size / 2;
  const center = radius;
  const scale = (radius - 6) / ARENA_RADIUS;

  const leaderId = leaderboard[0]?.id;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Fond du radar semi-transparent */}
        <Circle
          cx={center}
          cy={center}
          r={radius - 2}
          fill="rgba(4, 8, 18, 0.75)"
          stroke="#162D4D"
          strokeWidth={1.5}
        />
        {/* Anneau intérieur de repère */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.55}
          fill="none"
          stroke="#0F1E33"
          strokeWidth={1}
          strokeDasharray="4, 4"
        />
        {/* Réticules fins */}
        <Line
          x1={center}
          y1={6}
          x2={center}
          y2={size - 6}
          stroke="#0F1E33"
          strokeWidth={0.8}
        />
        <Line
          x1={6}
          y1={center}
          x2={size - 6}
          y2={center}
          stroke="#0F1E33"
          strokeWidth={0.8}
        />

        {/* Points des serpents sur la carte */}
        {players.map((snake) => {
          if (!snake.isAlive || snake.body.length === 0) return null;

          const isMe = snake.id === myPlayerId;
          const isLeader = snake.id === leaderId;
          const head = snake.body[0];

          const dotX = center + head.x * scale;
          const dotY = center + head.y * scale;

          if (isLeader) {
            return (
              <SvgText
                key={`radar_${snake.id}`}
                x={dotX}
                y={dotY + 4}
                fontSize={10}
                textAnchor="middle"
              >
                👑
              </SvgText>
            );
          }

          return (
            <Circle
              key={`radar_${snake.id}`}
              cx={dotX}
              cy={dotY}
              r={isMe ? 3.5 : 2}
              fill={isMe ? COLORS.PRIMARY_NEON : '#FF0055'}
              stroke={isMe ? '#FFFFFF' : 'none'}
              strokeWidth={isMe ? 1 : 0}
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 45,
    overflow: 'hidden',
  },
});
