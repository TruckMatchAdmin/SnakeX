/**
 * Contrôleur tactile multi-touch de SnakeX
 * - JOYSTICK INVISIBLE : le premier doigt posé (hors bouton boost) définit une origine flottante ;
 *   la direction = vecteur origine → doigt. Aucun élément visuel, aucun re-render pendant le geste.
 * - BOOST SIMULTANÉ : un second doigt sur le bouton boost accélère pendant que le premier dirige
 *   (événements tactiles bruts avec identifiants : contrairement au système de "responder" de
 *   React Native, ils ne sont pas exclusifs).
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, GestureResponderEvent, useWindowDimensions } from 'react-native';
import { COLORS } from '../theme/colors';

interface TouchControllerProps {
  onAngleChange: (angle: number) => void;
  onBoostChange: (boosting: boolean) => void;
  isBoosting: boolean;
}

// Distance (px) au-delà de laquelle l'origine invisible suit le doigt
const FOLLOW_DISTANCE = 70;
// Zone morte (px) avant de calculer une direction
const DEAD_ZONE = 4;
// Cadence max d'envoi réseau et seuil de variation d'angle (rad)
const SEND_INTERVAL_MS = 28;
const MIN_ANGLE_DELTA = 0.03;

// Bouton boost : géométrie (px) — la zone tactile est volontairement plus grande que le visuel
const BOOST_SIZE = 96;
const BOOST_MARGIN_RIGHT = 28;
const BOOST_MARGIN_BOTTOM = 32;
const BOOST_HIT_RADIUS = 86;

export const TouchController: React.FC<TouchControllerProps> = ({
  onAngleChange,
  onBoostChange,
  isBoosting,
}) => {
  const { width, height } = useWindowDimensions();

  const steerIdRef = useRef<number | null>(null);
  const boostIdRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const lastAngleRef = useRef(0);
  const lastSentAngleRef = useRef(0);
  const lastSentTimeRef = useRef(0);
  // État local uniquement pour l'aspect visuel du bouton boost
  const [boostPressed, setBoostPressed] = useState(false);

  const boostCx = width - BOOST_MARGIN_RIGHT - BOOST_SIZE / 2;
  const boostCy = height - BOOST_MARGIN_BOTTOM - BOOST_SIZE / 2;

  const isOnBoost = (x: number, y: number) =>
    Math.hypot(x - boostCx, y - boostCy) <= BOOST_HIT_RADIUS;

  const setBoost = (value: boolean) => {
    setBoostPressed(value);
    onBoostChange(value);
  };

  const steerTo = (x: number, y: number, force = false) => {
    let dx = x - originRef.current.x;
    let dy = y - originRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= DEAD_ZONE) return;

    // L'origine invisible suit le doigt s'il s'éloigne trop
    if (dist > FOLLOW_DISTANCE) {
      const excess = dist - FOLLOW_DISTANCE;
      originRef.current.x += (dx / dist) * excess;
      originRef.current.y += (dy / dist) * excess;
      dx = x - originRef.current.x;
      dy = y - originRef.current.y;
    }

    const angle = Math.atan2(dy, dx);
    lastAngleRef.current = angle;

    const now = Date.now();
    const delta = Math.abs(
      Math.atan2(Math.sin(angle - lastSentAngleRef.current), Math.cos(angle - lastSentAngleRef.current))
    );
    if (force || (now - lastSentTimeRef.current >= SEND_INTERVAL_MS && delta > MIN_ANGLE_DELTA)) {
      lastSentTimeRef.current = now;
      lastSentAngleRef.current = angle;
      onAngleChange(angle);
    }
  };

  const handleTouchStart = (e: GestureResponderEvent) => {
    for (const t of e.nativeEvent.changedTouches) {
      const id = Number(t.identifier);
      if (isOnBoost(t.pageX, t.pageY)) {
        if (boostIdRef.current === null) {
          boostIdRef.current = id;
          setBoost(true);
        }
      } else if (steerIdRef.current === null) {
        steerIdRef.current = id;
        originRef.current = { x: t.pageX, y: t.pageY };
      }
    }
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    for (const t of e.nativeEvent.changedTouches) {
      if (Number(t.identifier) === steerIdRef.current) {
        steerTo(t.pageX, t.pageY);
      }
    }
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    for (const t of e.nativeEvent.changedTouches) {
      const id = Number(t.identifier);
      if (id === steerIdRef.current) {
        steerIdRef.current = null;
        // On conserve le dernier cap : le serpent continue tout droit
        onAngleChange(lastAngleRef.current);
      } else if (id === boostIdRef.current) {
        boostIdRef.current = null;
        setBoost(false);
      }
    }
  };

  const active = boostPressed || isBoosting;

  return (
    <View
      style={styles.root}
      onStartShouldSetResponder={() => false}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Bouton BOOST : purement visuel, la détection se fait sur le root (multi-touch) */}
      <View
        pointerEvents="none"
        style={[
          styles.boostButton,
          {
            width: BOOST_SIZE,
            height: BOOST_SIZE,
            borderRadius: BOOST_SIZE / 2,
            right: BOOST_MARGIN_RIGHT,
            bottom: BOOST_MARGIN_BOTTOM,
          },
          active && styles.boostButtonActive,
        ]}
      >
        <Text style={styles.boostIcon}>⚡</Text>
        <Text style={[styles.boostText, active && styles.boostTextActive]}>BOOST</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  boostButton: {
    position: 'absolute',
    backgroundColor: 'rgba(11, 21, 40, 0.55)',
    borderWidth: 3,
    borderColor: COLORS.SECONDARY_CYAN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SECONDARY_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  boostButtonActive: {
    backgroundColor: COLORS.SECONDARY_CYAN,
    borderColor: COLORS.PRIMARY_NEON,
    transform: [{ scale: 1.12 }],
    shadowColor: COLORS.PRIMARY_NEON,
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  boostIcon: {
    fontSize: 26,
    marginBottom: -2,
  },
  boostText: {
    color: COLORS.SECONDARY_CYAN,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  boostTextActive: {
    color: COLORS.BACKGROUND,
  },
});
