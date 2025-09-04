// modules/monsterUtils.ts
import { GameState, Monster, Position } from "../config/types";
import { monsters } from "../config/monsters";
import { MovementHandler, checkCollision } from "./movement";

export const checkMonsterSpawn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
   const levelId = state.currentLevelId;
  const currentLevel = state.levels[levelId];
  console.log("check level in checkMonsterSpawn: ", currentLevel);

  if (!currentLevel) return;

  console.log("after check level in checkMonsterSpawn: ", currentLevel);

  for (const template of monsters) {
    console.log("in spawn check: ");
    if (!template.spawnRate || !template.spawnChance) continue;

    console.log("passed spawn check: ");

    const activeCount = state.activeMonsters.filter(
      (m) => m.shortName === template.shortName
    ).length;
    if (activeCount >= (template.maxInstances || Infinity)) continue;

    if (Math.random() < template.spawnRate * template.spawnChance) {
      const newMonster: Monster = {
        ...template,
        id: `${template.shortName}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        position: getSpawnPosition(state),
        active: true,
        hp: template.hp,
      };
      dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
      showDialog(`${template.name} has appeared!`, 2000);
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

    const isOccupied = activeMonsters.some(
      (m) => m.position.row === spawnRow && m.position.col === spawnCol
    );

    if (!isOccupied && distance >= 10 && distance <= 20)
      return { row: spawnRow, col: spawnCol };
    attempts++;
  } while (attempts < maxAttempts);

  return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) }; // fallback
};



export const handleMoveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  if (state.inCombat) return;

  // Spawn new monsters if applicable
  checkMonsterSpawn(state, dispatch, showDialog);

  const movementHandler = new MovementHandler(dispatch, showDialog, () => {}, () => {});

  state.activeMonsters.forEach((monster) => {
    if (!monster.id) {
      console.warn("Skipping monster with no id", monster);
      return;
    }

    const moveSteps = monster.moveRate || 1; // number of grid squares per player move

    for (let i = 0; i < moveSteps; i++) {
      const direction = movementHandler.calculateDirectionToTarget(
        monster.position,
        state.player.position
      );

      if (direction) {
        movementHandler.moveMonster(state, monster.id, direction);

        // Stop moving if collided with player
        if (checkCollision(monster.position, state.player.position)) {
          // setupCombat(state, dispatch, monster, showDialog);
          break;
        }
      } else {
        break; // no valid direction, stop
      }
    }
  });
};

