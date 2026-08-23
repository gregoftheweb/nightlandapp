import {
  getObeliskControlPanelRect,
  getObeliskControlClusterSize,
  OBELISK_CONTROL_CLUSTER_SCALE,
  OBELISK_CONTROL_PANEL_RECT,
} from '../layout'

describe('rune obelisk artwork layout', () => {
  test.each([320, 768, 1024, 1440])(
    'keeps the complete control cluster inside the lower stone panel at art size %i',
    (artSize) => {
      const rect = getObeliskControlPanelRect(artSize)
      const cluster = getObeliskControlClusterSize(artSize)

      expect(rect.left).toBeGreaterThanOrEqual(0)
      expect(rect.top).toBeGreaterThanOrEqual(0)
      expect(rect.left + rect.width).toBeLessThanOrEqual(artSize)
      expect(rect.top + rect.height).toBeLessThanOrEqual(artSize)
      expect(cluster.width).toBeLessThanOrEqual(rect.width)
      expect(cluster.height).toBeLessThanOrEqual(rect.height)
      expect(artSize * OBELISK_CONTROL_CLUSTER_SCALE.dial).toBeLessThanOrEqual(rect.height)
      expect(rect).toEqual({
        left: OBELISK_CONTROL_PANEL_RECT.x * artSize,
        top: OBELISK_CONTROL_PANEL_RECT.y * artSize,
        width: OBELISK_CONTROL_PANEL_RECT.width * artSize,
        height: OBELISK_CONTROL_PANEL_RECT.height * artSize,
      })
    }
  )

  test('shrinks the prior 0.22 dial ratio by exactly ten percent', () => {
    expect(OBELISK_CONTROL_CLUSTER_SCALE.dial).toBeCloseTo(0.22 * 0.9)
  })
})
