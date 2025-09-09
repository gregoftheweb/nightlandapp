// modules/gameLoop.ts - Fixed with monster spawning and movement
import { GameState, Position, Monster } from "../config/types";
import { monsters } from "../config/monsters";

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  setOverlay: (overlay: any) => void,
  showDialog: (message: string, duration?: number) => void,
  setDeathMessage: (message: string) => void
): void => {
  if (state.inCombat) return;

  let isMove = true;
  const newPosition = { ...state.player.position };

  // Update position based on direction
  switch (direction) {
    case "up":
      newPosition.row = Math.max(0, newPosition.row - 1);
      break;
    case "down":
      newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1);
      break;
    case "left":
      newPosition.col = Math.max(0, newPosition.col - 1);
      break;
    case "right":
      newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1);
      break;
    case "stay":
      break;
    case null:
      return;
    default:
      console.warn(`Unhandled direction: ${direction}`);
      return;
  }

  // Move the player
  if (isMove) {
    dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  }

  const updatedState = {
    ...state,
    player: { ...state.player, position: newPosition },
  };

  // TODO: Add collectible/object interaction logic here (from web version)

  // Update move count
  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  
  const finalState = { ...updatedState, moveCount: newMoveCount };

  // Handle monster spawning
  spawnMonsters(finalState, dispatch);

  // Monster movement and combat (the key part!)
  moveMonsters(finalState, dispatch, showDialog, newPosition);
};

// Monster spawning logic
export const spawnMonsters = (
  state: GameState,
  dispatch: (action: any) => void
): void => {
  if (state.inCombat) return;

  monsters.forEach((monsterTemplate) => {
    // Skip if spawn rate is 0
    if (monsterTemplate.spawnRate === 0) return;

    // Count existing monsters of this type
    const existingCount = state.activeMonsters.filter(
      (monster) => monster.shortName === monsterTemplate.shortName
    ).length;

    // Check if we're under the max instances
    if (existingCount >= (monsterTemplate.maxInstances || 10)) return;

    // Check spawn chance based on move count and spawn rate
    const shouldSpawn = Math.random() < ((monsterTemplate.spawnChance || 0) / 100) && 
                       (state.moveCount % (monsterTemplate.spawnRate || 1) === 0);

    if (shouldSpawn) {
      // Generate random position (avoid spawning too close to player)
      let spawnRow, spawnCol;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        spawnRow = Math.floor(Math.random() * state.gridHeight);
        spawnCol = Math.floor(Math.random() * state.gridWidth);
        attempts++;
      } while (
        attempts < maxAttempts &&
        Math.abs(spawnRow - state.player.position.row) < 10 &&
        Math.abs(spawnCol - state.player.position.col) < 10
      );

      const newMonster: Monster = {
        ...monsterTemplate,
        id: `${monsterTemplate.shortName}-${Date.now()}-${Math.random()}`,
        position: { row: spawnRow, col: spawnCol },
        hp: monsterTemplate.maxHP,
        active: true,
      };

      dispatch({
        type: "SPAWN_MONSTER",
        payload: { monster: newMonster },
      });

      console.log(`Spawned ${newMonster.name} at (${spawnRow}, ${spawnCol})`);
    }
  });
};

export const moveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;

  // Move each monster
  state.activeMonsters.forEach((monster) => {
    // Skip monsters already in combat
    if (
      state.attackSlots?.some((slot: any) => slot.id === monster.id) ||
      state.waitingMonsters?.some((m: any) => m.id === monster.id)
    ) {
      return;
    }

    let newPos: Position;
    
    if (state.player.isHidden) {
      // Move away from player when hidden
      newPos = moveAway(monster, playerPos, state.gridWidth, state.gridHeight);
    } else {
      // Move toward player
      const moveDistance = monster.moveRate || 1;
      newPos = { ...monster.position };

      // Calculate direction to player
      const deltaRow = playerPos.row - monster.position.row;
      const deltaCol = playerPos.col - monster.position.col;

      // Move towards player (one step at a time)
      if (Math.abs(deltaRow) > Math.abs(deltaCol)) {
        // Prioritize vertical movement
        if (deltaRow > 0) {
          newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row);
        } else if (deltaRow < 0) {
          newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row);
        }
      } else {
        // Prioritize horizontal movement
        if (deltaCol > 0) {
          newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col);
        } else if (deltaCol < 0) {
          newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col);
        }
      }

      // Keep in bounds
      newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
      newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

      // Check for collision with player
      if (checkCollision(newPos, playerPos)) {
        if (!state.player.isHidden) {
          setupCombat(state, dispatch, monster, showDialog, playerPos);
        }
        return; // Don't move if entering combat
      }
    }

    // Update monster position
    dispatch({
      type: "MOVE_MONSTER",
      payload: { id: monster.id, position: newPos },
    });
  });
};

const setupCombat = (
  state: GameState,
  dispatch: (action: any) => void,
  monster: Monster,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;
  let newAttackSlots = [...(state.attackSlots || [])];
  let newWaitingMonsters = [...(state.waitingMonsters || [])];

  // Define the 4 combat slot positions (like web version)
  const slotPositions = [
    { row: playerPos.row - 1, col: playerPos.col - 1 }, // top-left
    { row: playerPos.row - 1, col: playerPos.col + 1 }, // top-right  
    { row: playerPos.row + 1, col: playerPos.col - 1 }, // bottom-left
    { row: playerPos.row + 1, col: playerPos.col + 1 }, // bottom-right
  ];

  // Add monster to combat if slot available
  if (!newAttackSlots.some((slot: any) => slot.id === monster.id)) {
    if (newAttackSlots.length < (state.maxAttackers || 4)) {
      // Find next available UI slot
      const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0);
      const nextUISlot = [0, 1, 2, 3].find(slot => !usedUISlots.includes(slot));
      
      if (nextUISlot !== undefined) {
        // Assign combat position and UI slot
        const combatMonster = {
          ...monster,
          position: { ...slotPositions[nextUISlot] },
          uiSlot: nextUISlot,
          inCombatSlot: true
        };
        
        newAttackSlots.push(combatMonster);
        
        // Update the monster in activeMonsters too
        dispatch({
          type: "MOVE_MONSTER", 
          payload: { id: monster.id, position: combatMonster.position }
        });
      }
    } else {
      // No slots available, add to waiting
      if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
        newWaitingMonsters.push(monster);
      }
    }
  }

  // Create turn order: player first, then attacking monsters
  const newTurnOrder = [state.player, ...newAttackSlots];

  // Start combat
  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: true,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newTurnOrder[0], // Player goes first
    },
  });

  showDialog(`${monster.name} attacks!`, 2000);
};

// Helper functions
const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};

const moveAway = (
  monster: Monster, 
  playerPos: Position, 
  gridWidth: number, 
  gridHeight: number
): Position => {
  const newPos = { ...monster.position };
  const moveDistance = monster.moveRate || 1;
  
  // Move away from player
  if (monster.position.row < playerPos.row) {
    newPos.row = Math.max(0, monster.position.row - moveDistance);
  } else if (monster.position.row > playerPos.row) {
    newPos.row = Math.min(gridHeight - 1, monster.position.row + moveDistance);
  }
  
  if (monster.position.col < playerPos.col) {
    newPos.col = Math.max(0, monster.position.col - moveDistance);
  } else if (monster.position.col > playerPos.col) {
    newPos.col = Math.min(gridWidth - 1, monster.position.col + moveDistance);
  }
  
  return newPos;
};

// Initialize some starting monsters
export const initializeStartingMonsters = (
  state: GameState,
  dispatch: (action: any) => void
): void => {
  // Spawn a few abhuman monsters to start
  const abhumanTemplate = monsters.find(m => m.shortName === 'abhuman');
  if (abhumanTemplate) {
    for (let i = 0; i < 3; i++) {
      // Generate position within 20-40 squares of player
      const angle = Math.random() * 2 * Math.PI;
      const distance = 20 + Math.random() * 20; // 20-40 squares
      
      let spawnRow = Math.round(state.player.position.row + Math.sin(angle) * distance);
      let spawnCol = Math.round(state.player.position.col + Math.cos(angle) * distance);
      
      // Keep in bounds
      spawnRow = Math.max(0, Math.min(state.gridHeight - 1, spawnRow));
      spawnCol = Math.max(0, Math.min(state.gridWidth - 1, spawnCol));
      
      const newMonster: Monster = {
        ...abhumanTemplate,
        id: `abhuman-init-${i}`,
        position: { row: spawnRow, col: spawnCol },
        hp: abhumanTemplate.maxHP,
        active: true,
      };

      dispatch({
        type: "SPAWN_MONSTER",
        payload: { monster: newMonster },
      });
      
      console.log(`Spawned initial ${newMonster.name} at (${spawnRow}, ${spawnCol}), distance: ${Math.round(distance)}`);
    }
  }
};