import { levels } from '@config/levels'
import type { GameState, Level, TerrainRegion, Position } from '@config/types'
import { playerConfig } from '@config/player'
import {
  canTraverseTerrain,
  isTerrainWalkable,
  terrainContains,
  getTerrainAtPoint,
  buildTerrainDistances,
} from '../terrain'
import { checkObjectInteractions } from '../interactions'
import { reduceMovement } from '../../state/slices/movementSlice'
import { reduceMonsters } from '../../state/slices/monstersSlice'
import { moveMonsters } from '../movement'
import { createMonsterFromTemplate, getSpawnPosition } from '../monsterUtils'
import { buildTraversalObstacles } from '../trailGeometry'
import { applyEffect } from '../effects'

jest.mock('../effects', () => ({ applyEffect: jest.fn(() => ({ success: true })) }))

const wall: TerrainRegion = {
  id: 'wall',
  name: 'wall',
  position: { row: 3, col: 5 },
  width: 1,
  height: 6,
  image: 1,
  shape: [{ row: 0, col: 0, width: 1, height: 6 }],
  blocksMovement: true,
}
function world(regions: TerrainRegion[] = [wall]): GameState {
  const level: Level = {
    id: 'fixture',
    name: 'fixture',
    boardSize: { width: 14, height: 14 },
    playerSpawn: { row: 6, col: 3 },
    objects: [],
    items: [],
    terrainRegions: regions,
  }
  return {
    level,
    gridWidth: 14,
    gridHeight: 14,
    player: { ...playerConfig, position: level.playerSpawn },
    activeMonsters: [],
    attackSlots: [],
    waitingMonsters: [],
    objects: [],
    items: [],
    nonCollisionObjects: [],
    generatedFootsteps: [],
    inCombat: false,
  } as unknown as GameState
}

beforeEach(() => jest.clearAllMocks())

test('blocking geometry stops entry and long crossings; walkable overlaps do not erase blockers', () => {
  const state = world([wall, { ...wall, id: 'valley', blocksMovement: false }])
  expect(isTerrainWalkable(state, { row: 6, col: 5 })).toBe(false)
  expect(canTraverseTerrain(state, { row: 6, col: 3 }, { row: 6, col: 8 })).toBe(false)
  expect(canTraverseTerrain(state, { row: 2, col: 4 }, { row: 3, col: 5 })).toBe(false)
  expect(isTerrainWalkable(world([{ ...wall, blocksMovement: false }]), { row: 6, col: 5 })).toBe(
    true
  )
})

test('footprints and diagonal corner checks prevent clipping through blocked terrain', () => {
  const state = world()
  expect(isTerrainWalkable(state, { row: 6, col: 4 }, 2, 2)).toBe(false)
  expect(isTerrainWalkable(state, { row: 6, col: 3 }, 2, 2)).toBe(true)
  expect(canTraverseTerrain(state, { row: 2, col: 5 }, { row: 3, col: 4 })).toBe(false)
})

test('player and monster reducers reject blocked movement and monster spawns', () => {
  const state = world()
  state.player.position = { row: 6, col: 4 }
  expect(reduceMovement(state, { type: 'MOVE_PLAYER', payload: { direction: 'right' } })).toBe(
    state
  )
  const monster = createMonsterFromTemplate('abhuman', { row: 6, col: 3 })!
  state.activeMonsters = [monster]
  expect(
    reduceMonsters(state, {
      type: 'MOVE_MONSTER',
      payload: { id: monster.id, position: { row: 6, col: 8 } },
    })
  ).toBe(state)
  expect(
    reduceMonsters(state, {
      type: 'SPAWN_MONSTER',
      payload: { monster: { ...monster, position: { row: 6, col: 5 } } },
    })
  ).toBe(state)
})

test('monsters route around the wall and every accepted move clears terrain', () => {
  const state = world()
  state.player.position = { row: 6, col: 10 }
  const monster = createMonsterFromTemplate('abhuman', { row: 6, col: 3 })!
  monster.moveRate = 2
  monster.moveEveryTurns = 1
  state.activeMonsters = [monster]
  for (let turn = 0; turn < 14 && monster.position.col < 8; turn++) {
    moveMonsters(state, (action) => {
      if (action.type !== 'MOVE_MONSTER') return
      expect(
        canTraverseTerrain(
          state,
          monster.position,
          action.payload.position,
          monster.width,
          monster.height
        )
      ).toBe(true)
      monster.position = action.payload.position
    })
  }
  expect(monster.position.col).toBeGreaterThanOrEqual(8)
  const distances = buildTerrainDistances(state, state.player.position, 2, 2)
  expect(distances[6 * 14 + 4]).toBe(-1)
})

test('river effects preserve exact mask shape and apply once despite overlapping segments', () => {
  const state = world([])
  state.nonCollisionObjects = [
    {
      id: 'river',
      shortName: 'river',
      name: 'River',
      category: 'decoration',
      position: { row: 3, col: 3 },
      width: 5,
      height: 5,
      image: 1,
      rotation: 0,
      zIndex: 0,
      type: 'river',
      active: true,
      canTap: false,
      collisionMask: [
        { row: 0, col: 0, width: 2, height: 2 },
        { row: 0, col: 0 },
      ],
      collisionEffects: [{ type: 'heal', value: 5 }],
    },
  ]
  checkObjectInteractions(state, jest.fn(), { row: 3, col: 3 })
  expect(applyEffect).toHaveBeenCalledTimes(1)
  expect(isTerrainWalkable(state, { row: 3, col: 3 })).toBe(true)
  jest.clearAllMocks()
  checkObjectInteractions(state, jest.fn(), { row: 6, col: 6 })
  expect(applyEffect).not.toHaveBeenCalled()
})

test('overlapping walkable areas apply both effects; entry-only effects do not repeat', () => {
  const first = { ...wall, blocksMovement: false, effects: [{ type: 'heal' as const, value: 2 }] }
  const second = { ...first, id: 'second', effectTiming: 'onEnter' as const }
  const state = world([first, second])
  checkObjectInteractions(state, jest.fn(), { row: 6, col: 5 })
  expect(applyEffect).toHaveBeenCalledTimes(2)
  state.lastTerrainInteractionPosition = { row: 6, col: 5 }
  jest.clearAllMocks()
  checkObjectInteractions(state, jest.fn(), { row: 6, col: 5 })
  expect(applyEffect).toHaveBeenCalledTimes(1)
})

test('all authored terrain fits the playable board and leaves landmarks clear', () => {
  const level = levels['1']
  const state = { ...world(), level, gridWidth: 400, gridHeight: 400 }
  expect(level.terrainRegions).toHaveLength(6)
  const anchors = [
    level.playerSpawn,
    { row: 56, col: 224 },
    ...level.greatPowers!.map((g) => g.position),
  ]
  for (const p of anchors) expect(isTerrainWalkable(state, p)).toBe(true)
  for (const region of level.terrainRegions!)
    for (const s of region.shape) {
      const p: Position = { row: region.position.row + s.row, col: region.position.col + s.col }
      expect(terrainContains(region, p)).toBe(true)
      expect(
        isTerrainWalkable(
          { ...state, level: { ...level, terrainRegions: [] } },
          p,
          s.width,
          s.height
        )
      ).toBe(true)
    }
  expect(
    buildTraversalObstacles(level).obstacles.some((o) => o.id.startsWith('giants-sea-terrain'))
  ).toBe(true)
  expect(buildTraversalObstacles(level).obstacles.some((o) => o.id.startsWith('river'))).toBe(false)
})

test('spawning returns no location when every eligible tile is blocked', () => {
  const state = world([
    { ...wall, position: { row: 1, col: 1 }, shape: [{ row: 0, col: 0, width: 12, height: 12 }] },
  ])
  expect(getSpawnPosition(state)).toBeNull()
})

test('terrain inspection respects visible shape and prioritizes the topmost overlapping region', () => {
  const first = { ...wall, id: 'sea', description: 'Cold sea' }
  const top = { ...wall, id: 'valley', description: 'Open valley', blocksMovement: false }
  expect(getTerrainAtPoint({ terrainRegions: [first, top] }, { row: 6, col: 5 })).toBe(top)
  expect(getTerrainAtPoint({ terrainRegions: [first] }, { row: 6, col: 4 })).toBeUndefined()
  expect(getTerrainAtPoint({}, { row: 6, col: 5 })).toBeUndefined()
})

test('all six terrain features have names, descriptions and inspectable cells', () => {
  const level = levels['1']
  for (const region of level.terrainRegions!) {
    expect(region.description?.length).toBeGreaterThan(30)
    const cell = region.shape[0]
    expect(
      getTerrainAtPoint(level, {
        row: region.position.row + cell.row,
        col: region.position.col + cell.col,
      })?.id
    ).toBe(region.id)
  }
})
