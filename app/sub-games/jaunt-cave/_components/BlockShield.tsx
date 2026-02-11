// app/sub-games/jaunt-cave/_components/BlockShield.tsx
// Visual effect for defensive block mechanic

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

// ============================================================================
// BLOCK SHIELD CONFIGURATION
// ============================================================================

export const BLOCK_SHIELD_CONFIG = {
  // Size
  CIRCLE_SIZE: 200, // Diameter of shield circles in pixels

  // Animation
  DURATION: 1000, // How long shield lasts (ms)
  FADE_IN_DURATION: 150, // Fade in time (ms)
  FADE_OUT_DURATION: 200, // Fade out time (ms)

  // Colors
  SHIELD_COLOR: '#00BFFF', // Shiny blue for shield

  // Visual effect
  RING_COUNT: 4, // Number of concentric circles
  RING_SPACING: 12, // Spacing between rings in pixels
  RING_OPACITY: 0.7, // Base opacity of rings

  // Text
  TEXT_COLOR: '#FFFFFF', // White text
  TEXT_SIZE: 32, // Font size for "Block" text
  TEXT_SHADOW_RADIUS: 4, // Text shadow for readability
  TEXT_OFFSET_X: -50, // Horizontal offset to center text
  TEXT_OFFSET_Y: -16, // Vertical offset to center text
} as const

interface BlockShieldProps {
  active: boolean // Whether shield is active
  centerX: number // Center x position (screen width / 2)
  centerY: number // Center y position (screen height / 2)
  onExpire?: () => void // Callback when shield expires
}

/**
 * BlockShield - Visual effect for defensive block mechanic
 *
 * Renders 4 concentric shiny blue circles at screen center when active.
 * Fades in, holds, then fades out over DURATION ms.
 *
 * @param active - Whether shield is currently active
 * @param centerX - X position for shield center (typically screen width / 2)
 * @param centerY - Y position for shield center (typically screen height / 2)
 * @param onExpire - Optional callback when shield animation completes
 */
export function BlockShield({ active, centerX, centerY, onExpire }: BlockShieldProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const onExpireRef = useRef(onExpire)

  // Keep onExpire ref up to date
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (active) {
      // Dev logging
      if (__DEV__) {
        console.log('[BlockShield] Rendering shield with zIndex: 10000')
      }

      // Reset opacity to 0
      opacity.setValue(0)

      // Calculate hold duration (time at full opacity)
      const holdDuration = Math.max(
        0,
        BLOCK_SHIELD_CONFIG.DURATION -
          BLOCK_SHIELD_CONFIG.FADE_IN_DURATION -
          BLOCK_SHIELD_CONFIG.FADE_OUT_DURATION
      )

      // Sequence: fade in -> hold -> fade out
      Animated.sequence([
        // Fade in
        Animated.timing(opacity, {
          toValue: BLOCK_SHIELD_CONFIG.RING_OPACITY,
          duration: BLOCK_SHIELD_CONFIG.FADE_IN_DURATION,
          useNativeDriver: true,
        }),
        // Hold at full opacity
        Animated.delay(holdDuration),
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: BLOCK_SHIELD_CONFIG.FADE_OUT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Call onExpire when animation completes
        onExpireRef.current?.()
      })
    }
  }, [active, opacity])

  if (!active) {
    return null
  }

  // Generate array of ring radii
  const rings = Array.from({ length: BLOCK_SHIELD_CONFIG.RING_COUNT }, (_, i) => {
    const baseRadius = BLOCK_SHIELD_CONFIG.CIRCLE_SIZE / 2
    const radius = baseRadius + i * BLOCK_SHIELD_CONFIG.RING_SPACING
    return radius
  })

  return (
    <View style={styles.container} pointerEvents="none">
      {rings.map((radius, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ring,
            {
              left: centerX - radius,
              top: centerY - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderColor: BLOCK_SHIELD_CONFIG.SHIELD_COLOR,
              opacity: opacity,
            },
          ]}
        />
      ))}
      <Animated.Text
        style={{
          position: 'absolute',
          left: centerX,
          top: centerY,
          transform: [
            { translateX: BLOCK_SHIELD_CONFIG.TEXT_OFFSET_X },
            { translateY: BLOCK_SHIELD_CONFIG.TEXT_OFFSET_Y },
          ],
          fontSize: BLOCK_SHIELD_CONFIG.TEXT_SIZE,
          fontWeight: 'bold',
          color: BLOCK_SHIELD_CONFIG.TEXT_COLOR,
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: BLOCK_SHIELD_CONFIG.TEXT_SHADOW_RADIUS,
          opacity: opacity,
        }}
      >
        Block
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000, // Much higher than attack overlay (100)
    elevation: 10000, // For Android
    pointerEvents: 'none',
  },
  ring: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
  },
})
