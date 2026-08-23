import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import {
  HiddenImagePreloader,
  type ImagePreloadAsset,
  type ImagePreloadResult,
} from '../preload/HiddenImagePreloader'

export const GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS = 10_000

export interface GameBoardImageAsset extends ImagePreloadAsset {
  source: ImageSourcePropType
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

export type GameBoardImagePreloadResult = ImagePreloadResult

interface GameBoardImagePreloaderProps {
  onReady: (result: GameBoardImagePreloadResult) => void
  timeoutMs?: number
}

export function GameBoardImagePreloader({
  onReady,
  timeoutMs = GAMEBOARD_IMAGE_PRELOAD_TIMEOUT_MS,
}: GameBoardImagePreloaderProps) {
  return (
    <HiddenImagePreloader
      assets={GAMEBOARD_IMAGE_ASSETS}
      onReady={onReady}
      timeoutMs={timeoutMs}
      testIDPrefix="gameboard-preload"
      warningPrefix="[startup]"
    />
  )
}
