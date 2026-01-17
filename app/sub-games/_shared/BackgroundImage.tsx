// app/sub-games/_shared/BackgroundImage.tsx
// Reusable background image container with dark overlay for better text readability

import React from 'react';
import { View, ImageBackground, StyleSheet, ImageSourcePropType } from 'react-native';

interface BackgroundImageProps {
  source: ImageSourcePropType;
  children: React.ReactNode;
  overlayOpacity?: number;
}

/**
 * BackgroundImage component wraps content with a full-screen background image
 * and an optional semi-transparent dark overlay for improved text readability.
 * 
 * @param source - Image source (use require() for static assets)
 * @param children - Content to render above the background
 * @param overlayOpacity - Opacity of the dark overlay (default: 0.45)
 */
export function BackgroundImage({ 
  source, 
  children, 
  overlayOpacity = 0.45 
}: BackgroundImageProps) {
  return (
    <ImageBackground
      source={source}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark overlay for better text contrast */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />
      
      {/* Content container */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
  },
});
