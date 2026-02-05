// modules/turnManager.ts - Clean turn-based game flow orchestration
import { GameState, Position, Monster, MonsterInstance } from '../config/types'
import { getMonsterTemplate } from '../config/monsters'
import { hydrateMonsterV2 } from './hydration'
import { handleMoveMonsters } from './monsterUtils'
import { handleCombatTurn } from './combat'
import { calculateNewPosition } from './movement'
import { checkItemInteractions, checkObjectInteractions } from './interactions'
import { SPAWN_CONSTANTS } from '../constants/Game'
import { logIfDev } from './utils'
import { reducer as gameReducer } from './reducers'

// ==================== MODULE-LEVEL STATE (Preserved for combat/monster flow integrity) ====================
let currentGameState: GameState
let gameDispatch: (action: any) => void
let inCombat: boolean = false
let turnType: 'combat' | 'move' | 'non-move-turn' = 'non-move-turn'

// ==================== STATE UPDATE HELPER ====================

/**
 * Applies an action to the snapshot state using the game reducer.
 * For actions with side effects (e.g., GAME_OVER), returns a minimal pure state update.
 */
const applyActionToSnapshot = (state: GameState, action: any): GameState => {
  // Handle actions with side effects separately
  if (action.type === 'GAME_OVER') {
    // Return minimal pure state update without calling deleteCurrentGame
    return {
      ...state,
      gameOver: true,
      gameOverMessage: action.payload?.message || 'You have been defeated.',
      killerName: action.payload?.killerName || 'unknown horror',
      suppressDeathDialog: action.payload?.suppressDeathDialog || false,
      inCombat: false,
      attackSlots: [],
      waitingMonsters: [],
      turnOrder: [],
      combatTurn: null,
      combatLog: [],
      activeMonsters: [], // Clear all active monsters
    }
  }

  // Default: use the game reducer for all other actions
  return gameReducer(state, action)
}

/**
 * Creates a wrapped dispatch function that updates currentGameState before dispatching.
 * This ensures currentGameState stays in sync with the reducer's state transformations.
 */
const createWrappedDispatch = (dispatch: (action: any) => void): ((action: any) => void) => {
  return (action) => {
    currentGameState = applyActionToSnapshot(currentGameState, action)
    dispatch(action)
  }
}

// ==================== UTILITY FUNCTIONS ====================

const determineTurnType = (direction?: string): 'combat' | 'move' | 'non-move-turn' => {
  if (inCombat) {
    return 'combat'
  }
  if (direction && direction !== 'stay') {
    return 'move'
  }
  return 'non-move-turn'
}

// ==================== COMBAT TURN EXECUTION ====================

const doCombatTurn = (
  action: string,
  targetId?: string,
  setDeathMessage?: (message: string) => void
): void => {
  logIfDev(`⚔️ EXECUTING COMBAT TURN: ${action}`)

  // Do Player Attack
  if (action === 'attack' && targetId) {
    logIfDev(`Player attacking target: ${targetId}`)
  }

  // Execute full combat round (player + monster attacks) - preserves UI slotting logic
  handleCombatTurn(currentGameState, gameDispatch, action, targetId, setDeathMessage)

  // Check ongoing object interactions at current position (for recuperate, etc.)
  // Use currentGameState (updated via dispatch) for consistency with slotting
  checkObjectInteractions(currentGameState, gameDispatch, currentGameState.player.position)

  // Early exit if player died (check after dispatch updates)
  if (currentGameState.player.hp <= 0) {
    logIfDev('💀 Player died in combat - early exit')
    return
  }
}

// ==================== MOVEMENT TURN EXECUTION ====================

const doMoveTurn = (direction: string, setOverlay?: (overlay: any) => void): void => {
  logIfDev(`🚶 EXECUTING MOVE TURN: ${direction}`)

  // Move Player
  const newPosition = calculateNewPosition(
    currentGameState.player.position,
    direction,
    currentGameState
  )
  gameDispatch({ type: 'MOVE_PLAYER', payload: { position: newPosition } })

  const newMoveCount = currentGameState.moveCount + 1
  gameDispatch({
    type: 'UPDATE_MOVE_COUNT',
    payload: { moveCount: newMoveCount },
  })

  logIfDev(`Player moved to: (${newPosition.row}, ${newPosition.col}), Move: ${newMoveCount}`)

  // Handle world interactions at new position
  checkItemInteractions(currentGameState, gameDispatch, setOverlay)
  checkObjectInteractions(currentGameState, gameDispatch, newPosition)
}

// ==================== NON-MOVE TURN EXECUTION ====================

const doNonMoveTurn = (): void => {
  logIfDev(`⏳ EXECUTING NON-MOVE TURN (pass turn)`)

  // Update turn counter for non-move turns
  gameDispatch({ type: 'PASS_TURN' })

  // Check ongoing object interactions at current position (for recuperate, etc.)
  checkObjectInteractions(currentGameState, gameDispatch, currentGameState.player.position)
}

// ==================== MONSTER MOVEMENT AND COMBAT SETUP ====================

const doMonsterMovement = (): void => {
  logIfDev(`👹 PROCESSING MONSTER MOVEMENT`)

  // Move monsters - preserves specific UI slotting relative to Christos
  handleMoveMonsters(currentGameState, gameDispatch)

  // Monster collision and combat setup logic is handled within handleMoveMonsters
  // If a monster is waiting OR a monster collides with Christos:
  //   - If there is an empty Attack slot: slide into slot
  //   - Else: hold position until next turn (monster waiting)
}

// ==================== SPELL AND EFFECTS EXECUTION ====================

const executeSpellsAndEffects = (): void => {
  // TODO: Execute spells and effects (none yet in game engine)
  if (__DEV__) {
    console.log(`✨ EXECUTE SPELLS AND EFFECTS (not implemented yet)`)
  }
}

// ==================== CLEANUP ====================

const doTurnCleanup = (): void => {
  logIfDev(`🧹 TURN CLEANUP`)

  // Update hidden status if needed
  if (currentGameState.player.isHidden) {
    logIfDev('Christos is hidden')
  }

  // Update hide ability state (charge consumption and recharge)
  if (currentGameState.player.hideUnlocked) {
    gameDispatch({ type: 'UPDATE_HIDE_STATE' })
    // Note: Current state will be updated by dispatcher
  }

  // Apply self-healing if configured for the current level
  const turnsPerHitPoint = currentGameState.level.turnsPerHitPoint
  if (turnsPerHitPoint && turnsPerHitPoint > 0) {
    const currentHP = currentGameState.player.hp
    const maxHP = currentGameState.player.maxHP

    // Only heal if below max HP
    if (currentHP < maxHP) {
      // Initialize counter if not exists
      const currentCounter = currentGameState.selfHealTurnCounter || 0
      const newCounter = currentCounter + 1

      // Check if it's time to heal
      if (newCounter >= turnsPerHitPoint) {
        const newHP = Math.min(currentHP + 1, maxHP)

        gameDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP },
          },
        })

        // Reset counter and update state
        gameDispatch({
          type: 'UPDATE_SELF_HEAL_COUNTER',
          payload: { counter: 0 },
        })

        logIfDev(
          `💚 Self-healing: ${currentHP} -> ${newHP} (+1 HP) [after ${turnsPerHitPoint} turns]`
        )
      } else {
        // Increment counter
        gameDispatch({
          type: 'UPDATE_SELF_HEAL_COUNTER',
          payload: { counter: newCounter },
        })

        logIfDev(
          `💚 Self-healing: turn ${newCounter}/${turnsPerHitPoint} (${currentHP}/${maxHP} HP)`
        )
      }
    } else {
      logIfDev(`💚 Self-healing: Already at max HP (${maxHP})`)
    }
  }

  // Any other end-of-turn cleanup
}

// ==================== MAIN TURN EXECUTION ====================

const executeTurn = (
  action: string = 'move',
  direction?: string,
  targetId?: string,
  setOverlay?: (overlay: any) => void,
  setDeathMessage?: (message: string) => void
): void => {
  logIfDev(`\n🎯 === STARTING TURN EXECUTION ===`)
  logIfDev(`Action: ${action}, Direction: ${direction || 'none'}, In Combat: ${inCombat}`)

  // Execute spells and effects (placeholder)
  executeSpellsAndEffects()

  // DO TURN
  if (inCombat) {
    // Combat Turn - preserves slotting
    doCombatTurn(action, targetId, setDeathMessage)

    // Early exit if player died
    if (currentGameState.player.hp <= 0) {
      return
    }
  } else {
    // Non-Combat Turn
    if (turnType === 'move') {
      doMoveTurn(direction!, setOverlay)
    } else {
      doNonMoveTurn()
    }
  }

  // Move monsters (always happens unless player died)
  doMonsterMovement()

  // Cleanup
  doTurnCleanup()

  logIfDev(`✅ === TURN EXECUTION COMPLETE ===\n`)
}

// ==================== PUBLIC INTERFACE FUNCTIONS ====================

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  setOverlay?: (overlay: any) => void,
  setDeathMessage?: (message: string) => void
): void => {
  // Set current gamestate in module level variables
  currentGameState = state
  gameDispatch = createWrappedDispatch(dispatch)

  // Set inCombat boolean
  inCombat = state.inCombat

  // Cannot move during combat
  if (inCombat) {
    logIfDev('❌ Cannot move during combat')
    return
  }

  // Set Turn Type
  turnType = determineTurnType(direction)

  // Execute Turn
  executeTurn('move', direction, undefined, setOverlay, setDeathMessage)
}

export const handleCombatAction = (
  state: GameState,
  dispatch: (action: any) => void,
  action: string,
  targetId?: string,
  setDeathMessage?: (message: string) => void
): void => {
  // Set current gamestate in module level variables
  currentGameState = state
  gameDispatch = createWrappedDispatch(dispatch)

  // Set inCombat boolean
  inCombat = state.inCombat

  if (!inCombat) {
    logIfDev('❌ Cannot perform combat action outside of combat')
    return
  }

  // Set Turn Type
  turnType = 'combat'

  // Execute Turn
  executeTurn(action, undefined, targetId, undefined, setDeathMessage)
}

export const handlePassTurn = (state: GameState, dispatch: (action: any) => void): void => {
  // Set current gamestate in module level variables
  currentGameState = state
  gameDispatch = createWrappedDispatch(dispatch)

  // Set inCombat boolean
  inCombat = state.inCombat

  if (inCombat) {
    logIfDev('❌ Cannot pass turn during combat')
    return
  }

  // Set Turn Type
  turnType = 'non-move-turn'

  // Execute Turn
  executeTurn('pass', undefined, undefined, undefined)
}

// ==================== LEGACY EXPORTS FOR BACKWARD COMPATIBILITY ====================

// Re-export combat handler for existing code
export { handleCombatTurn } from './combat'

// ==================== GAME INITIALIZATION ====================

export const initializeStartingMonsters = (
  state: GameState,
  dispatch: (action: any) => void
): void => {
  const abhumanTemplate = getMonsterTemplate('abhuman')
  if (abhumanTemplate) {
    const timestamp = Date.now() // Ensure uniqueness across restarts/game overs

    // Spawn exactly INITIAL_ABHUMAN_SPAWNS abhumans for testing
    for (let i = 0; i < SPAWN_CONSTANTS.INITIAL_ABHUMAN_SPAWNS; i++) {
      const angle = Math.random() * 2 * Math.PI
      const distance =
        SPAWN_CONSTANTS.SPAWN_BASE_DISTANCE + Math.random() * SPAWN_CONSTANTS.SPAWN_RANDOM_DISTANCE // Closer for testing

      let spawnRow = Math.round(state.player.position.row + Math.sin(angle) * distance)
      let spawnCol = Math.round(state.player.position.col + Math.cos(angle) * distance)

      spawnRow = Math.max(0, Math.min(state.gridHeight - 1, spawnRow))
      spawnCol = Math.max(0, Math.min(state.gridWidth - 1, spawnCol))

      // Unique ID to prevent React key duplicates during restarts
      const uniqueId = `abhuman-init-${timestamp}-${i}`

      // Create MonsterInstance with runtime state
      const instance: MonsterInstance = {
        id: uniqueId,
        templateId: 'abhuman',
        position: { row: spawnRow, col: spawnCol },
        currentHP: abhumanTemplate.maxHP, // Start at full HP
      }

      // Hydrate template with instance to get Monster
      const newMonster: Monster = hydrateMonsterV2(abhumanTemplate, instance)

      dispatch({
        type: 'SPAWN_MONSTER',
        payload: { monster: newMonster },
      })

      logIfDev(
        `🎯 Spawned initial ${newMonster.name} #${
          i + 1
        } at (${spawnRow}, ${spawnCol}), distance: ${Math.round(distance)}`
      )
      logIfDev(`   Stats: HP:${newMonster.currentHP}, Attack:${newMonster.attack}, AC:${newMonster.ac}`)
    }
  }
}
