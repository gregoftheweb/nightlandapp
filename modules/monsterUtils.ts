// modules/monsterUtils.ts - Fixed version with proper combat handling
import { GameState, Monster, Position } from "../config/types";
import { monsters } from "../config/monsters";
import { MovementHandler } from "./movement.blech";

// Global movement handler instance for monster AI
let globalMovementHandler: MovementHandler | null = null;

export function setMovementHandler(handler: MovementHandler) {
  globalMovementHandler = handler;
  console.log("MonsterUtils: MovementHandler set");
}

// -------------------- HANDLE MONSTER TURN --------------------
export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  // ❌ REMOVED: Don't block all monster movement during combat
  // if (state.inCombat) return;

  console.log("handleMoveMonsters called with", state.activeMonsters.length, "monsters");

  // Spawn new monsters first (only when not in combat)
  if (!state.inCombat) {
    checkMonsterSpawn(state, dispatch, showDialog);
  }

  // Build occupancy map for this turn
  const occupiedTiles = new Map<string, string>();
  state.activeMonsters.forEach(m => {
    if (m.id) {
      occupiedTiles.set(`${m.position.row},${m.position.col}`, m.id);
    }
  });

  // Move all active monsters toward player (individually checked in moveMonsterTowardPlayer)
  state.activeMonsters.forEach(monster => {
    if (!monster.id) return;
    if (monster.active && globalMovementHandler) {
      // The movement handler will check if this specific monster is in combat
      globalMovementHandler.moveMonsterTowardPlayer(state, monster.id, occupiedTiles);
    }
  });

  console.log("Monster turn complete");
};

// -------------------- MONSTER SPAWNING --------------------
export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  console.log("Checking monster spawning...");

  for (const template of monsters) {
    if (!template.spawnRate || !template.spawnChance) continue;

    const activeCount = state.activeMonsters.filter(m => m.shortName === template.shortName).length;
    if (activeCount >= (template.maxInstances || Infinity)) continue;

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
      showDialog(`${template.name} has appeared!`, 2000);
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
    let isOccupied = activeMonsters.some(m => m.position.row === spawnRow && m.position.col === spawnCol);

    if (globalMovementHandler) {
      isOccupied = globalMovementHandler.isPositionBlocked(candidate, state);
    }

    if (!isOccupied) return candidate;
    attempts++;
  }

  console.warn(`Could not find valid spawn position after ${maxAttempts} attempts`);
  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) };
};

// -------------------- HELPER FUNCTIONS --------------------
export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(Math.pow(pos2.row - pos1.row, 2) + Math.pow(pos2.col - pos1.col, 2));
}

export function isAdjacentToPlayer(monster: Monster, playerPosition: Position): boolean {
  return calculateDistance(monster.position, playerPosition) <= 1.5;
}