import React, { useMemo, useRef, useState } from 'react'
import { View, Image, StyleSheet, ImageSourcePropType, LayoutChangeEvent } from 'react-native'

const puzzleBackground = require('@assets/images/backgrounds/subgames/sub-game-background.webp')

interface BackgroundImageProps {
  source?: ImageSourcePropType
  children: React.ReactNode
  overlayOpacity?: number
  contentContainerStyle?: object
}

const EDGE_FADE_PX = 20
const CHARCOAL = '18,18,18' // RGB for dark charcoal

export function BackgroundImage({
  source,
  children,
  overlayOpacity = 0.45,
  contentContainerStyle,
}: BackgroundImageProps) {
  const locked = useRef(false)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  const onLayout = (e: LayoutChangeEvent) => {
    if (locked.current) return

    const { width, height } = e.nativeEvent.layout
    if (width <= 0 || height <= 0) return

    locked.current = true
    setSize({ w: width, h: height })
  }

  const fillLocked = size
    ? { position: 'absolute' as const, left: 0, top: 0, width: size.w, height: size.h }
    : styles.fill

  /**
   * Foreground ALWAYS full width
   */
  const foregroundStyle = useMemo(() => {
    if (!size || !source) return fillLocked

    const resolved = Image.resolveAssetSource(source)
    const imgW = resolved?.width ?? 0
    const imgH = resolved?.height ?? 0

    if (imgW <= 0 || imgH <= 0) return fillLocked

    const targetW = size.w
    const targetH = targetW * (imgH / imgW)

    // Center vertically
    const top = (size.h - targetH) / 2

    return {
      position: 'absolute' as const,
      left: 0,
      top,
      width: targetW,
      height: targetH,
    }
  }, [fillLocked, size, source])

  /**
   * Metrics so we know when to draw fades
   */
  const foregroundMetrics = useMemo(() => {
    if (!size || !source) return null

    const resolved = Image.resolveAssetSource(source)
    const imgW = resolved?.width ?? 0
    const imgH = resolved?.height ?? 0
    if (imgW <= 0 || imgH <= 0) return null

    const targetW = size.w
    const targetH = targetW * (imgH / imgW)
    const top = (size.h - targetH) / 2

    return {
      top,
      bottom: top + targetH,
    }
  }, [size, source])

  /**
   * Fade renderer
   */
  const renderEdgeFade = (edgeY: number, direction: 'up' | 'down') => {
    const bandTop = direction === 'up' ? edgeY - EDGE_FADE_PX : edgeY

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: bandTop,
          width: size?.w ?? 0,
          height: EDGE_FADE_PX,
          zIndex: 9,
        }}
      >
        {Array.from({ length: EDGE_FADE_PX }).map((_, i) => {
          const t = direction === 'up' ? i / (EDGE_FADE_PX - 1) : 1 - i / (EDGE_FADE_PX - 1)

          const alpha = 0.85 * t

          return (
            <View
              key={i}
              style={{
                height: 1,
                width: '100%',
                backgroundColor: `rgba(${CHARCOAL},${alpha})`,
              }}
            />
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Base background */}
      <Image source={puzzleBackground} style={fillLocked} resizeMode="cover" fadeDuration={0} />

      {/* Foreground */}
      {source ? (
        <Image source={source} style={foregroundStyle} resizeMode="stretch" fadeDuration={0} />
      ) : null}

      {/* Top / Bottom fade bands */}
      {foregroundMetrics && size ? (
        <>
          {foregroundMetrics.top > 0 ? renderEdgeFade(foregroundMetrics.top, 'up') : null}

          {foregroundMetrics.bottom < size.h
            ? renderEdgeFade(foregroundMetrics.bottom, 'down')
            : null}
        </>
      ) : null}

      {/* Overlay */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />

      {/* Game content */}
      <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  fill: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  contentContainer: { flex: 1, zIndex: 20 },
})
