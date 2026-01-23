/**
 * ============================================================================
 * UNIFIED EFFECTS SYSTEM
 * ============================================================================
 * 
 * This module is the SINGLE source of truth for all effect execution in the game.
 * ALL effects (from items, objects, abilities, spells, etc.) MUST flow through
 * the applyEffect() function defined here.
 * 
 * ## Architecture
 * 
 * Effects are defined in config files:
 * - `/config/objects.ts` - Object/building effects (heal, hide, swarm, etc.)
 * - `/config/levels.ts` - Ability/spell effects
 * - Item templates - Consumable item effects
 * 
 * ## Effect Triggers
 * 
 * Effects can be triggered by various game events:
 * - `onUseItem` - Player uses a consumable item from inventory
 * - `onEnterTile` - Player steps onto a tile with an object that has effects
 * - `onInteract` - Player explicitly interacts with an object
 * - `onTurnStart` - Beginning of player's turn (passive effects, ticking)
 * - `onTurnEnd` - End of player's turn (passive effects, ticking)
 * - `onCombatHit` - Effect triggers on successful attack
 * - `onGreatPowerCollision` - Player collides with a Great Power
 * 
 * ## Duration & Expiration
 * 
 * - Effects with `duration` property create timed status effects
 * - Duration is tracked in turns and decremented via DECREMENT_CLOAKING_TURNS action
 * - When duration reaches 0, effect automatically expires
 * - Some effects are instant (heal, damage) with no duration
 * 
 * ## Stacking Rules
 * 
 * - Most effects refresh duration when reapplied (hide, cloaking)
 * - Healing effects stack (multiple heals add up)
 * - Spawn effects always execute (multiple swarms create more monsters)
 * 
 * ## Adding a New Effect
 * 
 * 1. Add effect type to Effect interface in `/config/types.ts`
 * 2. Define effect in appropriate config file (objects.ts, levels.ts, etc.)
 * 3. Implement effect handler function here (executeXxxEffect)
 * 4. Register handler in EFFECT_HANDLERS registry
 * 5. Add test cases to `/modules/__tests__/effects.test.ts`
 * 
 * ============================================================================
 */

import { GameState, Item, Effect, Monster, Position } from '../config/types'
import { createMonsterFromTemplate } from './monsterUtils'
import { logIfDev } from './utils'

// ==================== EFFECT EXECUTION INTERFACE ====================

/**
 * Context information for effect execution.
 * Provides all necessary information about the source, target, and trigger of an effect.
 */
export interface EffectContext {
  state: GameState
  dispatch: (action: any) => void
  showDialog?: (message: string, duration?: number) => void
  
  // Source information
  sourceType: 'player' | 'monster' | 'object' | 'item' | 'system'
  sourceId?: string // ID of the source entity (objectId, monsterId, itemId)
  
  // Target information
  targetType?: 'player' | 'monster' | 'tile' | 'none'
  targetId?: string // ID of the target entity if applicable
  
  // Trigger context
  trigger: 'onUseItem' | 'onEnterTile' | 'onInteract' | 'onTurnStart' | 'onTurnEnd' | 'onCombatHit' | 'onGreatPowerCollision'
  
  // Location context
  position?: Position // Position where effect is triggered
  
  // Legacy compatibility
  item?: Item // The item being used (if applicable)
}

/**
 * Result of an effect execution.
 */
export interface EffectResult {
  success: boolean
  message: string
  consumeItem?: boolean // Should the item be consumed/removed after use?
  logMessage?: string // Optional message for combat/event log
}

// ==================== EFFECT HANDLERS ====================

/**
 * HEAL EFFECT
 * Restores HP to the player, capped at maxHP.
 * Used by: health potions, healing pools, recuperation zones
 * 
 * Note: Supports both 'value' and 'amount' fields for backward compatibility
 * with different config sources (objects.ts uses 'value', some items may use 'amount')
 */
const executeHealEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, showDialog } = context
  const healAmount = effect.value || effect.amount || 0

  logIfDev('🩹 Executing heal effect:', { healAmount, currentHP: state.player.hp, maxHP: state.player.maxHP })

  // Check if player needs healing
  if (state.player.hp >= state.player.maxHP) {
    return {
      success: false,
      message: 'You are already at full health!',
      consumeItem: false,
    }
  }

  // Check resource costs if any
  if (effect.cost) {
    if (effect.cost.hp && state.player.hp < effect.cost.hp) {
      return {
        success: false,
        message: 'Not enough HP to use this item!',
        consumeItem: false,
      }
    }
  }

  // Calculate actual heal amount (don't exceed max HP)
  const currentHp = state.player.hp
  const maxHp = state.player.maxHP
  const actualHealAmount = Math.min(healAmount, maxHp - currentHp)
  const newHp = currentHp + actualHealAmount

  // Update player HP
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { hp: newHp },
    },
  })

  // Pay resource costs
  if (effect.cost?.hp) {
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { hp: newHp - effect.cost.hp },
      },
    })
  }

  // Show feedback
  const message = `Restored ${actualHealAmount} HP! (${newHp}/${maxHp})`
  showDialog?.(message, 3000)

  logIfDev(`✅ Heal effect: ${currentHp} -> ${newHp} (+${actualHealAmount})`)

  return {
    success: true,
    message,
    consumeItem: context.sourceType === 'item', // Only consume if from item
  }
}

/**
 * RECUPERATE EFFECT
 * Similar to heal, but only heals if player is below max HP.
 * Used by: safe zones, rest areas like The Last Redoubt
 * 
 * Note: Supports both 'value' and 'amount' fields for backward compatibility
 */
const executeRecuperateEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, showDialog } = context
  const healAmount = effect.value || effect.amount || 5

  logIfDev('💤 Executing recuperate effect:', { healAmount, currentHP: state.player.hp, maxHP: state.player.maxHP })

  // Only heal if player is below max HP
  if (state.player.hp >= state.player.maxHP) {
    logIfDev('Player at max HP, recuperate has no effect')
    return {
      success: false,
      message: 'You are already at full health.',
      consumeItem: false,
    }
  }

  const currentHp = state.player.hp
  const maxHp = state.player.maxHP
  const actualHealAmount = Math.min(healAmount, maxHp - currentHp)
  const newHp = currentHp + actualHealAmount

  // Update player HP
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { hp: newHp },
    },
  })

  const message = `You rest and recuperate. +${actualHealAmount} HP (${newHp}/${maxHp})`
  showDialog?.(message, 3000)

  logIfDev(`✅ Recuperate: ${currentHp} -> ${newHp} (+${actualHealAmount})`)

  return {
    success: true,
    message,
    consumeItem: false,
  }
}

/**
 * HIDE EFFECT
 * Sets player invisibility flag, making them hidden from enemies.
 * 
 * Intended Behavior (inferred from usage):
 * - Sets `isHidden: true` on player state
 * - Prevents monsters from detecting/targeting player
 * - Infinite duration unless explicitly cleared or player attacks
 * - Used by: safe zones (redoubt, healing pools, wreckage sites)
 * 
 * Note: For timed invisibility, use 'cloaking' effect instead
 */
const executeHideEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, showDialog } = context

  logIfDev('🥷 Executing hide effect')

  // If already hidden, just refresh the status
  if (state.player.isHidden) {
    logIfDev('Player already hidden, refreshing')
    return {
      success: true,
      message: 'You remain hidden in the shadows.',
      consumeItem: false,
    }
  }

  // Set player to hidden state
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { isHidden: true },
    },
  })

  const message = effect.description || 'You blend into the shadows, hidden from view.'
  showDialog?.(message, 3000)

  logIfDev('✅ Player is now hidden')

  return {
    success: true,
    message,
    consumeItem: false,
  }
}

/**
 * CLOAKING EFFECT
 * Timed invisibility effect with turn-based duration.
 * 
 * Intended Behavior:
 * - Sets `isHidden: true` on player state
 * - Sets `hideTurns` to specified duration
 * - Duration decrements each turn via DECREMENT_CLOAKING_TURNS action
 * - Automatically expires when hideTurns reaches 0
 * - Stacking behavior: refreshes duration to maximum
 */
const executeCloakingEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, showDialog } = context
  const duration = effect.duration || 5

  logIfDev('🌫️ Executing cloaking effect:', { duration, currentHideTurns: state.player.hideTurns })

  // Set player to hidden state with duration
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { 
        isHidden: true,
        hideTurns: duration,
      },
    },
  })

  const message = `You are cloaked in shadows for ${duration} turns.`
  showDialog?.(message, 3000)

  logIfDev(`✅ Player cloaked for ${duration} turns`)

  return {
    success: true,
    message,
    consumeItem: context.sourceType === 'item',
  }
}

/**
 * SWARM EFFECT
 * Spawns multiple monsters in a circular pattern around a position.
 * 
 * Behavior:
 * - Spawns `count` monsters of type `monsterType`
 * - Monsters spawn within `range` tiles of trigger position
 * - Random variance of ±5 tiles applied to each spawn
 * - Monsters are added to activeMonsters array
 * 
 * Used by: cursed totems, monster nests, dark rituals
 */
const executeSwarmEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, position } = context

  logIfDev('🐝 Executing swarm effect:', effect)

  // Validate required properties
  if (!effect.monsterType || !effect.count || !effect.range) {
    logIfDev('❌ Swarm effect missing required properties:', effect)
    return {
      success: false,
      message: 'Swarm effect misconfigured.',
      consumeItem: false,
    }
  }

  const spawnRange = effect.range
  const spawnPosition = position || state.player.position
  const newMonsters: Monster[] = []

  // Create the specified number of monsters
  for (let i = 0; i < effect.count; i++) {
    // Generate random offset within range
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * spawnRange

    // Calculate spawn position relative to trigger position
    const rowOffset = Math.round(Math.sin(angle) * distance)
    const colOffset = Math.round(Math.cos(angle) * distance)

    // Add random variance (±5 grid squares)
    const variance = 5
    const rowVariance = Math.floor(Math.random() * variance * 2) - variance
    const colVariance = Math.floor(Math.random() * variance * 2) - variance

    // Calculate final position, clamped to grid bounds
    const spawnRow = Math.max(
      0,
      Math.min(state.gridHeight - 1, spawnPosition.row + rowOffset + rowVariance)
    )
    const spawnCol = Math.max(
      0,
      Math.min(state.gridWidth - 1, spawnPosition.col + colOffset + colVariance)
    )

    const finalPosition: Position = { row: spawnRow, col: spawnCol }

    // Create monster using the utility function
    const monster = createMonsterFromTemplate(effect.monsterType, finalPosition)

    if (monster) {
      newMonsters.push(monster)
      logIfDev(`Swarm spawned ${monster.name} at ${spawnRow},${spawnCol}`)
    }
  }

  // Add monsters to active monsters
  dispatch({
    type: 'UPDATE_ACTIVE_MONSTERS',
    payload: {
      activeMonsters: [...state.activeMonsters, ...newMonsters],
    },
  })

  const message = `A swarm of ${effect.monsterType}s emerges!`
  
  logIfDev(`✅ Spawned ${newMonsters.length} ${effect.monsterType}s`)

  return {
    success: true,
    message,
    logMessage: message,
    consumeItem: false,
  }
}

/**
 * SOULSUCK EFFECT
 * Instant death effect used by Great Powers.
 * 
 * Behavior:
 * - Sets player HP to 0
 * - Triggers game over state
 * - Displays custom death message
 * - Ends any active combat
 * 
 * Used by: Great Powers (Watchers, House of Silence, etc.)
 */
const executeSoulsuckEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch } = context

  logIfDev('💀 Executing soulsuck effect - player soul consumed!')

  const message = effect.description || 'Your soul has been consumed by the Great Power.'

  // Instant death
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { hp: 0 },
    },
  })

  // Trigger game over
  dispatch({
    type: 'GAME_OVER',
    payload: {
      message,
    },
  })

  logIfDev('✅ Soulsuck complete - game over')

  return {
    success: true,
    message,
    logMessage: message,
    consumeItem: false,
  }
}

/**
 * POISON EFFECT
 * Deals damage over time to the player.
 * 
 * Behavior:
 * - Applies immediate poison damage
 * - Can be extended to apply DOT (damage over time) status
 * 
 * Used by: poison pools, toxic enemies, cursed items
 * 
 * Note: Supports both 'value' and 'amount' fields for backward compatibility
 */
const executePoisonEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { state, dispatch, showDialog } = context
  const damage = effect.value || effect.amount || 5

  logIfDev('☠️ Executing poison effect:', { damage, currentHP: state.player.hp })

  const currentHp = state.player.hp
  const newHp = Math.max(0, currentHp - damage)

  // Apply poison damage
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { hp: newHp },
    },
  })

  const message = `Poison courses through your veins! -${damage} HP (${newHp}/${state.player.maxHP})`
  showDialog?.(message, 3000)

  logIfDev(`✅ Poison damage: ${currentHp} -> ${newHp} (-${damage})`)

  // Check if player died from poison
  if (newHp <= 0) {
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: 'You succumb to the poison...',
      },
    })
  }

  return {
    success: true,
    message,
    logMessage: message,
    consumeItem: false,
  }
}

/**
 * SHOW MESSAGE EFFECT
 * Displays a message to the player without consuming the item.
 * Used for: readable items like scrolls, notes, and letters.
 */
const executeShowMessageEffect = (effect: Effect, context: EffectContext): EffectResult => {
  const { showDialog } = context
  const message = effect.message || effect.description || 'A message appears.'

  logIfDev('📜 Executing showMessage effect')
  
  showDialog?.(message, 5000)

  return {
    success: true,
    message: 'You read the scroll.',
    consumeItem: false,
  }
}

// ==================== EFFECT HANDLER REGISTRY ====================

/**
 * Registry of all effect handlers.
 * Maps effect type to its handler function.
 */
type EffectHandler = (effect: Effect, context: EffectContext) => EffectResult

const EFFECT_HANDLERS: Record<string, EffectHandler> = {
  heal: executeHealEffect,
  recuperate: executeRecuperateEffect,
  hide: executeHideEffect,
  cloaking: executeCloakingEffect,
  swarm: executeSwarmEffect,
  soulsuck: executeSoulsuckEffect,
  poison: executePoisonEffect,
  showMessage: executeShowMessageEffect,
  // Add new effect handlers here as they are implemented
}

// ==================== MAIN EFFECT EXECUTOR ====================

/**
 * UNIFIED EFFECT APPLICATION
 * 
 * This is the SINGLE entry point for ALL effect execution in the game.
 * All code paths (items, objects, abilities, etc.) MUST call this function.
 * 
 * @param effect - The effect definition from config
 * @param context - Full context including source, target, trigger, and game state
 * @returns EffectResult with success status and message
 */
export const applyEffect = (effect: Effect, context: EffectContext): EffectResult => {
  logIfDev(`🎯 Applying effect: ${effect.type}`, {
    source: `${context.sourceType}${context.sourceId ? ':' + context.sourceId : ''}`,
    trigger: context.trigger,
    position: context.position,
  })

  // Get handler for this effect type
  const handler = EFFECT_HANDLERS[effect.type]
  
  if (!handler) {
    console.warn(`❌ Unknown effect type: ${effect.type}`)
    return {
      success: false,
      message: `Unknown effect: ${effect.type}`,
      consumeItem: false,
    }
  }

  // Execute the effect handler
  const result = handler(effect, context)
  
  logIfDev(`${result.success ? '✅' : '❌'} Effect ${effect.type} ${result.success ? 'succeeded' : 'failed'}: ${result.message}`)
  
  return result
}

/**
 * LEGACY COMPATIBILITY WRAPPER
 * 
 * Maintains compatibility with existing item usage code.
 * Converts old EffectExecutionContext to new EffectContext.
 * 
 * @deprecated Use applyEffect() directly with full EffectContext
 */
export const executeEffect = (effect: Effect, context: any): EffectResult => {
  console.warn('⚠️ executeEffect is deprecated, use applyEffect() instead')
  
  // Convert legacy context to new context
  const newContext: EffectContext = {
    state: context.state,
    dispatch: context.dispatch,
    showDialog: context.showDialog,
    item: context.item,
    sourceType: context.item ? 'item' : 'system',
    sourceId: context.item?.id,
    trigger: 'onUseItem',
  }
  
  return applyEffect(effect, newContext)
}

// ==================== ITEM USAGE HANDLER ====================

/**
 * Handle item usage from inventory.
 * Executes all effects on the item and determines if item should be consumed.
 */
export const useItem = (item: Item, state: GameState, dispatch: (action: any) => void, showDialog?: (message: string, duration?: number) => void): EffectResult => {
  logIfDev(`📦 Using item: ${item.name}`)

  // Check if item has effects
  if (!item.effects || item.effects.length === 0) {
    return {
      success: false,
      message: `${item.name} cannot be used.`,
      consumeItem: false,
    }
  }

  // Execute all effects on the item
  let overallSuccess = true
  let messages: string[] = []
  let shouldConsume = false

  for (const effect of item.effects) {
    const context: EffectContext = {
      state,
      dispatch,
      showDialog,
      sourceType: 'item',
      sourceId: item.id,
      trigger: 'onUseItem',
      item,
    }
    
    const result = applyEffect(effect, context)

    if (result.success) {
      messages.push(result.message)
      if (result.consumeItem) {
        shouldConsume = true
      }
    } else {
      overallSuccess = false
      messages.push(result.message)
    }
  }

  return {
    success: overallSuccess,
    message: messages.join(' '),
    consumeItem: shouldConsume,
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const canUseItem = (item: Item): boolean => {
  console.log('Checking if item can be used:', item.name)
  console.log('Item effects:', item.effects)
  console.log('Effects length:', item.effects?.length)

  const canUse = !!(item.effects && item.effects.length > 0)
  console.log('Can use result:', canUse)

  return canUse
}

export const getItemEffectDescription = (item: Item): string => {
  if (!item.effects || item.effects.length === 0) {
    return 'This item has no special effects.'
  }

  const descriptions: string[] = []

  for (const effect of item.effects) {
    switch (effect.type) {
      case 'heal':
        descriptions.push(`Restores ${effect.value} HP`)
        break
      default:
        descriptions.push(`${effect.type} effect`)
    }
  }

  return descriptions.join(', ')
}
