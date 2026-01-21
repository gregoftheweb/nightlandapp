// components/Projectile.tsx
import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface ProjectileProps {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  angleDeg: number
  color: string
  durationMs: number
  onComplete: (id: string) => void
  lengthPx?: number // Optional length for laser bolts
  thicknessPx?: number // Optional thickness
  glow?: boolean // Optional glow effect
}

const PROJECTILE_LENGTH = 12 // pixels
const PROJECTILE_WIDTH = 3 // pixels

export default function Projectile({
  id,
  startX,
  startY,
  endX,
  endY,
  angleDeg,
  color,
  durationMs,
  onComplete,
  lengthPx,
  thicknessPx,
  glow,
}: ProjectileProps) {
  const translateX = useRef(new Animated.Value(startX)).current
  const translateY = useRef(new Animated.Value(startY)).current

  useEffect(() => {
    // Animate the projectile from start to end
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration: durationMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration: durationMs,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onComplete when animation finishes
      onComplete(id)
    })
  }, [id, startX, startY, endX, endY, durationMs, onComplete, translateX, translateY])

  // Use provided dimensions or defaults
  const projectileLength = lengthPx ?? PROJECTILE_LENGTH
  const projectileWidth = thicknessPx ?? PROJECTILE_WIDTH
  const borderRadius = projectileWidth / 2

  // Calculate glow effect styles
  const glowStyles = glow
    ? {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5, // For Android
      }
    : {}

  return (
    <Animated.View
      style={[
        styles.projectile,
        {
          backgroundColor: color,
          width: projectileLength,
          height: projectileWidth,
          borderRadius,
          // Anchor the bolt so it extends forward from the start point
          // The bolt rotates around its center, but we want it to appear
          // to shoot from the player toward the monster, so we offset it
          // by half its length in the negative X direction (before rotation)
          transform: [
            { translateX },
            { translateY },
            { translateX: -projectileLength / 2 }, // Anchor offset
            { rotate: `${angleDeg}deg` },
            { translateX: projectileLength / 2 }, // Restore after rotation
          ],
          ...glowStyles,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  projectile: {
    position: 'absolute',
    borderRadius: 1.5,
  },
})
