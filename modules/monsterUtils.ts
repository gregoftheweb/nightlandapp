// modules/monsterUtils.ts - Fixed version that integrates your original code with enhanced movement
import { GameState, Monster, Position } from "../config/types";
import { monsters } from "../config/monsters";
import { MovementHandler, checkCollision } from "./movement";

// Global movement handler instance for monster AI
let globalMovementHandler: MovementHandler | null = null;

export function setMovementHandler(handler: MovementHandler) {
  globalMovementHandler = handler;
  console.log("MonsterUtils: MovementHandler set");
}



export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  if (state.inCombat) return;

  console.log("handleMoveMonsters called with", state.activeMonsters.length, "monsters");

  // Spawn new monsters first (your original logic)
  checkMonsterSpawn(state, dispatch, showDialog);

  // Create a turn-based occupancy map for this monster turn
  const occupiedTiles = new Map<string, string>();
  state.activeMonsters.forEach(m => {
    if (m.id) {
      occupiedTiles.set(`${m.position.row},${m.position.col}`, m.id);
    }
  });

  // Move existing active monsters
  state.activeMonsters.forEach((monster) => {
    if (!monster.id) {
      console.warn("Skipping monster with no id", monster);
      return;
    }

    if (monster.active && globalMovementHandler) {
      // Use the enhanced movement system that respects moveRate and prevents overlaps
      globalMovementHandler.moveMonsterTowardPlayer(state, monster.id, occupiedTiles);

      // Check for combat initiation after movement
      const key = `${monster.position.row},${monster.position.col}`;
      const playerKey = `${state.player.position.row},${state.player.position.col}`;
      if (key === playerKey) {
        // setupCombat(state, dispatch, monster, showDialog);
        console.log(`Monster ${monster.name} is adjacent to player - ready for combat!`);
      }
    }
  });

  console.log("Monster turn complete");
};





export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  console.log("Checking monster spawning...");

  for (const template of monsters) {
    if (!template.spawnRate || !template.spawnChance) continue;

    const activeCount = state.activeMonsters.filter(
      (m) => m.shortName === template.shortName
    ).length;
    if (activeCount >= (template.maxInstances || Infinity)) continue;

    if (Math.random() < template.spawnRate * template.spawnChance) {
      const spawnPosition = getSpawnPosition(state);
      const newMonster: Monster = {
        ...template,
        id: `${template.shortName}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
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

export const getSpawnPosition = (state: GameState): Position => {
  const { gridHeight, gridWidth, player, activeMonsters } = state;
  let spawnRow: number, spawnCol: number, distance: number;
  const maxAttempts = 50;
  const minDistanceFromPlayer = 5;
  const maxDistanceFromPlayer = 15;
  let attempts = 0;

  do {
    // Generate a random position within a ring around the player
    const angle = Math.random() * 2 * Math.PI;
    const radius = minDistanceFromPlayer + 
                  Math.random() * (maxDistanceFromPlayer - minDistanceFromPlayer);
    
    spawnRow = Math.max(
      0,
      Math.min(
        gridHeight - 1,
        player.position.row + Math.round(Math.sin(angle) * radius)
      )
    );
    spawnCol = Math.max(
      0,
      Math.min(
        gridWidth - 1,
        player.position.col + Math.round(Math.cos(angle) * radius)
      )
    );

    distance = Math.sqrt(
      Math.pow(spawnRow - player.position.row, 2) +
        Math.pow(spawnCol - player.position.col, 2)
    );

    const candidatePosition = { row: spawnRow, col: spawnCol };

    // Enhanced collision detection using MovementHandler if available
    let isOccupied = false;
    if (globalMovementHandler) {
      isOccupied = globalMovementHandler.isPositionBlocked(candidatePosition, state);
    } else {
      // Fallback to original logic
      isOccupied = activeMonsters.some(
        (m) => m.position.row === spawnRow && m.position.col === spawnCol
      );
    }

    if (!isOccupied && distance >= minDistanceFromPlayer && distance <= maxDistanceFromPlayer) {
      return candidatePosition;
    }
    attempts++;
  } while (attempts < maxAttempts);

  console.warn(`Could not find valid spawn position after ${maxAttempts} attempts`);
  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) }; // fallback
};

// Utility function to calculate distance between two positions
export function calculateDistance(pos1: Position, pos2: Position): number {
  const rowDiff = pos2.row - pos1.row;
  const colDiff = pos2.col - pos1.col;
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
}

// Check if a monster is adjacent to the player (for combat initiation)
export function isAdjacentToPlayer(monster: Monster, playerPosition: Position): boolean {
  const distance = calculateDistance(monster.position, playerPosition);
  return distance <= 1.5; // Allow diagonal adjacency
}