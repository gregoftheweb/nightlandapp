import { GameState, Player } from '../../config/types'
import { jauntExecutionActions, reduceJaunt } from '../../state/slices/jauntSlice'

describe('Jaunt crystal resource', () => {
  let player: Player
  let state: GameState

  beforeEach(() => {
    player = {
      name: 'Christos',
      shortName: 'christos',
      id: 'christos',
      description: 'Test',
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
      jauntUnlocked: true,
      jauntCrystalCharges: 5,
      jauntCrystalReserve: 0,
      isJauntArmed: false,
    }
    state = {
      level: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        boardSize: { width: 500, height: 500 },
        playerSpawn: { row: 25, col: 25 },
        items: [],
        objects: [],
        greatPowers: [],
      },
      currentLevelId: 'test',
      levels: {},
      player,
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
      gridWidth: 500,
      gridHeight: 500,
      weapons: [],
      weaponUpgrades: {},
      saveVersion: '1.0',
      lastSaved: new Date(),
      playTime: 0,
      lastAction: '',
      encounterPlacements: [],
      trailNetwork: null,
      generatedFootsteps: [],
      gameboardCatalogIdentity: {
        gameboardVersion: 1,
        gameboardHash: 'test',
        referencedContentHash: 'test',
      },
      activeProjectiles: [],
      activeTeleportFlashes: [],
    }
  })

  it('arms only when unlocked with an active charge and cancel does not consume it', () => {
    const armed = reduceJaunt(state, { type: 'ARM_JAUNT' })!
    expect(armed.player.isJauntArmed).toBe(true)
    expect(reduceJaunt(armed, { type: 'CANCEL_JAUNT' })!.player.jauntCrystalCharges).toBe(5)
    expect(
      reduceJaunt(
        { ...state, player: { ...player, jauntCrystalCharges: 0 } },
        { type: 'ARM_JAUNT' }
      )!.player.isJauntArmed
    ).toBe(false)
    expect(
      reduceJaunt({ ...state, player: { ...player, jauntUnlocked: false } }, { type: 'ARM_JAUNT' })!
        .player.isJauntArmed
    ).toBe(false)
  })

  it('teleports and consumes one active-crystal charge', () => {
    const result = execute({ ...player, isJauntArmed: true })
    expect(result.player.position).toEqual({ col: 200, row: 200 })
    expect(result.player.jauntCrystalCharges).toBe(4)
    expect(result.player.isJauntArmed).toBe(false)
    expect(result.activeTeleportFlashes).toHaveLength(1)
  })

  it('atomically reloads from reserve on burn-out, with no zero-charge state', () => {
    const result = execute({
      ...player,
      isJauntArmed: true,
      jauntCrystalCharges: 1,
      jauntCrystalReserve: 2,
    })
    expect(result.player.jauntCrystalCharges).toBe(5)
    expect(result.player.jauntCrystalReserve).toBe(1)
  })

  it('reaches true zero when no reserve remains', () => {
    const result = execute({ ...player, isJauntArmed: true, jauntCrystalCharges: 1 })
    expect(result.player.jauntCrystalCharges).toBe(0)
    expect(result.player.jauntCrystalReserve).toBe(0)
  })

  it('emits the exact burn message and optional immediate-reload message at exactly zero', () => {
    const messages = (p: Player) =>
      jauntExecutionActions(p, { col: 1, row: 1 })
        .map((action) => action.payload?.message)
        .filter(Boolean)
    expect(messages({ ...player, isJauntArmed: true, jauntCrystalCharges: 1 })).toEqual([
      'The Jaunt Crystal is burned up, it dissolves in your hand',
    ])
    expect(
      messages({ ...player, isJauntArmed: true, jauntCrystalCharges: 1, jauntCrystalReserve: 1 })
    ).toEqual([
      'The Jaunt Crystal is burned up, it dissolves in your hand',
      'A fresh crystal ignites in your grasp',
    ])
    expect(messages({ ...player, isJauntArmed: true, jauntCrystalCharges: 2 })).toEqual([])
  })

  it('grants first crystal, reloads true zero, and otherwise stacks reserve', () => {
    const grant = (p: Player) =>
      reduceJaunt({ ...state, player: p }, { type: 'GRANT_JAUNT_CRYSTAL' })!.player
    expect(grant({ ...player, jauntUnlocked: false, jauntCrystalCharges: 0 })).toEqual(
      expect.objectContaining({
        jauntUnlocked: true,
        jauntCrystalCharges: 5,
        jauntCrystalReserve: 0,
      })
    )
    expect(grant({ ...player, jauntCrystalCharges: 0 }).jauntCrystalCharges).toBe(5)
    expect(grant({ ...player, jauntCrystalCharges: 3, jauntCrystalReserve: 2 })).toEqual(
      expect.objectContaining({ jauntCrystalCharges: 3, jauntCrystalReserve: 3 })
    )
  })

  it('has no turn-based recharge action anymore', () => {
    const depleted = { ...state, player: { ...player, jauntCrystalCharges: 0 } }
    expect(reduceJaunt(depleted, { type: 'UPDATE_JAUNT_STATE' })).toBeNull()
    expect(depleted.player.jauntCrystalCharges).toBe(0)
  })

  function execute(updatedPlayer: Player): GameState {
    return reduceJaunt(
      { ...state, player: updatedPlayer },
      {
        type: 'EXECUTE_JAUNT',
        payload: { targetPosition: { col: 200, row: 200 } },
      }
    )!
  }
})
