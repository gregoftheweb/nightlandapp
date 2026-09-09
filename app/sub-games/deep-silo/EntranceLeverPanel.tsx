import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import {
  EntranceLeverArt,
  LEVER_LIGHT_POSITIONS,
  LEVER_SWITCH_LIGHT_POSITION,
} from './EntranceLeverArt'

export const EXTERIOR_LEVER_FRAME_MS = [1200, 350, 350, 350, 1400] as const
export const EXTERIOR_LEVER_FRAMES = [
  require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-1.webp'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-2.webp'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-3.webp'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-4.webp'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-5.webp'),
]

interface LeverLightsProps {
  count: number
  unlocked: boolean
}

export function LeverLights({ count, unlocked }: LeverLightsProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {LEVER_LIGHT_POSITIONS.map((position, index) => {
        const lit = index >= LEVER_LIGHT_POSITIONS.length - count
        return (
          <View
            key={index}
            testID={`loom-light-${index}`}
            accessibilityState={{ selected: lit }}
            style={[
              styles.light,
              { left: `${position.x * 100}%`, top: `${position.y * 100}%` },
              lit ? styles.lightOn : styles.lightOff,
            ]}
          />
        )
      })}
      <View
        testID="switch-indicator-light"
        accessibilityState={{ selected: unlocked }}
        style={[
          styles.switchLight,
          {
            left: `${LEVER_SWITCH_LIGHT_POSITION.x * 100}%`,
            top: `${LEVER_SWITCH_LIGHT_POSITION.y * 100}%`,
          },
          unlocked ? styles.switchOn : styles.switchOff,
        ]}
      />
    </View>
  )
}

interface EntranceLeverAnimationProps {
  onComplete: () => void
}

export function EntranceLeverAnimation({ onComplete }: EntranceLeverAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let next = 1; next < EXTERIOR_LEVER_FRAMES.length; next += 1) {
      elapsed += EXTERIOR_LEVER_FRAME_MS[next - 1]
      timers.push(setTimeout(() => setFrameIndex(next), elapsed))
    }
    elapsed += EXTERIOR_LEVER_FRAME_MS[EXTERIOR_LEVER_FRAME_MS.length - 1]
    timers.push(setTimeout(() => onCompleteRef.current(), elapsed))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <Image
      testID={`lever-animation-frame-${frameIndex + 1}`}
      source={EXTERIOR_LEVER_FRAMES[frameIndex]}
      style={styles.animationFrame}
      resizeMode="contain"
      fadeDuration={0}
    />
  )
}

export interface DeepSiloPanelViewProps {
  loomCount: number
  switchThrown: boolean
  animating: boolean
  completionFlashNonce?: number
  onBack: () => void
  onEnter: () => void
  onThrow: () => void
  onAnimationComplete: () => void
  onDevIncrement: () => void
  showDevtool?: boolean
}

export function DeepSiloPanelView(props: DeepSiloPanelViewProps) {
  const unlocked = props.loomCount === 5
  const source = props.switchThrown ? EXTERIOR_LEVER_FRAMES[4] : EXTERIOR_LEVER_FRAMES[0]
  const flashOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!props.completionFlashNonce) return
    flashOpacity.stopAnimation()
    flashOpacity.setValue(0)
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.18,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start()
  }, [flashOpacity, props.completionFlashNonce])

  return (
    <View style={styles.container}>
      <EntranceLeverArt source={source}>
        {props.animating ? (
          <>
            <EntranceLeverAnimation onComplete={props.onAnimationComplete} />
            <LeverLights count={5} unlocked />
          </>
        ) : (
          <LeverLights
            count={props.switchThrown ? 5 : props.loomCount}
            unlocked={unlocked || props.switchThrown}
          />
        )}
      </EntranceLeverArt>
      {!props.animating ? (
        <BottomActionBar>
          <View style={styles.actions}>
            {props.switchThrown ? (
              <Action label="Enter the Deep Silo" onPress={props.onEnter} primary />
            ) : unlocked ? (
              <Action label="Throw the switch" onPress={props.onThrow} primary />
            ) : null}
            <Action label="Back" onPress={props.onBack} />
            {props.showDevtool ? (
              <Action
                label="DEV: +1 Loom Online"
                onPress={props.onDevIncrement}
                testID="deep-silo-dev-increment"
              />
            ) : null}
          </View>
        </BottomActionBar>
      ) : null}
      <Animated.View
        pointerEvents="none"
        testID="deep-silo-completion-flash"
        style={[styles.completionFlash, { opacity: flashOpacity }]}
      />
    </View>
  )
}

function Action({
  label,
  onPress,
  primary,
  testID,
}: {
  label: string
  onPress: () => void
  primary?: boolean
  testID?: string
}) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      style={[styles.button, primary && styles.primary]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050708' },
  completionFlash: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: '#d7ffff',
  },
  animationFrame: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: {
    flexGrow: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#607985',
    backgroundColor: '#1b2932',
  },
  primary: { borderColor: subGameTheme.red, backgroundColor: subGameTheme.blue },
  buttonText: { color: subGameTheme.white, fontFamily: 'Sofia', fontSize: 16, textAlign: 'center' },
  light: {
    position: 'absolute',
    width: '8%',
    aspectRatio: 1,
    marginLeft: '-4%',
    marginTop: '-4%',
    borderRadius: 999,
    borderWidth: 2,
  },
  lightOn: {
    backgroundColor: '#66f6ff',
    borderColor: '#d7ffff',
    shadowColor: '#66f6ff',
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  lightOff: { backgroundColor: 'rgba(12,18,18,0.78)', borderColor: '#475355' },
  switchLight: {
    position: 'absolute',
    width: '5.5%',
    aspectRatio: 1,
    marginLeft: '-2.75%',
    marginTop: '-2.75%',
    borderRadius: 999,
    borderWidth: 2,
  },
  switchOn: { backgroundColor: '#46e66b', borderColor: '#caffd2' },
  switchOff: { backgroundColor: '#b72525', borderColor: '#ff9b8f' },
})
