/**
 * Unit tests for utility functions, specifically getObjectAtPoint.
 *
 * Tests verify that:
 * - Object detection works correctly for all entity types
 * - Priority order is correct (Player > Monster > GreatPower > Item > Building > NonCollisionObject)
 * - Multi-tile objects are detected correctly
 * - Collision masks are handled properly
 * - Returns null when no object is at the position
 */
import { getObjectAtPoint } from '../utils'
import {
  GameState,
  Level,
  Player,
  Monster,
  Item,
  GreatPower,
  LevelObjectInstance,
  NonCollisionObject,
} from '../../config/types'

describe('getObjectAtPoint', () => {
  // Helper to create a minimal mock game state
  const createMockGameState = (): GameState => {
    const mockLevel: Level = {
      id: '1',
      name: 'Test Level',
      boardSize: { width: 50, height: 50 },
      playerSpawn: { row: 25, col: 25 },
      items: [],
      monsters: [],
      objects: [],
      greatPowers: [],
    }

    const mockPlayer: Player = {
      name: 'Christos',
      shortName: 'christos',
      id: 'christos',
      description: 'Test player',
      lastComment: '',
      image: '',
      position: { row: 10, col: 10 },
      hp: 100,
      maxHP: 100,
      ac: 14,
      initiative: 10,
      attack: 8,
      isHidden: false,
      hideTurns: 0,
      inventory: [],
      maxInventorySize: 10,
      weapons: [],
      maxWeaponsSize: 4,
      meleeWeaponId: 'weapon-discos-001',
      equippedRangedWeaponId: null,
      rangedWeaponInventoryIds: [],
      soulKey: '000000',
      moveSpeed: 1,
    }

    return {
    level: mockLevel,
      currentLevelId: '1',
      player: mockPlayer,
      moveCount: 0,
      inCombat: false,
      combatTurn: null,
      attackSlots: [],
      activeProjectiles: [],
      waitingMonsters: [],
      turnOrder: [],
      combatLog: [],
      activeMonsters: [],
      items: [],
      objects: [],
      greatPowers: [],
      levels: { '1': mockLevel },
      weapons: [],
      monsters: [],
      gridWidth: 400,
      gridHeight: 400,
      maxAttackers: 4,
      saveVersion: '1.0.0',
      lastSaved: new Date(),
      playTime: 0,
      lastAction: '',
    } as GameState
  }

  test('should return null when no object is at the position', () => {
    const state = createMockGameState()
    const result = getObjectAtPoint(5, 5, state)
    expect(result).toBeNull()
  })

  test('should detect player at exact position', () => {
    const state = createMockGameState()
    const result = getObjectAtPoint(10, 10, state)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('player')
    expect(result?.data).toBe(state.player)
  })

  test('should detect monster at position', () => {
    const state = createMockGameState()
    const monster: Monster = {
      id: 'monster-1',
      shortName: 'abhuman',
      category: 'monster',
      name: 'Abhuman',
      position: { row: 15, col: 15 },
      hp: 10,
      maxHP: 10,
      attack: 5,
      ac: 12,
      moveRate: 1,
      soulKey: '000001',
      active: true,
    }
    state.activeMonsters = [monster]

    const result = getObjectAtPoint(15, 15, state)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('monster')
    expect(result?.data).toEqual(monster)
  })

  test('should detect great power (multi-tile)', () => {
    const state = createMockGameState()
    const greatPower: GreatPower = {
      id: 'gp-1',
      shortName: 'watcher',
      category: 'greatpower',
      name: 'The Watcher',
      position: { row: 20, col: 20 },
      width: 3,
      height: 3,
      hp: 100,
      maxHP: 100,
      attack: 15,
      ac: 18,
      awakened: false,
      awakenCondition: 'player_within_range',
      active: true,
    }
    state.level.greatPowers = [greatPower]

    // Test all positions within the 3x3 area
    const result1 = getObjectAtPoint(20, 20, state) // Top-left
    const result2 = getObjectAtPoint(21, 21, state) // Center
    const result3 = getObjectAtPoint(22, 22, state) // Bottom-right
    const result4 = getObjectAtPoint(23, 23, state) // Outside

    expect(result1?.type).toBe('greatPower')
    expect(result2?.type).toBe('greatPower')
    expect(result3?.type).toBe('greatPower')
    expect(result4).toBeNull()
  })

  test('should detect item at position', () => {
    const state = createMockGameState()
    const item: Item = {
      id: 'item-1',
      shortName: 'potion',
      category: 'item',
      name: 'Health Potion',
      type: 'consumable',
      collectible: true,
      position: { row: 12, col: 12 },
      active: true,
    }
    state.items = [item]

    const result = getObjectAtPoint(12, 12, state)
    expect(result?.type).toBe('item')
    expect(result?.data).toEqual(item)
  })

  test('should detect building (multi-tile)', () => {
    const state = createMockGameState()
    const building: LevelObjectInstance = {
      id: 'building-1',
      shortName: 'tower',
      category: 'building',
      name: 'Watch Tower',
      position: { row: 30, col: 30 },
      size: { width: 2, height: 2 },
    }
    state.level.objects = [building]

    const result1 = getObjectAtPoint(30, 30, state)
    const result2 = getObjectAtPoint(31, 31, state)
    const result3 = getObjectAtPoint(32, 32, state) // Outside

    expect(result1?.type).toBe('building')
    expect(result2?.type).toBe('building')
    expect(result3).toBeNull()
  })

  test('should detect non-collision object with collision mask', () => {
    const state = createMockGameState()
    const nco: NonCollisionObject = {
      id: 'nco-1',
      shortName: 'river',
      name: 'River',
      description: 'A flowing river',
      type: 'river',
      position: { row: 40, col: 40 },
      width: 3,
      height: 3,
      rotation: 0,
    image: { uri: 'test://image' } as any,
      zIndex: 0,
      canTap: true,
      active: true,
      collisionMask: [
        { row: 1, col: 1, width: 1, height: 1 }, // Only center tile is tappable
      ],
    }
    state.nonCollisionObjects = [nco]

    const result1 = getObjectAtPoint(40, 40, state) // Top-left (no mask)
    const result2 = getObjectAtPoint(41, 41, state) // Center (has mask)
    const result3 = getObjectAtPoint(42, 42, state) // Bottom-right (no mask)

    expect(result1).toBeNull() // No mask at this position
    expect(result2?.type).toBe('nonCollisionObject') // Mask position
    expect(result3).toBeNull() // No mask at this position
  })

  test('should respect priority order: Player > Monster', () => {
    const state = createMockGameState()

    // Place both player and monster at same position
    state.player.position = { row: 10, col: 10 }
    const monster: Monster = {
      id: 'monster-1',
      shortName: 'abhuman',
      category: 'monster',
      name: 'Abhuman',
      position: { row: 10, col: 10 },
      hp: 10,
      maxHP: 10,
      attack: 5,
      ac: 12,
      moveRate: 1,
      soulKey: '000001',
    }
    state.activeMonsters = [monster]

    const result = getObjectAtPoint(10, 10, state)
    expect(result?.type).toBe('player') // Player has higher priority
  })

  test('should respect priority order: Monster > Item', () => {
    const state = createMockGameState()

    const monster: Monster = {
      id: 'monster-1',
      shortName: 'abhuman',
      category: 'monster',
      name: 'Abhuman',
      position: { row: 15, col: 15 },
      hp: 10,
      maxHP: 10,
      attack: 5,
      ac: 12,
      moveRate: 1,
      soulKey: '000001',
    }
    state.activeMonsters = [monster]

    const item: Item = {
      id: 'item-1',
      shortName: 'potion',
      category: 'item',
      name: 'Health Potion',
      type: 'consumable',
      collectible: true,
      position: { row: 15, col: 15 },
      active: true,
    }
    state.items = [item]

    const result = getObjectAtPoint(15, 15, state)
    expect(result?.type).toBe('monster') // Monster has higher priority than item
  })

  test('should ignore inactive monsters', () => {
    const state = createMockGameState()
    const monster: Monster = {
      id: 'monster-1',
      shortName: 'abhuman',
      category: 'monster',
      name: 'Abhuman',
      position: { row: 15, col: 15 },
      hp: 0,
      maxHP: 10,
      attack: 5,
      ac: 12,
      moveRate: 1,
      soulKey: '000001',
      active: false,
    }
    state.activeMonsters = [monster]

    const result = getObjectAtPoint(15, 15, state)
    expect(result).toBeNull()
  })

  test('should ignore inactive items', () => {
    const state = createMockGameState()
    const item: Item = {
      id: 'item-1',
      shortName: 'potion',
      category: 'item',
      name: 'Health Potion',
      type: 'consumable',
      collectible: true,
      position: { row: 12, col: 12 },
      active: false,
    }
    state.items = [item]

    const result = getObjectAtPoint(12, 12, state)
    expect(result).toBeNull()
  })

  test('should ignore non-tappable non-collision objects', () => {
    const state = createMockGameState()
    const nco: NonCollisionObject = {
      id: 'nco-1',
      shortName: 'footstep',
      name: 'Footstep',
      description: 'A footstep mark',
      type: 'footstep',
      position: { row: 40, col: 40 },
      width: 1,
      height: 1,
      rotation: 0,
      image: { uri: 'test://image' } as any,
      zIndex: 0,
      canTap: false, // Not tappable
      active: true,
    }
    state.nonCollisionObjects = [nco]

    const result = getObjectAtPoint(40, 40, state)
    expect(result).toBeNull()
  })

  test('should detect non-collision object without collision mask using full bounds', () => {
    const state = createMockGameState()
    const nco: NonCollisionObject = {
      id: 'nco-1',
      shortName: 'decoration',
      name: 'Decoration',
      description: 'A decorative object',
      type: 'decoration',
      position: { row: 40, col: 40 },
      width: 2,
      height: 2,
      rotation: 0,
      image: { uri: 'test://image' } as any,
      zIndex: 0,
      canTap: true,
      active: true,
      // No collision mask, so full bounds should be tappable
    }
    state.nonCollisionObjects = [nco]

    const result1 = getObjectAtPoint(40, 40, state)
    const result2 = getObjectAtPoint(41, 41, state)
    const result3 = getObjectAtPoint(42, 42, state) // Outside

    expect(result1?.type).toBe('nonCollisionObject')
    expect(result2?.type).toBe('nonCollisionObject')
    expect(result3).toBeNull()
  })
})
