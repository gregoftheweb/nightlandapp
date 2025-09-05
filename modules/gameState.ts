// modules/gameState.ts
import { levels } from "../config/levels";
import { GameState, Level } from "../config/types"; // Adjust import based on where Level is defined
import christosIMG from "@assets/images/christos.png";
import { playerConfig } from "../config/player";

export const getInitialState = (levelId: string = "1"): GameState => {
  const levelConfig = levels[levelId] as Level; // Cast to Level type
  return {
    // Core game data
    level: levelConfig,
    currentLevelId: levelId,
    player: {
      ...playerConfig,
      position: playerConfig.position || { row: 0, col: 0 },
    },
    // Dynamic game state
    moveCount: 0,
    inCombat: false,
    combatTurn: null,
    attackSlots: [],
    waitingMonsters: [],
    turnOrder: [],

    // Level-specific state
    activeMonsters: [],
    items: levelConfig.items || [],
    objects: levelConfig.objects || [],
    pools: levelConfig.pools || [],
    greatPowers: levelConfig.greatPowers || [],

    // Configuration references
    levels: { [levelId]: levelConfig }, // Initialize as Record<string, Level>
    weapons: [
      {
        id: "weapon-discos-001",
        shortName: "discos",
        name: "Discos",
        description:
          "Physically paired with Christos, powered by the Earth Current. This is a pole arm with a spinning blue disc of death for the evil monsters of the Night Land.",
        damage: { min: 2, max: 12 },
        attack: 1,
        toHit: 2,
        effects: [],
      },
      {
        id: "weapon-shortsword-002",
        shortName: "shortsword",
        name: "Short Sword",
        description:
          "A simple blade forged in the Last Redoubt, sharp and reliable against the lesser horrors.",
        damage: { min: 1, max: 6 },
        attack: 0,
        toHit: 0,
        effects: [],
      },
    ],
    monsters: levelConfig.monsters || [],

    // Game settings
    gridWidth: 400,
    gridHeight: 400,
    maxAttackers: 4,

    // Save game metadata
    saveVersion: "1.0", // Initial version
    lastSaved: new Date(),
    playTime: 0, // Initial playtime in milliseconds
    lastAction: "",
  };
};

// modules/gameState.ts
// ... (other imports and functions)

export const serializeGameState = (state: GameState): string => {
  // Convert to JSON, excluding non-serializable properties if needed
  return JSON.stringify(state);
};

// Ensure this is at the end to avoid redefinition
export const initialState = getInitialState("1");

// Add the new functions as before
export const createInitialGameState = (levelId: string = "1"): GameState => {
  return getInitialState(levelId);
};

export const deserializeGameState = (serializedState: string): GameState => {
  try {
    const parsedState = JSON.parse(serializedState);
    return {
      ...initialState, // Use initialState as a fallback structure
      ...parsedState,
      level: parsedState.level || initialState.level,
      player: {
        ...initialState.player,
        ...parsedState.player,
      },
      levels: {
        ...initialState.levels,
        ...parsedState.levels,
      },
    };
  } catch (e) {
    console.error("Failed to deserialize game state:", e);
    return initialState;
  }
};

export const reducer = (state: any = initialState, action: any) => {
  switch (action.type) {
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
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item: any) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
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

    case "MOVE_PLAYER":
      console.log("MOVE_PLAYER payload:", action.payload);
      console.log("Before move, position:", state.player.position);

      // Prevent player movement during combat
      if (state.inCombat) {
        console.log("Player cannot move while in combat");
        return state;
      }

      let newPlayerPos;

      // Use direct position if provided (from MovementHandler)
      if (action.payload.position) {
        newPlayerPos = action.payload.position;
      }
      // Otherwise, calculate new position from direction
      else if (action.payload.direction) {
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
        console.error(
          "MOVE_PLAYER: No position or direction provided in payload"
        );
        return state;
      }

      console.log("After move, position:", newPlayerPos);

      return {
        ...state,
        player: {
          ...state.player,
          position: newPlayerPos,
        },
      };

    case "MOVE_MONSTER":
      // Prevent monster movement if combat is active and the monster is in a combat slot
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster: any) => {
          if (
            state.inCombat &&
            state.attackSlots.some((slot: any) => slot.id === monster.id)
          ) {
            console.log(
              `Monster ${monster.name} in combat slot, skipping movement`
            );
            return monster;
          }
          return monster.id === action.payload.id
            ? { ...monster, position: action.payload.position }
            : monster;
        }),
      };

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
    case "SPAWN_MONSTER":
      const newMonster = action.payload.monster;
      console.log("Spawning monster:", newMonster.name);
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, newMonster],
      };
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
        attackSlots: [action.payload.monster], // Slot 1
        combatTurn: 0,
        waitingMonsters: [], // Optional
      };
    case "UPDATE_TURN":
      return {
        ...state,
        turnOrder: action.payload.turnOrder,
        combatTurn: action.payload.combatTurn,
      };
    case "UPDATE_DIALOG":
      return { ...state, dialogData: action.payload.dialogData };
    case "UPDATE_MOVE_COUNT":
      return { ...state, moveCount: action.payload.moveCount };
    case "UPDATE_WAITING_MONSTERS":
      return { ...state, waitingMonsters: action.payload.waitingMonsters };
    case "UPDATE_ACTIVE_MONSTERS":
      return { ...state, activeMonsters: action.payload.activeMonsters };
    case "SET_AUDIO_STARTED":
      return { ...state, audioStarted: action.payload };
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
    case "RESET_HP":
      return {
        ...state,
        player: { ...state.player, hp: state.player.maxHP },
      };
    case "TRIGGER_EFFECT":
      const { effect, position } = action.payload;
      switch (effect.type) {
        case "swarm":
          const newMonsters: any[] = [];

          // Safe access to monsters array
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
    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj: any) =>
          obj.shortName === action.payload.shortName
            ? { ...obj, ...action.payload.updates }
            : obj
        ),
      };
    case "TOGGLE_INVENTORY":
      return {
        ...state,
        showInventory: !state.showInventory,
        showWeaponsInventory: false,
      };
    case "TOGGLE_WEAPONS_INVENTORY":
      return {
        ...state,
        showWeaponsInventory: !state.showWeaponsInventory,
        showInventory: false,
      };
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
    case "PASS_TURN":
      return {
        ...state,
        moveCount: state.moveCount + 1,
        lastAction: "PASS_TURN",
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState;
  }
};
