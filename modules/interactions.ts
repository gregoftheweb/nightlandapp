// modules/interactions.ts - Handle item and object interactions
import { GameState, Position, Item } from "../config/types";
import { createItemInstance } from "../config/levels";

// ==================== ITEM INTERACTIONS ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void,
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
      showDialog?.(
        `Inventory is full! Cannot pick up ${collectibleAtPosition.name}.`,
        3000
      );
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
    handleWeaponCollection(collectibleAtPosition, state, dispatch, showDialog);
  } else {
    handleConsumableCollection(
      collectibleAtPosition,
      state,
      dispatch,
      showDialog
    );
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

  // Note: The actual inventory state will be updated by the reducer
  // To see the final state, we'd need to access it after the dispatch completes
};

// ==================== WEAPON COLLECTION ====================

const handleWeaponCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  console.log(`⚔️ Attempting to collect weapon: ${item.name}`);

  // Check if weapons inventory has space
  if (state.player.weapons.length >= state.player.maxWeaponsSize) {
    showDialog?.(
      `Weapon inventory is full! Cannot pick up ${item.name}.`,
      3000
    );
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
    showDialog?.(`Error: Weapon data not found for ${item.name}.`, 3000);
    return;
  }

  console.log(`✅ Adding weapon to inventory:`, inventoryItem);

  // Dispatch full weapon object
  dispatch({
    type: "ADD_TO_WEAPONS",
    payload: { weapon: inventoryItem },
  });

  showDialog?.(`Picked up ${inventoryItem.name}!`, 3000);
  console.log(`📦 Weapon added: ${inventoryItem.name} (shortName: ${item.shortName})`);
};





// ==================== CONSUMABLE COLLECTION ====================

const handleConsumableCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
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

  showDialog?.(`Picked up ${item.name}!`, 3000);
  console.log(`📦 Consumable added: ${item.name} (ID: ${inventoryItem.id})`);
  // Add this line right after the dispatch:
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
  playerPos: Position,
  showDialog?: (message: string, duration?: number) => void
) => {
  console.log('Checking object interactions at playerPos:', playerPos);
  console.log('Available objects:', state.objects);

  const objectAtPosition = state.objects?.find((obj: any) => {
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

        const isCollision = (
          playerPos.row >= objRowStart &&
          playerPos.row <= objRowEnd &&
          playerPos.col >= objColStart &&
          playerPos.col <= objColEnd
        );
        console.log(`Checking collision for ${obj.name}:`, {
          objRowStart,
          objRowEnd,
          objColStart,
          objColEnd,
          playerPos,
          isCollision,
        });
        return isCollision;
      });
    } else {
      const objRowStart = obj.position.row;
      const objColStart = obj.position.col;
      const objWidth = obj.size?.width || 1;
      const objHeight = obj.size?.height || 1;
      const objRowEnd = objRowStart + objHeight - 1;
      const objColEnd = objColStart + objWidth - 1;

      const isCollision = (
        playerPos.row >= objRowStart &&
        playerPos.row <= objRowEnd &&
        playerPos.col >= objColStart &&
        playerPos.col <= objColEnd
      );
      console.log(`Checking collision for ${obj.name} (no mask):`, {
        objRowStart,
        objRowEnd,
        objColStart,
        objColEnd,
        playerPos,
        isCollision,
      });
      return isCollision;
    }
  });

  if (!objectAtPosition) {
    console.log('No object found at player position');
    return;
  }
  if (!objectAtPosition.effects) {
    console.log(`Object ${objectAtPosition.name} has no effects`);
    return;
  }

  const now = Date.now();
  const lastTrigger = objectAtPosition.lastTrigger || 0;
  console.log(`Cooldown check for ${objectAtPosition.name}:`, {
    now,
    lastTrigger,
    timeSinceLast: now - lastTrigger,
  });

  // Cooldown check (50 seconds)
  if (now - lastTrigger <= 50000) {
    console.log(`Cooldown active for ${objectAtPosition.name}, exiting`);
    return;
  }

  objectAtPosition.effects.forEach((effect: any) => {
    console.log('Triggering effect:', effect);

    dispatch({
      type: 'TRIGGER_EFFECT',
      payload: { effect, position: playerPos },
    });

    switch (effect.type) {
      case 'swarm':
        console.log(`A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`);
        break;
      case 'hide':
        console.log(`The ${objectAtPosition.name} cloaks you in silence.`);
        break;
      case 'heal':
        console.log(`The ${objectAtPosition.name} restores your strength!`);
        break;
      default:
        console.log(`Unhandled effect type: ${effect.type}`);
        break;
    }
  });

  dispatch({
    type: 'UPDATE_OBJECT',
    payload: {
      shortName: objectAtPosition.shortName,
      updates: { lastTrigger: now },
    },
  });
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
