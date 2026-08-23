import React, { type ReactNode, useState } from 'react'
import { Image, type LayoutChangeEvent, StyleSheet, View } from 'react-native'

const plainImage = require('@assets/images/backgrounds/subgames/rosseta/obelisk-plain.webp')
const electricImage = require('@assets/images/backgrounds/subgames/rosseta/obelisk-electric.webp')

export type ObeliskArtState = 'plain' | 'electric'

interface ObeliskArtProps {
  state: ObeliskArtState
  children?: (imageRect: ObeliskImageRect) => ReactNode
}

export interface ObeliskImageRect {
  actualWidth: number
  actualHeight: number
  offsetX: number
  offsetY: number
}

export function getContainedObeliskRect(width: number, height: number): ObeliskImageRect {
  const actualWidth = width / height > 1 ? height : width
  const actualHeight = actualWidth
  return {
    actualWidth,
    actualHeight,
    offsetX: (width - actualWidth) / 2,
    offsetY: (height - actualHeight) / 2,
  }
}

export function ObeliskArt({ state, children }: ObeliskArtProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const imageRect = getContainedObeliskRect(viewport.width, viewport.height)

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setViewport({ width, height })
  }

  return (
    <View style={styles.viewport} onLayout={handleLayout} testID="obelisk-art-viewport">
      {imageRect.actualWidth > 0 && imageRect.actualHeight > 0 ? (
        <>
          <Image
            testID={`obelisk-background-${state}`}
            source={state === 'electric' ? electricImage : plainImage}
            style={[
              styles.image,
              {
                left: imageRect.offsetX,
                top: imageRect.offsetY,
                width: imageRect.actualWidth,
                height: imageRect.actualHeight,
              },
            ]}
            resizeMode="contain"
            fadeDuration={0}
          />
          <View
            testID="obelisk-overlay-rect"
            style={[
              styles.art,
              {
                left: imageRect.offsetX,
                top: imageRect.offsetY,
                width: imageRect.actualWidth,
                height: imageRect.actualHeight,
              },
            ]}
          >
            {children?.(imageRect)}
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#071018' },
  art: { position: 'absolute' },
  image: { position: 'absolute' },
})
