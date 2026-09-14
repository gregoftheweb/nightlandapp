// components/effects/VictoryPopup.tsx
import React, { useEffect, useRef } from 'react'
import { Animated, ImageSourcePropType, Modal, StyleSheet } from 'react-native'
import { SafeAreaContent } from '../SafeAreaContent'

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
 * Modeled on TeleportFlash's timer + onComplete self-dismiss idiom, but as a
 * full-screen centered overlay (like InfoBox's wrapper) instead of a
 * grid-positioned sprite. Not InfoBox itself - this has no header, close
 * button, or CTA, and never waits for a tap.
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
    <Modal transparent visible animationType="none">
      <SafeAreaContent style={styles.overlay}>
        <Animated.Image source={image} resizeMode="contain" style={[styles.image, { opacity }]} />
      </SafeAreaContent>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  image: {
    width: 260,
    height: 146, // 640:360 source ratio
  },
})
