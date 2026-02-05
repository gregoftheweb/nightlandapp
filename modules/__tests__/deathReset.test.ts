/**
 * Death Reset Tests
 *
 * Validates that when a player dies, the game state properly resets to
 * the true default/initial state through the GAME_OVER -> RESET_GAME flow.
 */
import { GameState } from '../../config/types'
import { getInitialState, validateGameState, toSnapshot, fromSnapshot } from '../gameState'
import { reducer } from '../../state/reducer'

describe('Death Reset System', () => {
  describe('getInitialState', () => {
    test('should create a fresh initial state for level 1', () => {
      const state = getInitialState('1')

      expect(state.currentLevelId).toBe('1')
      expect(state.gameOver).toBe(false)
      expect(state.player.currentHP).toBeGreaterThan(0)
      expect(state.inCombat).toBe(false)
      expect(state.activeMonsters).toEqual([])
      expect(state.combatLog).toEqual([])
      expect(state.moveCount).toBe(0)
      expect(state.monstersKilled).toBe(0)
      expect(state.distanceTraveled).toBe(0)
      expect(state.subGamesCompleted).toEqual({})
    })

    test('should create fresh state with different references each call', () => {
      const state1 = getInitialState('1')
      const state2 = getInitialState('1')

      // Should be equal values but different object references
      // (excluding lastSaved which will have different timestamps)
      expect(state1.currentLevelId).toEqual(state2.currentLevelId)
      expect(state1.player).toEqual(state2.player)
      expect(state1.activeMonsters).toEqual(state2.activeMonsters)

      // Object references should be different
      expect(state1).not.toBe(state2)
      expect(state1.player).not.toBe(state2.player)
      expect(state1.activeMonsters).not.toBe(state2.activeMonsters)
    })

    test('should handle invalid level gracefully', () => {
      const state = getInitialState('invalid-level-99')

      // Should fall back to level 1
      expect(state.currentLevelId).toBe('1')
      expect(state.level).toBeDefined()
    })
  })

  describe('GAME_OVER action', () => {
    test('should mark player as dead and clear combat state', () => {
      const initialState = getInitialState('1')
      const modifiedState: GameState = {
        ...initialState,
        inCombat: true,
        activeMonsters: [
          {
            id: 'monster1',
            name: 'Test Monster',
            hp: 50,
            maxHP: 50,
            ac: 10,
            initiative: 5,
            attack: 8,
            position: { row: 10, col: 10 },
          } as any,
        ],
       combatLog: [{ id: 'combat-start-1', message: 'Combat started', turn: 1 }],
        monstersKilled: 5,
        distanceTraveled: 100,
      }

      const newState = reducer(modifiedState, {
        type: 'GAME_OVER',
        payload: {
          message: 'Christos was killed by Test Monster',
          killerName: 'Test Monster',
        },
      })

      // Death flags should be set
      expect(newState.gameOver).toBe(true)
      expect(newState.gameOverMessage).toBe('Christos was killed by Test Monster')
      expect(newState.killerName).toBe('Test Monster')

      // Combat state should be cleared
      expect(newState.inCombat).toBe(false)
      expect(newState.activeMonsters).toEqual([])
      expect(newState.attackSlots).toEqual([])
      expect(newState.waitingMonsters).toEqual([])
      expect(newState.combatLog).toEqual([])
      expect(newState.turnOrder).toEqual([])
      expect(newState.combatTurn).toBeNull()

      // Stats should be preserved (for death screen display)
      expect(newState.monstersKilled).toBe(5)
      expect(newState.distanceTraveled).toBe(100)
    })

    test('should use default values when payload is missing', () => {
      const state = getInitialState('1')
      const newState = reducer(state, { type: 'GAME_OVER' })

      expect(newState.gameOver).toBe(true)
      expect(newState.gameOverMessage).toBe('You have been defeated.')
      expect(newState.killerName).toBe('unknown horror')
      expect(newState.suppressDeathDialog).toBe(false)
    })

    test('should support suppressDeathDialog flag', () => {
      const state = getInitialState('1')
      const newState = reducer(state, {
        type: 'GAME_OVER',
        payload: {
          suppressDeathDialog: true,
        },
      })

      expect(newState.suppressDeathDialog).toBe(true)
    })
  })

  describe('RESET_GAME action', () => {
    test('should reset to fresh initial state after death', () => {
      // Create a "dirty" state representing a player who died
      const dirtyState = getInitialState('1')
      const modifiedState: GameState = {
        ...dirtyState,
        gameOver: true,
        gameOverMessage: 'You died!',
        killerName: 'Monster',
        player: {
          ...dirtyState.player,
          currentHP: 0,
          inventory: ['item1', 'item2', 'item3'] as any,
        },
        monstersKilled: 10,
        distanceTraveled: 500,
        moveCount: 100,
        subGamesCompleted: { tesseract: true, aerowreck: true },
      }

      const resetState = reducer(modifiedState, { type: 'RESET_GAME' })

      // Should be a fresh state
      expect(resetState.gameOver).toBe(false)
      expect(resetState.gameOverMessage).toBeUndefined()
      expect(resetState.killerName).toBeUndefined()

      // Player should be restored
      expect(resetState.player.currentHP).toBeGreaterThan(0)
      expect(resetState.player.inventory).toEqual([])

      // Stats should be reset
      expect(resetState.monstersKilled).toBe(0)
      expect(resetState.distanceTraveled).toBe(0)
      expect(resetState.moveCount).toBe(0)

      // Sub-game flags should be reset (fresh run)
      expect(resetState.subGamesCompleted).toEqual({})

      // Combat state should be clean
      expect(resetState.inCombat).toBe(false)
      expect(resetState.activeMonsters).toEqual([])
      expect(resetState.combatLog).toEqual([])
    })

    test('should reset UI flags', () => {
      const dirtyState = getInitialState('1')
      const modifiedState: GameState = {
        ...dirtyState,
        showInventory: true,
        showWeaponsInventory: true,
        rangedAttackMode: true,
        targetedMonsterId: 'monster123',
        dialogData: { some: 'data' },
      }

      const resetState = reducer(modifiedState, { type: 'RESET_GAME' })

      expect(resetState.showInventory).toBe(false)
      expect(resetState.showWeaponsInventory).toBe(false)
      expect(resetState.rangedAttackMode).toBe(false)
      expect(resetState.targetedMonsterId).toBeNull()
      expect(resetState.dialogData).toBeUndefined()
    })

    test('should reset projectiles and effects', () => {
      const dirtyState = getInitialState('1')
      const modifiedState: GameState = {
        ...dirtyState,
        activeProjectiles: [{ id: 'proj1', position: { row: 5, col: 5 } } as any],
        player: {
          ...dirtyState.player,
          isHidden: true,
          hideTurns: 3,
        },
      }

      const resetState = reducer(modifiedState, { type: 'RESET_GAME' })

      expect(resetState.activeProjectiles).toEqual([])
      expect(resetState.player.isHidden).toBe(false)
      expect(resetState.player.hideTurns).toBe(0)
    })
  })

  describe('Snapshot Serialization', () => {
    test('toSnapshot should create JSON-serializable object', () => {
      const state = getInitialState('1')
      const snapshot = toSnapshot(state)

      // Date should be converted to ISO string
      expect(typeof snapshot.lastSaved).toBe('string')
      expect(snapshot.lastSaved).toMatch(/^\d{4}-\d{2}-\d{2}T/)

      // Should be serializable
      expect(() => JSON.stringify(snapshot)).not.toThrow()
      const serialized = JSON.stringify(snapshot)
      expect(serialized).toBeTruthy()
    })

    test('fromSnapshot should reconstruct state (stub)', () => {
      const state = getInitialState('1')
      const snapshot = toSnapshot(state)
      const reconstructed = fromSnapshot(snapshot)

      // Currently a stub, should return fresh state
      expect(reconstructed.currentLevelId).toBe('1')
      expect(reconstructed.player).toBeDefined()
    })
  })

  describe('State Validation', () => {
    test('validateGameState should pass for valid state', () => {
      const state = getInitialState('1')

      // Should not throw
      expect(() => validateGameState(state, 'TEST')).not.toThrow()
    })

    test('validateGameState should detect missing player', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const invalidState = getInitialState('1')
      // @ts-ignore - intentionally breaking state for test
      invalidState.player = null

      validateGameState(invalidState, 'TEST')

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('validation failed')

      consoleErrorSpy.mockRestore()
    })

    test('validateGameState should detect invalid combat state', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const invalidState = getInitialState('1')
      invalidState.inCombat = true
      invalidState.activeMonsters = []

      validateGameState(invalidState, 'TEST')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Complete Death Flow', () => {
    test('should handle complete death and reset flow', () => {
      // 1. Start with initial state
      let state = getInitialState('1')
      expect(state.gameOver).toBe(false)

      // 2. Simulate some gameplay
      state = {
        ...state,
        player: { ...state.player, currentHP: 10 },
        monstersKilled: 3,
        distanceTraveled: 50,
        moveCount: 25,
      }

      // 3. Player dies
      state = reducer(state, {
        type: 'GAME_OVER',
        payload: {
          message: 'Christos was killed by a Nighthound',
          killerName: 'Nighthound',
        },
      })
      expect(state.gameOver).toBe(true)
      expect(state.monstersKilled).toBe(3) // Preserved for death screen

      // 4. Player chooses to restart from death screen
      state = reducer(state, { type: 'RESET_GAME' })
      expect(state.gameOver).toBe(false)
      expect(state.gameOverMessage).toBeUndefined()
      expect(state.monstersKilled).toBe(0) // Reset
      expect(state.player.currentHP).toBeGreaterThan(0)
      expect(state.moveCount).toBe(0)

      // 5. State should be fresh and ready for new game
      const freshState = getInitialState('1')

      // Compare key fields (excluding lastSaved timestamp)
      expect(state.gameOver).toEqual(freshState.gameOver)
      expect(state.player).toEqual(freshState.player)
      expect(state.monstersKilled).toEqual(freshState.monstersKilled)
      expect(state.distanceTraveled).toEqual(freshState.distanceTraveled)
      expect(state.moveCount).toEqual(freshState.moveCount)
      expect(state.subGamesCompleted).toEqual(freshState.subGamesCompleted)
    })
  })
})
