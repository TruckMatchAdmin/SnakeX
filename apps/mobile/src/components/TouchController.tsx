/**
 * Contrôles tactiles : on dirige le serpent en touchant/glissant n'importe où sur l'écran.
 * Le serpent se dirige vers le point touché (caméra centrée sur le joueur => centre de l'écran).
 * Fonctionne en portrait et en paysage car il s'appuie sur la taille de fenêtre courante.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  GestureResponderEvent,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '../theme/colors';

interface TouchControllerProps {
  onAngleChange: (angle: number) => void;
  onBoostChange: (boosting: boolean) => void;
  isBoosting: boolean;
}

// ~30 envois/s maximum : reste sous la limite serveur (40/s) tout en restant fluide
const SEND_INTERVAL_MS = 33;

export const TouchController: React.FC<TouchControllerProps> = ({
  onAngleChange,
  onBoostChange,
  isBoosting,
}) => {
  const { width, height } = useWindowDimensions();
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const lastSentRef = useRef(0);

  const steer = (e: GestureResponderEvent, force = false) => {
    const { pageX, pageY } = e.nativeEvent;
    setTouchPoint({ x: pageX, y: pageY });

    const now = Date.now();
    if (!force && now - lastSentRef.current < SEND_INTERVAL_MS) return;
    lastSentRef.current = now;

    const dx = pageX - width / 2;
    const dy = pageY - height / 2;
    if (Math.abs(dx) + Math.abs(dy) < 4) return;
    onAngleChange(Math.atan2(dy, dx));
  };

  const release = () => setTouchPoint(null);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Zone de pilotage : tout l'écran */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => steer(e, true)}
        onResponderMove={(e) => steer(e)}
        onResponderRelease={release}
        onResponderTerminate={release}
      />

      {/* Repère visuel du point visé */}
      {touchPoint && (
        <View
          pointerEvents="none"
          style={[styles.target, { left: touchPoint.x - 22, top: touchPoint.y - 22 }]}
        />
      )}

      {/* Bouton de Boost (bas droite) */}
      <View style={styles.boostContainer} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.boostButton, isBoosting && styles.boostButtonActive]}
          onPressIn={() => onBoostChange(true)}
          onPressOut={() => onBoostChange(false)}
        >
          <Text style={[styles.boostText, isBoosting && styles.boostTextActive]}>⚡ BOOST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  target: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.7)',
    backgroundColor: 'rgba(0, 255, 102, 0.18)',
  },
  boostContainer: {
    position: 'absolute',
    right: 24,
    bottom: 30,
  },
  boostButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(11, 21, 40, 0.85)',
    borderWidth: 3,
    borderColor: COLORS.SECONDARY_CYAN,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  boostButtonActive: {
    backgroundColor: COLORS.SECONDARY_CYAN,
    borderColor: COLORS.PRIMARY_NEON,
    transform: [{ scale: 1.08 }],
  },
  boostText: {
    color: COLORS.SECONDARY_CYAN,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  boostTextActive: {
    color: COLORS.BACKGROUND,
  },
});
