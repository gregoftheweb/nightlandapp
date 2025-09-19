// modules/interactions.ts - Handle item and object interactions
import { GameState, Position, Item } from "../config/types";

// ==================== ITEM INTERACTIONS ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  setOverlay?: (overlay: any) => void
) => {
  const playerPos = state.player.position;
  
  console.log(`🔍 CHECKING ITEM INTERACTIONS at position (${playerPos.row}, ${playerPos.col})`);
  console.log(`Items available: ${state.items?.length || 0}`);
  if (state.items?.length > 0) {
    console.log('Item details:', state.items.map(item => ({
      name: item.name,
      position: item.position,
      active: item.active,
      collectible: item.collectible
    })));
  }

  // Find all collectible items at player's position
  const collectibleAtPosition = state.items?.find((item: Item) => {
    if (!item || !item.active || !item.collectible || !item.position) return false;

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

  if (!collectibleAtPosition) return;

  // Check if inventory has space (except for weapons which go to weapons array)
  if (collectibleAtPosition.type !== 'weapon') {
    if (state.player.inventory.length >= state.player.maxInventorySize) {
      showDialog?.(`Inventory is full! Cannot pick up ${collectibleAtPosition.name}.`, 3000);
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

  // Handle item collection based on type
  if (collectibleAtPosition.type === 'weapon') {
    handleWeaponCollection(collectibleAtPosition, state, dispatch, showDialog);
  } else {
    handleConsumableCollection(collectibleAtPosition, state, dispatch, showDialog);
  }

  // Remove the item from the game board
  dispatch({
    type: 'REMOVE_ITEM',
    payload: {
      position: collectibleAtPosition.position,
      shortName: collectibleAtPosition.shortName,
    },
  });

  console.log(`Collected item: ${collectibleAtPosition.name} at position (${playerPos.row}, ${playerPos.col})`);
};

// ==================== WEAPON COLLECTION ====================

const handleWeaponCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  // Check if weapons inventory has space
  if (state.player.weapons.length >= state.player.maxWeaponsSize) {
    showDialog?.(`Weapon inventory is full! Cannot pick up ${item.name}.`, 3000);
    return;
  }

  // Find the weapon in the weapons config
  const weapon = state.weapons?.find((w: Item) => w.id === item.weaponId);
  if (!weapon) {
    console.warn('Weapon not found:', item.weaponId);
    showDialog?.(`Error: Weapon data not found for ${item.name}.`, 3000);
    return;
  }

  const weaponEntry = {
    id: weapon.id,
    equipped: false,
  };

  dispatch({ 
    type: 'ADD_TO_WEAPONS', 
    payload: { weapon: weaponEntry } 
  });
  
  showDialog?.(`Picked up ${weapon.name}!`, 3000);
  console.log(`Added weapon to inventory: ${weapon.name}`);
};

// ==================== CONSUMABLE COLLECTION ====================

const handleConsumableCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
) => {
  // Create a proper inventory item with unique ID
  const inventoryItem: Item = {
    id: `${item.shortName}-${Date.now()}`,
    shortName: item.shortName,
    category: item.category,
    name: item.name,
    description: item.description,
    type: item.type,
    collectible: item.collectible,
    image: item.image,
    healAmount: item.healAmount,
    damage: item.damage,
    // Don't include position in inventory items
    active: true,
  };

  dispatch({ 
    type: 'ADD_TO_INVENTORY', 
    payload: { item: inventoryItem } 
  });
  
  showDialog?.(`Picked up ${item.name}!`, 3000);
  console.log(`Added item to inventory: ${item.name}`, inventoryItem);
};

// ==================== OBJECT INTERACTIONS ====================

export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position,
  showDialog?: (message: string, duration?: number) => void
) => {
  const objectAtPosition = state.objects?.find((obj: any) => {
    if (!obj.active) return false;

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

  if (!objectAtPosition || !objectAtPosition.effects) return;

  const now = Date.now();
  const lastTrigger = objectAtPosition.lastTrigger || 0;
  
  // Cooldown check (50 seconds)
  if (now - lastTrigger <= 50000) return;

  objectAtPosition.effects.forEach((effect: any) => {
    dispatch({
      type: 'TRIGGER_EFFECT',
      payload: { effect, position: playerPos },
    });

    switch (effect.type) {
      case 'swarm':
        showDialog?.(
          `A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`,
          3000
        );
        break;
      case 'hide':
        showDialog?.(
          `The ${objectAtPosition.name} cloaks you in silence.`,
          3000
        );
        break;
      case 'heal':
        showDialog?.(
          `The ${objectAtPosition.name} restores your strength!`,
          3000
        );
        break;
      default:
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
  
  if (item.type === 'weapon') {
    return player.weapons.length < player.maxWeaponsSize;
  }
  
  return player.inventory.length < player.maxInventorySize;
};

export const getItemsAtPosition = (items: Item[], position: Position): Item[] => {
  return items.filter(item => {
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