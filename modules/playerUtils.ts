// modules/playerUtils.ts - Interaction utilities
import { GameState, Position } from '../config/types'
import { applyEffect } from './effects'

// ==================== ITEM INTERACTION ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  setOverlay: (overlay: any) => void
) => {
  const playerPos = state.player.position

  const collectibleAtPosition = state.items?.find((item: any) => {
    if (!item || !item.active || !item.collectible || !item.position) return false

    const itemRowStart = item.position.row
    const itemColStart = item.position.col
    const itemWidth = item.size?.width || 1
    const itemHeight = item.size?.height || 1
    const itemRowEnd = itemRowStart + itemHeight - 1
    const itemColEnd = itemColStart + itemWidth - 1

    return (
      item.active &&
      item.collectible &&
      playerPos.row >= itemRowStart &&
      playerPos.row <= itemRowEnd &&
      playerPos.col >= itemColStart &&
      playerPos.col <= itemColEnd
    )
  })

  if (!collectibleAtPosition) return

  // Handle splash screen
  if (collectibleAtPosition.splash) {
    setOverlay({
      image: collectibleAtPosition.splash.image,
      text: collectibleAtPosition.splash.text,
    })
  }

  // Handle item collection
  if (collectibleAtPosition.type === 'weapon') {
    const weapon = state.weapons?.find((w: any) => w.id === collectibleAtPosition.weaponId)
    if (!weapon) {
      console.warn('Weapon not found:', collectibleAtPosition.weaponId)
      return
    }
    const weaponEntry = {
      id: weapon.id,
      equipped: false,
    }
    dispatch({ type: 'ADD_TO_WEAPONS', payload: { weapon: weaponEntry } })
    showDialog(`Picked up ${weapon.name}!`, 3000)
  } else {
    const item = {
      id: `${collectibleAtPosition.shortName}-${Date.now()}`,
      ...collectibleAtPosition,
    }
    dispatch({ type: 'ADD_TO_INVENTORY', payload: { item } })
    showDialog(`Picked up ${item.name}!`, 3000)
  }

  // Deactivate the collected item
  dispatch({
    type: 'UPDATE_ITEM',
    payload: {
      shortName: collectibleAtPosition.shortName,
      updates: { active: false },
    },
  })
}

// ==================== OBJECT INTERACTION ====================
/**
 * Check for object interactions and apply effects through unified effects system.
 * This function detects collision with objects and triggers their effects.
 */
export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  playerPos: Position
) => {
  console.log('Checking object interactions at playerPos:', playerPos)
  console.log('Available objects:', state.objects)

  const objectAtPosition = state.objects?.find((obj: any) => {
    if (!obj.active) {
      console.log(`Object ${obj.name} is inactive, skipping`)
      return false
    }

    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const objRowStart = obj.position.row + mask.row
        const objColStart = obj.position.col + mask.col
        const objRowEnd = objRowStart + (mask.height || 1) - 1
        const objColEnd = objColStart + (mask.width || 1) - 1

        const isCollision =
          playerPos.row >= objRowStart &&
          playerPos.row <= objRowEnd &&
          playerPos.col >= objColStart &&
          playerPos.col <= objColEnd
        console.log(`Checking collision for ${obj.name}:`, {
          objRowStart,
          objRowEnd,
          objColStart,
          objColEnd,
          playerPos,
          isCollision,
        })
        return isCollision
      })
    } else {
      const objRowStart = obj.position.row
      const objColStart = obj.position.col
      const objWidth = obj.size?.width || 1
      const objHeight = obj.size?.height || 1
      const objRowEnd = objRowStart + objHeight - 1
      const objColEnd = objColStart + objWidth - 1

      const isCollision =
        playerPos.row >= objRowStart &&
        playerPos.row <= objRowEnd &&
        playerPos.col >= objColStart &&
        playerPos.col <= objColEnd
      console.log(`Checking collision for ${obj.name} (no mask):`, {
        objRowStart,
        objRowEnd,
        objColStart,
        objColEnd,
        playerPos,
        isCollision,
      })
      return isCollision
    }
  })

  if (!objectAtPosition) {
    console.log('No object found at player position')
    return
  }
  if (!objectAtPosition.effects) {
    console.log(`Object ${objectAtPosition.name} has no effects`)
    return
  }

  const now = Date.now()
  const lastTrigger = objectAtPosition.lastTrigger || 0
  console.log(`Cooldown check for ${objectAtPosition.name}:`, {
    now,
    lastTrigger,
    timeSinceLast: now - lastTrigger,
  })

  // Cooldown check (50 seconds)
  if (now - lastTrigger <= 50000) {
    console.log(`Cooldown active for ${objectAtPosition.name}, exiting`)
    return
  }

  // Apply each effect through the unified effects system
  objectAtPosition.effects.forEach((effect: any) => {
    console.log('Triggering effect through unified system:', effect)

    const context = {
      state,
      dispatch,
      showDialog,
      sourceType: 'object' as const,
      sourceId: objectAtPosition.shortName,
      trigger: 'onEnterTile' as const,
      position: playerPos,
    }

    const result = applyEffect(effect, context)

    if (result.success && result.message) {
      console.log(`Effect applied: ${result.message}`)
    }
  })

  dispatch({
    type: 'UPDATE_OBJECT',
    payload: {
      shortName: objectAtPosition.shortName,
      updates: { lastTrigger: now },
    },
  })
}
