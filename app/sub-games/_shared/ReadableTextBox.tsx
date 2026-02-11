import React, { ReactNode } from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { subGameTheme } from './subGameTheme'

interface ReadableTextBoxProps {
  children: ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
}

/**
 * ReadableTextBox - Shared component for narrative/description text across sub-games
 * 
 * Provides consistent readable text treatment with:
 * - Dark translucent background for readability
 * - Blue border with rounded corners
 * - Shadow/glow effect
 * - Proper padding and spacing
 * 
 * Based on Hermit Hollow conversation text style (the source of truth)
 */
export function ReadableTextBox({ children, style, textStyle }: ReadableTextBoxProps) {
  return (
    <View style={[styles.textBox, style]}>
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  textBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    padding: 20,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: subGameTheme.white,
    lineHeight: 28,
    textAlign: 'left',
  },
})
