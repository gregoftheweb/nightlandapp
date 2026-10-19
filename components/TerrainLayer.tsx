import React from 'react'
import { Image } from 'react-native'
import type { TerrainRegion } from '@config/types'
import type { GameViewport } from '@modules/viewport'

export function TerrainLayer({
  regions,
  cameraOffset,
  viewport,
  cellSize,
}: {
  regions: readonly TerrainRegion[]
  cameraOffset: { offsetX: number; offsetY: number }
  viewport: GameViewport
  cellSize: number
}) {
  return (
    <>
      {regions.map((r) => {
        const row = r.position.row - cameraOffset.offsetY,
          col = r.position.col - cameraOffset.offsetX
        if (
          row + r.height <= 0 ||
          col + r.width <= 0 ||
          row >= viewport.rows ||
          col >= viewport.cols
        )
          return null
        return (
          <Image
            key={r.id}
            accessibilityLabel={r.name}
            source={r.image}
            resizeMode="stretch"
            style={{
              position: 'absolute',
              left: col * cellSize,
              top: row * cellSize,
              width: r.width * cellSize,
              height: r.height * cellSize,
              zIndex: 0,
            }}
          />
        )
      })}
    </>
  )
}
