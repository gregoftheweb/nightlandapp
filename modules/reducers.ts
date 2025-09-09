// modules/reducers.ts - All game logic and state updates
import { GameState, Position, Monster } from "../config/types";
import { levels } from "../config/levels";
import { initialState } from "./gameState";

// ==================== HELPER FUNCTIONS ====================

const moveAway = (
  monster: Monster, 
  playerPos: Position, 
  gridWidth: number, 
  gridHeight: number
): Position => {
  const newPos = { ...monster.position };
  const moveDistance = monster.moveRate || 1;
  
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

const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};

// ==================== MOVEMENT LOGIC ====================

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  showDialog: (message: string, duration?: number) => void
): GameState => {
  if (state.inCombat) return state;

  const newPosition = { ...state.player.position };

  // Calculate new position
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
    case null:
      break;
    default:
      console.warn(`Unhandled direction: ${direction}`);
      return state;
  }

  // Move player
  dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  
  // Update move count
  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });

  // Handle monster movement and combat
  const updatedState = { 
    ...state, 
    player: { ...state.player, position: newPosition },
    moveCount: newMoveCount 
  };
  
  moveMonsters(updatedState, dispatch, showDialog, newPosition);
  
  return updatedState;
};

const moveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
  if (state.inCombat) return;

  const playerPos = playerPosOverride || state.player.position;

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
      newPos = moveAway(monster, playerPos, state.gridWidth, state.gridHeight);
    } else {
      // Move toward player
      const moveDistance = monster.moveRate || 1;
      newPos = { ...monster.position };

      if (monster.position.row < playerPos.row) {
        newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row);
      } else if (monster.position.row > playerPos.row) {
        newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row);
      }
      
      if (monster.position.col < playerPos.col) {
        newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col);
      } else if (monster.position.col > playerPos.col) {
        newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col);
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

  // Define the 4 combat slot positions (matching web version)
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
        
        // Move monster to combat position
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
      combatTurn: newTurnOrder[0],
    },
  });

  showDialog(`${monster.name} attacks!`, 2000);
};

// ==================== MAIN REDUCER ====================

export const reducer = (state: any = initialState, action: any) => {
  switch (action.type) {
    
    // ============ LEVEL MANAGEMENT ============
    case "SET_LEVEL":
      const newLevelConfig = levels[String(action.levelId)];
      return {
        ...state,
        level: newLevelConfig.id,
        levels: [newLevelConfig],
        monsters: newLevelConfig.monsters,
        greatPowers: newLevelConfig.greatPowers,
        objects: newLevelConfig.objects,
        pools: newLevelConfig.pools,
        poolsTemplate: newLevelConfig.poolTemplates,
        footsteps: newLevelConfig.footsteps,
        footstepsTemplate: newLevelConfig.footstepsTemplate,
        activeMonsters: [],
        attackSlots: [],
        waitingMonsters: [],
        inCombat: false,
        turnOrder: [],
        combatTurn: null,
        moveCount: 0,
        player: {
          ...state.player,
          hp: state.player.maxHP,
          position: { row: 395, col: 200 },
        },
      };

    // ============ PLAYER MOVEMENT ============
    case "MOVE_PLAYER":
      if (state.inCombat) {
        console.log("Player cannot move while in combat");
        return state;
      }

      let newPlayerPos;
      if (action.payload.position) {
        newPlayerPos = action.payload.position;
      } else if (action.payload.direction) {
        const currentPos = state.player.position;
        if (!currentPos) {
          console.error("Player position is undefined!");
          return state;
        }

        let newRow = currentPos.row;
        let newCol = currentPos.col;

        switch (action.payload.direction) {
          case "up":
            newRow = Math.max(0, currentPos.row - 1);
            break;
          case "down":
            newRow = Math.min(state.gridHeight - 1, currentPos.row + 1);
            break;
          case "left":
            newCol = Math.max(0, currentPos.col - 1);
            break;
          case "right":
            newCol = Math.min(state.gridWidth - 1, currentPos.col + 1);
            break;
          default:
            console.warn("Unknown direction:", action.payload.direction);
            return state;
        }

        newPlayerPos = { row: newRow, col: newCol };
      } else {
        console.error("MOVE_PLAYER: No position or direction provided");
        return state;
      }

      return {
        ...state,
        player: {
          ...state.player,
          position: newPlayerPos,
        },
      };

    case "UPDATE_MOVE_COUNT":
      return { ...state, moveCount: action.payload.moveCount };

    case "PASS_TURN":
      return {
        ...state,
        moveCount: state.moveCount + 1,
        lastAction: "PASS_TURN",
      };

    // ============ MONSTER MOVEMENT ============
    case "MOVE_MONSTER":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster: any) =>
          monster.id === action.payload.id
            ? { ...monster, position: action.payload.position }
            : monster
        ),
      };

    case "SPAWN_MONSTER":
      const newMonster = action.payload.monster;
      console.log("Spawning monster:", newMonster.name);
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, newMonster],
      };

    case "UPDATE_ACTIVE_MONSTERS":
      return { ...state, activeMonsters: action.payload.activeMonsters };

    // ============ COMBAT SYSTEM ============
    case "SET_COMBAT":
      return {
        ...state,
        inCombat: action.payload.inCombat,
        attackSlots: action.payload.attackSlots,
        waitingMonsters: action.payload.waitingMonsters || [],
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      };

    case "START_COMBAT":
      return {
        ...state,
        inCombat: true,
        activeMonsters: state.activeMonsters.map((monster: any) =>
          monster.id === action.payload.monster?.id
            ? { ...monster, inCombatSlot: true }
            : monster
        ),
      };

    case "UPDATE_TURN":
      return {
        ...state,
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      };

    case "UPDATE_WAITING_MONSTERS":
      return { ...state, waitingMonsters: action.payload.waitingMonsters };

    // ============ HEALTH SYSTEM ============
    case "UPDATE_MONSTER_HP":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster: any) =>
          monster.id === action.payload.id
            ? { ...monster, hp: action.payload.hp }
            : monster
        ),
        attackSlots: state.attackSlots.map((slot: any) =>
          slot.id === action.payload.id
            ? { ...slot, hp: action.payload.hp }
            : slot
        ),
      };

    case "UPDATE_PLAYER_HP":
      return {
        ...state,
        player: { ...state.player, hp: action.payload.hp },
      };

    case "RESET_HP":
      return {
        ...state,
        player: { ...state.player, hp: state.player.maxHP },
      };

    // ============ INVENTORY SYSTEM ============
    case "ADD_TO_INVENTORY":
      const { item } = action.payload;
      if (state.player.inventory.length >= state.player.maxInventorySize) {
        return state;
      }
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, item],
        },
      };

    case "DROP_ITEM":
      const { itemId } = action.payload;
      const droppedItem = state.player.inventory.find(
        (item: any) => item.id === itemId
      );
      if (!droppedItem) return state;
      const newItem = {
        ...droppedItem,
        position: { ...state.player.position },
        active: true,
      };
      return {
        ...state,
        player: {
          ...state.player,
          inventory: state.player.inventory.filter(
            (item: any) => item.id !== itemId
          ),
        },
        items: [...state.items, newItem],
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item: any) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };

    case "TOGGLE_INVENTORY":
      return {
        ...state,
        showInventory: !state.showInventory,
        showWeaponsInventory: false,
      };

    // ============ WEAPONS SYSTEM ============
    case "ADD_TO_WEAPONS":
      const { weapon } = action.payload;
      if (state.player.weapons.length >= state.player.maxWeaponsSize) {
        console.log("Weapons inventory full!");
        return state;
      }
      return {
        ...state,
        player: {
          ...state.player,
          weapons: [...state.player.weapons, weapon],
        },
      };

    case "DROP_WEAPON":
      const { weaponId } = action.payload;
      const droppedWeapon = state.player.weapons.find(
        (w: any) => w.id === weaponId
      );
      if (!droppedWeapon) return state;
      if (droppedWeapon.id === "weapon-discos-001") {
        console.log("Cannot drop the Discos!");
        return state;
      }
      const weaponDetails = state.weapons.find((w: any) => w.id === weaponId);
      const newWeaponItem = {
        name: weaponDetails.name,
        shortName: weaponDetails.shortName,
        position: { ...state.player.position },
        description: weaponDetails.description,
        active: true,
        collectible: true,
        type: "weapon",
        weaponId: weaponId,
      };
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter((w: any) => w.id !== weaponId),
        },
        items: [...state.items, newWeaponItem],
        dropSuccess: true,
      };

    case "TOGGLE_WEAPONS_INVENTORY":
      return {
        ...state,
        showWeaponsInventory: !state.showWeaponsInventory,
        showInventory: false,
      };

    // ============ EFFECTS SYSTEM ============
    case "TRIGGER_EFFECT":
      const { effect, position } = action.payload;
      switch (effect.type) {
        case "swarm":
          const newMonsters: any[] = [];
          const monstersArray = state.monsters ?? [];
          const monsterTemplate = monstersArray.find(
            (m: any) => m.name === effect.monsterType
          );

          if (!monsterTemplate) {
            console.warn("Monster template not found:", effect.monsterType);
            return state;
          }

          for (let i = 0; i < effect.count; i++) {
            const spawnRow = Math.max(
              0,
              Math.min(
                state.gridHeight - 1,
                position.row +
                  Math.floor(Math.random() * effect.range * 2) -
                  effect.range
              )
            );
            const spawnCol = Math.max(
              0,
              Math.min(
                state.gridWidth - 1,
                position.col +
                  Math.floor(Math.random() * effect.range * 2) -
                  effect.range
              )
            );
            newMonsters.push({
              ...monsterTemplate,
              id: `${monsterTemplate.shortName}-${Date.now()}-${i}`,
              hp: monsterTemplate.hp,
              position: { row: spawnRow, col: spawnCol },
              active: true,
            });
          }

          return {
            ...state,
            activeMonsters: [...state.activeMonsters, ...newMonsters],
          };
          
        case "hide":
          return {
            ...state,
            player: {
              ...state.player,
              isHidden: true,
              hideTurns: effect.duration || 10,
            },
          };
          
        case "heal":
          return {
            ...state,
            player: {
              ...state.player,
              hp: Math.min(state.player.maxHP, state.player.hp + effect.amount),
            },
          };
          
        default:
          return state;
      }

    case "DECREMENT_HIDE_TURNS":
      const newHideTurns = Math.max(0, state.player.hideTurns - 1);
      return {
        ...state,
        player: {
          ...state.player,
          hideTurns: newHideTurns,
          isHidden: newHideTurns > 0,
        },
      };

    // ============ WORLD OBJECTS ============
    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj: any) =>
          obj.shortName === action.payload.shortName
            ? { ...obj, ...action.payload.updates }
            : obj
        ),
      };

    case "ADD_FOOTSTEPS":
      const newFootsteps = {
        id: state.footsteps.length + 1,
        position: action.position,
        direction: action.direction,
      };
      return {
        ...state,
        footsteps: [...state.footsteps, newFootsteps].slice(
          0,
          state.footstepsTemplate.maxInstances
        ),
      };

    case "ADD_POOL":
      const newPool = {
        id: state.pools.length + 1,
        position: action.position,
      };
      return {
        ...state,
        pools: [...state.pools, newPool].slice(
          0,
          state.poolsTemplate.maxInstances
        ),
      };

    // ============ UI STATE ============
    case "UPDATE_DIALOG":
      return { ...state, dialogData: action.payload.dialogData };

    case "SET_AUDIO_STARTED":
      return { ...state, audioStarted: action.payload };

    // ============ CLEANUP ============
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState;
  }
};