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

  // Process each monster configuration from the level
  if (state.level.monsters && state.level.monsters.length > 0) {
    for (const monsterConfig of state.level.monsters) {
      // Skip if no spawn configuration
      if (!monsterConfig.spawnRate || !monsterConfig.spawnChance || !monsterConfig.maxInstances) {
        continue;
      }

      // Count active monsters of this type
      const activeCount = state.activeMonsters.filter(m => m.shortName === monsterConfig.shortName).length;
      
      // Check against maxInstances for this monster type
      if (activeCount >= monsterConfig.maxInstances) {
        continue;
      }

      // Use the spawn logic: Math.random() < spawnRate * spawnChance
      if (Math.random() < monsterConfig.spawnRate * monsterConfig.spawnChance) {
        const template = getMonsterTemplate(monsterConfig.shortName);
        if (!template) {
          console.error(`Monster template not found: ${monsterConfig.shortName}`);
          continue;
        }

        const spawnPosition = getSpawnPosition(state);
        const newMonster: Monster = {
          ...template,
          id: `${template.shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          position: spawnPosition,
          active: true,
          hp: template.hp,
          maxHP: template.maxHP,
          attack: template.attack,
          ac: template.ac,
          moveRate: template.moveRate,
          soulKey: template.soulKey,
        };

        console.log(`Spawning ${newMonster.name} at ${spawnPosition.row},${spawnPosition.col}`);
        dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
        showDialog?.(`${template.name} has appeared!`, 2000);
      }
    }
  }
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
    maxHP: template.maxHP,
    attack: template.attack,
    ac: template.ac,
    moveRate: template.moveRate,
    soulKey: template.soulKey,
  };
};