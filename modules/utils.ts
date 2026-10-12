// /modules/utils.ts
import {
  Position,
  GameState,
  Monster,
  Item,
  GreatPower,
  LevelObjectInstance,
  NonCollisionObject,
  Player,
} from '../config/types'
import textContent from '../assets/copy/textcontent'

/**
 * Development logging helper - only logs in development mode
 * Use this instead of console.log to prevent expensive console operations in production
 */
export const logIfDev = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args)
  }
}

/**
 * Check if the player is standing on an object
 * @param playerPos - The player's position
 * @param objectPos - The object's position
 * @param objectWidth - The object's width (default: 1)
 * @param objectHeight - The object's height (default: 1)
 * @returns true if player position is within object bounds
 */
export function isPlayerOnObject(
  playerPos: Position,
  objectPos: Position,
  objectWidth: number = 1,
  objectHeight: number = 1
): boolean {
  return (
    playerPos.row >= objectPos.row &&
    playerPos.row < objectPos.row + objectHeight &&
    playerPos.col >= objectPos.col &&
    playerPos.col < objectPos.col + objectWidth
  )
}

/**
 * Object returned by getObjectAtPoint, including object type and data
 */
type ObjectAtPoint =
  | { type: 'player'; data: Player }
  | { type: 'monster'; data: Monster }
  | { type: 'greatPower'; data: GreatPower }
  | { type: 'item'; data: Item }
  | { type: 'building'; data: LevelObjectInstance }
  | { type: 'nonCollisionObject'; data: NonCollisionObject }
  | null

/**
 * Centralized hit-testing function to determine which object (if any) is at a world position.
 *
 * Priority order (highest to lowest):
 * 1. Player (if at exact position)
 * 2. Monsters (active monsters and combat slots)
 * 3. Great Powers
 * 4. Items
 * 5. Buildings (level objects)
 * 6. Non-collision objects (with collision masks)
 *
 * @param worldRow - World row coordinate
 * @param worldCol - World column coordinate
 * @param state - Current game state
 * @returns Object at the point with type and data, or null if no object found
 */
export function getObjectAtPoint(
  worldRow: number,
  worldCol: number,
  state: GameState
): ObjectAtPoint {
  // Priority 1: Player
  if (state.player?.position) {
    if (state.player.position.row === worldRow && state.player.position.col === worldCol) {
      return { type: 'player', data: state.player }
    }
  }

  // Priority 2: Monsters (both active and in combat slots)
  // Note: We check !inCombatSlot to avoid detecting monsters that are positioned
  // at combat UI slots rather than their world position. Monsters in attackSlots
  // still have their world position and should be detectable there.
  const allMonsters = [...(state.activeMonsters || []), ...(state.attackSlots || [])]
  for (const monster of allMonsters) {
    if (
      monster.position &&
      !monster.inCombatSlot &&
      worldRow >= monster.position.row &&
      worldRow < monster.position.row + (monster.height ?? 1) &&
      worldCol >= monster.position.col &&
      worldCol < monster.position.col + (monster.width ?? 1)
    ) {
      return { type: 'monster', data: monster }
    }
  }

  // Priority 3: Great Powers
  if (state.level?.greatPowers) {
    for (const gp of state.level.greatPowers) {
      if (gp.position) {
        const gpWidth = gp.width || 1
        const gpHeight = gp.height || 1
        if (
          worldRow >= gp.position.row &&
          worldRow < gp.position.row + gpHeight &&
          worldCol >= gp.position.col &&
          worldCol < gp.position.col + gpWidth
        ) {
          return { type: 'greatPower', data: gp }
        }
      }
    }
  }

  // Priority 4: Items
  if (state.items) {
    for (const item of state.items) {
      if (
        item.active &&
        item.position &&
        item.position.row === worldRow &&
        item.position.col === worldCol
      ) {
        return { type: 'item', data: item }
      }
    }
  }

  // Priority 5: Buildings (level objects)
  if (state.level?.objects) {
    for (const obj of state.level.objects) {
      if (obj.position) {
        const objWidth = obj.size?.width ?? 1
        const objHeight = obj.size?.height ?? 1
        if (
          worldRow >= obj.position.row &&
          worldRow < obj.position.row + objHeight &&
          worldCol >= obj.position.col &&
          worldCol < obj.position.col + objWidth
        ) {
          return { type: 'building', data: obj }
        }
      }
    }
  }

  // Priority 6: Non-collision objects (check collision masks if present)
  if (state.nonCollisionObjects) {
    for (const obj of state.nonCollisionObjects) {
      if (!obj.position || !obj.active || obj.canTap === false) continue

      // If object has collision mask, check each mask tile
      if (obj.collisionMask && obj.collisionMask.length > 0) {
        for (const mask of obj.collisionMask) {
          const maskRow = obj.position.row + mask.row
          const maskCol = obj.position.col + mask.col
          const maskWidth = mask.width || 1
          const maskHeight = mask.height || 1

          if (
            worldRow >= maskRow &&
            worldRow < maskRow + maskHeight &&
            worldCol >= maskCol &&
            worldCol < maskCol + maskWidth
          ) {
            return { type: 'nonCollisionObject', data: obj }
          }
        }
      } else {
        // No collision mask, check main object bounds
        const objWidth = obj.width || 1
        const objHeight = obj.height || 1
        if (
          worldRow >= obj.position.row &&
          worldRow < obj.position.row + objHeight &&
          worldCol >= obj.position.col &&
          worldCol < obj.position.col + objWidth
        ) {
          return { type: 'nonCollisionObject', data: obj }
        }
      }
    }
  }

  return null
}

// Fixed calculateCameraOffset function
export function calculateCameraOffset(
  playerPosition: Position,
  viewportCols: number,
  viewportRows: number,
  gridWidth: number,
  gridHeight: number
) {
  // Add null/undefined check for playerPosition
  if (!playerPosition) {
    console.warn('playerPosition is undefined, returning default camera offset')
    return { offsetX: 0, offsetY: 0 }
  }

  const offsetX = Math.min(
    Math.max(playerPosition.col - Math.floor(viewportCols / 2), 0),
    Math.max(0, gridWidth - viewportCols)
  )
  const offsetY = Math.min(
    Math.max(playerPosition.row - Math.floor(viewportRows / 2), 0),
    Math.max(0, gridHeight - viewportRows)
  )

  return { offsetX, offsetY }
}

// New helper function to fetch and format text from textcontent.ts
export function getTextContent(key: string, replacements: string[] = []): string {
  let text = textContent[key] || ''
  console.log(`getTextContent called: key=${key}, text="${text}", replacements=`, replacements)

  // Perform replacements sequentially
  replacements.forEach((replacement, index) => {
    const placeholder = `[${index + 1}]` // Assumes placeholders are [1], [2], etc.
    text = text.replace(placeholder, replacement)
  })

  // Specifically handle [monster] for combatStart
  if (key === 'combatStart' && replacements.length > 0) {
    text = text.replace('[monster]', replacements[0])
  }

  return text
}
