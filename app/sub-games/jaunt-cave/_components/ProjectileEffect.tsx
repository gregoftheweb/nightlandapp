import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

// ============================================================================
// PROJECTILE CONFIGURATION
// Adjust these values to change the look and feel of zap projectiles
// ============================================================================

const PROJECTILE_CONFIG = {
  // Speed and timing
  DEFAULT_DURATION: 250,        // Travel time in milliseconds (lower = faster projectiles, higher = slower)
  FADE_START_PERCENT: 0.9,      // When to start fading (0.9 = fade in last 10% of journey)
  
  // Size and shape
  DEFAULT_SIZE: 16,              // Diameter of projectile circle/sphere
  BORDER_RADIUS_MULTIPLIER: 0.5, // 0.5 = perfect circle, lower values = elongated/streak effect
  
  // Glow/shadow effects
  SHADOW_OPACITY: 0.8,           // Glow intensity around projectile (0.0 to 1.0)
  SHADOW_RADIUS: 8,              // How far the glow spreads (in pixels)
  
  // Advanced: Stretch/trail effect (future enhancement)
  // TRAIL_LENGTH: 0,            // 0 = no trail, higher = longer streak behind projectile
} as const;

interface ProjectileEffectProps {
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  color: string;
  duration?: number;
  size?: number;
  onComplete?: () => void;
}

export const ProjectileEffect: React.FC<ProjectileEffectProps> = ({
  from,
  to,
  color,
  duration = PROJECTILE_CONFIG.DEFAULT_DURATION,
  size = PROJECTILE_CONFIG.DEFAULT_SIZE,
  onComplete,
}) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Only animate when both from and to are set
    if (!from || !to) {
      return;
    }

    // Reset position to starting point (accounting for size to center the projectile)
    position.setValue({ x: from.x - size / 2, y: from.y - size / 2 });
    opacity.setValue(1);

    // Animate to target position
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: to.x - size / 2, y: to.y - size / 2 },
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        delay: duration * PROJECTILE_CONFIG.FADE_START_PERCENT, // Fade out in last portion of journey
        duration: duration * (1 - PROJECTILE_CONFIG.FADE_START_PERCENT),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call completion callback
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    });

    // Cleanup function
    return () => {
      position.stopAnimation();
      opacity.stopAnimation();
    };
  }, [from, to, duration, size, position, opacity]);

  // Don't render if from or to are null
  if (!from || !to) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.projectile,
        {
          width: size,
          height: size,
          borderRadius: size * PROJECTILE_CONFIG.BORDER_RADIUS_MULTIPLIER,
          backgroundColor: color,
          shadowColor: color,
          transform: position.getTranslateTransform(),
          opacity,
        },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  projectile: {
    position: 'absolute',
    zIndex: 150, // Above daemon (50), below attack overlay (100)
    shadowOpacity: PROJECTILE_CONFIG.SHADOW_OPACITY,
    shadowRadius: PROJECTILE_CONFIG.SHADOW_RADIUS,
    shadowOffset: { width: 0, height: 0 },
  },
});
