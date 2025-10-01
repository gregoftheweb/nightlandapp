// modules/interactions.ts - Handle item and object interactions
import { GameState, Position, Item } from "../config/types";
import { createItemInstance } from "../config/levels";

// ==================== ITEM INTERACTIONS ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  setOverlay?: (overlay: any) => void
) => {
  const playerPos = state.player.position;

  console.log(
    `🔍 CHECKING ITEM INTERACTIONS at position (${playerPos.row}, ${playerPos.col})`
  );
  console.log(`Items available: ${state.items?.length || 0}`);
  console.log(
    `Current inventory size: ${state.player.inventory.length}/${state.player.maxInventorySize}`
  );

  if (state.items?.length > 0) {
    console.log(
      "Item details:",
      state.items.map((item) => ({
        name: item.name,
        position: item.position,
        active: item.active,
        collectible: item.collectible,
      }))
    );
  }

  // Find all collectible items at player's position
  const collectibleAtPosition = state.items?.find((item: Item) => {
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
      playerPos.row >= itemRowStart &&
      playerPos.row <= itemRowEnd &&
      playerPos.col >= itemColStart &&
      playerPos.col <= itemColEnd
    );
  });

  if (!collectibleAtPosition) {
    console.log("No collectible items found at player position");
    return;
  }

  console.log(
    `📦 Found collectible item: ${collectibleAtPosition.name} at (${collectibleAtPosition.position?.row}, ${collectibleAtPosition.position?.col})`
  );

  // Check if inventory has space (except for weapons which go to weapons array)
  if (collectibleAtPosition.type !== "weapon") {
    if (state.player.inventory.length >= state.player.maxInventorySize) {
      console.log(
        `❌ Inventory full - cannot collect ${collectibleAtPosition.name}`
      );
      return;
    }
  }

  // Handle splash screen
  if (collectibleAtPosition.splash && setOverlay) {
    setOverlay({
      image: collectibleAtPosition.splash.image,
      text: collectibleAtPosition.splash.text,
    });
  }

  // Store current inventory for comparison
  const inventoryBefore = [...state.player.inventory];
  const weaponsBefore = [...state.player.weapons];

  console.log(`📦 BEFORE COLLECTION:`);
  console.log(
    `  Inventory (${inventoryBefore.length}/${state.player.maxInventorySize}):`,
    inventoryBefore.map((i) => ({ name: i.name, id: i.id }))
  );
  console.log(
    `  Weapons (${weaponsBefore.length}/${state.player.maxWeaponsSize}):`,
    weaponsBefore.map((w) => ({ id: w.id, equipped: w.equipped }))
  );

  // Handle item collection based on type
  if (collectibleAtPosition.type === "weapon") {
    handleWeaponCollection(collectibleAtPosition, state, dispatch);
  } else {
    handleConsumableCollection(collectibleAtPosition, state, dispatch);
  }

  // Remove the item from the game board
  dispatch({
    type: "REMOVE_ITEM_FROM_GAMEBOARD",
    payload: {
      position: collectibleAtPosition.position,
      shortName: collectibleAtPosition.shortName,
    },
  });
  console.log(
    `ITEMS REMAINING ON GAMEBOARD:`,
    state.items.filter(
      (item) =>
        !(
          item.position?.row === collectibleAtPosition.position?.row &&
          item.position?.col === collectibleAtPosition.position?.col &&
          item.shortName === collectibleAtPosition.shortName
        )
    ).length
  );
  console.log(
    `✅ Item collection completed for: ${collectibleAtPosition.name}`
  );
  console.log(
    `🗑️ Removing item from position (${collectibleAtPosition.position?.row}, ${collectibleAtPosition.position?.col})`
  );
};

// ==================== WEAPON COLLECTION ====================

const handleWeaponCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
) => {
  console.log(`⚔️ Attempting to collect weapon: ${item.name}`);

  // Check if weapons inventory has space
  if (state.player.weapons.length >= state.player.maxWeaponsSize) {
    console.log(`❌ Weapon inventory full - cannot collect ${item.name}`);
    return;
  }

  // Create full inventory item from shortName
  const inventoryItem = createItemInstance(
    item.shortName,
    state.player.position
  );

  if (!inventoryItem) {
    console.warn("❌ Failed to create weapon instance:", item.shortName);
    return;
  }

  console.log(`✅ Adding weapon to inventory:`, inventoryItem);

  // Dispatch full weapon object
  dispatch({
    type: "ADD_TO_WEAPONS",
    payload: { weapon: inventoryItem },
  });

  console.log(`📦 Weapon added: ${inventoryItem.name} (shortName: ${item.shortName})`);
};

// ==================== CONSUMABLE COLLECTION ====================

const handleConsumableCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
) => {
  console.log(`🧪 Attempting to collect consumable: ${item.name}`);

  // Create a proper inventory item with unique ID
  const inventoryItem = createItemInstance(
    item.shortName,
    state.player.position
  );

  console.log(`✅ Adding consumable to inventory:`, {
    id: inventoryItem.id,
    name: inventoryItem.name,
    type: inventoryItem.type,
    healAmount: inventoryItem.healAmount,
  });

  dispatch({
    type: "ADD_TO_INVENTORY",
    payload: { item: inventoryItem },
  });

  console.log(`📦 Consumable added: ${item.name} (ID: ${inventoryItem.id})`);
  console.log(
    `CHRISTOS INVENTORY AFTER ADD:`,
    [...state.player.inventory, inventoryItem].map((item: any) => ({
      name: item.name,
      id: item.id,
      type: item.type,
    }))
  );
};

// ==================== OBJECT INTERACTIONS ====================
export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  console.log('Checking object interactions at playerPos:', playerPos);

  // Check regular objects first
  const isChristosOnTopOfObject = state.objects?.find((obj: any) => {
    if (!obj.active) {
      console.log(`Object ${obj.name} is inactive, skipping`);
      return false;
    }

    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const objRowStart = obj.position.row + mask.row;
        const objColStart = obj.position.col + mask.col;
        const objRowEnd = objRowStart + (mask.height || 1) - 1;
        const objColEnd = objColStart + (mask.width || 1) - 1;

        return (
          playerPos.row >= objRowStart &&
          playerPos.row <= objRowEnd &&
          playerPos.col >= objColStart &&
          playerPos.col <= objColEnd
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
        playerPos.row >= objRowStart &&
        playerPos.row <= objRowEnd &&
        playerPos.col >= objColStart &&
        playerPos.col <= objColEnd
      );
    }
  });

  // Check Great Powers
  const isChristosOnTopOfGreatPower = state.level.greatPowers?.find((gp: any) => {
    if (!gp.active) {
      console.log(`Great Power ${gp.name} is inactive, skipping`);
      return false;
    }

    const gpRowStart = gp.position.row;
    const gpColStart = gp.position.col;
    const gpWidth = gp.width || 1;
    const gpHeight = gp.height || 1;
    const gpRowEnd = gpRowStart + gpHeight - 1;
    const gpColEnd = gpColStart + gpWidth - 1;

    return (
      playerPos.row >= gpRowStart &&
      playerPos.row <= gpRowEnd &&
      playerPos.col >= gpColStart &&
      playerPos.col <= gpColEnd
    );
  });

  // Handle regular objects
  if (isChristosOnTopOfObject) {
    handleObjectEffects(isChristosOnTopOfObject, state, dispatch, playerPos);
  } else {
    // Turn off isHidden if not on any object
    dispatch({ type: 'CLEAR_HIDE' });
  }

  // Handle Great Powers
  if (isChristosOnTopOfGreatPower) {
    handleGreatPowerEffects(isChristosOnTopOfGreatPower, state, dispatch, playerPos);
  }
};

const handleObjectEffects = (
  obj: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  if (!obj.effects) {
    console.log(`Object ${obj.name} has no effects`);
    return;
  }

  // Check which effects need cooldowns (swarm and heal are one-time per cooldown)
  const needsCooldown = obj.effects.some((e: any) => 
    e.type === 'swarm' || e.type === 'heal'
  );

  if (needsCooldown) {
    const now = Date.now();
    const lastTrigger = obj.lastTrigger || 0;
    
    // Cooldown check (50 seconds)
    if (now - lastTrigger <= 50000) {
      console.log(`Cooldown active for ${obj.name}, exiting`);
      return;
    }
  }

  obj.effects.forEach((effect: any) => {
    console.log('Triggering effect:', effect);

    dispatch({
      type: 'TRIGGER_EFFECT',
      payload: { effect, position: playerPos },
    });

    // Log effect messages
    switch (effect.type) {
      case 'swarm':
        console.log(`A swarm of ${effect.monsterType}s emerges from the ${obj.name}!`);
        break;
      case 'hide':
        console.log(`The ${obj.name} cloaks you in silence.`);
        break;
      case 'heal':
        console.log(`The ${obj.name} restores your strength!`);
        break;
      case 'recuperate':
        console.log(`The ${obj.name} restores ${effect.amount || 5} HP!`);
        break;
      default:
        console.log(`Unhandled effect type: ${effect.type}`);
        break;
    }
  });

  // Only update lastTrigger for effects that need cooldown
  if (needsCooldown) {
    const now = Date.now();
    dispatch({
      type: 'UPDATE_OBJECT',
      payload: {
        shortName: obj.shortName,
        updates: { lastTrigger: now },
      },
    });
  }
};

// Handle Great Power effects
const handleGreatPowerEffects = (
  greatPower: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  console.log(`Player collided with Great Power: ${greatPower.name}`);

  // Awaken the Great Power if not already awakened
  if (!greatPower.awakened && greatPower.awakenCondition === 'player_within_range') {
    console.log(`Awakening Great Power: ${greatPower.name}`);
    dispatch({
      type: 'AWAKEN_GREAT_POWER',
      payload: { id: greatPower.id }
    });
  }

  // Execute effects if awakened
  if (greatPower.effects) {
    greatPower.effects.forEach((effect: any) => {
      console.log('Triggering Great Power effect:', effect);

      dispatch({
        type: 'TRIGGER_EFFECT',
        payload: { effect, position: playerPos, source: 'greatPower' },
      });
    });
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const canCollectItem = (item: Item, player: any): boolean => {
  if (!item.collectible || !item.active) return false;

  if (item.type === "weapon") {
    return player.weapons.length < player.maxWeaponsSize;
  }

  return player.inventory.length < player.maxInventorySize;
};

export const getItemsAtPosition = (
  items: Item[],
  position: Position
): Item[] => {
  return items.filter((item) => {
    if (!item.active || !item.position) return false;

    const itemRowStart = item.position.row;
    const itemColStart = item.position.col;
    const itemWidth = item.size?.width || 1;
    const itemHeight = item.size?.height || 1;
    const itemRowEnd = itemRowStart + itemHeight - 1;
    const itemColEnd = itemColStart + itemWidth - 1;

    return (
      position.row >= itemRowStart &&
      position.row <= itemRowEnd &&
      position.col >= itemColStart &&
      position.col <= itemColEnd
    );
  });
};