/**
 * Modal d'écran de défaite / Récapitulatif de fin de partie SnakeX
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DiedPayload } from '@snakex/shared';
import { COLORS } from '../theme/colors';

interface DeathModalProps {
  stats: DiedPayload;
  onRespawn: () => void;
  onExitMenu: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({ stats, onRespawn, onExitMenu }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>ÉLIMINÉ !</Text>
        {stats.killerName ? (
          <Text style={styles.killerText}>
            Vous avez été terrassé par <Text style={styles.killerHighlight}>{stats.killerName}</Text>
          </Text>
        ) : (
          <Text style={styles.killerText}>Collision avec la bordure de l'arène !</Text>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SCORE FINAL</Text>
            <Text style={styles.statValue}>{stats.stats.score}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LONGUEUR</Text>
            <Text style={styles.statValue}>{stats.stats.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>KILLS</Text>
            <Text style={styles.statValue}>{stats.stats.kills}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SURVIE</Text>
            <Text style={styles.statValue}>{stats.stats.durationSeconds}s</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.respawnButton} activeOpacity={0.8} onPress={onRespawn}>
          <Text style={styles.respawnButtonText}>🔄 REJOUER IMMÉDIATEMENT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitButton} activeOpacity={0.8} onPress={onExitMenu}>
          <Text style={styles.exitButtonText}>MENU PRINCIPAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.DANGER,
    shadowColor: COLORS.DANGER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    color: COLORS.DANGER,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  killerText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  killerHighlight: {
    color: COLORS.SECONDARY_CYAN,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.SURFACE_LIGHT,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    color: COLORS.PRIMARY_NEON,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  respawnButton: {
    width: '100%',
    backgroundColor: COLORS.PRIMARY_NEON,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  respawnButtonText: {
    color: COLORS.BACKGROUND,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  exitButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  exitButtonText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
});
