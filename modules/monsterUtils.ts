// modules/monsterUtils.ts - Monster spawning and management logic
import { GameState, RuntimeMonster, Position, MonsterInstanceV2 } from '../config/types'
import { getMonsterTemplate } from '../config/monsters'
import { hydrateMonsterV2 } from './hydration'
import { moveMonsters } from './movement'

// ==================== CONSTANTS ====================
const MIN_SPAWN_DISTANCE = 5
const MAX_SPAWN_DISTANCE = 15
const MAX_SPAWN_ATTEMPTS = 50

// ==================== UTILITY FUNCTIONS ====================
const logIfDev = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args)
  }
}

// ==================== HANDLE MONSTER TURN ====================
export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  logIfDev('handleMoveMonsters called with', state.activeMonsters.length, 'monsters')

  // Spawn new monsters first (only when not in combat)
  if (!state.inCombat) {
    checkMonsterSpawn(state, dispatch, showDialog)
  }

  // Move all active monsters toward player (original full flow preserved)
  moveMonsters(state, dispatch, showDialog)

  logIfDev('Monster turn complete')
}

// ==================== MONSTER SPAWNING ====================
export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  logIfDev('Checking monster spawning...')

  // Use V2 spawn configs if available, otherwise fall back to legacy state.monsters
  const v2SpawnConfigs = state.level.monsterSpawnConfigsV2
  
  if (v2SpawnConfigs && v2SpawnConfigs.length > 0) {
    // V2 path: Use MonsterSpawnConfigV2[]
    logIfDev('Using V2 spawn configs')
    
    // Pre-compute counts by templateId for O(1) lookups (perf: avoids filter per config)
    const typeCounts = new Map<string, number>()
    state.activeMonsters.forEach((m) => {
      const count = typeCounts.get(m.shortName) || 0
      typeCounts.set(m.shortName, count + 1)
    })

    for (const spawnConfig of v2SpawnConfigs) {
      // Skip if spawn configuration is incomplete
      if (spawnConfig.spawnRate === undefined || spawnConfig.spawnRate === null ||
          spawnConfig.maxInstances === undefined || spawnConfig.maxInstances === null) {
        continue
      }

      // O(1) count lookup by templateId (which maps to shortName)
      const activeCount = typeCounts.get(spawnConfig.templateId) || 0

      // Check against maxInstances for this monster type
      if (activeCount >= spawnConfig.maxInstances) {
        continue
      }

      // Use the spawn logic: Math.random() < spawnRate (percentage chance per turn)
      if (Math.random() < spawnConfig.spawnRate) {
        const newMonster = createMonsterFromTemplate(
          spawnConfig.templateId,
          getSpawnPosition(state)
        )
        if (!newMonster) {
          continue
        }

        logIfDev(
          `Spawning ${newMonster.name} at ${newMonster.position.row},${newMonster.position.col}`
        )
        dispatch({ type: 'SPAWN_MONSTER', payload: { monster: newMonster } })
        showDialog?.(`${newMonster.name} has appeared!`, 2000)
      }
    }
  } else if (state.level.monsters && state.level.monsters.length > 0) {
    // Legacy path: Use LevelMonsterInstance[] for backward compatibility
    logIfDev('Using legacy monster spawn configs (fallback)')
    
    // Pre-compute counts by type for O(1) lookups (perf: avoids filter per config)
    const typeCounts = new Map<string, number>()
    state.activeMonsters.forEach((m) => {
      const count = typeCounts.get(m.shortName) || 0
      typeCounts.set(m.shortName, count + 1)
    })

    for (const monsterConfig of state.level.monsters) {
      // Skip if spawn configuration is incomplete
      if (monsterConfig.spawnRate === undefined || monsterConfig.spawnRate === null ||
          monsterConfig.maxInstances === undefined || monsterConfig.maxInstances === null) {
        continue
      }

      // O(1) count lookup
      const activeCount = typeCounts.get(monsterConfig.shortName) || 0

      // Check against maxInstances for this monster type
      if (activeCount >= monsterConfig.maxInstances) {
        continue
      }

      // Use the spawn logic: Math.random() < spawnRate (percentage chance per turn)
      if (Math.random() < monsterConfig.spawnRate) {
        const newMonster = createMonsterFromTemplate(
          monsterConfig.shortName,
          getSpawnPosition(state)
        )
        if (!newMonster) {
          continue
        }

        logIfDev(
          `Spawning ${newMonster.name} at ${newMonster.position.row},${newMonster.position.col}`
        )
        dispatch({ type: 'SPAWN_MONSTER', payload: { monster: newMonster } })
        showDialog?.(`${newMonster.name} has appeared!`, 2000)
      }
    }
  }
}

// ==================== SPAWN POSITION LOGIC ====================
export const getSpawnPosition = (state: GameState): Position => {
  const { gridHeight, gridWidth, player, activeMonsters } = state
  let attempts = 0

  while (attempts < MAX_SPAWN_ATTEMPTS) {
    const angle = Math.random() * 2 * Math.PI
    const radius = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE)

    let spawnRow = Math.round(state.player.position.row + Math.sin(angle) * radius)
    let spawnCol = Math.round(state.player.position.col + Math.cos(angle) * radius)

    spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow))
    spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol))

    const candidate: Position = { row: spawnRow, col: spawnCol }
    const isOccupied = activeMonsters.some(
      (m) => m.position.row === spawnRow && m.position.col === spawnCol
    )

    if (!isOccupied) return candidate
    attempts++
  }

  logIfDev(`Could not find valid spawn position after ${MAX_SPAWN_ATTEMPTS} attempts`)
  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) }
}

// ==================== MONSTER CREATION UTILITIES ====================

/**
 * Create a monster instance from a template for spawning
 * Uses MonsterTemplateV2 + MonsterInstanceV2 + hydrateMonsterV2 pattern
 */
export const createMonsterFromTemplate = (
  shortName: string,
  position: Position
): RuntimeMonster | null => {
  const template = getMonsterTemplate(shortName)
  if (!template) {
    logIfDev(`Monster template not found: ${shortName}`)
    return null
  }

  // Create a MonsterInstanceV2 with runtime state
  const instance: MonsterInstanceV2 = {
    id: `${shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`, // Unique ID for React keys
    templateId: shortName,
    position,
    currentHP: template.maxHP, // Start at full HP
  }

  // Hydrate the template with the instance to create RuntimeMonster (HydratedMonsterV2)
  return hydrateMonsterV2(template, instance)
}

/**
 * Find the nearest living monster to a given position
 * @param position - The position to search from (typically player position)
 * @param monsters - Array of monsters to search
 * @returns The nearest monster, or null if no living monsters exist
 */
export const findNearestMonster = (position: Position, monsters: RuntimeMonster[]): RuntimeMonster | null => {
  if (!monsters || monsters.length === 0) return null

  // Filter for living monsters (currentHP > 0)
  const livingMonsters = monsters.filter((m) => m.currentHP > 0 && m.position)

  if (livingMonsters.length === 0) return null

  // Find the monster with the smallest Euclidean distance
  let nearestMonster: RuntimeMonster | null = null
  let minDistance = Infinity

  for (const monster of livingMonsters) {
    const dx = monster.position.col - position.col
    const dy = monster.position.row - position.row
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      nearestMonster = monster
    }
  }

  return nearestMonster
}
