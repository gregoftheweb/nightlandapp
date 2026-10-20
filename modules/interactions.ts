// modules/interactions.ts - Optimized with spatial grid
import { GameState, Position, Item, NonCollisionObject } from '../config/types'
import { createItemInstance } from '../config/levelHelpers'
import { COMBAT_STRINGS } from '@assets/copy/combat'
import { buildSpatialGrid, checkOverlap, SpatialGrid } from './spacialGrid'
import { applyEffect } from './effects'
import { effectRegions, terrainContains } from './terrain'

// ==================== ITEM INTERACTIONS ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  setOverlay?: (overlay: any) => void,
  spatialGrid: SpatialGrid = buildSpatialGrid(state)
) => {
  const playerPos = state.player.position

  console.log(`🔍 CHECKING ITEM INTERACTIONS at position (${playerPos.row}, ${playerPos.col})`)

  const nearbyEntities = spatialGrid.getNearbyByType(playerPos, 'item', 0)

  console.log(
    `Found ${nearbyEntities.length} nearby items (filtered from ${state.items?.length || 0} total)`
  )

  // Find collectible item at player's exact position
  const collectibleAtPosition = nearbyEntities.find((entity) => {
    const item = entity.data as Item

    if (!item || !item.active || !item.collectible || !item.position) {
      return false
    }

    // Check overlap with player position (player is 1x1)
    return checkOverlap(
      playerPos,
      1,
      1,
      item.position,
      item.size?.width || 1,
      item.size?.height || 1
    )
  })

  if (!collectibleAtPosition) {
    console.log('No collectible items found at player position')
    return
  }

  const item = collectibleAtPosition.data as Item

  console.log(
    `📦 Found collectible item: ${item.name} at (${item.position?.row}, ${item.position?.col})`
  )

  // Check inventory space
  if (item.type !== 'weapon') {
    if (state.player.inventory.length >= state.player.maxInventorySize) {
      console.log(`❌ Inventory full - cannot collect ${item.name}`)
      return
    }
  }

  // Handle splash screen
  if (item.splash && setOverlay) {
    setOverlay({
      image: item.splash.image,
      text: item.splash.text,
    })
  }

  // Handle collection. Both handlers report whether the item was actually
  // collected so a full inventory doesn't silently delete the item from the
  // board (see the matching note at the call site below).
  const collected =
    item.type === 'weapon'
      ? handleWeaponCollection(item, state, dispatch)
      : handleConsumableCollection(item, state, dispatch)

  if (!collected) {
    console.log(`⏭️ Leaving ${item.name} on the board (collection did not succeed)`)
    return
  }

  // Remove from gameboard. Only reached when collection actually succeeded -
  // otherwise the item would vanish from the board without ever reaching the
  // player's inventory.
  dispatch({
    type: 'REMOVE_ITEM_FROM_GAMEBOARD',
    payload: {
      position: item.position,
      shortName: item.shortName,
    },
  })

  console.log(`✅ Item collection completed for: ${item.name}`)
}

// ==================== WEAPON COLLECTION ====================

const handleWeaponCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
): boolean => {
  console.log(`⚔️ Attempting to collect weapon: ${item.name}`)

  if (state.player.weapons.length >= state.player.maxWeaponsSize) {
    console.log(`❌ Weapon inventory full - cannot collect ${item.name}`)
    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: 'Weapon inventory is full.' },
    })
    return false
  }

  const inventoryItem = createItemInstance(item.shortName, state.player.position)

  if (!inventoryItem) {
    console.warn('❌ Failed to create weapon instance:', item.shortName)
    return false
  }

  dispatch({
    type: 'ADD_TO_WEAPONS',
    payload: { weapon: inventoryItem },
  })

  // Short, non-blocking "picked up X" notice. Reuses the same combat-log ->
  // CombatDialog pipeline the "terrain blocks the way" message already uses
  // outside combat: CombatDialog auto-dismisses after 2s and has no touch
  // handlers, so tap-to-move keeps working while it's showing.
  dispatch({
    type: 'ADD_COMBAT_LOG',
    payload: { message: `Picked up: ${item.name}` },
  })

  console.log(`📦 Weapon added: ${inventoryItem.name}`)
  return true
}

// ==================== CONSUMABLE COLLECTION ====================

const handleConsumableCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
): boolean => {
  console.log(`🧪 Attempting to collect consumable: ${item.name}`)

  const inventoryItem = createItemInstance(item.shortName, state.player.position)

  if (!inventoryItem) {
    console.warn('❌ Failed to create consumable instance:', item.shortName)
    return false
  }

  dispatch({
    type: 'ADD_TO_INVENTORY',
    payload: { item: inventoryItem },
  })

  // See the matching comment in handleWeaponCollection above.
  dispatch({
    type: 'ADD_COMBAT_LOG',
    payload: { message: `Picked up: ${item.name}` },
  })

  console.log(`📦 Consumable added: ${item.name} (ID: ${inventoryItem.id})`)
  return true
}

// ==================== OBJECT INTERACTIONS ====================

export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position,
  spatialGrid: SpatialGrid = buildSpatialGrid(state)
) => {
  console.log('Checking object interactions at playerPos:', playerPos)

  // Check regular objects
  const nearbyObjects = spatialGrid.getNearbyByType(playerPos, 'object', 0)

  const collidingObject = nearbyObjects.find((entity) => {
    const obj = entity.data as any

    if (!obj.active) return false

    // Check collision with collision mask if it exists
    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const maskPos = {
          row: obj.position.row + mask.row,
          col: obj.position.col + mask.col,
        }

        return checkOverlap(playerPos, 1, 1, maskPos, mask.width || 1, mask.height || 1)
      })
    }

    return checkOverlap(playerPos, 1, 1, obj.position, obj.size?.width || 1, obj.size?.height || 1)
  })

  // Check Great Powers
  const collidingGreatPower = state.level.greatPowers?.find((gp: any) => {
    return checkOverlap(playerPos, 1, 1, gp.position, gp.width || 1, gp.height || 1)
  })

  // Check non-collision objects (now using spatial grid!)
  const nearbyNonCollisionObjects = spatialGrid.getNearbyByType(playerPos, 'nonCollisionObject', 0)

  const collidingNonCollisionObject = nearbyNonCollisionObjects.find((entity) => {
    // The grid entity position already represents the mask tile position
    return checkOverlap(playerPos, 1, 1, entity.position, entity.width, entity.height)
  })

  // Handle collisions
  if (collidingObject) {
    handleObjectEffects(collidingObject.data, state, dispatch, playerPos)
  }

  if (collidingGreatPower) {
    handleGreatPowerEffects(collidingGreatPower, state, dispatch, playerPos)
  }

  if (collidingNonCollisionObject) {
    // Get the parent object from the entity data
    const obj = collidingNonCollisionObject.data as NonCollisionObject
    if (obj.type !== 'river') handleNonCollisionObjectEffects(obj, state, dispatch, playerPos)
  }

  const regions = effectRegions(state).filter((r) => terrainContains(r, playerPos))
  for (const region of regions) {
    // Entry-only effects use the previous checked position; repeated effects preserve river behavior.
    if (
      region.effectTiming === 'onEnter' &&
      terrainContains(region, state.lastTerrainInteractionPosition ?? { row: -1, col: -1 })
    )
      continue
    for (const effect of region.effects ?? [])
      applyEffect(effect, {
        state,
        dispatch,
        sourceType: 'object',
        sourceId: region.id,
        trigger: 'onEnterTile',
        position: playerPos,
      })
  }
  if (effectRegions(state).some((r) => r.effectTiming === 'onEnter'))
    dispatch({ type: 'SET_TERRAIN_INTERACTION_POSITION', payload: { position: { ...playerPos } } })
  // Only clear hide if player is not on any object with hide effects
  if (
    !collidingObject &&
    !collidingNonCollisionObject &&
    !regions.some((r) => r.effects?.some((e) => e.type === 'hide'))
  ) {
    dispatch({ type: 'CLEAR_HIDE' })
  }
}

// ==================== EFFECT HANDLERS ====================

const handleObjectEffects = (
  obj: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  if (!obj.effects) {
    return
  }

  const needsCooldown = obj.effects.some((e: any) => e.type === 'swarm' || e.type === 'heal')

  if (needsCooldown) {
    const now = Date.now()
    const lastTrigger = obj.lastTrigger || 0

    if (now - lastTrigger <= 50000) {
      console.log(`Cooldown active for ${obj.name}`)
      return
    }
  }

  // Apply each effect through unified effects system
  obj.effects.forEach((effect: any) => {
    const context = {
      state,
      dispatch,
      sourceType: 'object' as const,
      sourceId: obj.shortName,
      trigger: 'onEnterTile' as const,
      position: playerPos,
    }

    const result = applyEffect(effect, context)

    if (result.success) {
      console.log(`✅ Object effect applied: ${result.message}`)
    }
  })

  if (needsCooldown) {
    dispatch({
      type: 'UPDATE_OBJECT',
      payload: {
        shortName: obj.shortName,
        updates: { lastTrigger: Date.now() },
      },
    })
  }
}

const handleGreatPowerEffects = (
  greatPower: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  console.log(`Player collided with Great Power: ${greatPower.name}`)

  if (greatPower.effects) {
    const deathMessage = COMBAT_STRINGS.soulSuckDeath.player(greatPower.name)

    dispatch({
      type: 'ADD_COMBAT_LOG',
      payload: { message: deathMessage },
    })

    // Apply effects through unified effects system
    greatPower.effects.forEach((effect: any) => {
      // Create effect context with death message for soulsuck effects
      const context = {
        state,
        dispatch,
        sourceType: 'object' as const,
        sourceId: greatPower.id,
        trigger: 'onGreatPowerCollision' as const,
        position: playerPos,
      }

      // For soulsuck effects, pass death message through modified effect object
      // (create new object to avoid mutating config)
      const effectToApply =
        effect.type === 'soulsuck' && !effect.description
          ? { ...effect, description: deathMessage }
          : effect

      applyEffect(effectToApply, context)
    })
  }
}

const handleNonCollisionObjectEffects = (
  obj: NonCollisionObject,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  if (!obj.collisionEffects) return

  // Apply effects through unified effects system
  obj.collisionEffects.forEach((effect) => {
    const context = {
      state,
      dispatch,
      sourceType: 'object' as const,
      sourceId: obj.shortName,
      trigger: 'onEnterTile' as const,
      position: playerPos,
    }

    const result = applyEffect(effect, context)

    if (result.success) {
      console.log(`✅ Non-collision object effect applied: ${result.message}`)
    }
  })
}
