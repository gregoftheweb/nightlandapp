// modules/monsterUtils.ts - Monster spawning and management logic
import { GameState, Monster, Position, MonsterInstance } from '../config/types'
import { getMonsterTemplate } from '../config/monsters'
import { hydrateMonster } from './hydration'
import { moveMonsters } from './movement'
import { isTerrainWalkable } from './terrain'

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

  // Use spawn configs
  const spawnConfigs = state.level.monsterSpawnConfigs

  if (!spawnConfigs || spawnConfigs.length === 0) {
    logIfDev('No spawn configs available, skipping monster spawn')
    return
  }

  // Use MonsterSpawnConfig[]
  logIfDev('Using spawn configs')

  // Pre-compute counts by templateId for O(1) lookups (perf: avoids filter per config)
  const typeCounts = new Map<string, number>()
  state.activeMonsters.forEach((m) => {
    const count = typeCounts.get(m.shortName) || 0
    typeCounts.set(m.shortName, count + 1)
  })

  for (const spawnConfig of spawnConfigs) {
    // Skip if spawn configuration is incomplete
    if (
      spawnConfig.spawnRate === undefined ||
      spawnConfig.spawnRate === null ||
      spawnConfig.maxInstances === undefined ||
      spawnConfig.maxInstances === null
    ) {
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
      const template = getMonsterTemplate(spawnConfig.templateId)
      const position = getSpawnPosition(state, template)
      if (!position) continue
      const newMonster = createMonsterFromTemplate(spawnConfig.templateId, position)
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

// ==================== SPAWN POSITION LOGIC ====================
export const getSpawnPosition = (
  state: GameState,
  footprint: { width?: number; height?: number } = {}
): Position | null => {
  const { gridHeight, gridWidth, player, activeMonsters } = state
  const width = footprint.width ?? 1
  const height = footprint.height ?? 1
  let attempts = 0

  while (attempts < MAX_SPAWN_ATTEMPTS) {
    const angle = Math.random() * 2 * Math.PI
    const radius = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE)

    let spawnRow = Math.round(state.player.position.row + Math.sin(angle) * radius)
    let spawnCol = Math.round(state.player.position.col + Math.cos(angle) * radius)

    spawnRow = Math.max(0, Math.min(gridHeight - height, spawnRow))
    spawnCol = Math.max(0, Math.min(gridWidth - width, spawnCol))

    const candidate: Position = { row: spawnRow, col: spawnCol }
    const rowDelta = spawnRow - player.position.row
    const colDelta = spawnCol - player.position.col
    const roundedDistance = Math.sqrt(rowDelta * rowDelta + colDelta * colDelta)
    const isWithinSpawnRange =
      roundedDistance >= MIN_SPAWN_DISTANCE && roundedDistance <= MAX_SPAWN_DISTANCE
    const isOccupied = activeMonsters.some((monster) => {
      const monsterWidth = monster.width ?? 1
      const monsterHeight = monster.height ?? 1
      return !(
        spawnRow + height <= monster.position.row ||
        spawnRow >= monster.position.row + monsterHeight ||
        spawnCol + width <= monster.position.col ||
        spawnCol >= monster.position.col + monsterWidth
      )
    })

    if (isWithinSpawnRange && !isOccupied && isTerrainWalkable(state, candidate, width, height))
      return candidate
    attempts++
  }

  logIfDev(`Could not find valid spawn position after ${MAX_SPAWN_ATTEMPTS} attempts`)
  return null
}

// ==================== MONSTER CREATION UTILITIES ====================

/**
 * Create a monster instance from a template for spawning
 * Uses MonsterTemplate + MonsterInstance + hydrateMonster pattern
 */
export const createMonsterFromTemplate = (
  shortName: string,
  position: Position
): Monster | null => {
  const template = getMonsterTemplate(shortName)
  if (!template) {
    logIfDev(`Monster template not found: ${shortName}`)
    return null
  }

  // Create a MonsterInstance with runtime state
  const instance: MonsterInstance = {
    id: `${shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`, // Unique ID for React keys
    templateId: shortName,
    position,
    currentHP: template.maxHP, // Start at full HP
  }

  // Hydrate the template with the instance to create Monster
  return hydrateMonster(template, instance)
}
