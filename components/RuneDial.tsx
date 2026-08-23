import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'

export type RuneDialDirection = 'CW' | 'CCW'

const NUMBER_MARKERS = 12
const TICK_MARKS = 8
const DIAL_ORIENTATION_OFFSET = -Math.PI / 2
const TICK_ANIMATION_DURATION = 150
const TAU = 2 * Math.PI
const MAX_ANIMATED_TURNS = 100

const positionToAngle = (position: number, totalPositions: number) =>
  (position / totalPositions) * TAU

const positionToDisplayAngle = (position: number, totalPositions: number) =>
  -positionToAngle(position, totalPositions) + DIAL_ORIENTATION_OFFSET

const stepPosition = (current: number, direction: RuneDialDirection, totalPositions: number) => {
  const delta = direction === 'CW' ? -1 : 1
  return (current + delta + totalPositions) % totalPositions
}

const getDialSize = (width: number, height: number) => {
  const aspectRatio = height / width
  const minDimension = Math.min(width, height)

  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) return Math.min(minDimension * 0.5, 250)
  if (aspectRatio > 1.1) return Math.min(width * 0.65, 280)
  return Math.min(height * 0.6, 280)
}

export interface RuneDialProps {
  currentPosition: number
  totalPositions: number
  onPositionChange: (position: number, direction: RuneDialDirection) => void
  labels?: readonly string[]
}

export function RuneDial({
  currentPosition,
  totalPositions,
  onPositionChange,
  labels,
}: RuneDialProps) {
  if (!Number.isInteger(totalPositions) || totalPositions < 2) {
    throw new Error('RuneDial totalPositions must be an integer of at least 2')
  }

  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window')
    return { width: window.width, height: window.height }
  })
  const dialSize = getDialSize(dimensions.width, dimensions.height)

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height })
    })
    return () => subscription?.remove()
  }, [])

  const displayAngleAnimated = useRef(
    new Animated.Value(positionToDisplayAngle(currentPosition, totalPositions))
  ).current
  const displayAngleRef = useRef(positionToDisplayAngle(currentPosition, totalPositions))
  const pendingPositionRef = useRef<number | null>(null)

  useEffect(() => {
    if (pendingPositionRef.current === currentPosition) {
      pendingPositionRef.current = null
      return
    }

    const restoredAngle = positionToDisplayAngle(currentPosition, totalPositions)
    displayAngleRef.current = restoredAngle
    displayAngleAnimated.setValue(restoredAngle)
  }, [currentPosition, displayAngleAnimated, totalPositions])

  const rotateOneStep = (direction: RuneDialDirection) => {
    const newPosition = stepPosition(currentPosition, direction, totalPositions)
    pendingPositionRef.current = newPosition
    onPositionChange(newPosition, direction)

    const displayStep = TAU / totalPositions
    const targetDisplayAngle =
      displayAngleRef.current + (direction === 'CW' ? displayStep : -displayStep)
    displayAngleRef.current = targetDisplayAngle

    Animated.timing(displayAngleAnimated, {
      toValue: targetDisplayAngle,
      duration: TICK_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start()
  }

  const rotationInterpolated = displayAngleAnimated.interpolate({
    inputRange: [-TAU * MAX_ANIMATED_TURNS, TAU * MAX_ANIMATED_TURNS],
    outputRange: ['-36000deg', '36000deg'],
  })

  const markerCount = Math.min(NUMBER_MARKERS, totalPositions)
  const markers = Array.from({ length: markerCount }, (_, index) => {
    const position = Math.round(index * (totalPositions / markerCount)) % totalPositions
    const angleRad = (position / totalPositions) * TAU - DIAL_ORIENTATION_OFFSET
    const angle = (angleRad * 180) / Math.PI
    const label = labels?.[position] ?? String(position)

    return (
      <Animated.View
        key={position}
        style={[
          styles.marker,
          {
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -(dialSize / 2 - 20) },
              { rotate: `${-angle}deg` },
              {
                rotate: displayAngleAnimated.interpolate({
                  inputRange: [-TAU * MAX_ANIMATED_TURNS, TAU * MAX_ANIMATED_TURNS],
                  outputRange: ['36000deg', '-36000deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.markerText}>{label}</Text>
      </Animated.View>
    )
  })

  return (
    <View style={styles.outerContainer}>
      <Pressable
        onPress={() => rotateOneStep('CW')}
        style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Rotate clockwise"
        accessibilityHint="Moves to the previous position"
      >
        <Text style={styles.controlButtonText}>\u21BB</Text>
      </Pressable>

      <View style={styles.container}>
        <View style={styles.fixedIndicator} pointerEvents="none">
          <View style={styles.indicatorTriangle} />
        </View>
        <View style={[styles.dial, { width: dialSize, height: dialSize }]}>
          <View style={styles.dialBackground}>
            <View style={styles.outerRing} />
            <Animated.View
              style={[styles.innerDial, { transform: [{ rotate: rotationInterpolated }] }]}
            >
              <View style={styles.markersContainer}>{markers}</View>
              {Array.from({ length: TICK_MARKS }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.tickMark,
                    {
                      transform: [
                        { rotate: `${index * (360 / TICK_MARKS)}deg` },
                        { translateY: -(dialSize / 2 - 40) },
                      ],
                    },
                  ]}
                />
              ))}
            </Animated.View>
            <View style={styles.center} pointerEvents="none">
              <Text style={styles.currentPosition}>
                {labels?.[currentPosition] ?? String(currentPosition)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => rotateOneStep('CCW')}
        style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Rotate counter-clockwise"
        accessibilityHint="Moves to the next position"
      >
        <Text style={styles.controlButtonText}>\u21BA</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
  },
  controlButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#8d8d8d',
    backgroundColor: '#242424',
  },
  controlButtonPressed: { opacity: 0.6 },
  controlButtonText: { color: '#f2f2f2', fontSize: 40 },
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fixedIndicator: { position: 'absolute', top: 20, zIndex: 10, alignItems: 'center' },
  indicatorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f2f2f2',
  },
  dial: {
    borderRadius: 1000,
    backgroundColor: '#202020',
    borderWidth: 4,
    borderColor: '#8d8d8d',
  },
  dialBackground: {
    flex: 1,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#666',
  },
  markersContainer: { position: 'absolute', width: '100%', height: '100%' },
  marker: { position: 'absolute', left: '50%', top: '50%', marginLeft: -15, marginTop: -10 },
  markerText: {
    fontSize: 16,
    color: '#f2f2f2',
    textAlign: 'center',
    fontFamily: 'NotoSansRunic',
    transform: [{ rotate: '-90deg' }],
  },
  innerDial: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#666',
    left: '50%',
    top: '50%',
    marginLeft: -1,
    marginTop: -4,
  },
  center: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#303030',
    borderWidth: 3,
    borderColor: '#8d8d8d',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  currentPosition: { fontSize: 24, color: '#f2f2f2', fontFamily: 'NotoSansRunic' },
})
