// modules/__tests__/jaunt.test.ts
import { reduceJaunt } from '../../state/slices/jauntSlice'
import { GameState, Player } from '../../config/types'

describe('Jaunt Power', () => {
  let basePlayer: Player
  let baseState: GameState

  beforeEach(() => {
    basePlayer = {
      name: 'Christos',
      shortName: 'christos',
      id: 'christos',
      description: 'Test player',
      lastComment: '',
      image: 0 as unknown as import('react-native').ImageSourcePropType,
      position: { row: 100, col: 100 },
      currentHP: 100,
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
      meleeWeaponId: 'fists',
      equippedRangedWeaponId: '',
      rangedWeaponInventoryIds: [],
      moveSpeed: 1,
      hideUnlocked: false,
      hideChargeTurns: 0,
      hideActive: false,
      hideRechargeProgressTurns: 0,
      canJaunt: true,
      jauntCharges: 3,
      jauntRechargeCounter: 0,
      isJauntArmed: false,
    }

    baseState = {
      level: {
        id: 'test-level',
        name: 'Test Level',
        description: 'Test level',
        image: 0 as any,
        playerSpawn: { row: 25, col: 25 },
        items: [],
        objects: [],
        greatPowers: [],
      },
      currentLevelId: 'test-level',
      levels: {},
      player: basePlayer,
      moveCount: 0,
      inCombat: false,
      combatTurn: null,
      activeMonsters: [],
      attackSlots: [],
      waitingMonsters: [],
      turnOrder: [],
      combatLog: [],
      maxAttackers: 3,
      items: [],
      objects: [],
      greatPowers: [],
      gridWidth: 500,
      gridHeight: 500,
      weapons: [],
      saveVersion: '1.0',
      lastSaved: new Date(),
      playTime: 0,
      lastAction: '',
      activeProjectiles: [],
    }
  })

  describe('ARM_JAUNT', () => {
    it('should arm jaunt when charges are available', () => {
      const result = reduceJaunt(baseState, { type: 'ARM_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(true)
      expect(result?.player.jauntCharges).toBe(3) // No charge consumed yet
    })

    it('should toggle off when already armed', () => {
      const armedState = {
        ...baseState,
        player: { ...basePlayer, isJauntArmed: true },
      }
      const result = reduceJaunt(armedState, { type: 'ARM_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(false)
    })

    it('should not arm when charges are 0', () => {
      const noChargesState = {
        ...baseState,
        player: { ...basePlayer, jauntCharges: 0 },
      }
      const result = reduceJaunt(noChargesState, { type: 'ARM_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(false)
    })

    it('should not arm when jaunt is not unlocked', () => {
      const lockedState = {
        ...baseState,
        player: { ...basePlayer, canJaunt: false },
      }
      const result = reduceJaunt(lockedState, { type: 'ARM_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(false)
    })
  })

  describe('CANCEL_JAUNT', () => {
    it('should cancel armed state without consuming charge', () => {
      const armedState = {
        ...baseState,
        player: { ...basePlayer, isJauntArmed: true, jauntCharges: 3 },
      }
      const result = reduceJaunt(armedState, { type: 'CANCEL_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(false)
      expect(result?.player.jauntCharges).toBe(3) // No charge consumed
    })

    it('should do nothing if not armed', () => {
      const result = reduceJaunt(baseState, { type: 'CANCEL_JAUNT' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(false)
    })
  })

  describe('EXECUTE_JAUNT', () => {
    it('should teleport player and consume 1 charge', () => {
      const armedState = {
        ...baseState,
        player: { ...basePlayer, isJauntArmed: true, jauntCharges: 3 },
      }
      const result = reduceJaunt(armedState, {
        type: 'EXECUTE_JAUNT',
        payload: { targetPosition: { col: 200, row: 200 } },
      })
      expect(result).not.toBeNull()
      expect(result?.player.position.col).toBe(200)
      expect(result?.player.position.row).toBe(200)
      expect(result?.player.jauntCharges).toBe(2)
      expect(result?.player.isJauntArmed).toBe(false)
    })

    it('should clamp position to grid bounds', () => {
      const armedState = {
        ...baseState,
        player: { ...basePlayer, isJauntArmed: true, jauntCharges: 3 },
      }
      const result = reduceJaunt(armedState, {
        type: 'EXECUTE_JAUNT',
        payload: { targetPosition: { col: 600, row: 600 } }, // Outside bounds
      })
      expect(result).not.toBeNull()
      expect(result?.player.position.col).toBe(499) // Clamped to gridWidth - 1
      expect(result?.player.position.row).toBe(499) // Clamped to gridHeight - 1
    })

    it('should not execute if not armed', () => {
      const result = reduceJaunt(baseState, {
        type: 'EXECUTE_JAUNT',
        payload: { targetPosition: { col: 200, row: 200 } },
      })
      expect(result).not.toBeNull()
      expect(result?.player.position.col).toBe(100) // Unchanged
      expect(result?.player.position.row).toBe(100)
      expect(result?.player.jauntCharges).toBe(3) // No charge consumed
    })

    it('should not execute if no charges', () => {
      const armedState = {
        ...baseState,
        player: { ...basePlayer, isJauntArmed: true, jauntCharges: 0 },
      }
      const result = reduceJaunt(armedState, {
        type: 'EXECUTE_JAUNT',
        payload: { targetPosition: { col: 200, row: 200 } },
      })
      expect(result).not.toBeNull()
      expect(result?.player.position.col).toBe(100) // Unchanged
      expect(result?.player.jauntCharges).toBe(0)
    })
  })

  describe('UPDATE_JAUNT_STATE', () => {
    it('should increment recharge counter when not at max charges', () => {
      const stateNotMax = {
        ...baseState,
        player: { ...basePlayer, jauntCharges: 2, jauntRechargeCounter: 0 },
      }
      const result = reduceJaunt(stateNotMax, { type: 'UPDATE_JAUNT_STATE' })
      expect(result).not.toBeNull()
      expect(result?.player.jauntRechargeCounter).toBe(1)
      expect(result?.player.jauntCharges).toBe(2) // No charge gained yet
    })

    it('should add charge after 20 turns', () => {
      const state19Turns = {
        ...baseState,
        player: { ...basePlayer, jauntCharges: 0, jauntRechargeCounter: 19 },
      }
      const result = reduceJaunt(state19Turns, { type: 'UPDATE_JAUNT_STATE' })
      expect(result).not.toBeNull()
      expect(result?.player.jauntCharges).toBe(1)
      expect(result?.player.jauntRechargeCounter).toBe(0) // Reset
    })

    it('should not exceed max 3 charges', () => {
      const state19Turns = {
        ...baseState,
        player: { ...basePlayer, jauntCharges: 3, jauntRechargeCounter: 19 },
      }
      const result = reduceJaunt(state19Turns, { type: 'UPDATE_JAUNT_STATE' })
      expect(result).not.toBeNull()
      expect(result?.player.jauntCharges).toBe(3) // Still at max
      expect(result?.player.jauntRechargeCounter).toBe(19) // Counter not incremented at max
    })

    it('should not update if jaunt not unlocked', () => {
      const lockedState = {
        ...baseState,
        player: { ...basePlayer, canJaunt: false, jauntRechargeCounter: 5 },
      }
      const result = reduceJaunt(lockedState, { type: 'UPDATE_JAUNT_STATE' })
      expect(result).not.toBeNull()
      expect(result?.player.jauntRechargeCounter).toBe(5) // Unchanged
    })
  })

  describe('Legacy PLAYER_JAUNT_REQUESTED', () => {
    it('should redirect to ARM_JAUNT', () => {
      const result = reduceJaunt(baseState, { type: 'PLAYER_JAUNT_REQUESTED' })
      expect(result).not.toBeNull()
      expect(result?.player.isJauntArmed).toBe(true)
    })
  })
})
