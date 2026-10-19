import { levels } from '../levels'
import { getMapBoundary, isBoundaryWalkable } from '../../modules/mapBoundary'

describe('Level 1 reference-map Watchers', () => {
  it('places five distinct Watchers in their reference-map sectors on walkable land', () => {
    const powers = levels['1'].greatPowers ?? []
    const boundary = getMapBoundary(400, 400)
    expect(powers).toHaveLength(5)
    expect(new Set(powers.map((power) => power.id)).size).toBe(5)
    const byDirection = Object.fromEntries(powers.map((power) => [power.shortName, power]))
    for (const direction of ['watcher_nw', 'watcher_ne', 'watcher_sw', 'watcher_s', 'watcher_se']) {
      const power = byDirection[direction]
      expect(power).toBeDefined()
      expect(isBoundaryWalkable(boundary, power.position, power.width, power.height)).toBe(true)
    }
    expect(byDirection.watcher_nw.position.row).toBeLessThan(192)
    expect(byDirection.watcher_nw.position.col).toBeLessThan(192)
    expect(byDirection.watcher_ne.position.row).toBeLessThan(192)
    expect(byDirection.watcher_ne.position.col).toBeGreaterThan(208)
    expect(byDirection.watcher_sw.position.row).toBeGreaterThan(208)
    expect(byDirection.watcher_sw.position.col).toBeLessThan(192)
    expect(byDirection.watcher_se.position.row).toBeGreaterThan(208)
    expect(byDirection.watcher_se.position.col).toBeGreaterThan(208)
    expect(byDirection.watcher_s.position.row).toBeGreaterThan(byDirection.watcher_se.position.row)
    expect(Math.abs(byDirection.watcher_s.position.col + 3 - 200)).toBeLessThan(10)
    expect(byDirection.watcher_se.id).toBe('watcher_se_370_199')
  })
})
