/**
 * Écran d'accueil SnakeX — 100% mobile, plein écran immersif
 * - Fond dégradé radial néon + orbes lumineux flottants animés (style Slither.io)
 * - Logo détouré (sans fond noir) avec animation de flottement
 * - Pseudo, choix de skin, gros bouton JOUER pulsant (zones tactiles >= 48px)
 * - Portrait & paysage, clavier géré, zones sûres (encoches)
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { SNAKE_SKINS } from '@snakex/shared';

interface LobbyScreenProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedSkinId: string;
  setSelectedSkinId: (id: string) => void;
  onStartGame: () => void;
  isConnected: boolean;
  latencyMs: number;
  currentUser: { id: string; username: string } | null;
  onOpenAuth: () => void;
  isLandscape: boolean;
}

const ORB_COLORS = ['#00FF66', '#00E5FF', '#FF0077', '#FFD700', '#9D4EDD', '#FF6B35'];

/** Orbe flottant décoratif (animation native, aucun re-render React) */
const FloatingOrb: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}> = ({ x, y, size, color, delay, duration }) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) },
        ],
        shadowColor: color,
        shadowOpacity: 1,
        shadowRadius: size,
        elevation: 6,
      }}
    />
  );
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerName,
  setPlayerName,
  selectedSkinId,
  setSelectedSkinId,
  onStartGame,
  isConnected,
  latencyMs,
  currentUser,
  onOpenAuth,
  isLandscape,
}) => {
  const { width, height } = useWindowDimensions();

  // Animations : flottement du logo + pulsation du bouton
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [float, pulse]);

  // Orbes décoratifs générés une fois par taille d'écran
  const orbs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        key: i,
        x: ((i * 137) % 100) / 100 * width,
        y: ((i * 83 + 17) % 100) / 100 * height,
        size: 6 + ((i * 7) % 11),
        color: ORB_COLORS[i % ORB_COLORS.length],
        delay: (i * 230) % 1800,
        duration: 1800 + ((i * 311) % 1800),
      })),
    [width, height]
  );

  const logoSize = isLandscape
    ? Math.min(height * 0.62, width * 0.36)
    : Math.min(width * 0.82, height * 0.34);
  const logoHeight = logoSize * (617 / 640);

  const statusLabel = isConnected
    ? `En ligne${latencyMs > 0 ? ` • ${latencyMs} ms` : ''}`
    : 'Connexion au serveur...';

  const logoBlock = (
    <View style={[styles.logoBlock, isLandscape && { flex: 1 }]}>
      <Animated.Image
        source={require('../../assets/logo-transparent.png')}
        resizeMode="contain"
        style={{
          width: logoSize,
          height: logoHeight,
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { scale: float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
          ],
        }}
      />
      <View style={styles.statusPill}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? COLORS.PRIMARY_NEON : COLORS.DANGER },
          ]}
        />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </View>
  );

  const formBlock = (
    <View style={[styles.form, isLandscape && { flex: 1, maxWidth: 380 }]}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputIcon}>🐍</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Ton pseudo..."
          placeholderTextColor={COLORS.TEXT_MUTED}
          maxLength={16}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onStartGame}
        />
      </View>

      <View style={styles.skinsRow}>
        {SNAKE_SKINS.map((skin) => {
          const selected = skin.id === selectedSkinId;
          return (
            <TouchableOpacity
              key={skin.id}
              activeOpacity={0.7}
              onPress={() => setSelectedSkinId(skin.id)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={[
                styles.skinOrb,
                { borderColor: skin.primary },
                selected && styles.skinOrbSelected,
                selected && { shadowColor: skin.primary },
              ]}
            >
              <View style={[styles.skinInnerDot, { backgroundColor: skin.primary }]}>
                <View style={[styles.skinCenterAccent, { backgroundColor: skin.secondary }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.View
        style={{
          width: '100%',
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
        }}
      >
        <TouchableOpacity style={styles.playButton} activeOpacity={0.85} onPress={onStartGame}>
          <Text style={styles.playButtonText}>▶  JOUER</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.authLink} activeOpacity={0.7} onPress={onOpenAuth}>
        <Text style={styles.authLinkText}>
          {currentUser ? `👑 ${currentUser.username}` : '🔐 Se connecter'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fond dégradé radial */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="bgA" cx="50%" cy="35%" rx="75%" ry="65%">
            <Stop offset="0" stopColor="#0E2A4D" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#071327" stopOpacity="1" />
            <Stop offset="1" stopColor="#03060F" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="bgB" cx="50%" cy="40%" rx="45%" ry="40%">
            <Stop offset="0" stopColor="#00FF66" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#00FF66" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#bgA)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#bgB)" />
      </Svg>

      {orbs.map(({ key, ...o }) => (
        <FloatingOrb key={key} {...o} />
      ))}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, isLandscape && styles.scrollLandscape]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {logoBlock}
          {formBlock}
        </ScrollView>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>Studio IziGab</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#03060F',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 14,
  },
  scrollLandscape: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 32,
  },
  logoBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 12, 26, 0.65)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(5, 11, 23, 0.72)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.55)',
    paddingHorizontal: 18,
    minHeight: 54,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    paddingVertical: 12,
  },
  skinsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  skinOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 11, 23, 0.7)',
  },
  skinOrbSelected: {
    borderWidth: 3.5,
    transform: [{ scale: 1.18 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  skinInnerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skinCenterAccent: { width: 11, height: 11, borderRadius: 6 },
  playButton: {
    width: '100%',
    minHeight: 62,
    backgroundColor: COLORS.PRIMARY_NEON,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: COLORS.PRIMARY_NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  playButtonText: {
    color: '#03140A',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  authLink: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  authLinkText: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    color: 'rgba(126, 145, 176, 0.6)',
    fontSize: 10,
    letterSpacing: 2,
  },
});
