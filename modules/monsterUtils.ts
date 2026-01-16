// modules/monsterUtils.ts - Monster spawning and management logic
import { GameState, Monster, Position } from "../config/types";
import { getMonsterTemplate } from "../config/monsters";
import { moveMonsters } from "./movement";

// ==================== CONSTANTS ====================
const MIN_SPAWN_DISTANCE = 5;
const MAX_SPAWN_DISTANCE = 15;
const MAX_SPAWN_ATTEMPTS = 50;

// ==================== UTILITY FUNCTIONS ====================
const logIfDev = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

// ==================== HANDLE MONSTER TURN ====================
export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  logIfDev("handleMoveMonsters called with", state.activeMonsters.length, "monsters");

  // Spawn new monsters first (only when not in combat)
  if (!state.inCombat) {
    checkMonsterSpawn(state, dispatch, showDialog);
  }

  // Move all active monsters toward player (original full flow preserved)
  moveMonsters(state, dispatch, showDialog);

  logIfDev("Monster turn complete");
};

// ==================== MONSTER SPAWNING ====================
export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  logIfDev("Checking monster spawning...");

  // Process each monster configuration from the level
  if (state.level.monsters && state.level.monsters.length > 0) {
    // Pre-compute counts by type for O(1) lookups (perf: avoids filter per config)
    const typeCounts = new Map<string, number>();
    state.activeMonsters.forEach((m) => {
      const count = typeCounts.get(m.shortName) || 0;
      typeCounts.set(m.shortName, count + 1);
    });

    for (const monsterConfig of state.level.monsters) {
      // Skip if no spawn configuration
      if (!monsterConfig.spawnRate || !monsterConfig.maxInstances) {
        continue;
      }

      // O(1) count lookup
      const activeCount = typeCounts.get(monsterConfig.shortName) || 0;
      
      // Check against maxInstances for this monster type
      if (activeCount >= monsterConfig.maxInstances) {
        continue;
      }

      // Use the spawn logic: Math.random() < spawnRate (percentage chance per turn)
      if (Math.random() < monsterConfig.spawnRate) {
        const newMonster = createMonsterFromTemplate(monsterConfig.shortName, getSpawnPosition(state));
        if (!newMonster) {
          continue;
        }

        logIfDev(`Spawning ${newMonster.name} at ${newMonster.position.row},${newMonster.position.col}`);
        dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
        showDialog?.(`${newMonster.name} has appeared!`, 2000);
      }
    }
  }
};

// ==================== SPAWN POSITION LOGIC ====================
export const getSpawnPosition = (state: GameState): Position => {
  const { gridHeight, gridWidth, player, activeMonsters } = state;
  let attempts = 0;

  while (attempts < MAX_SPAWN_ATTEMPTS) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);

    let spawnRow = Math.round(
      state.player.position.row + Math.sin(angle) * radius
    );
    let spawnCol = Math.round(
      state.player.position.col + Math.cos(angle) * radius
    );

    spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow));
    spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol));

    const candidate: Position = { row: spawnRow, col: spawnCol };
    const isOccupied = activeMonsters.some(m => m.position.row === spawnRow && m.position.col === spawnCol);

    if (!isOccupied) return candidate;
    attempts++;
  }

  logIfDev(`Could not find valid spawn position after ${MAX_SPAWN_ATTEMPTS} attempts`);
  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) };
};

// ==================== MONSTER CREATION UTILITIES ====================

/**
 * Create a monster instance from a template for spawning
 */
export const createMonsterFromTemplate = (shortName: string, position: Position): Monster | null => {
  const template = getMonsterTemplate(shortName);
  if (!template) {
    logIfDev(`Monster template not found: ${shortName}`);
    return null;
  }

  return {
    ...template,
    id: `${shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`, // Unique ID for React keys
    position,
    active: true,
    hp: template.hp,
    maxHP: template.maxHP,
    attack: template.attack,
    ac: template.ac,
    moveRate: template.moveRate,
    soulKey: template.soulKey,
  };
};