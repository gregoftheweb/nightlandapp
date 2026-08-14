// app/sub-games/_shared/BottomActionBar.tsx
// Reusable bottom action bar component for sub-game screens

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

interface BottomActionBarProps {
  children: React.ReactNode
  style?: ViewStyle
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
  return <View style={[styles.container, style]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
})
