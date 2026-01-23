// app/sub-games/_shared/BackgroundImage.tsx
// Reusable background image container with dark overlay for better text readability
//
// Layout Behavior:
// - Base layer: Always shows puzzle-background.png texture (full screen, cover mode)
// - Foreground layer: Optional screen-specific image, always sized to screen width
//   with height calculated from aspect ratio, centered vertically
// - Overlay: Semi-transparent dark layer for text readability (above both backgrounds)
// - Content: Children render on top of everything
//
// Image Sizing:
// - Width is always set to screen width
// - Height is calculated from intrinsic aspect ratio
// - If image is shorter than screen: vertically centered with letterbox areas showing
//   puzzle background
// - If image is taller than screen: vertically centered, overflow parts are clipped
//   (center portion visible)

import React, { useMemo } from 'react'
import {
  View,
  Image,
  ImageBackground,
  StyleSheet,
  ImageSourcePropType,
  useWindowDimensions,
} from 'react-native'

const puzzleBackground = require('@/assets/images/sub-game-background.png')

interface BackgroundImageProps {
  source?: ImageSourcePropType
  children: React.ReactNode
  overlayOpacity?: number
  contentContainerStyle?: object
  foregroundFit?: 'screenWidthCenter' | 'cover' | 'contain'
}

/**
 * BackgroundImage component wraps content with dual-layer backgrounds:
 * 1. Base texture (puzzle-background.png) - always visible
 * 2. Optional foreground image - sized to screen width, preserving aspect ratio
 *
 * @param source - Optional foreground image source (use require() for static assets)
 * @param children - Content to render above the backgrounds
 * @param overlayOpacity - Opacity of the dark overlay (default: 0.45)
 * @param contentContainerStyle - Optional additional styles for content container
 * @param foregroundFit - How to fit foreground image (default: 'screenWidthCenter')
 */
export function BackgroundImage({
  source,
  children,
  overlayOpacity = 0.45,
  contentContainerStyle,
  foregroundFit = 'screenWidthCenter',
}: BackgroundImageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  // Calculate foreground image dimensions - memoized to prevent recalculation
  const foregroundStyle = useMemo(() => {
    if (source && foregroundFit === 'screenWidthCenter') {
      try {
        // Get intrinsic dimensions of the foreground image
        const resolved = Image.resolveAssetSource(source)
        if (resolved && resolved.width && resolved.height) {
          const aspectRatio = resolved.width / resolved.height

          // Always size to screen width, compute height from aspect ratio
          const displayedWidth = screenWidth
          const displayedHeight = displayedWidth / aspectRatio

          // Always center vertically
          // If taller than screen, parts will be cut off (overflow hidden by container)
          // If shorter than screen, letterbox areas show puzzle background
          return {
            width: displayedWidth,
            height: displayedHeight,
            position: 'absolute' as const,
            left: 0,
            top: (screenHeight - displayedHeight) / 2,
          }
        }
      } catch (error) {
        // If we can't resolve dimensions, fall back to cover mode
        console.warn('[BackgroundImage] Could not resolve image dimensions, using cover mode', error)
      }
    }
    return {}
  }, [source, screenWidth, screenHeight, foregroundFit])

  return (
    <View style={styles.container}>
      {/* Base layer: puzzle background texture - always visible, covers full screen */}
      <ImageBackground 
        source={puzzleBackground} 
        style={styles.baseBackground} 
        resizeMode="cover"
        fadeDuration={0}
      />

      {/* Foreground layer: screen-specific image (optional) */}
      {source &&
        (foregroundFit === 'screenWidthCenter' && Object.keys(foregroundStyle).length > 0 ? (
          <Image
            source={source}
            style={[styles.foregroundImage, foregroundStyle]}
            resizeMode="contain"
            fadeDuration={0}
          />
        ) : (
          <ImageBackground
            source={source}
            style={styles.baseBackground}
            resizeMode={foregroundFit === 'cover' ? 'cover' : 'contain'}
            fadeDuration={0}
          />
        ))}

      {/* Dark overlay for better text contrast - above both backgrounds */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />

      {/* Content container - above everything */}
      <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  baseBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  foregroundImage: {
    // Position and size set dynamically
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    zIndex: 20,
  },
})
