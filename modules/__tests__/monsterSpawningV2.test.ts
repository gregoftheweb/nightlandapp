/**
 * Unit tests for monster spawning using V2 spawn configs
 *
 * Tests verify that:
 * - checkMonsterSpawn uses monsterSpawnConfigsV2
 * - maxInstances is enforced by templateId
 * - Spawn behavior is unchanged (rates, distance, slotting)
 */
import { checkMonsterSpawn, getSpawnPosition } from '../monsterUtils'
import { GameState, Monster, MonsterSpawnConfigV2, Level } from '../../config/types'
import { getLevel } from '../../config/levels'

// Mock dispatch for capturing spawned monsters
let dispatchedActions: any[] = []
const mockDispatch = (action: any) => {
  dispatchedActions.push(action)
}

// Mock showDialog
const mockShowDialog = jest.fn()

describe('Monster Spawning V2', () => {
  beforeEach(() => {
    dispatchedActions = []
    mockShowDialog.mockClear()
  })

  describe('checkMonsterSpawn with V2 configs', () => {
    it('should use monsterSpawnConfigsV2 when available', () => {
      // Create a state with V2 spawn configs
      const mockLevel: Level = {
        ...getLevel('1'),
        monsterSpawnConfigsV2: [
          {
            templateId: 'abhuman',
            spawnRate: 1.0, // 100% chance to force spawn for testing
            maxInstances: 5,
          },
        ],
      }

      const state: GameState = {
        level: mockLevel,
        activeMonsters: [],
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
      } as any

      // Call checkMonsterSpawn
      checkMonsterSpawn(state, mockDispatch, mockShowDialog)

      // Verify a monster was spawned
      expect(dispatchedActions.length).toBe(1)
      expect(dispatchedActions[0].type).toBe('SPAWN_MONSTER')
      expect(dispatchedActions[0].payload.monster.shortName).toBe('abhuman')
    })

    it('should enforce maxInstances by templateId', () => {
      const mockLevel: Level = {
        ...getLevel('1'),
        monsterSpawnConfigsV2: [
          {
            templateId: 'abhuman',
            spawnRate: 1.0, // 100% chance
            maxInstances: 2,
          },
        ],
      }

      // Create state with 2 abhumans already active (at max)
      const state: GameState = {
        level: mockLevel,
        activeMonsters: [
          { shortName: 'abhuman', id: 'abhuman-1' } as Monster,
          { shortName: 'abhuman', id: 'abhuman-2' } as Monster,
        ],
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
      } as any

      // Call checkMonsterSpawn
      checkMonsterSpawn(state, mockDispatch, mockShowDialog)

      // Verify no monster was spawned (already at max)
      expect(dispatchedActions.length).toBe(0)
    })

    it('should allow spawn when below maxInstances', () => {
      const mockLevel: Level = {
        ...getLevel('1'),
        monsterSpawnConfigsV2: [
          {
            templateId: 'abhuman',
            spawnRate: 1.0,
            maxInstances: 3,
          },
        ],
      }

      // Create state with 1 abhuman (below max of 3)
      const state: GameState = {
        level: mockLevel,
        activeMonsters: [
          { shortName: 'abhuman', id: 'abhuman-1', position: { row: 100, col: 100 } } as Monster,
        ],
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
      } as any

      // Call checkMonsterSpawn
      checkMonsterSpawn(state, mockDispatch, mockShowDialog)

      // Verify a monster was spawned
      expect(dispatchedActions.length).toBe(1)
      expect(dispatchedActions[0].type).toBe('SPAWN_MONSTER')
    })

    it('should respect spawnRate probability', () => {
      const mockLevel: Level = {
        ...getLevel('1'),
        monsterSpawnConfigsV2: [
          {
            templateId: 'abhuman',
            spawnRate: 0.0, // 0% chance - should never spawn
            maxInstances: 5,
          },
        ],
      }

      const state: GameState = {
        level: mockLevel,
        activeMonsters: [],
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
      } as any

      // Call checkMonsterSpawn multiple times
      for (let i = 0; i < 10; i++) {
        checkMonsterSpawn(state, mockDispatch, mockShowDialog)
      }

      // Verify no monsters were spawned (0% rate)
      expect(dispatchedActions.length).toBe(0)
    })
  })

  describe('getSpawnPosition', () => {
    it('should spawn monsters within min/max distance from player', () => {
      const state: GameState = {
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
        activeMonsters: [],
      } as any

      // Test multiple spawns
      for (let i = 0; i < 20; i++) {
        const position = getSpawnPosition(state)

        // Calculate distance from player
        const dx = position.col - 200
        const dy = position.row - 200
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Verify distance is within expected range (5-15)
        expect(distance).toBeGreaterThanOrEqual(5)
        expect(distance).toBeLessThanOrEqual(15)

        // Verify position is within grid bounds
        expect(position.row).toBeGreaterThanOrEqual(0)
        expect(position.row).toBeLessThan(400)
        expect(position.col).toBeGreaterThanOrEqual(0)
        expect(position.col).toBeLessThan(400)
      }
    })

    it('should avoid spawning on occupied positions', () => {
      const state: GameState = {
        gridWidth: 400,
        gridHeight: 400,
        player: {
          position: { row: 200, col: 200 },
        } as any,
        activeMonsters: [
          { position: { row: 205, col: 205 } } as Monster,
          { position: { row: 206, col: 206 } } as Monster,
        ],
      } as any

      const position = getSpawnPosition(state)

      // Verify position is not occupied by existing monsters
      const isOccupied = state.activeMonsters.some(
        (m) => m.position.row === position.row && m.position.col === position.col
      )
      expect(isOccupied).toBe(false)
    })
  })

  describe('V2 spawn configs in actual levels', () => {
    it('should have V2 configs in level 1', () => {
      const level = getLevel('1')
      expect(level.monsterSpawnConfigsV2).toBeDefined()
      expect(level.monsterSpawnConfigsV2!.length).toBeGreaterThan(0)
    })

    it('should have V2 configs in level 2', () => {
      const level = getLevel('2')
      expect(level.monsterSpawnConfigsV2).toBeDefined()
      expect(level.monsterSpawnConfigsV2!.length).toBeGreaterThan(0)
    })
  })
})
