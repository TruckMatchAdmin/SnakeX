/**
 * Interface HUD (Affichage tête haute) réactive en jeu
 * Leaderboard en direct, scores, ping, notification serveur et adaptation portrait/paysage
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaderboardEntry } from '@snakex/shared';
import { COLORS } from '../theme/colors';

interface HUDProps {
  score: number;
  length: number;
  kills: number;
  leaderboard: LeaderboardEntry[];
  myPlayerId: string | null;
  latencyMs: number;
  isConnected: boolean;
  isLandscape: boolean;
  notification: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  length,
  kills,
  leaderboard,
  myPlayerId,
  latencyMs,
  isConnected,
  isLandscape,
  notification,
}) => {
  const getPingColor = (ping: number) => {
    if (ping < 70) return COLORS.PRIMARY_NEON;
    if (ping < 140) return COLORS.ACCENT_GOLD;
    return COLORS.DANGER;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 1. Bandeau supérieur : Statut & Statistiques Personnelles */}
      <View style={[styles.topBar, isLandscape && styles.topBarLandscape]}>
        <View style={styles.statsCard}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailText}>📏 Taille: {length}</Text>
          <Text style={styles.detailText}>⚔️ Kills: {kills}</Text>
        </View>

        <View style={styles.networkBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? getPingColor(latencyMs) : COLORS.DANGER },
            ]}
          />
          <Text style={styles.pingText}>
            {isConnected ? `${latencyMs} ms` : 'Déconnecté'}
          </Text>
        </View>
      </View>

      {/* 2. Notification Serveur / Killfeed */}
      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}

      {/* 3. Classement en Direct (Leaderboard Top 5) */}
      <View style={[styles.leaderboardCard, isLandscape ? styles.lbLandscape : styles.lbPortrait]}>
        <Text style={styles.lbTitle}>🏆 CLASSEMENT</Text>
        {leaderboard.slice(0, 5).map((entry, idx) => {
          const isMe = entry.id === myPlayerId;
          return (
            <View key={entry.id || idx} style={styles.lbRow}>
              <Text style={[styles.lbRank, isMe && styles.highlightText]}>
                #{idx + 1}
              </Text>
              <Text
                style={[styles.lbName, isMe && styles.highlightText]}
                numberOfLines={1}
              >
                {entry.name}
              </Text>
              <Text style={[styles.lbScore, isMe && styles.highlightText]}>
                {entry.score}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarLandscape: {
    top: 15,
    left: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(11, 21, 40, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  scoreLabel: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreValue: {
    color: COLORS.PRIMARY_NEON,
    fontSize: 22,
    fontWeight: '900',
  },
  detailRow: {
    backgroundColor: 'rgba(11, 21, 40, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  detailText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: '600',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 21, 40, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pingText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: 'bold',
  },
  notificationContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 0, 119, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  notificationText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  leaderboardCard: {
    position: 'absolute',
    backgroundColor: 'rgba(11, 21, 40, 0.88)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    width: 175,
  },
  lbPortrait: {
    top: 40,
    right: 15,
  },
  lbLandscape: {
    top: 15,
    right: 20,
  },
  lbTitle: {
    color: COLORS.ACCENT_GOLD,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  lbRank: {
    color: COLORS.TEXT_MUTED,
    fontSize: 11,
    width: 24,
    fontWeight: '700',
  },
  lbName: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    flex: 1,
    fontWeight: '600',
  },
  lbScore: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 11,
    fontWeight: 'bold',
  },
  highlightText: {
    color: COLORS.PRIMARY_NEON,
    fontWeight: '900',
  },
});
