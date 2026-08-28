import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type GestureResponderEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { GameBoardZoomLevel } from '@modules/gameboardZoom'

interface GameBoardZoomControlsProps {
  zoomLevel: GameBoardZoomLevel
  onZoomIn: () => void
  onZoomOut: () => void
}

export default React.memo(function GameBoardZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
}: GameBoardZoomControlsProps) {
  const insets = useSafeAreaInsets()

  const handlePress =
    (callback: () => void) =>
    (event: GestureResponderEvent): void => {
      event.stopPropagation()
      callback()
    }

  return (
    <View style={[styles.container, { right: insets.right + 10 }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress(onZoomIn)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        testID="gameboard-zoom-in"
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
      <Text style={styles.label} testID="gameboard-zoom-level">
        {zoomLevel}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress(onZoomOut)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        testID="gameboard-zoom-out"
      >
        <Text style={styles.buttonText}>-</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -65 }],
    alignItems: 'center',
    gap: 7,
    zIndex: 1100,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#990000',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
    textAlign: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
})
