// components/effects/TeleportFlash.tsx
import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'

const FLASH_SIZE = 80 // Base size in pixels

interface TeleportFlashProps {
  id: string
  gridCol: number // Grid column position
  gridRow: number // Grid row position
  cellSize: number // Size of each grid cell in pixels
  cameraOffsetX: number // Camera offset X
  cameraOffsetY: number // Camera offset Y
  onComplete: (id: string) => void
}

/**
 * TeleportFlash - A visual effect for teleportation
 * 
 * Displays a bright radial flash that expands and fades out.
 * Used when the player uses the Jaunt ability to teleport.
 * 
 * Animation:
 * - Starts small (scale 0.4) and bright (opacity 0.9)
 * - Expands to scale 2.2 while fading to transparent
 * - Duration: 400ms
 * - Uses native driver for performance
 */
export default function TeleportFlash({
  id,
  gridCol,
  gridRow,
  cellSize,
  cameraOffsetX,
  cameraOffsetY,
  onComplete,
}: TeleportFlashProps) {
  const scale = useRef(new Animated.Value(0.4)).current
  const opacity = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Run parallel animation for scale and opacity
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 2.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onComplete when animation finishes
      onComplete(id)
    })
  }, [id, scale, opacity, onComplete])

  // Convert grid coordinates to screen coordinates
  const screenCol = gridCol - cameraOffsetX
  const screenRow = gridRow - cameraOffsetY
  const x = screenCol * cellSize + cellSize / 2 // Center on cell
  const y = screenRow * cellSize + cellSize / 2 // Center on cell

  return (
    <Animated.View
      style={[
        styles.flash,
        {
          left: x,
          top: y,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  flash: {
    position: 'absolute',
    width: FLASH_SIZE,
    height: FLASH_SIZE,
    // Center the flash on the coordinate
    marginLeft: -FLASH_SIZE / 2,
    marginTop: -FLASH_SIZE / 2,
    borderRadius: FLASH_SIZE / 2, // Make it circular
    backgroundColor: '#B0E0E6', // Pale cyan-blue
    shadowColor: '#00FFFF', // Cyan glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10, // For Android shadow
  },
})
