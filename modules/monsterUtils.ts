// modules/monsterUtils.ts - Monster spawning and management logic
import { GameState, Monster, Position } from "../config/types";
import { getMonsterTemplate } from "../config/monsters";
import { moveMonsters } from "./movement";

// -------------------- HANDLE MONSTER TURN --------------------
export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  console.log("handleMoveMonsters called with", state.activeMonsters.length, "monsters");

  // Spawn new monsters first (only when not in combat)
  if (!state.inCombat) {
    checkMonsterSpawn(state, dispatch, showDialog);
  }

  // Move all active monsters toward player
  moveMonsters(state, dispatch, showDialog);

  console.log("Monster turn complete");
};

// -------------------- MONSTER SPAWNING --------------------
export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  console.log("Checking monster spawning...");

  // Get unique monster types that can spawn in this level
  const spawnableMonsterTypes = getSpawnableMonsterTypes(state);

  for (const monsterShortName of spawnableMonsterTypes) {
    const template = getMonsterTemplate(monsterShortName);
    if (!template || !template.spawnRate || !template.spawnChance) continue;

    const activeCount = state.activeMonsters.filter(m => m.shortName === template.shortName).length;
    
    // Use template maxInstances with special handling for specific monsters
    let maxInstances = template.maxInstances || Infinity;
    if (template.shortName === 'abhuman') {
      maxInstances = 2; // Limit to just 2 abhumans during testing
    }
    
    if (activeCount >= maxInstances) continue;

    if (Math.random() < template.spawnRate * template.spawnChance) {
      const spawnPosition = getSpawnPosition(state);
      const newMonster: Monster = {
        ...template,
        id: `${template.shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        position: spawnPosition,
        active: true,
        hp: template.hp,
      };

      console.log(`Spawning ${newMonster.name} at ${spawnPosition.row},${spawnPosition.col}`);
      dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
      showDialog?.(`${template.name} has appeared!`, 2000);
    }
  }
};

// -------------------- HELPER FUNCTIONS --------------------

/**
 * Get all spawnable monster types for the current level.
 * This combines monsters from spawn zones and any pre-placed monsters in the level.
 */
const getSpawnableMonsterTypes = (state: GameState): string[] => {
  const spawnableTypes = new Set<string>();

  // Add monsters from spawn zones
  if (state.level.spawnZones) {
    state.level.spawnZones.forEach(zone => {
      if (zone.active !== false) { // Default to active if not specified
        zone.monsterTypes.forEach(type => spawnableTypes.add(type));
      }
    });
  }

  // Add any pre-placed monsters from the level configuration
  if (state.level.monsters) {
    state.level.monsters.forEach(monster => {
      if (monster.active !== false) {
        spawnableTypes.add(monster.shortName);
      }
    });
  }

  return Array.from(spawnableTypes);
};

// -------------------- SPAWN POSITION LOGIC --------------------
export const getSpawnPosition = (state: GameState): Position => {
  const { gridHeight, gridWidth, player, activeMonsters } = state;
  const minDistance = 5;
  const maxDistance = 15;
  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = minDistance + Math.random() * (maxDistance - minDistance);

    const spawnRow = Math.max(0, Math.min(gridHeight - 1, player.position.row + Math.round(Math.sin(angle) * radius)));
    const spawnCol = Math.max(0, Math.min(gridWidth - 1, player.position.col + Math.round(Math.cos(angle) * radius)));

    const candidate: Position = { row: spawnRow, col: spawnCol };
    const isOccupied = activeMonsters.some(m => m.position.row === spawnRow && m.position.col === spawnCol);

    if (!isOccupied) return candidate;
    attempts++;
  }

  console.warn(`Could not find valid spawn position after ${maxAttempts} attempts`);
  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) };
};

// -------------------- MONSTER CREATION UTILITIES --------------------

/**
 * Create a monster instance from a template for spawning
 */
export const createMonsterFromTemplate = (shortName: string, position: Position): Monster | null => {
  const template = getMonsterTemplate(shortName);
  if (!template) {
    console.error(`Monster template not found: ${shortName}`);
    return null;
  }

  return {
    ...template,
    id: `${shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    position,
    active: true,
    hp: template.hp,
  };
};