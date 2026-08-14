// app/sub-games/deep-silo/switch-animation.tsx
import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Image, LayoutChangeEvent, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'

const frames = [
  require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch1.png'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch2.png'),
  require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch3.png'),
]

const IMG_W = 1024
const IMG_H = 1536

// Slow stepped timing
const FRAME_1_HOLD_MS = 1200
const FRAME_2_HOLD_MS = 350
const FRAME_3_HOLD_MS = 1400

// FX timing
const FLASH_IN_MS = 70
const FLASH_OUT_MS = 180
const SHAKE_STEP_MS = 35

export default function SwitchAnimation() {
  const router = useRouter()
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const startedRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const flashOpacity = useRef(new Animated.Value(0)).current
  const shakeX = useRef(new Animated.Value(0)).current
  const shakeY = useRef(new Animated.Value(0)).current

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (!containerSize && width > 0 && height > 0) {
      setContainerSize({ w: width, h: height })
    }
  }

  const imageStyle = containerSize
    ? (() => {
        const w = containerSize.w
        const h = w * (IMG_H / IMG_W)
        const top = (containerSize.h - h) / 2

        return {
          position: 'absolute' as const,
          left: 0,
          top,
          width: w,
          height: h,
        }
      })()
    : null

  const playPowerOnFx = () => {
    flashOpacity.setValue(0)
    shakeX.setValue(0)
    shakeY.setValue(0)

    Animated.parallel([
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.6,
          duration: FLASH_IN_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: FLASH_OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: -3,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 3,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -2,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 2,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(shakeY, {
          toValue: 2,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeY, {
          toValue: -2,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeY, {
          toValue: 1,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeY, {
          toValue: -1,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
        Animated.timing(shakeY, {
          toValue: 0,
          duration: SHAKE_STEP_MS,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      flashOpacity.stopAnimation()
      shakeX.stopAnimation()
      shakeY.stopAnimation()
    }
  }, [flashOpacity, shakeX, shakeY])

  useEffect(() => {
    if (!containerSize || startedRef.current) return
    startedRef.current = true

    setFrameIndex(0)

    const t1 = setTimeout(() => {
      setFrameIndex(1)
    }, FRAME_1_HOLD_MS)

    const t2 = setTimeout(() => {
      setFrameIndex(2)
      playPowerOnFx()
    }, FRAME_1_HOLD_MS + FRAME_2_HOLD_MS)

    const t3 = setTimeout(
      () => {
        router.replace('/sub-games/deep-silo/screen8' as any)
      },
      FRAME_1_HOLD_MS + FRAME_2_HOLD_MS + FRAME_3_HOLD_MS
    )

    timersRef.current.push(t1, t2, t3)
  }, [containerSize, router])

  return (
    <View style={styles.container} onLayout={onLayout}>
      {imageStyle && (
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateX: shakeX }, { translateY: shakeY }],
          }}
        >
          <Image
            source={frames[frameIndex]}
            style={imageStyle}
            resizeMode="stretch"
            fadeDuration={0}
          />

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { opacity: flashOpacity }]}
          />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flashOverlay: {
    backgroundColor: '#9fd8ff',
  },
})
