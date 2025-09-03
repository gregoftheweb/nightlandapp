// modules/gameState.ts
import { GameState, Level } from "../config/types";
import { playerConfig } from "../config/player";
import { levels } from "../config/levels";
import { gameConfig } from "../config/gameConfig";

// ✅ Initialize the full runtime game state
export const createInitialGameState = (levelId: string = "1"): GameState => {
  const level: Level | undefined = levels[levelId];

  if (!level) {
    throw new Error(`Level ${levelId} not found`);
  }

  return {
    // Core game data
    level,
    currentLevelId: levelId,
    player: {
      ...playerConfig,
      position: level.playerSpawn,
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
    items: [...level.items],
    objects: [...level.objects],
    pools: level.pools || [],
    greatPowers: level.greatPowers || [],

    // Configuration references
    levels,
    weapons: [], // load weapons config if needed
    monsters: level.monsters,

    // Game settings
    gridWidth: gameConfig.grid.width,
    gridHeight: gameConfig.grid.height,
    maxAttackers: gameConfig.combat.maxAttackers,

    // Save game metadata
    saveVersion: "1.0.0",
    lastSaved: new Date(),
    playTime: 0,
  };
};

// ✅ Legacy initialization (keep for backwards compatibility)
export const getInitialState = (levelId: number = 1) => {
  const levelConfig: Level | undefined = levels[levelId];
  return {
    gridWidth: 400,
    gridHeight: 400,
    tileSize: 40,
    viewHeight: 800,
    map: Array(400)
      .fill(null)
      .map(() => Array(400).fill(".")),
    level: levelConfig.id,
    levels: [levelConfig],
    showInventory: false,
    showWeaponsInventory: false,
    player: {
      name: "Christos",
      shortName: "christos",
      hp: 100,
      maxHP: 100,
      position: { row: 395, col: 200 },
      description: "One of the humans from the Last Redoubt.",
      initiative: 10,
      lastComment: "",
      attack: 4,
      ac: 14,
      inventory: [],
      maxInventorySize: 10,
      weapons: [
        {
          id: "weapon-discos-001",
          equipped: true,
        },
      ],
      maxWeaponsSize: 2,
      isHidden: false,
      hideTurns: 0,
      soulKey: "7C6368627E64",
    },
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
    monsters: levelConfig.monsters,
    greatPowers: levelConfig.greatPowers,
    objects: levelConfig.objects,
    items: levelConfig.items,
    pools: levelConfig.pools,
    poolsTemplate: levelConfig.poolTemplates,
    footsteps: levelConfig.footsteps,
    footstepsTemplate: levelConfig.footstepsTemplate,
    activeMonsters: [],
    attackSlots: [],
    waitingMonsters: [],
    inCombat: false,
    turnOrder: [],
    combatTurn: null,
    dialogData: {
      player: { name: "Christos", hp: 100, comment: "" },
      enemies: [],
    },
    moveCount: 0,
    spawnThreshold: Math.floor(Math.random() * 7) + 4,
    maxAttackers: 4,
    audioStarted: false,
  };
};

export const initialState = getInitialState(1);

// ✅ Save game functionality
export const serializeGameState = (gameState: GameState): string => {
  return JSON.stringify(
    {
      ...gameState,
      lastSaved: gameState.lastSaved.toISOString(),
    },
    null,
    2
  );
};

// ✅ Load game functionality
export const deserializeGameState = (saveData: string): GameState => {
  const parsed = JSON.parse(saveData);
  return {
    ...parsed,
    lastSaved: new Date(parsed.lastSaved),
  };
};

// ✅ The reducer that was missing!
export const reducer = (state: any = initialState, action: any) => {
  switch (action.type) {
    case "SET_LEVEL":
      const newLevelConfig: Level | undefined = levels[action.payload.level];
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
      return {
        ...state,
        player: { ...state.player, position: action.payload.position },
      };
    case "MOVE_MONSTER":
      return {
        ...state,
        activeMonsters: state.activeMonsters.map((monster: any) =>
          monster.id === action.payload.id
            ? { ...monster, position: action.payload.position }
            : monster
        ),
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
      return {
        ...state,
        activeMonsters: [...state.activeMonsters, action.payload.monster],
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
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state || initialState;
  }
};
