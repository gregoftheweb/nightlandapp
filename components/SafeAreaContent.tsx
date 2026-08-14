import React from 'react'
import { StyleProp, StyleSheet, ViewProps, ViewStyle } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'

interface SafeAreaContentProps {
  children: React.ReactNode
  edges?: Edge[]
  onTouchStart?: ViewProps['onTouchStart']
  style?: StyleProp<ViewStyle>
}

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left']

/** Keeps interactive content inside system insets while its parent background stays edge-to-edge. */
export function SafeAreaContent({
  children,
  edges = ALL_EDGES,
  onTouchStart,
  style,
}: SafeAreaContentProps) {
  return (
    <SafeAreaView edges={edges} onTouchStart={onTouchStart} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
