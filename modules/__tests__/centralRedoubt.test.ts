import { levels } from '@config/levels'
import { createObjectInstance } from '@config/levelHelpers'
import { GAMEBOARD_MANIFEST } from '@config/gameboardManifest'
import { NORTHERN_TRAIL_DESTINATION } from '@config/worldLayout'
import {
  getInitialState,
  fromSnapshot,
  toSnapshot,
  IncompatibleGameboardSaveError,
} from '../gameState'
import {
  buildBoardOccupancyRegistry,
  generateLayout,
  RandomSource,
  REAL_PARSED_CONTENT_CATALOGS,
} from '../gameboardLayout'
import { buildTraversalObstacles, generateTrailNetwork } from '../trailGeometry'
import { getMapBoundary, isBoundaryFootprintWalkable } from '../mapBoundary'

describe('central Redoubt expedition', () => {
  test('fresh games place the entire Redoubt at the map center and start beside its entrance', () => {
    const state = getInitialState('1')
    const redoubt = state.objects.find((object) => object.shortName === 'redoubt')!
    expect(redoubt.position).toEqual({ row: 192, col: 192 })
    expect(redoubt.position!.row + (redoubt.size?.height ?? redoubt.height!) / 2).toBe(
      state.gridHeight / 2
    )
    expect(redoubt.position!.col + (redoubt.size?.width ?? redoubt.width!) / 2).toBe(
      state.gridWidth / 2
    )
    expect(
      isBoundaryFootprintWalkable(getMapBoundary(400, 400, '1'), redoubt.position!, 16, 16)
    ).toBe(true)
    expect(state.player.position).toEqual({ row: 203, col: 200 })
    expect(state.trailNetwork!.resolve({ type: 'trunk', progressPct: 0 })).toEqual(
      state.player.position
    )
    expect(state.trailNetwork!.resolve({ type: 'trunk', progressPct: 1 })).toEqual(
      NORTHERN_TRAIL_DESTINATION
    )
  })

  test('each level uses its own spawn and grid dimensions, rather than Level 1 player defaults', () => {
    const state = getInitialState('2')
    expect(state.player.position).toEqual(levels['2'].playerSpawn)
    expect(state.gridWidth).toBe(600)
    expect(state.gridHeight).toBe(500)
  })

  test('old full-map expedition saves cannot restore the southern Redoubt', () => {
    const snapshot = toSnapshot(getInitialState('1'))
    const oldSnapshot = {
      ...snapshot,
      gameboardCatalogIdentity: { ...snapshot.gameboardCatalogIdentity, gameboardVersion: 2 },
    }
    expect(() => fromSnapshot(oldSnapshot)).toThrow(IncompatibleGameboardSaveError)
    expect(fromSnapshot(snapshot).player.position).toEqual(snapshot.player.position)
  })

  test('an occupied House of Silence approach is rejected rather than silently moving the destination', () => {
    const level = {
      ...levels['1'],
      objects: [
        ...levels['1'].objects,
        createObjectInstance('redoubt', NORTHERN_TRAIL_DESTINATION),
      ],
    }
    const result = generateLayout(
      GAMEBOARD_MANIFEST,
      REAL_PARSED_CONTENT_CATALOGS,
      level,
      new RandomSource(() => 0.5)
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0].code).toBe('trail-endpoint-unavailable')
  })

  test('a wall separating the Redoubt from the destination cannot produce an obstacle-crossing fallback', () => {
    const level = levels['1']
    const obstacles = buildTraversalObstacles(level)
    obstacles.obstacles.push({
      id: 'impassable-wall',
      position: { row: 150, col: 0 },
      width: 400,
      height: 2,
    })
    const result = generateTrailNetwork(
      obstacles,
      buildBoardOccupancyRegistry(level),
      new RandomSource(() => 0.5),
      0,
      level.playerSpawn
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0].code).toBe('trail-route-unavailable')
  })
})
