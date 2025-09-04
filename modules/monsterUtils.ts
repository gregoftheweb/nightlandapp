// modules/monsterUtils.ts - Refactored without movement logic
import { GameState } from '../config/types';
import { Monster, Position } from '../config/types';
import { monsters } from '../config/monsters';
import { MovementHandler, checkCollision } from './movement';

export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  const currentLevel = state.levels.currentLevel;
  if (!currentLevel) return;

  const { player, activeMonsters } = state;

  for (const monsterTemplate of monsters) {
    if (!monsterTemplate.spawnRate || !monsterTemplate.spawnChance) continue; // Skip bosses like king_kong

    const activeCount = activeMonsters.filter(
      (m: Monster) => m.shortName === monsterTemplate.shortName
    ).length;

    if (activeCount >= (monsterTemplate.maxInstances || Infinity)) continue;

    const spawnRoll = Math.random();
    if (spawnRoll < monsterTemplate.spawnRate * monsterTemplate.spawnChance) {
      const newMonster: Monster = {
        ...monsterTemplate,
        id: `${monsterTemplate.shortName}-${Date.now()}-${Math.random().toString(36).slice(2)}`, // Ensure id is set
        position: getSpawnPosition(state),
        active: true,
        hp: monsterTemplate.hp,
      };
      dispatch({
        type: 'SPAWN_MONSTER',
        payload: { monster: newMonster },
      });

      showDialog(`${monsterTemplate.name} has appeared!`, 2000);
    }
  }
};

export const getSpawnPosition = (state: GameState): Position => {
  const { gridHeight, gridWidth, player, activeMonsters } = state;
  let spawnRow: number, spawnCol: number, distance: number;
  const maxAttempts = 10;
  let attempts = 0;

  do {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.floor(Math.random() * 11) + 5; // 5-15 tiles away

    spawnRow = player.position.row + Math.round(Math.sin(angle) * radius);
    spawnCol = player.position.col + Math.round(Math.cos(angle) * radius);

    spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow));
    spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol));

    distance = Math.sqrt(
      Math.pow(spawnRow - player.position.row, 2) +
      Math.pow(spawnCol - player.position.col, 2)
    );

    const isOccupied = activeMonsters.some(
      (m: Monster) => m.position.row === spawnRow && m.position.col === spawnCol
    );

    if (!isOccupied && distance >= 10 && distance <= 20) {
      return { row: spawnRow, col: spawnCol };
    }

    attempts++;
  } while (attempts < maxAttempts);

  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) }; // Fallback
};

export const setupCombat = (
  state: GameState,
  dispatch: (action: any) => void,
  monster: Monster,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: Position
) => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;
  let newAttackSlots = [...state.attackSlots];
  let newWaitingMonsters = [...state.waitingMonsters];

  const slotPositions = [
    { row: playerPos.row - 1, col: playerPos.col - 1 },
    { row: playerPos.row - 1, col: playerPos.col + 1 },
    { row: playerPos.row + 1, col: playerPos.col - 1 },
    { row: playerPos.row + 1, col: playerPos.col + 1 },
  ];

  if (!newAttackSlots.some((slot: Monster) => slot.id === monster.id)) {
    if (newAttackSlots.length < state.maxAttackers) {
      const usedUISlots = newAttackSlots.map((slot: Monster) => slot.uiSlot || 0);
      const nextUISlot = [0, 1, 2, 3].find(
        (slot: number) => !usedUISlots.includes(slot)
      );

      if (nextUISlot !== undefined) {
        monster.position = { ...slotPositions[nextUISlot] };
        monster.uiSlot = nextUISlot;
        newAttackSlots.push(monster);
      } else {
        console.warn('No available UI slot found, adding to waiting monsters');
        if (!newWaitingMonsters.some((m: Monster) => m.id === monster.id)) {
          newWaitingMonsters.push(monster);
        }
      }
    } else {
      if (!newWaitingMonsters.some((m: Monster) => m.id === monster.id)) {
        newWaitingMonsters.push(monster);
      }
    }
  }

  const updatedActiveMonsters = state.activeMonsters.map((m: Monster) =>
    m.id === monster.id
      ? { ...m, position: monster.position, uiSlot: monster.uiSlot }
      : m
  );

  const newTurnOrder = [state.player, ...newAttackSlots];

  dispatch({
    type: 'SET_COMBAT',
    payload: {
      inCombat: true,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newTurnOrder[0],
    },
  });

  dispatch({
    type: 'UPDATE_ACTIVE_MONSTERS',
    payload: { activeMonsters: updatedActiveMonsters },
  });

  const monsterName = monster.name || monster.shortName || "Unknown Monster";
  showDialog(`${monsterName} has engaged in combat!`, 2000);
};

export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  if (state.inCombat) return;

  // Check for spawning new monsters
  checkMonsterSpawn(state, dispatch, showDialog);

  // Create movement handler
  const movementHandler = new MovementHandler(dispatch, showDialog, () => {}, () => {});

  // Move each monster toward the player
  const updatedMonsters = state.activeMonsters.map((monster: Monster) => {
    const direction = movementHandler.calculateDirectionToTarget(
      monster.position,
      state.player.position
    );

    if (direction) {
      // Ensure monster.id is defined before calling moveMonster
      if (!monster.id) {
        console.warn(`Monster missing id: ${JSON.stringify(monster)}`);
        return monster; // Skip movement for this monster
      }
      movementHandler.moveMonster(state, monster.id, direction);
    }

    // Get updated monster position after potential movement
    const updatedMonster = state.activeMonsters.find((m: Monster) => m.id === monster.id) || monster;
    
    // Check for collision with player
    if (checkCollision(updatedMonster.position, state.player.position)) {
      setupCombat(state, dispatch, updatedMonster, showDialog);
    }

    return updatedMonster;
  });

  dispatch({
    type: 'UPDATE_ACTIVE_MONSTERS',
    payload: { activeMonsters: updatedMonsters },
  });
};