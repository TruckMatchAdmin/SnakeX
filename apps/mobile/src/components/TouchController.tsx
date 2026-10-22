/**
 * Contrôleur tactile virtuel adapté pour smartphones (Portrait & Paysage)
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent } from 'react-native';
import { COLORS } from '../theme/colors';

interface TouchControllerProps {
  onAngleChange: (angle: number) => void;
  onBoostChange: (boosting: boolean) => void;
  isBoosting: boolean;
}

export const TouchController: React.FC<TouchControllerProps> = ({
  onAngleChange,
  onBoostChange,
  isBoosting,
}) => {
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    setJoystickCenter({ x: pageX, y: pageY });
    setKnobPos({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (!joystickCenter) return;
    const { pageX, pageY } = e.nativeEvent;
    const dx = pageX - joystickCenter.x;
    const dy = pageY - joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const angle = Math.atan2(dy, dx);
      onAngleChange(angle);

      const maxRadius = 45;
      const clampedDist = Math.min(maxRadius, dist);
      setKnobPos({
        x: Math.cos(angle) * clampedDist,
        y: Math.sin(angle) * clampedDist,
      });
    }
  };

  const handleTouchEnd = () => {
    setJoystickCenter(null);
    setKnobPos({ x: 0, y: 0 });
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Zone de pilotage tactile (partie gauche de l'écran) */}
      <View
        style={styles.steeringZone}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
      >
        {joystickCenter && (
          <View
            style={[
              styles.joystickBase,
              { left: joystickCenter.x - 50, top: joystickCenter.y - 50 },
            ]}
          >
            <View
              style={[
                styles.joystickKnob,
                { transform: [{ translateX: knobPos.x }, { translateY: knobPos.y }] },
              ]}
            />
          </View>
        )}
      </View>

      {/* Bouton de Boost Néon (partie droite basse de l'écran) */}
      <View style={styles.boostContainer} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.boostButton, isBoosting && styles.boostButtonActive]}
          onPressIn={() => onBoostChange(true)}
          onPressOut={() => onBoostChange(false)}
        >
          <Text style={[styles.boostText, isBoosting && styles.boostTextActive]}>
            ⚡ BOOST
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  steeringZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '65%',
  },
  joystickBase: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickKnob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_NEON,
    shadowColor: COLORS.PRIMARY_NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
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
    shadowColor: COLORS.SECONDARY_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  boostButtonActive: {
    backgroundColor: COLORS.SECONDARY_CYAN,
    borderColor: COLORS.PRIMARY_NEON,
    shadowColor: COLORS.PRIMARY_NEON,
    shadowOpacity: 1,
    shadowRadius: 16,
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
