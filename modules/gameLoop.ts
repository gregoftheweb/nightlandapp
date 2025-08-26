// modules/gameLoop.ts
import { resetChristos } from "./combat";
import { handleMovePlayer } from "./playerUtils";
import { moveAway, disappearFarMonsters } from "./utils";

export const checkMonsterSpawn = (
  state: any,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  console.log(
    "state.levels type:",
    typeof state.levels,
    Array.isArray(state.levels),
    state.levels
  );

  const currentLevel = state.levels?.[state.level];
  if (!currentLevel) return;

  const { moveCount, player, activeMonsters } = state;

  const monsters = state.monsters ?? [];
  for (const monsterTemplate of monsters) {
    if (!monsterTemplate) continue;

    const activeCount = (activeMonsters ?? []).filter(
      (m: any) => m.name === monsterTemplate.name
    ).length;

    const spawnChance = Math.random();
    if (activeCount === 0 && spawnChance < 0.1) {
      dispatch({
        type: "SPAWN_MONSTER",
        payload: {
          monster: {
            ...monsterTemplate,
            id: `${monsterTemplate.name}-${Date.now()}`,
          },
        },
      });

      showDialog(`${monsterTemplate.name} has appeared!`, 2000);
    }
  }
};

const getSpawnPosition = (playerPosition: any) => {
  const gridHeight = 400;
  const gridWidth = 400;
  let spawnRow: number, spawnCol: number, distance: number;

  do {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.floor(Math.random() * 11) + 5;

    spawnRow = playerPosition.row + Math.round(Math.sin(angle) * radius);
    spawnCol = playerPosition.col + Math.round(Math.cos(angle) * radius);

    spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow));
    spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol));

    distance = Math.sqrt(
      Math.pow(spawnRow - playerPosition.row, 2) +
        Math.pow(spawnCol - playerPosition.col, 2)
    );
  } while (distance < 10 || distance > 20);

  return { row: spawnRow, col: spawnCol };
};

const checkCollision = (monsterPos: any, playerPos: any) => {
  return monsterPos.row === playerPos.row && monsterPos.col === playerPos.col;
};

const setupCombat = (
  state: any,
  dispatch: (action: any) => void,
  monster: any,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: any
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

  if (!newAttackSlots.some((slot: any) => slot.id === monster.id)) {
    if (newAttackSlots.length < state.maxAttackers) {
      const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0);
      const nextUISlot = [0, 1, 2, 3].find(
        (slot: any) => !usedUISlots.includes(slot)
      );

      if (nextUISlot !== undefined) {
        monster.position = { ...slotPositions[nextUISlot] };
        monster.uiSlot = nextUISlot;
        newAttackSlots.push(monster);
      } else {
        console.warn("No available UI slot found, adding to waiting monsters");
        if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
          newWaitingMonsters.push(monster);
        }
      }
    } else {
      if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
        newWaitingMonsters.push(monster);
      }
    }
  }

  const updatedActiveMonsters = state.activeMonsters.map((m: any) =>
    m.id === monster.id
      ? { ...m, position: monster.position, uiSlot: monster.uiSlot }
      : m
  );

  const newTurnOrder = [state.player, ...newAttackSlots];

  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: true,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newTurnOrder[0],
    },
  });

  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: { activeMonsters: updatedActiveMonsters },
  });
};

export const handleMoveMonster = (
  state: any,
  dispatch: (action: any) => void,
  monsterId: string,
  direction: string
) => {
  const monster = state.activeMonsters.find((m: any) => m.id === monsterId);
  if (!monster || state.inCombat) return;

  const newPosition = { ...monster.position };
  const moveDistance = monster.moveRate;
  switch (direction) {
    case "up":
      newPosition.row = Math.max(0, newPosition.row - moveDistance);
      break;
    case "down":
      newPosition.row = Math.min(
        state.gridHeight - 1,
        newPosition.row + moveDistance
      );
      break;
    case "left":
      newPosition.col = Math.max(0, newPosition.col - moveDistance);
      break;
    case "right":
      newPosition.col = Math.min(
        state.gridWidth - 1,
        newPosition.col + moveDistance
      );
      break;
    default:
      break;
  }
  dispatch({
    type: "MOVE_MONSTER",
    payload: { id: monsterId, position: newPosition },
  });
};

export const handleMoveRedoubt = (
  state: any,
  dispatch: (action: any) => void,
  direction: string
) => {
  const newPosition = { ...state.redoubt.position };
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
    default:
      break;
  }
  dispatch({ type: "MOVE_REDOUBT", payload: { position: newPosition } });
};