// components/effects/VictoryPopup.tsx
import React, { useEffect, useRef } from 'react'
import { Animated, ImageSourcePropType, StyleSheet } from 'react-native'

const FADE_MS = 300
const HOLD_MS = 1900
// Total on-screen time is FADE_MS + HOLD_MS + FADE_MS = 2500ms.

interface VictoryPopupProps {
  id: string
  image: ImageSourcePropType
  onComplete: (id: string) => void
}

/**
 * VictoryPopup - a short, auto-dismissing celebration image shown after a
 * melee kill that ends combat. Purely decorative: fades in, holds, fades
 * out, then calls onComplete so the caller can remove it from state.
 *
 * Deliberately NOT a <Modal> - a transparent RN Modal still captures all
 * touch input on its own native layer, which silently blocked tap-to-move
 * for the whole 2.5s this was on screen. This is a plain, non-interactive
 * (`pointerEvents="none"`) absolute overlay instead, same idiom as
 * TeleportFlash/CombatDialog elsewhere in GameBoard, so movement taps pass
 * straight through to the board underneath while it plays.
 */
export default function VictoryPopup({ id, image, onComplete }: VictoryPopupProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
    ])
    sequence.start(() => onComplete(id))
    return () => sequence.stop()
  }, [id, opacity, onComplete])

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.Image source={image} resizeMode="contain" style={styles.image} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  image: {
    width: 260,
    height: 146, // 640:360 source ratio
  },
})
