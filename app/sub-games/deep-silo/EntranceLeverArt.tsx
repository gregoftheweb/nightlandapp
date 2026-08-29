import React, { type ReactNode, useState } from 'react'
import {
  Image,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native'

export const LEVER_ART_WIDTH = 896
export const LEVER_ART_HEIGHT = 1200

export const LEVER_LIGHT_POSITIONS = [
  { x: 0.282, y: 0.187 },
  { x: 0.282, y: 0.342 },
  { x: 0.282, y: 0.498 },
  { x: 0.282, y: 0.652 },
  { x: 0.282, y: 0.807 },
] as const
export const LEVER_SWITCH_LIGHT_POSITION = { x: 0.855, y: 0.365 } as const

interface EntranceLeverArtProps {
  source: ImageSourcePropType
  children?: ReactNode
}

export function containedPortraitRect(width: number, height: number) {
  const scale = Math.min(width / LEVER_ART_WIDTH, height / LEVER_ART_HEIGHT)
  const actualWidth = LEVER_ART_WIDTH * scale
  const actualHeight = LEVER_ART_HEIGHT * scale
  return {
    width: actualWidth,
    height: actualHeight,
    left: (width - actualWidth) / 2,
    top: (height - actualHeight) / 2,
  }
}

export function EntranceLeverArt({ source, children }: EntranceLeverArtProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const rect = containedPortraitRect(viewport.width, viewport.height)
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setViewport({ width, height })
  }

  return (
    <View style={styles.viewport} onLayout={onLayout} testID="deep-silo-lever-viewport">
      {rect.width > 0 ? (
        <>
          <Image
            testID="deep-silo-lever-image"
            source={source}
            style={[styles.image, rect]}
            resizeMode="contain"
            fadeDuration={0}
          />
          <View style={[styles.art, rect]} testID="deep-silo-lever-art">
            {children}
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#050708' },
  art: { position: 'absolute' },
  image: { position: 'absolute' },
})
