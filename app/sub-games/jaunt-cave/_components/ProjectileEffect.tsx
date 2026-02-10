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
  
  // Beam dimensions
  BEAM_LENGTH: 70,               // Length of beam in pixels (direction of travel)
  BEAM_THICKNESS: 5,             // Thickness/width of beam in pixels
  
  // Glow/shadow effects
  SHADOW_OPACITY: 0.8,           // Glow intensity around projectile (0.0 to 1.0)
  SHADOW_RADIUS: 8,              // How far the glow spreads (in pixels)
  GLOW_THICKNESS_MULTIPLIER: 3,  // Glow is 2x thicker than main beam
} as const;

interface ProjectileEffectProps {
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  color: string;
  duration?: number;
  onComplete?: () => void;
}

export const ProjectileEffect: React.FC<ProjectileEffectProps> = ({
  from,
  to,
  color,
  duration = PROJECTILE_CONFIG.DEFAULT_DURATION,
  onComplete,
}) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
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

    // Calculate rotation angle based on travel direction
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Set rotation
    rotation.setValue(angleDeg);

    // Reset position to starting point (accounting for beam dimensions to center the beam)
    // Center the beam: offset by half the length and half the thickness
    position.setValue({ 
      x: from.x - PROJECTILE_CONFIG.BEAM_LENGTH / 2, 
      y: from.y - PROJECTILE_CONFIG.BEAM_THICKNESS / 2 
    });
    opacity.setValue(1);

    // Animate to target position
    Animated.parallel([
      Animated.timing(position, {
        toValue: { 
          x: to.x - PROJECTILE_CONFIG.BEAM_LENGTH / 2, 
          y: to.y - PROJECTILE_CONFIG.BEAM_THICKNESS / 2 
        },
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
  }, [from, to, duration, position, opacity, rotation]);

  // Don't render if from or to are null
  if (!from || !to) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.projectile,
        {
          width: PROJECTILE_CONFIG.BEAM_LENGTH,
          height: PROJECTILE_CONFIG.BEAM_THICKNESS,
          backgroundColor: color,
          shadowColor: color,
          transform: [
            ...position.getTranslateTransform(),
            { 
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
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
    zIndex: 200, // Above daemon attack overlay (100)
    elevation: 200, // For Android
    shadowOpacity: PROJECTILE_CONFIG.SHADOW_OPACITY,
    shadowRadius: PROJECTILE_CONFIG.SHADOW_RADIUS,
    shadowOffset: { width: 0, height: 0 },
  },
});
