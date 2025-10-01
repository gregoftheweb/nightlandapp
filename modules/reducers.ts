// modules/reducers.ts
import {
  GameState,
  CombatLogEntry,
  Monster,
  LevelMonsterInstance,
  FootstepInstance,
  Position,
} from "../config/types";
import { levels } from "../config/levels";
import { initialState } from "./gameState";
import { createMonsterFromTemplate } from "../modules/monsterUtils";

export const reducer = (
  state: GameState = initialState,
  action: any
): GameState => {
  switch (action.type) {
    // ============ LEVEL MANAGEMENT ============
    case "SET_LEVEL":
      const newLevelConfig = levels[String(action.levelId)];
      return {
        ...state,
        level: newLevelConfig,
        levels: { ...state.levels, [action.levelId]: newLevelConfig },
        monsters: newLevelConfig.monsters || [],
        greatPowers: newLevelConfig.greatPowers || [],
        objects: newLevelConfig.objects || [],
        footsteps: newLevelConfig.footsteps || [],
        footstepsTemplate: newLevelConfig.footstepsTemplate || {
          maxInstances: 0,
        },
        activeMonsters: [],
        attackSlots: [],
        waitingMonsters: [],
        inCombat: false,
        turnOrder: [],
        combatTurn: null,
        moveCount: 0,
        combatLog: [],
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
        activeMonsters: state.activeMonsters.map((monster) =>
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

    case "AWAKEN_GREAT_POWER":
      return {
        ...state,
        level: {
          ...state.level,
          greatPowers:
            state.level.greatPowers?.map((power) =>
              power.id === action.payload.greatPowerId
                ? { ...power, awakened: true }
                : power
            ) || [],
        },
      };

    // ============ COMBAT SYSTEM ============
    case "SET_COMBAT":
      console.log("SET_COMBAT dispatched, inCombat.");
      return {
        ...state,
        inCombat: action.payload.inCombat,
        attackSlots: action.payload.attackSlots,
        waitingMonsters: action.payload.waitingMonsters || [],
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
        combatLog: action.payload.inCombat ? state.combatLog || [] : [],
      };

    case "START_COMBAT":
      return {
        ...state,
        inCombat: true,
        activeMonsters: state.activeMonsters.map((monster) =>
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

    // ============ COMBAT LOG ============
    case "ADD_COMBAT_LOG":
      console.log("ADD_COMBAT_LOG dispatched:", action.payload);
      return {
        ...state,
        combatLog: [
          ...(state.combatLog || []),
          {
            id: `${Date.now()}-${Math.random()}`,
            message: action.payload.message,
            turn: state.moveCount,
          },
        ],
      };

    // ============ HEALTH SYSTEM ============
    case "UPDATE_PLAYER":
      return {
        ...state,
        player: { ...state.player, ...action.payload.updates },
      };

    case "UPDATE_MONSTER":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? { ...monster, ...action.payload.updates }
            : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id
            ? { ...slot, ...action.payload.updates }
            : slot
        ),
      };

    case "REMOVE_MONSTER":
      return {
        ...state,
        activeMonsters: state.activeMonsters.filter(
          (monster) => monster.id !== action.payload.id
        ),
        attackSlots: state.attackSlots.filter(
          (slot) => slot.id !== action.payload.id
        ),
        waitingMonsters: state.waitingMonsters.filter(
          (monster) => monster.id !== action.payload.id
        ),
      };

    case "UPDATE_PLAYER_HP":
      return {
        ...state,
        player: { ...state.player, hp: action.payload.hp },
      };

    case "UPDATE_MONSTER_HP":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster) =>
          monster.id === action.payload.id
            ? { ...monster, hp: action.payload.hp }
            : monster
        ),
        attackSlots: state.attackSlots.map((slot) =>
          slot.id === action.payload.id
            ? { ...slot, hp: action.payload.hp }
            : slot
        ),
      };

    case "RESET_HP":
      return {
        ...state,
        player: { ...state.player, hp: state.player.maxHP },
      };

    case "GAME_OVER": {
      // This should set the death state but NOT reset anything yet
      return {
        ...state,
        gameOver: true,
        gameOverMessage: state.gameOverMessage || "You have been defeated.",
        inCombat: false,
        attackSlots: [],
        waitingMonsters: [],
        turnOrder: [],
        combatTurn: null,
        combatLog: [],
      };
    }

    case "RESET_GAME": {
      return initialState;
    }

    // ============ INVENTORY MANAGEMENT ============
    case "ADD_TO_INVENTORY":
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, action.payload.item],
        },
      };

    case "REMOVE_FROM_INVENTORY":
      return {
        ...state,
        player: {
          ...state.player,
          inventory: state.player.inventory.filter(
            (item) => item.id !== action.payload.id
          ),
        },
      };

    case "TOGGLE_INVENTORY":
      return {
        ...state,
        showInventory: !state.showInventory,
        showWeaponsInventory: false,
      };

    case "ADD_TO_WEAPONS":
      return {
        ...state,
        player: {
          ...state.player,
          weapons: [...state.player.weapons, action.payload.weapon],
        },
      };

    case "REMOVE_FROM_WEAPONS":
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter(
            (w) => w.id !== action.payload.id
          ),
        },
      };

    case "EQUIP_WEAPON":
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.map((w) =>
            w.id === action.payload.id
              ? { ...w, equipped: true }
              : { ...w, equipped: false }
          ),
        },
      };

    case "DROP_WEAPON":
      const weaponId = action.payload.id;
      if (weaponId === "weapon-discos-001") {
        console.log("Cannot drop the Discos!");
        return state;
      }

      const weaponDetails = state.weapons.find(
        (w) => w.id === action.payload.id
      );
      if (!weaponDetails) {
        console.warn(`Weapon with ID ${weaponId} not found`);
        return state;
      }

      const newWeaponItem = {
        name: weaponDetails.name,
        shortName: weaponDetails.shortName,
        position: { ...state.player.position },
        description: weaponDetails.description,
        active: true,
        collectible: true,
        type: "weapon" as const,
        weaponId: weaponId,
        category: "weapon" as const,
      };

      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter(
            (w) => w.id !== action.payload.id
          ),
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

    // ============ ITEM MANAGEMENT ============

    case "DROP_ITEM": {
      const { item, position } = action.payload;

      const updatedInventory = state.player.inventory.filter(
        (invItem) => invItem.id !== item.id
      );

      const droppedItem = {
        ...item,
        position: { ...position },
        active: true,
        collectible: true,
      };

      return {
        ...state,
        player: {
          ...state.player,
          inventory: updatedInventory,
        },
        items: [...state.items, droppedItem],
      };
    }

    case "REMOVE_ITEM_FROM_GAMEBOARD":
      console.log(
        `Removing item from gameboard: ${action.payload.shortName} from position (${action.payload.position.row}, ${action.payload.position.col})`
      );
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.position?.row === action.payload.position.row &&
              item.position?.col === action.payload.position.col &&
              item.shortName === action.payload.shortName
            )
        ),
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };

    // ============ EFFECTS SYSTEM ============
    case "TRIGGER_EFFECT":
      const { effect, position } = action.payload;
      switch (effect.type) {
        case "swarm": {
          // Validate we have the necessary effect properties
          if (!effect.monsterType || !effect.count || !effect.range) {
            console.error("Swarm effect missing required properties:", effect);
            return state;
          }

          // Get the spawn range (effect.range +/- 5 grid squares)
          const spawnRange = effect.range;
          const playerPos = state.player.position;
          const newMonsters: Monster[] = [];

          // Create the specified number of monsters
          for (let i = 0; i < effect.count; i++) {
            // Generate random offset within range
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * spawnRange;

            // Calculate spawn position relative to player
            const rowOffset = Math.round(Math.sin(angle) * distance);
            const colOffset = Math.round(Math.cos(angle) * distance);

            // Add random variance (+/- 5 grid squares as specified)
            const variance = 5;
            const rowVariance =
              Math.floor(Math.random() * variance * 2) - variance;
            const colVariance =
              Math.floor(Math.random() * variance * 2) - variance;

            // Calculate final position, clamped to grid bounds
            const spawnRow = Math.max(
              0,
              Math.min(
                state.gridHeight - 1,
                playerPos.row + rowOffset + rowVariance
              )
            );
            const spawnCol = Math.max(
              0,
              Math.min(
                state.gridWidth - 1,
                playerPos.col + colOffset + colVariance
              )
            );

            const spawnPosition: Position = { row: spawnRow, col: spawnCol };

            // Create monster using the utility function
            const monster = createMonsterFromTemplate(
              effect.monsterType,
              spawnPosition
            );

            if (monster) {
              newMonsters.push(monster);
              console.log(
                `Swarm spawned ${monster.name} at ${spawnRow},${spawnCol}`
              );
            }
          }

          // Return updated state with new monsters
          return {
            ...state,
            activeMonsters: [...state.activeMonsters, ...newMonsters],
          };
        }

        case "hide":
          return {
            ...state,
            player: {
              ...state.player,
              isHidden: true,
            },
          };

        case "cloaking":
          return {
            ...state,
            player: {
              ...state.player,
              isHidden: true,
              hideTurns: effect.duration || 5, // default to 5 turns if not set
            },
          };

        case "heal": {
          const healAmount =
            typeof effect.amount === "number" && !isNaN(effect.amount)
              ? effect.amount
              : 0;
          const currentHP =
            typeof state.player.hp === "number" && !isNaN(state.player.hp)
              ? state.player.hp
              : 0;
          const newHP = Math.min(state.player.maxHP, currentHP + healAmount);
          return {
            ...state,
            player: {
              ...state.player,
              hp: newHP,
            },
          };
        }

        case "recuperate": {
          // Only heal if player is below max HP
          if (state.player.hp >= state.player.maxHP) {
            return state;
          }

          const recuperateAmount =
            typeof effect.amount === "number" && !isNaN(effect.amount)
              ? effect.amount
              : 5;

          const currentHP =
            typeof state.player.hp === "number" && !isNaN(state.player.hp)
              ? state.player.hp
              : 0;

          const newHP = Math.min(
            state.player.maxHP,
            currentHP + recuperateAmount
          );

          return {
            ...state,
            player: {
              ...state.player,
              hp: newHP,
            },
          };
        }
        case "soulsuck": {
          console.log("SOULSUCK EFFECT TRIGGERED - Player soul consumed!");
          return {
            ...state,
            player: {
              ...state.player,
              hp: 0,
            },
            gameOver: true,
            gameOverMessage:
              "Your soul has been consumed by the Watcher. The darkness claims another victim...",
            inCombat: false,
            attackSlots: [],
            waitingMonsters: [],
          };
        }
        default:
          return state;
      }

    case "CLEAR_HIDE":
      return {
        ...state,
        player: {
          ...state.player,
          isHidden: false,
        },
      };

    case "DECREMENT_CLOAKING_TURNS":
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
        objects: state.objects.map((obj) =>
          obj.shortName === action.payload.shortName
            ? { ...obj, ...action.payload.updates }
            : obj
        ),
      };
    case "ADD_FOOTSTEPS":
      const template = state.footstepsTemplate;

      const newFootstep: FootstepInstance = {
        id: state.footsteps.length + 1,
        templateId: template?.id || "default",
        position: action.position,
        direction: action.direction,
      };

      return {
        ...state,
        footsteps: [...state.footsteps, newFootstep].slice(
          0,
          template?.maxInstances || 10
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
