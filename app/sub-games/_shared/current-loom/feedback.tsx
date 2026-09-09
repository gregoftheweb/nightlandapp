import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import {
  getPlayerHealthDisplay,
  getPlayerHealthPercentage,
  type PlayerHealthDisplay,
} from '@modules/playerHealthDisplay'

export const CURRENT_LOOM_BUZZ_AMPLITUDE = 4
export const CURRENT_LOOM_BUZZ_STEP_MS = 25
export const CURRENT_LOOM_COMPLETION_FADE_MS = 2500

export function useCurrentLoomBuzz(active: boolean): Animated.Value {
  const shakeX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active) {
      shakeX.stopAnimation()
      shakeX.setValue(0)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: -CURRENT_LOOM_BUZZ_AMPLITUDE,
          duration: CURRENT_LOOM_BUZZ_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: CURRENT_LOOM_BUZZ_AMPLITUDE,
          duration: CURRENT_LOOM_BUZZ_STEP_MS,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()

    return () => {
      animation.stop()
      shakeX.setValue(0)
    }
  }, [active, shakeX])

  return shakeX
}

export function CurrentLoomEdgeGlow({ display }: { display: PlayerHealthDisplay }) {
  const opacity = useRef(new Animated.Value(display.glow.minOpacity)).current

  useEffect(() => {
    opacity.setValue(display.glow.minOpacity)
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: display.glow.maxOpacity,
          duration: display.glow.halfCycleMs,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: display.glow.minOpacity,
          duration: display.glow.halfCycleMs,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [display, opacity])

  const edgeStyle = { backgroundColor: display.color }
  const thickness = display.glow.thickness
  return (
    <Animated.View
      pointerEvents="none"
      testID="current-loom-edge-glow"
      accessibilityLabel={`Current danger: ${display.band}`}
      style={[styles.glowFrame, { opacity }]}
    >
      <View style={[styles.horizontalEdge, edgeStyle, { height: thickness, top: 0 }]} />
      <View style={[styles.horizontalEdge, edgeStyle, { height: thickness, bottom: 0 }]} />
      <View style={[styles.verticalEdge, edgeStyle, { width: thickness, left: 0 }]} />
      <View style={[styles.verticalEdge, edgeStyle, { width: thickness, right: 0 }]} />
    </Animated.View>
  )
}

export function CurrentLoomCompletionGlow({ onComplete }: { onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: CURRENT_LOOM_COMPLETION_FADE_MS,
      useNativeDriver: true,
    })
    animation.start(({ finished }) => {
      if (finished) onComplete()
    })
    return () => animation.stop()
  }, [onComplete, opacity])

  return (
    <Animated.View
      testID="current-loom-completion-glow"
      accessibilityLabel="Current-Loom aligned"
      style={[styles.completionGlow, { opacity }]}
    />
  )
}

export function CurrentLoomHealthBar({ currentHP, maxHP }: { currentHP: number; maxHP: number }) {
  const percentage = getPlayerHealthPercentage(currentHP, maxHP)
  const display = getPlayerHealthDisplay(currentHP, maxHP)

  return (
    <View style={styles.healthHud} testID="current-loom-health-bar">
      <Text style={styles.healthLabel}>
        HP {Math.max(0, currentHP)}/{maxHP}
      </Text>
      <View style={styles.healthTrack}>
        <View
          testID="current-loom-health-fill"
          accessibilityLabel={`Health: ${display.band}`}
          style={[
            styles.healthFill,
            { width: `${percentage * 100}%`, backgroundColor: display.color },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  glowFrame: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
  completionGlow: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    backgroundColor: '#00ff66',
  },
  horizontalEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  verticalEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  healthHud: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: 'rgba(1, 8, 15, 0.82)',
    zIndex: 25,
  },
  healthLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  healthTrack: {
    height: 12,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  healthFill: {
    height: '100%',
  },
})
