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
  HIT_TEXT_COLOR: '#FFFFFF',    // Bold white for HIT text
  
  // Hit effect
  HIT_RING_COUNT: 3,            // Number of concentric circles for hit
  HIT_RING_SPACING: 8,          // Spacing between rings in pixels
} as const;

interface HitIndicatorProps {
  position: { x: number; y: number } | null;  // Where to show indicator
  type: 'hit' | 'block';                      // Hit or block
  onComplete?: () => void;                     // Callback when animation finishes
}

export const HitIndicator: React.FC<HitIndicatorProps> = ({
  position,
  type,
  onComplete,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const onCompleteRef = useRef(onComplete);

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Only animate when position is set
    if (!position) {
      return;
    }

    // Reset opacity to full
    opacity.setValue(1);

    // Hold at full opacity for DURATION, then fade out
    Animated.sequence([
      Animated.delay(HIT_INDICATOR_CONFIG.DURATION),
      Animated.timing(opacity, {
        toValue: 0,
        duration: HIT_INDICATOR_CONFIG.FADE_OUT_DURATION,
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
      opacity.stopAnimation();
    };
  }, [position, opacity]);

  // Don't render if position is null
  if (!position) {
    return null;
  }

  const { x, y } = position;
  const halfSize = HIT_INDICATOR_CONFIG.CIRCLE_SIZE / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - halfSize,
          top: y - halfSize,
          width: HIT_INDICATOR_CONFIG.CIRCLE_SIZE,
          height: HIT_INDICATOR_CONFIG.CIRCLE_SIZE,
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      {type === 'block' ? (
        // BLOCK indicator: orange circle with X through it
        <>
          <View
            style={[
              styles.circle,
              {
                width: HIT_INDICATOR_CONFIG.CIRCLE_SIZE,
                height: HIT_INDICATOR_CONFIG.CIRCLE_SIZE,
                borderRadius: HIT_INDICATOR_CONFIG.CIRCLE_SIZE / 2,
                borderColor: HIT_INDICATOR_CONFIG.BLOCK_COLOR,
              },
            ]}
          />
          {/* X diagonal lines */}
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
        </>
      ) : (
        // HIT indicator: 3 concentric red circles with "HIT" text
        <>
          {Array.from({ length: HIT_INDICATOR_CONFIG.HIT_RING_COUNT }).map((_, i) => {
            const radius =
              halfSize - i * HIT_INDICATOR_CONFIG.HIT_RING_SPACING;
            const diameter = radius * 2;
            return (
              <View
                key={i}
                style={[
                  styles.circle,
                  {
                    width: diameter,
                    height: diameter,
                    borderRadius: radius,
                    borderColor: HIT_INDICATOR_CONFIG.HIT_COLOR,
                    position: 'absolute',
                    left: (HIT_INDICATOR_CONFIG.CIRCLE_SIZE - diameter) / 2,
                    top: (HIT_INDICATOR_CONFIG.CIRCLE_SIZE - diameter) / 2,
                  },
                ]}
              />
            );
          })}
          <Text
            style={[
              styles.hitText,
              { color: HIT_INDICATOR_CONFIG.HIT_TEXT_COLOR },
            ]}
          >
            HIT
          </Text>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 300, // Above projectile (200)
    elevation: 300, // For Android
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  xLine: {
    position: 'absolute',
    width: '70%',
    height: 3,
  },
  hitText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
