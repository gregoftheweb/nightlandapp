// app/sub-games/_shared/BottomActionBar.tsx
// Reusable bottom action bar component for sub-game screens

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomActionBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A bottom action bar that positions children at the bottom of the screen
 * with proper safe area padding.
 * 
 * Usage:
 * - Pass buttons as children
 * - For side-by-side layout, wrap buttons in a horizontal View with flex
 * - For stacked layout, pass buttons directly
 */
export function BottomActionBar({ children, style }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, 16) },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
