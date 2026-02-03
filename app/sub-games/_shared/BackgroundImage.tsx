import React, { useRef, useState } from 'react'
import { View, Image, StyleSheet, ImageSourcePropType, LayoutChangeEvent } from 'react-native'

const puzzleBackground = require('@assets/images/backgrounds/subgames/sub-game-background.webp')

interface BackgroundImageProps {
  source?: ImageSourcePropType
  children: React.ReactNode
  overlayOpacity?: number
  contentContainerStyle?: object
  foregroundFit?: 'cover' | 'contain'
}

export function BackgroundImage({
  source,
  children,
  overlayOpacity = 0.45,
  contentContainerStyle,
  foregroundFit = 'cover',
}: BackgroundImageProps) {
  const locked = useRef(false)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  const onLayout = (e: LayoutChangeEvent) => {
    if (locked.current) return

    const { width, height } = e.nativeEvent.layout

    // Guard against transient 0x0 layouts (rare but can happen during mount)
    if (width <= 0 || height <= 0) {
      if (__DEV__)
        console.warn('[BackgroundImage] onLayout returned non-positive size', { width, height })
      return
    }

    locked.current = true
    setSize({ w: width, h: height })

    if (__DEV__) console.log('[BackgroundImage] locked size', { width, height })
  }

  // Determine if we're in portrait mode (height > width)
  // Default to false before layout completes - will use foregroundFit prop initially
  const isPortrait = size ? size.h > size.w : false

  // For portrait screens, use 'contain' to respect full width and center vertically
  // For square/landscape screens, keep using the foregroundFit prop (default 'cover')
  const effectiveResizeMode = isPortrait ? 'contain' : foregroundFit

  const fillLocked = size
    ? { position: 'absolute' as const, left: 0, top: 0, width: size.w, height: size.h }
    : styles.fill

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Image source={puzzleBackground} style={fillLocked} resizeMode="cover" fadeDuration={0} />

      {source ? (
        <Image
          source={source}
          style={fillLocked}
          resizeMode={effectiveResizeMode}
          fadeDuration={0}
          onLoadEnd={() => {
            if (__DEV__) console.log('[BackgroundImage] foreground loaded')
          }}
        />
      ) : null}

      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />

      <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  fill: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  contentContainer: { flex: 1, zIndex: 20 },
})
