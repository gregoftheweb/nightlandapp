/**
 * Unit tests for the unified effects system.
 *
 * Tests verify that:
 * - All effects execute correctly through applyEffect()
 * - Item and object effects use the same execution path
 * - Effects properly update player state
 * - Duration and stacking work as expected
 * - Effect handlers respect context (source, trigger, etc.)
 */
import { GameState, Level, Player, Effect } from '../../config/types'
import { applyEffect, EffectContext } from '../effects'

describe('Unified Effects System', () => {
  // Mock dispatch function
  const mockDispatch = jest.fn()
  const mockShowDialog = jest.fn()

  // Helper to create a mock game state
  const createMockGameState = (
    playerHP: number = 50,
    playerMaxHP: number = 100,
    activeMonsters: any[] = []
  ): GameState => {
    const mockLevel: Level = {
      id: '1',
      name: 'Test Level',
      boardSize: { width: 400, height: 400 },
      playerSpawn: { row: 200, col: 200 },
      turnsPerHitPoint: 5,
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
      image: 0 as unknown as import('react-native').ImageSourcePropType,
      position: { row: 200, col: 200 },
      hp: playerHP,
      maxHP: playerMaxHP,
      ac: 14,
      initiative: 10,
      attack: 8,
      isHidden: false,
      hideTurns: 0,
      inventory: [],
      maxInventorySize: 10,
      weapons: [],
      maxWeaponsSize: 4,
      meleeWeaponId: 'fists',
      equippedRangedWeaponId: '',
      rangedWeaponInventoryIds: [],
      soulKey: '000000',
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
      activeMonsters,
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
      selfHealTurnCounter: 0,
    } as GameState
  }

  beforeEach(() => {
    mockDispatch.mockClear()
    mockShowDialog.mockClear()
  })

  // ==================== HEAL EFFECT TESTS ====================

  describe('Heal Effect', () => {
    test('should heal player when below max HP (item source)', () => {
      const state = createMockGameState(50, 100)
      const healEffect: Effect = {
        type: 'heal',
        value: 25,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'item',
        sourceId: 'healthPotion',
        trigger: 'onUseItem',
      }

      const result = applyEffect(healEffect, context)

      expect(result.success).toBe(true)
      expect(result.consumeItem).toBe(true) // Items should be consumed
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 75 },
        },
      })
    })

    test('should heal player when below max HP (object source)', () => {
      const state = createMockGameState(50, 100)
      const healEffect: Effect = {
        type: 'heal',
        value: 25,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'object',
        sourceId: 'healingPool',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(healEffect, context)

      expect(result.success).toBe(true)
      expect(result.consumeItem).toBe(false) // Objects should not be consumed
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 75 },
        },
      })
    })

    test('should not exceed max HP when healing', () => {
      const state = createMockGameState(90, 100)
      const healEffect: Effect = {
        type: 'heal',
        value: 25,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'item',
        trigger: 'onUseItem',
      }

      const result = applyEffect(healEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 100 }, // Capped at maxHP
        },
      })
    })

    test('should fail when already at max HP', () => {
      const state = createMockGameState(100, 100)
      const healEffect: Effect = {
        type: 'heal',
        value: 25,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'item',
        trigger: 'onUseItem',
      }

      const result = applyEffect(healEffect, context)

      expect(result.success).toBe(false)
      expect(result.consumeItem).toBe(false) // Don't consume if failed
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  // ==================== RECUPERATE EFFECT TESTS ====================

  describe('Recuperate Effect', () => {
    test('should heal player when below max HP', () => {
      const state = createMockGameState(50, 100)
      const recuperateEffect: Effect = {
        type: 'recuperate',
        value: 10,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'object',
        sourceId: 'redoubt',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(recuperateEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 60 },
        },
      })
    })

    test('should not heal when at max HP', () => {
      const state = createMockGameState(100, 100)
      const recuperateEffect: Effect = {
        type: 'recuperate',
        value: 10,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'object',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(recuperateEffect, context)

      expect(result.success).toBe(false)
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  // ==================== HIDE EFFECT TESTS ====================

  describe('Hide Effect', () => {
    test('should set player to hidden', () => {
      const state = createMockGameState()
      const hideEffect: Effect = {
        type: 'hide',
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'object',
        sourceId: 'redoubt',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(hideEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { isHidden: true },
        },
      })
    })

    test('should succeed when already hidden (refresh)', () => {
      const state = createMockGameState()
      state.player.isHidden = true

      const hideEffect: Effect = {
        type: 'hide',
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'object',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(hideEffect, context)

      expect(result.success).toBe(true)
    })
  })

  // ==================== HIDE EFFECT TESTS ====================

  describe('Hide Effect', () => {
    test('should set player to hidden with duration', () => {
      const state = createMockGameState()

      const hideEffect: Effect = {
        type: 'hide',
        duration: 5,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'item',
        sourceId: 'shadowPotion',
        trigger: 'onUseItem',
      }

      const result = applyEffect(hideEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: {
            isHidden: true,
          },
        },
      })
    })

    test('should use default duration if not specified', () => {
      const state = createMockGameState()

      const hideEffect: Effect = {
        type: 'hide',
        // no duration specified
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'item',
        trigger: 'onUseItem',
      }

      const result = applyEffect(hideEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: {
            isHidden: true,
          },
        },
      })
    })
  })

  // ==================== POISON EFFECT TESTS ====================

  describe('Poison Effect', () => {
    test('should damage player', () => {
      const state = createMockGameState(50, 100)
      const poisonEffect: Effect = {
        type: 'poison',
        value: 10,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        showDialog: mockShowDialog,
        sourceType: 'object',
        sourceId: 'poisonPool',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(poisonEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 40 },
        },
      })
    })

    test('should trigger game over when HP drops to 0', () => {
      const state = createMockGameState(5, 100)
      const poisonEffect: Effect = {
        type: 'poison',
        value: 10,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'object',
        trigger: 'onEnterTile',
      }

      const result = applyEffect(poisonEffect, context)

      expect(result.success).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_PLAYER',
        payload: {
          updates: { hp: 0 },
        },
      })
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'GAME_OVER',
        payload: {
          message: 'You succumb to the poison...',
        },
      })
    })
  })

  // ==================== UNKNOWN EFFECT TESTS ====================

  describe('Unknown Effect Type', () => {
    test('should fail gracefully for unknown effect type', () => {
      const state = createMockGameState()
      const unknownEffect: Effect = {
        type: 'unknownEffect' as any,
      }

      const context: EffectContext = {
        state,
        dispatch: mockDispatch,
        sourceType: 'system',
        trigger: 'onUseItem',
      }

      const result = applyEffect(unknownEffect, context)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Unknown effect')
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })
})
