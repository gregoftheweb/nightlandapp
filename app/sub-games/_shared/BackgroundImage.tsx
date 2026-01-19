// app/sub-games/_shared/BackgroundImage.tsx
// Reusable background image container with dark overlay for better text readability
//
// Layout Behavior:
// - Base layer: Always shows puzzle-background.png texture (full screen, cover mode)
// - Foreground layer: Optional screen-specific image, sized to match screen width
//   while preserving aspect ratio, centered vertically
// - Overlay: Semi-transparent dark layer for text readability (above both backgrounds)
// - Content: Children render on top of everything
//
// This allows non-portrait images to display without distortion, with the
// puzzle background visible in any letterbox areas.

import React from 'react';
import { View, Image, ImageBackground, StyleSheet, ImageSourcePropType, useWindowDimensions } from 'react-native';

const puzzleBackground = require('@/assets/images/puzzle-background.png');

interface BackgroundImageProps {
  source?: ImageSourcePropType;
  children: React.ReactNode;
  overlayOpacity?: number;
  contentContainerStyle?: object;
  foregroundFit?: 'screenWidthCenter' | 'cover' | 'contain';
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Calculate foreground image dimensions
  let foregroundStyle = {};
  if (source && foregroundFit === 'screenWidthCenter') {
    try {
      // Get intrinsic dimensions of the foreground image
      const resolved = Image.resolveAssetSource(source);
      if (resolved && resolved.width && resolved.height) {
        const aspectRatio = resolved.width / resolved.height;
        
        // Size to screen width, compute height from aspect ratio
        const displayedWidth = screenWidth;
        let displayedHeight = displayedWidth / aspectRatio;
        
        // If image would be taller than screen, clamp to screen height
        // and adjust width accordingly to avoid overflow
        if (displayedHeight > screenHeight) {
          displayedHeight = screenHeight;
          const adjustedWidth = displayedHeight * aspectRatio;
          foregroundStyle = {
            width: adjustedWidth,
            height: displayedHeight,
            position: 'absolute' as const,
            left: (screenWidth - adjustedWidth) / 2,
            top: 0,
          };
        } else {
          // Image fits vertically - center it
          foregroundStyle = {
            width: displayedWidth,
            height: displayedHeight,
            position: 'absolute' as const,
            left: 0,
            top: (screenHeight - displayedHeight) / 2,
          };
        }
      }
    } catch (error) {
      // If we can't resolve dimensions, fall back to cover mode
      console.warn('[BackgroundImage] Could not resolve image dimensions, using cover mode', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Base layer: puzzle background texture - always visible, covers full screen */}
      <ImageBackground
        source={puzzleBackground}
        style={styles.baseBackground}
        resizeMode="cover"
      />

      {/* Foreground layer: screen-specific image (optional) */}
      {source && (
        foregroundFit === 'screenWidthCenter' && Object.keys(foregroundStyle).length > 0 ? (
          <Image
            source={source}
            style={[styles.foregroundImage, foregroundStyle]}
            resizeMode="contain"
          />
        ) : (
          <ImageBackground
            source={source}
            style={styles.baseBackground}
            resizeMode={foregroundFit === 'cover' ? 'cover' : 'contain'}
          />
        )
      )}

      {/* Dark overlay for better text contrast - above both backgrounds */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />
      
      {/* Content container - above everything */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
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
});
