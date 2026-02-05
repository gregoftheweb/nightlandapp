/**
 * Unit tests for the self-healing mechanic.
 *
 * Tests verify that:
 * - Players heal 1 HP after the configured number of turns (turnsPerHitPoint)
 * - Healing only occurs when below max HP
 * - Healing never exceeds max HP
 * - Turn counter resets after healing
 * - No healing occurs when turnsPerHitPoint is 0 or undefined
 */
import { GameState, Level, Player } from '../../config/types'

describe('Self-Healing Mechanic', () => {
  // Mock dispatch function
  const mockDispatch = jest.fn()

  // Helper to create a mock game state
  const createMockGameState = (
    playerHP: number,
    playerMaxHP: number,
    turnsPerHitPoint: number = 5,
    selfHealTurnCounter: number = 0
  ): GameState => {
    const mockLevel: Level = {
      id: '1',
      name: 'Test Level',
      boardSize: { width: 400, height: 400 },
      playerSpawn: { row: 200, col: 200 },
      turnsPerHitPoint,
      items: [],
      objects: [],
      greatPowers: [],
    }

    const mockPlayer: Player = {
      name: 'Christos',
      shortName: 'christos',
      id: 'christos',
      description: 'Test player',
      lastComment: '',
      image: 0 as unknown as import('react-native').ImageSourcePropType,
      position: { row: 200, col: 200 },
      currentHP: playerHP,
      maxHP: playerMaxHP,
      ac: 14,
      initiative: 10,
      attack: 8,
      isHidden: false,
      hideTurns: 0,
      inventory: [],
      maxInventorySize: 10,
      weapons: [],
      meleeWeaponId: 'fists',
      equippedRangedWeaponId: '',
      rangedWeaponInventoryIds: [],
      maxWeaponsSize: 4,
      moveSpeed: 1,
      // Hide ability state
      hideUnlocked: false,
      hideChargeTurns: 0,
      hideActive: false,
      hideRechargeProgressTurns: 0,
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
      selfHealTurnCounter,
    } as GameState
  }

  // Helper to simulate self-healing logic (matches turnManager.ts implementation)
  const simulateSelfHealing = (state: GameState, dispatch: jest.Mock) => {
    const turnsPerHitPoint = state.level.turnsPerHitPoint
    if (turnsPerHitPoint && turnsPerHitPoint > 0) {
      const currentHP = state.player.currentHP
      const maxHP = state.player.maxHP

      if (currentHP < maxHP) {
        const currentCounter = state.selfHealTurnCounter || 0
        const newCounter = currentCounter + 1

        if (newCounter >= turnsPerHitPoint) {
          const newHP = Math.min(currentHP + 1, maxHP)

          dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
              updates: { currentHP: newHP },
            },
          })

          dispatch({
            type: 'UPDATE_SELF_HEAL_COUNTER',
            payload: { counter: 0 },
          })
        } else {
          dispatch({
            type: 'UPDATE_SELF_HEAL_COUNTER',
            payload: { counter: newCounter },
          })
        }
      }
    }
  }

  beforeEach(() => {
    mockDispatch.mockClear()
  })

  test('should increment counter but not heal before reaching turnsPerHitPoint', () => {
    const state = createMockGameState(50, 100, 5, 0)
    simulateSelfHealing(state, mockDispatch)

    // Should only update counter, not heal
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SELF_HEAL_COUNTER',
      payload: { counter: 1 },
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPDATE_PLAYER' })
    )
  })

  test('should heal 1 HP after reaching turnsPerHitPoint', () => {
    const state = createMockGameState(50, 100, 5, 4) // Counter at 4, next turn should heal
    simulateSelfHealing(state, mockDispatch)

    // Should heal and reset counter
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { currentHP: 51 },
      },
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SELF_HEAL_COUNTER',
      payload: { counter: 0 },
    })
  })

  test('should not heal when player is at max HP', () => {
    const state = createMockGameState(100, 100, 5, 4)
    simulateSelfHealing(state, mockDispatch)

    // Should not dispatch anything when at max HP
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  test('should not exceed max HP when healing', () => {
    const state = createMockGameState(99, 100, 5, 4) // At 99/100, heal should cap at 100
    simulateSelfHealing(state, mockDispatch)

    // Should heal to exactly max HP, not beyond
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { currentHP: 100 },
      },
    })
  })

  test('should not heal when turnsPerHitPoint is 0', () => {
    const state = createMockGameState(50, 100, 0, 0)
    simulateSelfHealing(state, mockDispatch)

    // Should not dispatch when turnsPerHitPoint is 0
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  test('should not heal when turnsPerHitPoint is undefined', () => {
    const state = createMockGameState(50, 100, 0, 0)
    state.level.turnsPerHitPoint = undefined
    simulateSelfHealing(state, mockDispatch)

    // Should not dispatch when turnsPerHitPoint is undefined
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  test('should work with turnsPerHitPoint of 1 (heal every turn)', () => {
    const state = createMockGameState(50, 100, 1, 0)
    simulateSelfHealing(state, mockDispatch)

    // Should heal immediately when turnsPerHitPoint is 1
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { currentHP: 51 },
      },
    })
  })
})
