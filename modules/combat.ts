// modules/combat.ts - Enhanced d20 combat system with all combat logic
import { GameState, Position, Monster } from '../config/types'
import { getTextContent, logIfDev } from './utils'
import { COMBAT_STRINGS } from '@assets/copy/combat'

// Roll a d20
const rollD20 = (): number => {
  return Math.floor(Math.random() * 20) + 1
}

// Roll a d6
const rollD6 = (): number => {
  return Math.floor(Math.random() * 6) + 1
}

// ==================== COMBAT UTILITIES ====================

const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col
}

// ==================== CORE COMBAT ACTIONS ====================

export const executeAttack = (attacker: any, defender: any, dispatch: any): boolean => {
  const attackRoll = rollD20()
  const totalAttack = attackRoll + attacker.attack
  const hit = totalAttack >= defender.ac

  logIfDev(`\n🎲 ${attacker.name} attacks ${defender.name}:`)
  logIfDev(
    `   Roll: ${attackRoll} + Attack: ${attacker.attack} = ${totalAttack} vs AC: ${defender.ac}`
  )

  if (hit) {
    const damageRoll = Math.floor(Math.random() * 6) + 1
    const totalDamage = damageRoll + Math.floor(attacker.attack / 2)

    // Use currentHP consistently for both player and monsters
    const currentHp = defender.currentHP
    const newHp = Math.max(0, currentHp - totalDamage)

    logIfDev(
      `   💥 HIT! Damage: ${damageRoll} + ${Math.floor(attacker.attack / 2)} = ${totalDamage}`
    )
    logIfDev(`   ${defender.name} HP: ${currentHp} → ${newHp}`)

    // Create different messages for Christos vs monsters
    let combatMessage = ''
    if (attacker.id === 'christos') {
      // Christos attacking - use "the" before monster name
      const monsterName = defender.name || defender.shortName || 'enemy'
      combatMessage =
        `Christos hit the ${monsterName} for ${totalDamage}` + (totalDamage >= 10 ? '!!' : '')
    } else {
      // Monster attacking - keep it simple
      combatMessage = `${attacker.name} hit for ${totalDamage}` + (totalDamage >= 10 ? '!!' : '')
    }

    // Dispatch combat log message
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: combatMessage },
    })

    // Update HP - use currentHP for both player and monsters
    if (defender.id === 'christos') {
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { updates: { currentHP: newHp } },
      })
    } else {
      dispatch({
        type: 'UPDATE_MONSTER',
        payload: { id: defender.id, updates: { currentHP: newHp } },
      })
    }

    // Check if defender is dead
    if (newHp <= 0) {
      logIfDev(`💀 ${defender.name} is defeated!`)

      let deathMessage = ''
      if (attacker.id === 'christos') {
        const monsterName = defender.name || defender.shortName || 'enemy'
        deathMessage = `Christos killed the ${monsterName}`
      } else {
        deathMessage = `${attacker.name} killed ${defender.name}`
      }

      dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: deathMessage },
      })

      if (defender.id !== 'christos') {
        dispatch({
          type: 'REMOVE_MONSTER',
          payload: { id: defender.id },
        })
        return true
      } else {
        // Player died - just dispatch GAME_OVER
        const killerName = attacker.name || attacker.shortName || 'unknown horror'

        // Use your COMBAT_STRINGS function here
        const deathMessage = COMBAT_STRINGS.death.player(killerName)

        dispatch({
          type: 'ADD_COMBAT_LOG',
          payload: { message: deathMessage },
        })

        // Send the message and killer name into GAME_OVER reducer
        dispatch({
          type: 'GAME_OVER',
          payload: { message: deathMessage, killerName: killerName },
        })

        return true
      }
    }
  } else {
    logIfDev(`   ❌ MISS!`)

    // Create different miss messages for Christos vs monsters
    let missMessage = ''
    if (attacker.id === 'christos') {
      const monsterName = defender.name || defender.shortName || 'enemy'
      missMessage = `Christos missed the ${monsterName}`
    } else {
      missMessage = `${attacker.name} missed`
    }

    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: missMessage },
    })
  }

  return false
}

// ==================== COMBAT TURN PROCESSING ====================

export const processCombatTurn = (state: GameState, dispatch: any, targetId?: string): void => {
  if (!state.inCombat || !state.attackSlots || state.attackSlots.length === 0) {
    logIfDev('No combat to process')
    return
  }

  logIfDev(`\n⚔️ COMBAT ROUND STARTING (Turn ${state.moveCount + 1})`)
  logIfDev(`   Player HP: ${state.player.currentHP}/${state.player.maxHP}`)
  logIfDev(`   Monsters in combat: ${state.attackSlots.length}`)

  const combatOrder = [state.player, ...state.attackSlots]

  for (const entity of combatOrder) {
    // Use currentHP consistently for both player and monsters
    const currentHp = (entity as any).currentHP
    if (currentHp <= 0) continue

    if (entity.id === 'christos') {
      logIfDev(`\n👤 ${entity.name}'s turn:`)
      let targetMonster = null
      if (targetId) {
        targetMonster = state.attackSlots.find((m: any) => m.id === targetId && m.currentHP > 0)
      }
      if (!targetMonster) {
        targetMonster = state.attackSlots.find((m: any) => m.currentHP > 0)
      }

      if (targetMonster) {
        const monsterDied = executeAttack(entity, targetMonster, dispatch)
        if (monsterDied) {
          const updatedAttackSlots = state.attackSlots.filter((m: any) => m.id !== targetMonster.id)
          dispatch({
            type: 'SET_COMBAT',
            payload: {
              ...state,
              attackSlots: updatedAttackSlots,
              inCombat: updatedAttackSlots.length > 0,
            },
          })
        }
      } else {
        logIfDev(`   No valid target for ${entity.name}'s attack`)
        dispatch({
          type: 'ADD_COMBAT_LOG',
          payload: { message: `${entity.name} has no target to attack!` },
        })
      }
    } else {
      logIfDev(`\n👹 ${entity.name}'s turn:`)
      const playerDied = executeAttack(entity, state.player, dispatch)
      if (playerDied) {
        logIfDev('💀 GAME OVER - Player defeated!')
        return
      }
    }
  }

  // Move waiting monsters into empty attack slots
  moveWaitingMonstersToAttackSlots(state, dispatch)

  logIfDev(`\n📊 COMBAT ROUND COMPLETE`)
  logIfDev(`   Player HP: ${state.player.currentHP}/${state.player.maxHP}`)
  state.attackSlots.forEach((monster: any) => {
    if (monster.currentHP > 0) {
      logIfDev(`   ${monster.name} HP: ${monster.currentHP}/${monster.maxHP}`)
    }
  })
}

// ==================== COMBAT MANAGEMENT ====================

const moveWaitingMonstersToAttackSlots = (state: GameState, dispatch: any): void => {
  const aliveMonsters = state.attackSlots.filter((m: any) => m.currentHP > 0)
  const availableSlots = (state.maxAttackers || 4) - aliveMonsters.length

  if (availableSlots > 0 && state.waitingMonsters.length > 0) {
    const newAttackSlots = [...aliveMonsters]
    const newWaitingMonsters = [...state.waitingMonsters]
    const slotPositions = [
      {
        row: state.player.position.row - 1,
        col: state.player.position.col - 1,
      },
      {
        row: state.player.position.row - 1,
        col: state.player.position.col + 1,
      },
      {
        row: state.player.position.row + 1,
        col: state.player.position.col - 1,
      },
      {
        row: state.player.position.row + 1,
        col: state.player.position.col + 1,
      },
    ]

    const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0)
    let monstersMoved = 0

    for (let i = 0; i < newWaitingMonsters.length && monstersMoved < availableSlots; i++) {
      const monster = newWaitingMonsters[i]
      const nextUISlot = [0, 1, 2, 3].find((slot) => !usedUISlots.includes(slot))
      if (nextUISlot !== undefined) {
        const combatMonster = {
          ...monster,
          position: { ...slotPositions[nextUISlot] },
          uiSlot: nextUISlot,
          inCombatSlot: true,
        }
        newAttackSlots.push(combatMonster)
        dispatch({
          type: 'MOVE_MONSTER',
          payload: { id: monster.id, position: combatMonster.position },
        })
        console.log(`✅ Monster ${monster.name} moved from waiting to attack slot ${nextUISlot}`)
        dispatch({
          type: 'ADD_COMBAT_LOG',
          payload: { message: `${monster.name} joins the combat!` },
        })
        usedUISlots.push(nextUISlot)
        newWaitingMonsters.splice(i, 1)
        i--
        monstersMoved++
      }
    }

    dispatch({
      type: 'SET_COMBAT',
      payload: {
        ...state,
        attackSlots: newAttackSlots,
        waitingMonsters: newWaitingMonsters,
        turnOrder: [state.player, ...newAttackSlots],
        combatTurn: state.player,
      },
    })
  }
}

export const checkCombatEnd = (state: GameState, dispatch: any): boolean => {
  const aliveMonsters = state.attackSlots?.filter((m: any) => m.currentHP > 0) || []

  if (aliveMonsters.length === 0) {
    logIfDev('🏆 Combat won - all monsters defeated!')
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'All enemies defeated!' },
    })
    dispatch({
      type: 'SET_COMBAT',
      payload: {
        inCombat: false,
        attackSlots: [],
        waitingMonsters: state.waitingMonsters || [],
        turnOrder: [state.player],
        combatTurn: state.player,
        combatLog: [], // Clear log
      },
    })
    return true
  }

  if (state.player.currentHP <= 0) {
    logIfDev('💀 Combat lost - player defeated!')

    const killer = aliveMonsters[0]?.name || 'unknown horror'

    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: COMBAT_STRINGS.death.player(killer) },
    })

    return true
  }

  return false
}

// ==================== COMBAT SETUP AND INITIALIZATION ====================

export const setupCombat = (
  state: GameState,
  dispatch: (action: any) => void,
  monster: Monster,
  playerPosOverride?: Position
): void => {
  logIfDev(`\n⚔️ SETTING UP COMBAT with ${monster.name}`)
  logIfDev(`📊 BEFORE SETUP - state.attackSlots:`, state.attackSlots)
  logIfDev(`📊 BEFORE SETUP - state.inCombat:`, state.inCombat)

  let newAttackSlots = [...(state.attackSlots || [])]
  let newWaitingMonsters = [...(state.waitingMonsters || [])]

  // Define attack slot positions around player
  const slotPositions = [
    { row: state.player.position.row - 1, col: state.player.position.col - 1 }, // Slot 0
    { row: state.player.position.row - 1, col: state.player.position.col + 1 }, // Slot 1
    { row: state.player.position.row + 1, col: state.player.position.col - 1 }, // Slot 2
    { row: state.player.position.row + 1, col: state.player.position.col + 1 }, // Slot 3
  ]

  // Check if monster is already in combat
  if (newAttackSlots.some((slot: any) => slot.id === monster.id)) {
    console.warn(`Monster ${monster.name} already in attack slots`)
    return
  }

  // Try to add to attack slots
  if (newAttackSlots.length < (state.maxAttackers || 4)) {
    const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0)
    const nextUISlot = [0, 1, 2, 3].find((slot) => !usedUISlots.includes(slot))

    if (nextUISlot !== undefined) {
      const combatMonster = {
        ...monster,
        position: { ...slotPositions[nextUISlot] },
        uiSlot: nextUISlot,
        inCombatSlot: true,
      }

      newAttackSlots.push(combatMonster)

      logIfDev(
        `✅ ADDED TO ATTACK SLOTS - Monster: ${monster.name}, ID: ${monster.id}, Slot: ${nextUISlot}`
      )
      logIfDev(`📊 NEW attackSlots array length:`, newAttackSlots.length)
      logIfDev(
        `📊 NEW attackSlots IDs:`,
        newAttackSlots.map((m) => m.id)
      )

      dispatch({
        type: 'MOVE_MONSTER',
        payload: { id: monster.id, position: combatMonster.position },
      })

      // Add combat log entry
      dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: `${monster.name} enters combat!` },
      })

      logIfDev(`✅ Monster ${monster.name} assigned to attack slot ${nextUISlot}`)
    } else {
      console.warn('No available UI slot for combat monster')
      return
    }
  } else {
    // Add to waiting monsters
    if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
      newWaitingMonsters.push(monster)
      logIfDev(`Monster ${monster.name} added to waiting queue`)
    }
    return
  }

  const newTurnOrder = [state.player, ...newAttackSlots]

  const combatPayload = {
    inCombat: true,
    attackSlots: newAttackSlots,
    waitingMonsters: newWaitingMonsters,
    turnOrder: newTurnOrder,
    combatTurn: newTurnOrder[0] || state.player,
  }

  logIfDev(`🎯 DISPATCHING SET_COMBAT with payload:`)

  dispatch({ type: 'SET_COMBAT', payload: combatPayload })

  // Add player comment at start of combat if combat just began
  if (!state.inCombat) {
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: getTextContent('combatStartPlayerComment') },
    })
  }

  // Add monster-specific combat start message
  dispatch({
    type: 'ADD_COMBAT_LOG',
    payload: { message: getTextContent('combatStart', [monster.name]) },
  })

  logIfDev(`⚔️ Combat initiated! ${newAttackSlots.length} monsters in attack slots`)
}

// ==================== COMBAT TURN HANDLER ====================

export const handleCombatTurn = (
  state: GameState,
  dispatch: any,
  action: string,
  targetId?: string,
  setDeathMessage?: (message: string) => void // Can remove this parameter now
): void => {
  if (!state.inCombat) {
    logIfDev('handleCombatTurn called but not in combat')
    return
  }

  logIfDev(`\n⚔️ PROCESSING COMBAT ACTION: ${action}`)
  processCombatTurn(state, dispatch, targetId)
  checkCombatEnd(state, dispatch)
}

// ==================== MONSTER MOVEMENT AND COLLISION ====================

export const checkForCombatCollision = (
  state: GameState,
  monster: Monster,
  newPosition: Position,
  playerPos: Position
): boolean => {
  if (checkCollision(newPosition, playerPos)) {
    if (!state.player.isHidden) {
      return true // Combat should be initiated
    }
  }
  return false
}

// ==================== RANGED ATTACK ====================

/**
 * Get the name of the player's equipped ranged weapon
 * @param state - Current game state
 * @returns The weapon name or a default
 */
const getEquippedRangedWeaponName = (state: GameState): string => {
  if (!state.player.equippedRangedWeaponId) {
    return 'bow' // Default fallback
  }

  const weapon = state.weapons?.find((w) => w.id === state.player.equippedRangedWeaponId)
  return weapon?.name || 'ranged weapon'
}

/**
 * Get the projectile color for the equipped ranged weapon
 * @param state - Current game state
 * @returns The projectile color or a default
 */
const getEquippedRangedWeaponProjectileColor = (state: GameState): string => {
  if (!state.player.equippedRangedWeaponId) {
    return '#FFFFFF' // Default white
  }

  const weapon = state.weapons?.find((w) => w.id === state.player.equippedRangedWeaponId)
  return weapon?.projectileColor || '#FFFFFF'
}

/**
 * Get the projectile style (dimensions, glow) for the equipped ranged weapon
 * @param state - Current game state
 * @returns Object containing projectile style properties
 */
const getEquippedRangedWeaponProjectileStyle = (
  state: GameState
): {
  lengthPx?: number
  thicknessPx?: number
  glow?: boolean
} => {
  if (!state.player.equippedRangedWeaponId) {
    return {}
  }

  const weapon = state.weapons?.find((w) => w.id === state.player.equippedRangedWeaponId)
  if (!weapon) {
    return {}
  }

  return {
    lengthPx: weapon.projectileLengthPx,
    thicknessPx: weapon.projectileThicknessPx,
    glow: weapon.projectileGlow,
  }
}

/**
 * Execute a ranged attack from the player to a target monster
 * This spawns a projectile and returns the projectile ID
 * The actual hit/miss/damage calculation happens when the projectile completes
 * @param state - Current game state
 * @param dispatch - Dispatch function for state updates
 * @param targetMonsterId - ID of the monster to attack
 * @param playerScreenX - Player's screen X coordinate (in pixels)
 * @param playerScreenY - Player's screen Y coordinate (in pixels)
 * @param monsterScreenX - Monster's screen X coordinate (in pixels)
 * @param monsterScreenY - Monster's screen Y coordinate (in pixels)
 * @returns Projectile ID if spawned, null otherwise
 */
export const executeRangedAttack = (
  state: GameState,
  dispatch: any,
  targetMonsterId: string,
  playerScreenX: number,
  playerScreenY: number,
  monsterScreenX: number,
  monsterScreenY: number
): string | null => {
  // Find the target monster in either activeMonsters or attackSlots
  let targetMonster = state.activeMonsters.find((m) => m.id === targetMonsterId && m.currentHP > 0)

  if (!targetMonster) {
    targetMonster = state.attackSlots.find((m) => m.id === targetMonsterId && m.currentHP > 0)
  }

  if (!targetMonster) {
    logIfDev('No valid target for ranged attack')
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'No target in range' },
    })
    return null
  }

  const player = state.player
  const weaponName = getEquippedRangedWeaponName(state)
  const projectileColor = getEquippedRangedWeaponProjectileColor(state)
  const projectileStyle = getEquippedRangedWeaponProjectileStyle(state)

  // Log attempt
  const monsterName = targetMonster.name || targetMonster.shortName || 'enemy'
  dispatch({
    type: 'ADD_COMBAT_LOG',
    payload: { message: `Christos attempts a shot with ${weaponName} at ${monsterName}.` },
  })

  logIfDev(`\n🏹 Christos ranged attack on ${monsterName}:`)

  // Calculate projectile trajectory
  const dx = monsterScreenX - playerScreenX
  const dy = monsterScreenY - playerScreenY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI

  // Calculate duration based on distance (faster for short distances, slower for long)
  const pixelsPerMs = 0.5 // Speed of projectile
  const durationMs = Math.max(120, Math.min(450, distance / pixelsPerMs))

  // Create projectile
  const projectileId = `projectile-${Date.now()}-${Math.random()}`
  const projectile = {
    id: projectileId,
    startX: playerScreenX,
    startY: playerScreenY,
    endX: monsterScreenX,
    endY: monsterScreenY,
    angleDeg,
    color: projectileColor,
    createdAt: Date.now(),
    durationMs,
    lengthPx: projectileStyle.lengthPx,
    thicknessPx: projectileStyle.thicknessPx,
    glow: projectileStyle.glow,
  }

  // Spawn projectile
  dispatch({
    type: 'ADD_PROJECTILE',
    payload: projectile,
  })

  // Cancel Hide if active (ranged attacks break stealth)
  if (state.player.hideActive) {
    logIfDev('🥷 Ranged attack cancels Hide')
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { hideActive: false },
      },
    })
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'Hide cancelled by ranged attack!' },
    })
  }

  logIfDev(
    `🎯 Projectile spawned: id=${projectileId}, duration=${durationMs}ms, angle=${angleDeg}°`
  )

  return projectileId
}

/**
 * Process the hit/miss/damage for a ranged attack after projectile impact
 * This is called when the projectile animation completes
 * @param state - Current game state
 * @param dispatch - Dispatch function for state updates
 * @param targetMonsterId - ID of the monster to attack
 * @returns true if the target died, false otherwise
 */
export const processRangedAttackImpact = (
  state: GameState,
  dispatch: any,
  targetMonsterId: string
): boolean => {
  // Find the target monster in either activeMonsters or attackSlots
  let targetMonster = state.activeMonsters.find((m) => m.id === targetMonsterId && m.currentHP > 0)

  if (!targetMonster) {
    targetMonster = state.attackSlots.find((m) => m.id === targetMonsterId && m.currentHP > 0)
  }

  if (!targetMonster) {
    logIfDev('Target no longer exists for ranged attack impact')
    return false
  }

  const player = state.player
  const monsterName = targetMonster.name || targetMonster.shortName || 'enemy'

  // Perform hit/miss roll using d20 system
  const attackRoll = rollD20()
  const totalAttack = attackRoll + player.attack
  const hit = totalAttack >= targetMonster.ac

  logIfDev(
    `   Roll: ${attackRoll} + Attack: ${player.attack} = ${totalAttack} vs AC: ${targetMonster.ac}`
  )

  if (hit) {
    // Calculate damage using d6 dice roll
    const damageRoll = rollD6()
    const totalDamage = damageRoll + Math.floor(player.attack / 2)
    const newHp = Math.max(0, targetMonster.currentHP - totalDamage)

    logIfDev(`   💥 HIT! Damage: ${damageRoll} + ${Math.floor(player.attack / 2)} = ${totalDamage}`)
    logIfDev(`   ${monsterName} HP: ${targetMonster.currentHP} → ${newHp}`)

    // Log hit and damage
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'Hit!' },
    })
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: `${monsterName} takes ${totalDamage} damage.` },
    })

    // Update monster HP using currentHP
    dispatch({
      type: 'UPDATE_MONSTER',
      payload: { id: targetMonster.id, updates: { currentHP: newHp } },
    })

    // Check if monster dies
    if (newHp <= 0) {
      logIfDev(`💀 ${monsterName} is defeated!`)
      dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: `${monsterName} dies.` },
      })
      dispatch({
        type: 'REMOVE_MONSTER',
        payload: { id: targetMonster.id },
      })

      return true // Target died
    }
  } else {
    logIfDev(`   ❌ MISS!`)
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'Miss!' },
    })
  }

  return false // Target survived
}
