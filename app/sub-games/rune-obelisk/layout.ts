export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

export const OBELISK_CONTROL_PANEL_RECT: NormalizedRect = {
  x: 0.158,
  y: 0.486,
  width: 0.712,
  height: 0.318,
}

export const OBELISK_CONTROL_CLUSTER_SCALE = {
  dial: 0.22,
  categoryButtonHeight: 0.065,
} as const

export function normalizedRectToPixels(rect: NormalizedRect, artSize: number) {
  return {
    left: rect.x * artSize,
    top: rect.y * artSize,
    width: rect.width * artSize,
    height: rect.height * artSize,
  }
}

export function getObeliskControlPanelRect(artSize: number) {
  return normalizedRectToPixels(OBELISK_CONTROL_PANEL_RECT, artSize)
}

export function getObeliskControlClusterSize(artSize: number) {
  return {
    width: artSize * (OBELISK_CONTROL_CLUSTER_SCALE.dial + 2 * 0.052 + 0.024),
    height: artSize * OBELISK_CONTROL_PANEL_RECT.height,
  }
}
