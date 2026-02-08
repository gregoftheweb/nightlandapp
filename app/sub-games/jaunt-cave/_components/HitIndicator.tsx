// app/sub-games/jaunt-cave/_components/HitIndicator.tsx
// Visual feedback component for hit/block indicators at target locations

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// ============================================================================
// HIT INDICATOR CONFIGURATION
// ============================================================================

export const HIT_INDICATOR_CONFIG = {
  // Size
  CIRCLE_SIZE: 80,              // Diameter of indicator circle in pixels
  
  // Animation
  DURATION: 600,                // How long indicator shows (ms)
  FADE_OUT_DURATION: 200,       // Fade out time (ms)
  
  // Colors
  BLOCK_COLOR: '#CC6600',       // Dull orange for blocked shots
  HIT_COLOR: '#FF0000',         // Bright red for successful hits
  
  // Hit effect
  HIT_RING_COUNT: 3,            // Number of concentric circles for hit
  HIT_RING_SPACING: 8,          // Spacing between rings in pixels
} as const;

interface HitIndicatorProps {
  position: { x: number; y: number } | null;  // Where to show indicator
  type: 'hit' | 'block';                      // Hit or block
  onComplete?: () => void;                     // Callback when animation finishes
}

export function HitIndicator({ position, type, onComplete }: HitIndicatorProps) {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (position) {
      // Reset opacity to 1
      opacityAnim.setValue(1);

      // Start fade out after DURATION
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: HIT_INDICATOR_CONFIG.FADE_OUT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, HIT_INDICATOR_CONFIG.DURATION);

      return () => clearTimeout(timer);
    }
  }, [position, opacityAnim, onComplete]);

  // Don't render if no position
  if (!position) {
    return null;
  }

  const size = HIT_INDICATOR_CONFIG.CIRCLE_SIZE;
  const halfSize = size / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x - halfSize,
          top: position.y - halfSize,
          width: size,
          height: size,
          opacity: opacityAnim,
        },
      ]}
    >
      {type === 'block' ? (
        // BLOCK indicator: dull orange X
        <View style={styles.blockContainer}>
          <View
            style={[
              styles.circle,
              {
                borderColor: HIT_INDICATOR_CONFIG.BLOCK_COLOR,
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
          {/* X through the circle - diagonal lines */}
          <View
            style={[
              styles.xLine,
              {
                backgroundColor: HIT_INDICATOR_CONFIG.BLOCK_COLOR,
                transform: [{ rotate: '45deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.xLine,
              {
                backgroundColor: HIT_INDICATOR_CONFIG.BLOCK_COLOR,
                transform: [{ rotate: '-45deg' }],
              },
            ]}
          />
        </View>
      ) : (
        // HIT indicator: bright red concentric circles with text
        <View style={styles.hitContainer}>
          {/* Render concentric circles */}
          {Array.from({ length: HIT_INDICATOR_CONFIG.HIT_RING_COUNT }).map((_, index) => {
            const ringRadius = size / 2 - index * HIT_INDICATOR_CONFIG.HIT_RING_SPACING;
            const ringDiameter = ringRadius * 2;
            return (
              <View
                key={index}
                style={[
                  styles.hitCircle,
                  {
                    width: ringDiameter,
                    height: ringDiameter,
                    borderRadius: ringRadius,
                    borderColor: HIT_INDICATOR_CONFIG.HIT_COLOR,
                    position: 'absolute',
                    top: (size - ringDiameter) / 2,
                    left: (size - ringDiameter) / 2,
                  },
                ]}
              />
            );
          })}
          {/* HIT text centered */}
          <Text style={[styles.hitText, { color: HIT_INDICATOR_CONFIG.HIT_COLOR }]}>
            HIT
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 3,
    position: 'absolute',
  },
  xLine: {
    position: 'absolute',
    width: '80%',
    height: 3,
  },
  hitContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hitCircle: {
    borderWidth: 2,
  },
  hitText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Export config for use in other components
// (Exported at declaration above)
