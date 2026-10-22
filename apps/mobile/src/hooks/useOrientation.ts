/**
 * Hook de détection et adaptation dynamique à l'orientation (Portrait / Paysage)
 * Permet la rotation à chaud sans perte d'état ni reconnexion
 */

import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface OrientationState {
  width: number;
  height: number;
  isLandscape: boolean;
  aspectRatio: number;
}

export function useOrientation(): OrientationState {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const isLandscape = dimensions.width > dimensions.height;
  const aspectRatio = dimensions.width / (dimensions.height || 1);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isLandscape,
    aspectRatio,
  };
}
