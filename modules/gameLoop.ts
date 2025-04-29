// modules/gameLoop.ts
import { resetChristos } from "./combat";
import * as textContent from "../assets/copy/textcontent";
import { moveAway, disappearFarMonsters } from "./utils";

export const handleMovePlayer = (
  state: any,
  dispatch: (action: any) => void,
  direction: string | null,
  setOverlay: (overlay: any) => void,
  showDialog: (message: string, duration?: number) => void,
  setDeathMessage: (message: string) => void
) => {
  if (state.inCombat) return;

  let isMove = true;
  const newPosition = { ...state.player.position };

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

  if (isMove) {
    dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  }
  const updatedState = {
    ...state,
    player: { ...state.player, position: newPosition },
  };

  const collectibleAtPosition = state.items.find((item: any) => {
    if (!item || !item.active || !item.collectible || !item.position)
      return false;

    const itemRowStart = item.position.row;
    const itemColStart = item.position.col;
    const itemWidth = item.size?.width || 1;
    const itemHeight = item.size?.height || 1;
    const itemRowEnd = itemRowStart + itemHeight - 1;
    const itemColEnd = itemColStart + itemWidth - 1;

    return (
      item.active &&
      item.collectible &&
      newPosition.row >= itemRowStart &&
      newPosition.row <= itemRowEnd &&
      newPosition.col >= itemColStart &&
      newPosition.col <= itemColEnd
    );
  });

  if (collectibleAtPosition?.splash) {
    setOverlay({
      image: collectibleAtPosition.splash.image,
      text: collectibleAtPosition.splash.text,
    });
  }

  if (collectibleAtPosition) {
    if (collectibleAtPosition.type === "weapon") {
      const weapon = state.weapons.find(
        (w: any) => w.id === collectibleAtPosition.weaponId
      );
      if (!weapon) {
        console.warn("Weapon not found:", collectibleAtPosition.weaponId);
        return;
      }
      const weaponEntry = {
        id: weapon.id,
        equipped: false,
      };
      dispatch({ type: "ADD_TO_WEAPONS", payload: { weapon: weaponEntry } });
      showDialog(`Picked up ${weapon.name}!`, 3000);
    } else {
      const item = {
        id: `${collectibleAtPosition.shortName}-${Date.now()}`,
        ...collectibleAtPosition,
      };
      dispatch({ type: "ADD_TO_INVENTORY", payload: { item } });
      showDialog(`Picked up ${item.name}!`, 3000);
    }
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        shortName: collectibleAtPosition.shortName,
        updates: { active: false },
      },
    });
  }

  const objectAtPosition = state.objects.find((obj: any) => {
    if (!obj.active) return false;

    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const objRowStart = obj.position.row + mask.row;
        const objColStart = obj.position.col + mask.col;
        const objRowEnd = objRowStart + (mask.height || 1) - 1;
        const objColEnd = objColStart + (mask.width || 1) - 1;

        return (
          newPosition.row >= objRowStart &&
          newPosition.row <= objRowEnd &&
          newPosition.col >= objColStart &&
          newPosition.col <= objColEnd
        );
      });
    } else {
      const objRowStart = obj.position.row;
      const objColStart = obj.position.col;
      const objWidth = obj.size?.width || 1;
      const objHeight = obj.size?.height || 1;
      const objRowEnd = objRowStart + objHeight - 1;
      const objColEnd = objColStart + objWidth - 1;

      return (
        newPosition.row >= objRowStart &&
        newPosition.row <= objRowEnd &&
        newPosition.col >= objColStart &&
        newPosition.col <= objColEnd
      );
    }
  });

  if (objectAtPosition && objectAtPosition.effects) {
    const now = Date.now();
    const lastTrigger = objectAtPosition.lastTrigger || 0;
    if (now - lastTrigger > 50000) {
      objectAtPosition.effects.forEach((effect: any) => {
        dispatch({
          type: "TRIGGER_EFFECT",
          payload: { effect, position: newPosition },
        });
        switch (effect.type) {
          case "swarm":
            showDialog(
              `A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`,
              3000
            );
            dispatch({
              type: "UPDATE_OBJECT",
              payload: {
                shortName: objectAtPosition.shortName,
                updates: { lastTrigger: now },
              },
            });
            break;
          case "hide":
            showDialog(
              `The ${objectAtPosition.name} cloaks you in silence.`,
              3000
            );
            break;
          case "heal":
            showDialog(
              `The ${objectAtPosition.name} restores your strength!`,
              3000
            );
            break;
          default:
            break;
        }
      });
    }
  }

  const poolAtPosition = state.pools.find((pool: any) => {
    const poolRowStart = pool.position.row;
    const poolColStart = pool.position.col;
    const poolMiddleRowStart = poolRowStart + 1;
    const poolMiddleColStart = poolColStart + 1;
    const poolMiddleRowEnd = poolMiddleRowStart + 1;
    const poolMiddleColEnd = poolMiddleColStart + 1;

    return (
      newPosition.row >= poolMiddleRowStart &&
      newPosition.row <= poolMiddleRowEnd &&
      newPosition.col >= poolMiddleColStart &&
      newPosition.col <= poolMiddleColEnd
    );
  });
  if (poolAtPosition && state.poolsTemplate.effects) {
    state.poolsTemplate.effects.forEach((effect: any) => {
      dispatch({
        type: "TRIGGER_EFFECT",
        payload: { effect, position: newPosition },
      });
      switch (effect.type) {
        case "heal":
          showDialog("The Pool of Peace restores your strength!", 3000);
          break;
        case "hide":
          showDialog(
            `The ${state.poolsTemplate.name} cloaks you in silence.`,
            3000
          );
          break;
        default:
          break;
      }
    });
  }

  const watcher = updatedState.greatPowers.find(
    (power: any) => power.shortName === "watcherse"
  );
  if (watcher) {
    const watcherLeft = watcher.position.col;
    const watcherTop = watcher.position.row;
    const watcherWidth = watcher.size?.width || 1;
    const watcherHeight = watcher.size?.height || 1;
    const watcherRight = watcherLeft + watcherWidth - 1;
    const watcherBottom = watcherTop + watcherHeight - 1;

    if (
      newPosition.row >= watcherTop &&
      newPosition.row <= watcherBottom &&
      newPosition.col >= watcherLeft &&
      newPosition.col <= watcherRight
    ) {
      const deathMessageKey = `combatChristosDeath${watcher.shortName}`;
      const deathMessage =
        textContent[deathMessageKey] || textContent.combatChristosDeathDefault;

      dispatch({ type: "UPDATE_PLAYER_HP", payload: { hp: 0 } });
      resetChristos(updatedState, dispatch);
      setDeathMessage(deathMessage);
      return;
    }
  }

  if (state.player.isHidden) {
    dispatch({ type: "DECREMENT_HIDE_TURNS" });
  }

  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  const finalState = { ...updatedState, moveCount: newMoveCount };

  checkMonsterSpawn(finalState, dispatch, showDialog);
  moveMonsters(finalState, dispatch, showDialog, newPosition);
};

export const moveMonsters = (
  state: any,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: any
) => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;

  state.activeMonsters.forEach((monster: any) => {
    if (
      state.attackSlots.some((slot: any) => slot.id === monster.id) ||
      state.waitingMonsters.some((m: any) => m.id === monster.id)
    ) {
      return;
    }

    let newPos;
    if (state.player.isHidden) {
      newPos = moveAway(monster, playerPos, state.gridWidth, state.gridHeight);
    } else {
      const moveDistance = monster.moveRate;
      newPos = { ...monster.position };

      if (monster.position.row < playerPos.row) {
        newPos.row = Math.min(
          monster.position.row + moveDistance,
          playerPos.row
        );
      } else if (monster.position.row > playerPos.row) {
        newPos.row = Math.max(
          monster.position.row - moveDistance,
          playerPos.row
        );
      }
      if (monster.position.col < playerPos.col) {
        newPos.col = Math.min(
          monster.position.col + moveDistance,
          playerPos.col
        );
      } else if (monster.position.col > playerPos.col) {
        newPos.col = Math.max(
          monster.position.col - moveDistance,
          playerPos.col
        );
      }

      newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
      newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

      if (checkCollision(newPos, playerPos)) {
        if (!state.player.isHidden) {
          setupCombat(state, dispatch, monster, showDialog, playerPos);
        }
        return;
      } else {
        if (state.attackSlots.length >= state.maxAttackers) {
          const distance = Math.sqrt(
            Math.pow(newPos.row - playerPos.row, 2) +
              Math.pow(newPos.col - playerPos.col, 2)
          );
          if (distance <= 2) {
            if (!state.waitingMonsters.some((m: any) => m.id === monster.id)) {
              dispatch({
                type: "UPDATE_WAITING_MONSTERS",
                payload: {
                  waitingMonsters: [
                    ...state.waitingMonsters,
                    { ...monster, position: newPos },
                  ],
                },
              });
            }
            return;
          }
        }
      }
    }

    dispatch({
      type: "MOVE_MONSTER",
      payload: { id: monster.id, position: newPos },
    });
  });

  const filteredMonsters = disappearFarMonsters(
    state.activeMonsters,
    playerPos
  );

  if (filteredMonsters.length !== state.activeMonsters.length) {
    dispatch({
      type: "UPDATE_ACTIVE_MONSTERS",
      payload: { activeMonsters: filteredMonsters },
    });
  }
};

export const checkMonsterSpawn = (
  state: any,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void
) => {
  const currentLevel = state.levels.find((lvl: any) => lvl.id === state.level);
  if (!currentLevel) return;

  const { moveCount, player, activeMonsters } = state;

  for (const monsterTemplate of state.monsters) {
    const activeCount = activeMonsters.filter(
      (m: any) => m.name === monsterTemplate.name
    ).length;

    if (activeCount >= (monsterTemplate.maxInstances || 1)) continue;

    const shouldAttemptSpawn =
      monsterTemplate.spawnRate &&
      (moveCount + 1) % monsterTemplate.spawnRate === 0;

    if (!shouldAttemptSpawn) continue;

    const spawnRoll = Math.random();
    if (spawnRoll >= (monsterTemplate.spawnChance || 0)) continue;

    const spawnPosition = getSpawnPosition(player.position);

    const newMonster = {
      ...monsterTemplate,
      position: spawnPosition,
      id: `${monsterTemplate.shortName}-${Date.now()}`,
      active: true,
      hp: monsterTemplate.hp ?? 20,
    };

    dispatch({ type: "SPAWN_MONSTER", payload: { monster: newMonster } });
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
      monster.position = { ...slotPositions[nextUISlot] };
      monster.uiSlot = nextUISlot;
      newAttackSlots.push(monster);
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