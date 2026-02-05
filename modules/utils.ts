// /modules/utils.ts
import {
  Position,
  GameState,
  RuntimeMonster,
  Item,
  RuntimeGreatPower,
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
export type ObjectAtPoint =
  | { type: 'player'; data: Player }
  | { type: 'monster'; data: RuntimeMonster }
  | { type: 'greatPower'; data: RuntimeGreatPower }
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
      monster.position.row === worldRow &&
      monster.position.col === worldCol
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

export function moveToward(
  entity: any,
  targetRow: number,
  targetCol: number,
  speed: number = 1,
  gridWidth: number = 49,
  gridHeight: number = 49
) {
  let dRow = targetRow - entity.position.row
  let dCol = targetCol - entity.position.col
  let stepsRow = Math.min(Math.abs(dRow), speed) * (dRow > 0 ? 1 : dRow < 0 ? -1 : 0)
  let stepsCol = Math.min(Math.abs(dCol), speed) * (dCol > 0 ? 1 : dCol < 0 ? -1 : 0)

  entity.position.row = Math.max(0, Math.min(gridHeight - 1, entity.position.row + stepsRow))
  entity.position.col = Math.max(0, Math.min(gridWidth - 1, entity.position.col + stepsCol))
}

export const moveAway = (
  monster: any,
  playerPosition: { row: number; col: number },
  gridWidth: number,
  gridHeight: number
) => {
  const dx = monster.position.col - playerPosition.col
  const dy = monster.position.row - playerPosition.row
  let newRow = monster.position.row + Math.sign(dy) // Move away vertically
  let newCol = monster.position.col + Math.sign(dx) // Move away horizontally

  // Ensure the new position is within bounds
  newRow = Math.max(0, Math.min(gridHeight - 1, newRow))
  newCol = Math.max(0, Math.min(gridWidth - 1, newCol))

  return { row: newRow, col: newCol }
}

export const disappearFarMonsters = (
  monsters: any[],
  playerPosition: { row: number; col: number },
  distanceThreshold: number = 20
) => {
  return monsters.filter((monster) => {
    const dx = monster.position.col - playerPosition.col
    const dy = monster.position.row - playerPosition.row
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= distanceThreshold
  })
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
    gridWidth - viewportCols
  )
  const offsetY = Math.min(
    Math.max(playerPosition.row - Math.floor(viewportRows / 2), 0),
    gridHeight - viewportRows
  )

  return { offsetX, offsetY }
}

// nightland/src/modules/utils.ts
export function initializeEntityStyles(state: any) {
  const tileSize = state.tileSize

  console.log('===== Initializing Entity Styles =====')
  console.log('Tile size:', tileSize)
  console.log('Player:', state.player)
  console.log('Objects array:', state.objects)
  console.log('Active Monsters array:', state.activeMonsters)
  console.log('Pools array:', state.pools)
  console.log('Great Powers array:', state.greatPowers)

  // Player
  const player = document.querySelector(`#${state.player?.shortName}`)
  if (player && state.player?.position) {
    ;(player as HTMLElement).style.left = `${state.player.position.col * tileSize}px`
    ;(player as HTMLElement).style.top = `${state.player.position.row * tileSize}px`
    ;(player as HTMLElement).style.transform = 'none'
    ;(player as HTMLElement).style.visibility = 'visible'
    ;(player as HTMLElement).style.opacity = '1'
    console.log('Player positioned at:', state.player.position)
  } else {
    console.warn('Player element or position missing:', state.player)
  }

  // Objects (including Redoubt)
  ;(state.objects || []).forEach((object: any) => {
    const element = document.querySelector(`#${object.id}`)
    console.log('Object:', object.shortName, 'id:', object.id, 'DOM element found?', !!element)
    if (element && object.position) {
      ;(element as HTMLElement).style.left = `${object.position.col * tileSize}px`
      ;(element as HTMLElement).style.top = `${object.position.row * tileSize}px`
      ;(element as HTMLElement).style.width = `${(object.size?.width || 1) * tileSize}px`
      ;(element as HTMLElement).style.height = `${(object.size?.height || 1) * tileSize}px`
      ;(element as HTMLElement).style.transform = `rotate(${object.direction || 0}deg)`
      ;(element as HTMLElement).style.transformOrigin = 'center center'
      ;(element as HTMLElement).style.visibility = 'visible'
      ;(element as HTMLElement).style.opacity = '1'
      console.log(
        'Positioned object:',
        object.shortName,
        'at row:',
        object.position.row,
        'col:',
        object.position.col
      )
    } else {
      console.warn('Object element or position missing:', object)
    }
  })

  // Great Powers
  ;(state.greatPowers || []).forEach((power: any) => {
    const element = document.querySelector(`#${power.shortName}`)
    console.log('GreatPower:', power.shortName, 'DOM element found?', !!element)
    if (element && power.position) {
      ;(element as HTMLElement).style.left = `${power.position.col * tileSize}px`
      ;(element as HTMLElement).style.top = `${power.position.row * tileSize}px`
      ;(element as HTMLElement).style.width = `${(power.size?.width || 1) * tileSize}px`
      ;(element as HTMLElement).style.height = `${(power.size?.height || 1) * tileSize}px`
      ;(element as HTMLElement).style.transform = 'none'
      ;(element as HTMLElement).style.visibility = 'visible'
      ;(element as HTMLElement).style.opacity = '1'
    } else {
      console.warn('GreatPower element or position missing:', power)
    }
  })

  // Active Monsters
  ;(state.activeMonsters || []).forEach((monster: any) => {
    const element =
      document.querySelector(`#${monster.id}`) || document.querySelector(`#combat-${monster.id}`)
    console.log('Monster:', monster.name, 'id:', monster.id, 'DOM element found?', !!element)
    if (element && monster.position) {
      ;(element as HTMLElement).style.left = `${monster.position.col * tileSize}px`
      ;(element as HTMLElement).style.top = `${monster.position.row * tileSize}px`
      ;(element as HTMLElement).style.transform = 'none'
      ;(element as HTMLElement).style.visibility = 'visible'
      ;(element as HTMLElement).style.opacity = '1'
    } else {
      console.warn('Monster element or position missing:', monster)
    }
  })

  // Pools
  ;(state.pools || []).forEach((pool: any) => {
    const element = document.querySelector(`#poolOfPeace-${pool.id}`)
    console.log('Pool:', pool.shortName, 'id:', pool.id, 'DOM element found?', !!element)
    if (element && pool.position) {
      const template = state.poolsTemplate
      ;(element as HTMLElement).style.left = `${pool.position.col * tileSize}px`
      ;(element as HTMLElement).style.top = `${pool.position.row * tileSize}px`
      ;(element as HTMLElement).style.width = `${(template.size?.width || 1) * tileSize}px`
      ;(element as HTMLElement).style.height = `${(template.size?.height || 1) * tileSize}px`
      ;(element as HTMLElement).style.transform = 'none'
      ;(element as HTMLElement).style.visibility = 'visible'
      ;(element as HTMLElement).style.opacity = '1'
    } else {
      console.warn('Pool element or position missing:', pool)
    }
  })

  console.log('===== Entity Styles Initialization Complete =====')
}

export function updateViewport(state: any) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const statusBarHeight = 42
  const playerRow = state.player.position.row
  const playerCol = state.player.position.col
  const tileSize = state.tileSize
  const edgeDistance = 2.5 // Approximately 100px / 40px = 2.5 tiles
  const maxRow = state.gridHeight - 1 // 399 (updated from 48)
  const maxCol = state.gridWidth - 1 // 399 (updated from 48)
  const middleY = Math.floor(viewportHeight / (2 * tileSize))

  // Update Redoubt reference to use state.objects
  const redoubt = (state.objects || []).find((obj: any) => obj.shortName === 'redoubt')
  if (!redoubt) {
    console.warn('Redoubt not found in state.objects')
    return
  }

  let translateX = -(playerCol * tileSize) + viewportWidth / 2 - tileSize / 2
  let translateY = -((redoubt.position.row + 4) * tileSize - viewportHeight + statusBarHeight) // Redoubt offset (4 tiles down)

  let playerViewportRow = playerRow + translateY / tileSize
  if (playerViewportRow <= middleY) {
    translateY = -(playerRow * tileSize) + middleY * tileSize
  }

  if (playerRow < edgeDistance) {
    translateY = -(playerRow * tileSize) + edgeDistance * tileSize
  } else if (playerRow > maxRow - edgeDistance) {
    translateY = -(
      (playerRow - (viewportHeight / tileSize - statusBarHeight / tileSize - edgeDistance)) *
      tileSize
    )
  }

  if (playerCol < edgeDistance) {
    translateX = -(playerCol * tileSize) + edgeDistance * tileSize
  } else if (playerCol > maxCol - edgeDistance) {
    translateX = -((playerCol - (viewportWidth / tileSize - edgeDistance)) * tileSize)
  }

  const gameBoard = document.querySelector('.game-board')
  if (gameBoard) {
    ;(gameBoard as HTMLElement).style.transform = `translate(${translateX}px, ${translateY}px)`
    ;(gameBoard as HTMLElement).style.transition = 'transform 0.2s ease'
  }
}

export function updateCombatDialogs(
  playerComment: string = '',
  enemyComments: string[] = [],
  player: any,
  monsters: any[]
) {
  const result = {
    player: { name: player.name, hp: player.hp, comment: playerComment },
    enemies: monsters.map((m, i) =>
      m
        ? { name: m.name, hp: Math.max(0, m.currentHP), comment: enemyComments[i] || '', dead: m.currentHP <= 0 }
        : null
    ),
  }
  console.log('updateCombatDialogs - Player Comment:', playerComment, 'Result:', result)
  return result
}

export function updateStatusBar(player: any) {
  return { hp: player.hp }
}

export const isClickWithinBounds = (
  event: MouseEvent,
  gameBoard: DOMRect,
  object: any,
  tileSize: number
) => {
  // Get the click coordinates relative to the game board
  const clickX = event.clientX - gameBoard.left
  const clickY = event.clientY - gameBoard.top

  // Convert pixel coordinates to tile coordinates
  const clickCol = Math.floor(clickX / tileSize)
  const clickRow = Math.floor(clickY / tileSize)

  // Adjust for the object's position to get relative coordinates
  const relativeRow = clickRow - object.position.row
  const relativeCol = clickCol - object.position.col

  // If there's a collisionMask, check if the click is within it
  if (object.collisionMask) {
    return object.collisionMask.some((mask: any) => {
      const maskRowStart = mask.row
      const maskColStart = mask.col
      const maskRowEnd = maskRowStart + (mask.height || 1) - 1
      const maskColEnd = maskColStart + (mask.width || 1) - 1

      return (
        relativeRow >= maskRowStart &&
        relativeRow <= maskRowEnd &&
        relativeCol >= maskColStart &&
        relativeCol <= maskColEnd
      )
    })
  }

  // If no collisionMask, check the full bounding box
  const objWidth = object.size?.width || 1
  const objHeight = object.size?.height || 1
  return relativeRow >= 0 && relativeRow < objHeight && relativeCol >= 0 && relativeCol < objWidth
}

export function getAttributeModifier(value: number) {
  return Math.floor((value - 10) / 2)
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
