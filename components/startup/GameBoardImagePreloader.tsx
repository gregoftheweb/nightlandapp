import React, { useCallback, useEffect, useRef } from 'react'
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native'

export const GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS = 10_000

export interface GameBoardImageAsset {
  id: string
  source: ImageSourcePropType
  width: number
  height: number
}

export const GAMEBOARD_IMAGE_ASSETS: readonly GameBoardImageAsset[] = Object.freeze([
  {
    id: 'encounter-jaunt-cave',
    source: require('@assets/images/sprites/buildings/jaunt-cave.webp'),
    width: 1024,
    height: 1024,
  },
  {
    id: 'encounter-word-grid',
    source: require('@assets/images/sprites/buildings/tesseract-puzzle1.webp'),
    width: 256,
    height: 384,
  },
  {
    id: 'encounter-rune-obelisk',
    source: require('@assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp'),
    width: 1408,
    height: 768,
  },
  {
    id: 'encounter-aero-wreckage',
    source: require('@assets/images/sprites/buildings/aero-wreckage.webp'),
    width: 256,
    height: 256,
  },
  {
    id: 'encounter-deep-silo',
    source: require('@assets/images/sprites/buildings/silo.webp'),
    width: 1024,
    height: 1024,
  },
  {
    id: 'encounter-hermit-hollow',
    source: require('@assets/images/backgrounds/subgames/hermit/hermit-save2.webp'),
    width: 256,
    height: 256,
  },
  {
    id: 'building-last-redoubt',
    source: require('@assets/images/sprites/buildings/redoubt2.webp'),
    width: 197,
    height: 160,
  },
  {
    id: 'building-pools',
    source: require('@assets/images/sprites/buildings/poolofpeace.webp'),
    width: 256,
    height: 256,
  },
  {
    id: 'building-cursed-totem',
    source: require('@assets/images/sprites/buildings/cursedtotem.webp'),
    width: 274,
    height: 274,
  },
  {
    id: 'great-power-watcher',
    source: require('@assets/images/sprites/monsters/watcherse.webp'),
    width: 512,
    height: 512,
  },
  {
    id: 'environment-river',
    source: require('@assets/images/sprites/buildings/river1.webp'),
    width: 322,
    height: 275,
  },
  {
    id: 'footsteps-green',
    source: require('@assets/images/items/quest/footprints-green.webp'),
    width: 280,
    height: 1080,
  },
  {
    id: 'footsteps-blue',
    source: require('@assets/images/items/quest/footprints-blue.webp'),
    width: 280,
    height: 1080,
  },
  {
    id: 'footsteps-red',
    source: require('@assets/images/items/quest/footprints-red.webp'),
    width: 280,
    height: 1080,
  },
  {
    id: 'player-christos',
    source: require('@assets/images/sprites/characters/christos.webp'),
    width: 575,
    height: 546,
  },
  {
    id: 'terrain-ground-tile',
    source: require('@assets/images/backgrounds/ui_screens/dark-blue-bg-320.webp'),
    width: 320,
    height: 320,
  },
  {
    id: 'monster-abhuman',
    source: require('@assets/images/sprites/monsters/abhuman.webp'),
    width: 40,
    height: 40,
  },
  {
    id: 'monster-night-hound',
    source: require('@assets/images/sprites/monsters/nighthound4.webp'),
    width: 512,
    height: 512,
  },
  {
    id: 'item-potion',
    source: require('@assets/images/items/consumables/potion.webp'),
    width: 634,
    height: 980,
  },
  {
    id: 'item-short-sword',
    source: require('@assets/images/items/equipment/shortSword.webp'),
    width: 512,
    height: 512,
  },
  {
    id: 'item-maguffin-rock',
    source: require('@assets/images/items/equipment/maguffinRock.webp'),
    width: 100,
    height: 100,
  },
])

export type GameBoardImagePreloadResult = {
  reason: 'loaded' | 'failed' | 'timeout'
  loadedCount: number
  failedIds: string[]
}

interface GameBoardImagePreloaderProps {
  onReady: (result: GameBoardImagePreloadResult) => void
  timeoutMs?: number
}

export function GameBoardImagePreloader({
  onReady,
  timeoutMs = GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS,
}: GameBoardImagePreloaderProps) {
  const onReadyRef = useRef(onReady)
  const loadedIdsRef = useRef(new Set<string>())
  const failedIdsRef = useRef(new Set<string>())
  const completedRef = useRef(false)
  onReadyRef.current = onReady

  const finish = useCallback((reason: GameBoardImagePreloadResult['reason']) => {
    if (completedRef.current) return
    completedRef.current = true
    onReadyRef.current({
      reason,
      loadedCount: loadedIdsRef.current.size,
      failedIds: [...failedIdsRef.current],
    })
  }, [])

  const settleAsset = useCallback(
    (id: string, loaded: boolean) => {
      if (completedRef.current) return
      const settled = loadedIdsRef.current.has(id) || failedIdsRef.current.has(id)
      if (settled) return

      if (loaded) loadedIdsRef.current.add(id)
      else failedIdsRef.current.add(id)

      if (loadedIdsRef.current.size + failedIdsRef.current.size === GAMEBOARD_IMAGE_ASSETS.length) {
        finish(failedIdsRef.current.size > 0 ? 'failed' : 'loaded')
      }
    },
    [finish]
  )

  useEffect(() => {
    const timeout = setTimeout(() => finish('timeout'), timeoutMs)
    return () => clearTimeout(timeout)
  }, [finish, timeoutMs])

  return (
    <View pointerEvents="none" accessibilityElementsHidden style={styles.preloadContainer}>
      {GAMEBOARD_IMAGE_ASSETS.map(({ id, source, width, height }) => (
        <Image
          key={id}
          testID={`gameboard-preload-${id}`}
          source={source}
          style={[styles.preloadImage, { width, height }]}
          fadeDuration={0}
          onLoad={() => settleAsset(id, true)}
          onError={() => {
            console.warn(`[startup] Failed to decode gameboard image '${id}'`)
            settleAsset(id, false)
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  preloadContainer: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  preloadImage: { position: 'absolute' },
})
