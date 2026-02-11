// app/sub-games/jaunt-cave/_components/useArenaLayout.ts
// Custom hook for arena layout calculations and positioning logic

import { useState, useCallback, useMemo } from 'react'
import { Image, LayoutChangeEvent } from 'react-native'
import { PositionKey } from './DaemonSprite'

/**
 * Basic helpers (kept local to avoid adding deps)
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * Aspect-aware daemon ground anchor (percentage of the *scaled background* height).
 *
 * Why: resizeMode="cover" + different aspect ratios change what part of the background
 * is visible; a fixed percent can look "too high" on tall screens. This function
 * nudges the anchor lower on tall screens, slightly lower on square screens.
 *
 * Tune points:
 *  - square-ish (aspect ~ 1.0): yAtSquare
 *  - tall phones (aspect ~ 2.0): yAtTall
 */
export function getDaemonAnchorY(arenaWidth: number, arenaHeight: number) {
  const w = Math.max(1, arenaWidth)
  const h = Math.max(1, arenaHeight)
  const aspect = h / w

  // Calibration knobs (tune these values to taste)
  const aspectMin = 1.0 // square baseline
  const aspectMax = 2.0 // tall phone baseline

  // These replace your previous fixed 0.38-ish values.
  // Increase yAtTall to move daemons lower on tall screens.
  // Decrease yAtSquare to move them higher on square screens.
  const yAtSquare = 0.39
  const yAtTall = 0.42

  const t = clamp((aspect - aspectMin) / (aspectMax - aspectMin), 0, 1)
  return lerp(yAtSquare, yAtTall, t)
}

/**
 * X anchors remain constant; Y anchors are computed dynamically (see above).
 * We preserve your prior left-vs-center offset by keeping left slightly higher.
 */
const POSITION_X = {
  left: 0.2,
  center: 0.5,
  right: 0.8,
} as const

const LEFT_Y_DELTA = -0.01 // previously left was 0.37 vs center/right 0.38

export interface UseArenaLayoutProps {
  backgroundImage: any // require() asset
  currentPosition: PositionKey
}

export interface UseArenaLayoutReturn {
  arenaSize: { width: number; height: number } | null
  bgRect: { offsetX: number; offsetY: number; drawW: number; drawH: number } | null
  daemonPosition: { x: number; y: number }
  daemonX: number
  daemonY: number
  handleArenaLayout: (event: LayoutChangeEvent) => void
  getSpawnPosition: (positionKey: PositionKey) => { x: number; y: number }
}

export function useArenaLayout(props: UseArenaLayoutProps): UseArenaLayoutReturn {
  const { backgroundImage, currentPosition } = props

  const [arenaSize, setArenaSize] = useState<{ width: number; height: number } | null>(null)

  // Handle arena layout
  const handleArenaLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    if (width > 0 && height > 0) {
      setArenaSize({ width, height })
    }
  }, [])

  // Compute background image rect for resizeMode="cover"
  const bgRect = useMemo(() => {
    if (!arenaSize) return null

    // Get intrinsic dimensions of background image
    const bgSource = Image.resolveAssetSource(backgroundImage)
    if (!bgSource) return null

    const imageW = bgSource.width
    const imageH = bgSource.height
    const containerW = arenaSize.width
    const containerH = arenaSize.height

    // Compute scale for resizeMode="cover" (fills container, may crop)
    const scale = Math.max(containerW / imageW, containerH / imageH)

    const drawW = imageW * scale
    const drawH = imageH * scale
    const offsetX = (containerW - drawW) / 2
    const offsetY = (containerH - drawH) / 2

    return { offsetX, offsetY, drawW, drawH }
  }, [arenaSize, backgroundImage])

  /**
   * Compute dynamic Y anchors once arenaSize exists.
   * This keeps logic stable and easy to tune.
   */
  const positionY = useMemo(() => {
    if (!arenaSize) {
      // Fallback to previous behavior if we don't know arena size yet
      return {
        left: 0.37,
        center: 0.38,
        right: 0.38,
      } as const
    }

    const baseY = getDaemonAnchorY(arenaSize.width, arenaSize.height)
    return {
      left: clamp(baseY + LEFT_Y_DELTA, 0, 1),
      center: clamp(baseY, 0, 1),
      right: clamp(baseY, 0, 1),
    } as const
  }, [arenaSize])

  // Helper to compute absolute position for any spawn point
  const getSpawnPosition = useCallback(
    (positionKey: PositionKey) => {
      if (!bgRect) return { x: 0, y: 0 }

      const xPct = POSITION_X[positionKey]
      const yPct = positionY[positionKey]

      const x = bgRect.offsetX + xPct * bgRect.drawW
      const y = bgRect.offsetY + yPct * bgRect.drawH

      return { x, y }
    },
    [bgRect, positionY]
  )

  // Compute daemon absolute position from percentage
  const daemonPosition = useMemo(() => {
    return getSpawnPosition(currentPosition)
  }, [getSpawnPosition, currentPosition])

  // Position for daemon
  const daemonX = daemonPosition.x
  const daemonY = daemonPosition.y

  return {
    arenaSize,
    bgRect,
    daemonPosition,
    daemonX,
    daemonY,
    handleArenaLayout,
    getSpawnPosition,
  }
}
