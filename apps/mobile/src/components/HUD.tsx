/**
 * Interface HUD (Affichage tête haute) - Référence Slither.io Cyber
 * - Haut-Gauche : Carte néon Score, Taille et Kills
 * - Haut-Droite : Classement Top 10 avec icône trophée et bouton Paramètres
 * - Bas-Droite : Mini-radar et bouton Boost
 * - Parfaitement proportionné, adapté au portrait et au paysage
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LeaderboardEntry, TickPayload } from '@snakex/shared';
import { COLORS } from '../theme/colors';
import { MiniRadar } from './MiniRadar';

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
  players?: TickPayload['players'];
}

const RANK_COLORS = [
  '#00FF66', // #1 (Vert fluo)
  '#00E5FF', // #2 (Cyan)
  '#FF2A42', // #3 (Rouge)
  '#FF8800', // #4 (Orange)
  '#FFD700', // #5 (Or)
  '#C084FC', // #6 (Violet)
  '#60A5FA', // #7 (Bleu)
  '#F472B6', // #8 (Rose)
  '#A78BFA', // #9 (Lavande)
  '#94A3B8', // #10 (Gris)
];

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
  players = [],
}) => {
  const getPingColor = (ping: number) => {
    if (!isConnected) return COLORS.DANGER;
    if (ping < 70) return COLORS.PRIMARY_NEON;
    if (ping < 140) return COLORS.ACCENT_GOLD;
    return COLORS.DANGER;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 1. PANNEAU HAUT-GAUCHE : SCORE, TAILLE, KILLS (Comme la référence) */}
      <View style={[styles.statsCard, isLandscape && styles.statsCardLandscape]}>
        <View style={styles.scoreHeaderRow}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <View style={styles.pingRow}>
            <View
              style={[
                styles.pingDot,
                { backgroundColor: getPingColor(latencyMs) },
              ]}
            />
            <Text style={styles.pingValue}>{isConnected ? `${latencyMs}ms` : 'offline'}</Text>
          </View>
        </View>

        <Text style={styles.scoreValue}>{score}</Text>

        <View style={styles.statsDetailsRow}>
          <Text style={styles.statDetailText}>📏 TAILLE : {length}</Text>
          <Text style={styles.statDetailText}>⚔️ KILLS : {kills}</Text>
        </View>
      </View>

      {/* 2. NOTIFICATION SERVEUR FLOTTANTE */}
      {notification && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}

      {/* 3. PANNEAU HAUT-DROITE : CLASSEMENT TOP 10 AVEC TROPHÉE ET GEAR */}
      <View style={[styles.leaderboardCard, isLandscape && styles.leaderboardLandscape]}>
        <View style={styles.lbHeaderRow}>
          <Text style={styles.lbTitle}>🏆 CLASSEMENT</Text>
          <TouchableOpacity style={styles.settingsIcon} activeOpacity={0.7}>
            <Text style={styles.settingsIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {leaderboard.slice(0, 10).map((entry, idx) => {
          const isMe = entry.id === myPlayerId;
          const rankColor = RANK_COLORS[idx] || '#FFFFFF';

          return (
            <View key={entry.id || idx} style={styles.lbEntryRow}>
              <Text style={[styles.entryRank, { color: rankColor }]}>
                #{idx + 1}
              </Text>
              <Text
                style={[
                  styles.entryName,
                  isMe ? styles.entryNameMe : { color: rankColor },
                ]}
                numberOfLines={1}
              >
                {entry.name}
              </Text>
              <Text style={[styles.entryScore, isMe && styles.entryScoreMe]}>
                {entry.score}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 4. BAS-DROITE : MINI-RADAR CIRCULAIRE (Au-dessus du bouton boost) */}
      <View style={styles.radarWrapper}>
        <MiniRadar
          players={players}
          myPlayerId={myPlayerId}
          leaderboard={leaderboard}
          size={84}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Panneau Haut-Gauche (Score néon)
  statsCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(4, 9, 20, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 130,
  },
  statsCardLandscape: {
    top: 14,
    left: 18,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pingValue: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  scoreValue: {
    color: COLORS.PRIMARY_NEON,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    marginVertical: 1,
    textShadowColor: 'rgba(0, 255, 102, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statsDetailsRow: {
    gap: 2,
    marginTop: 2,
  },
  statDetailText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Notification serveur / Killfeed
  notificationBanner: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#EC4899',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  notificationText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Panneau Haut-Droite (Leaderboard Top 10)
  leaderboardCard: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(4, 9, 20, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#19335A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 160,
    maxWidth: 180,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  leaderboardLandscape: {
    top: 14,
    right: 18,
  },
  lbHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#122543',
    paddingBottom: 4,
  },
  lbTitle: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  settingsIcon: {
    padding: 2,
  },
  settingsIconText: {
    fontSize: 12,
  },
  lbEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1.5,
  },
  entryRank: {
    fontSize: 10,
    fontWeight: '800',
    width: 22,
  },
  entryName: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  entryNameMe: {
    color: COLORS.PRIMARY_NEON,
    fontWeight: '900',
  },
  entryScore: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  entryScoreMe: {
    color: COLORS.PRIMARY_NEON,
    fontWeight: '900',
  },

  // Radar bas-droite
  radarWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 125,
  },
});
