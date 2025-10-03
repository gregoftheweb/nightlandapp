// modules/interactions.ts - Optimized with spatial grid
import { GameState, Position, Item, NonCollisionObject } from "../config/types";
import { createItemInstance } from "../config/levels";
import { COMBAT_STRINGS } from "@assets/copy/combat";
import { buildSpatialGrid, checkOverlap } from "./spacialGrid";

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

  // Build spatial grid for efficient lookup
  const grid = buildSpatialGrid(state, 10); // 10x10 cell size

  // Only check items in nearby cells (massive performance boost)
  const nearbyEntities = grid.getNearbyByType(playerPos, 'item', 1);
  
  console.log(`Found ${nearbyEntities.length} nearby items (filtered from ${state.items?.length || 0} total)`);

  // Find collectible item at player's exact position
  const collectibleAtPosition = nearbyEntities.find((entity) => {
    const item = entity.data as Item;
    
    if (!item || !item.active || !item.collectible || !item.position) {
      return false;
    }

    // Check overlap with player position (player is 1x1)
    return checkOverlap(
      playerPos, 1, 1,
      item.position, 
      item.size?.width || 1, 
      item.size?.height || 1
    );
  });

  if (!collectibleAtPosition) {
    console.log("No collectible items found at player position");
    return;
  }

  const item = collectibleAtPosition.data as Item;

  console.log(
    `📦 Found collectible item: ${item.name} at (${item.position?.row}, ${item.position?.col})`
  );

  // Check inventory space
  if (item.type !== "weapon") {
    if (state.player.inventory.length >= state.player.maxInventorySize) {
      console.log(`❌ Inventory full - cannot collect ${item.name}`);
      return;
    }
  }

  // Handle splash screen
  if (item.splash && setOverlay) {
    setOverlay({
      image: item.splash.image,
      text: item.splash.text,
    });
  }

  // Handle collection
  if (item.type === "weapon") {
    handleWeaponCollection(item, state, dispatch);
  } else {
    handleConsumableCollection(item, state, dispatch);
  }

  // Remove from gameboard
  dispatch({
    type: "REMOVE_ITEM_FROM_GAMEBOARD",
    payload: {
      position: item.position,
      shortName: item.shortName,
    },
  });

  console.log(`✅ Item collection completed for: ${item.name}`);
};

// ==================== WEAPON COLLECTION ====================

const handleWeaponCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
) => {
  console.log(`⚔️ Attempting to collect weapon: ${item.name}`);

  if (state.player.weapons.length >= state.player.maxWeaponsSize) {
    console.log(`❌ Weapon inventory full - cannot collect ${item.name}`);
    return;
  }

  const inventoryItem = createItemInstance(
    item.shortName,
    state.player.position
  );

  if (!inventoryItem) {
    console.warn("❌ Failed to create weapon instance:", item.shortName);
    return;
  }

  dispatch({
    type: "ADD_TO_WEAPONS",
    payload: { weapon: inventoryItem },
  });

  console.log(`📦 Weapon added: ${inventoryItem.name}`);
};

// ==================== CONSUMABLE COLLECTION ====================

const handleConsumableCollection = (
  item: Item,
  state: GameState,
  dispatch: (action: any) => void
) => {
  console.log(`🧪 Attempting to collect consumable: ${item.name}`);

  const inventoryItem = createItemInstance(
    item.shortName,
    state.player.position
  );

  dispatch({
    type: "ADD_TO_INVENTORY",
    payload: { item: inventoryItem },
  });

  console.log(`📦 Consumable added: ${item.name} (ID: ${inventoryItem.id})`);
};

// ==================== OBJECT INTERACTIONS ====================

export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  console.log('Checking object interactions at playerPos:', playerPos);

  // Build spatial grid for efficient lookup
  const grid = buildSpatialGrid(state, 10);

  // Only check objects in nearby cells
  const nearbyObjects = grid.getNearbyByType(playerPos, 'object', 1);
  
  console.log(`Found ${nearbyObjects.length} nearby objects (filtered from ${state.objects?.length || 0} total)`);

  // Check regular objects
  const collidingObject = nearbyObjects.find((entity) => {
    const obj = entity.data as any;

    if (!obj.active) {
      return false;
    }

    // Check collision with collision mask if it exists
    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const maskPos = {
          row: obj.position.row + mask.row,
          col: obj.position.col + mask.col
        };
        
        return checkOverlap(
          playerPos, 1, 1,
          maskPos,
          mask.width || 1,
          mask.height || 1
        );
      });
    }

    // Standard bounding box check
    return checkOverlap(
      playerPos, 1, 1,
      obj.position,
      obj.size?.width || 1,
      obj.size?.height || 1
    );
  });

  // Check Great Powers (they have special handling)
  const collidingGreatPower = state.level.greatPowers?.find((gp: any) => {
    if (!gp.active) return false;

    return checkOverlap(
      playerPos, 1, 1,
      gp.position,
      gp.width || 1,
      gp.height || 1
    );
  });

  // Handle collisions
  if (collidingObject) {
    handleObjectEffects(collidingObject.data, state, dispatch, playerPos);
  } else {
    dispatch({ type: 'CLEAR_HIDE' });
  }

  if (collidingGreatPower) {
    handleGreatPowerEffects(collidingGreatPower, state, dispatch, playerPos);
  }


   const collidingNonCollisionObject = state.nonCollisionObjects?.find((obj) => {
    if (!obj.collisionMask || !obj.active) return false;

    // Check if player is within any of the collision mask tiles
    return obj.collisionMask.some((mask) => {
      const maskPos = {
        row: obj.position.row + mask.row,
        col: obj.position.col + mask.col
      };
      
      return checkOverlap(
        playerPos, 1, 1,
        maskPos,
        mask.width || 1,
        mask.height || 1
      );
    });
  });

  // Handle effects from non-collision object collision
  if (collidingNonCollisionObject && collidingNonCollisionObject.collisionEffects) {
    handleNonCollisionObjectEffects(
      collidingNonCollisionObject, 
      state, 
      dispatch, 
      playerPos
    );
  }
};




// ==================== EFFECT HANDLERS ====================

const handleObjectEffects = (
  obj: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  if (!obj.effects) {
    return;
  }

  const needsCooldown = obj.effects.some((e: any) => 
    e.type === 'swarm' || e.type === 'heal'
  );

  if (needsCooldown) {
    const now = Date.now();
    const lastTrigger = obj.lastTrigger || 0;
    
    if (now - lastTrigger <= 50000) {
      console.log(`Cooldown active for ${obj.name}`);
      return;
    }
  }

  obj.effects.forEach((effect: any) => {
    dispatch({
      type: 'TRIGGER_EFFECT',
      payload: { effect, position: playerPos },
    });

    switch (effect.type) {
      case 'swarm':
        console.log(`A swarm of ${effect.monsterType}s emerges!`);
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
    }
  });

  if (needsCooldown) {
    dispatch({
      type: 'UPDATE_OBJECT',
      payload: {
        shortName: obj.shortName,
        updates: { lastTrigger: Date.now() },
      },
    });
  }
};

const handleGreatPowerEffects = (
  greatPower: any,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  console.log(`Player collided with Great Power: ${greatPower.name}`);

  if (!greatPower.awakened && greatPower.awakenCondition === 'player_within_range') {
    dispatch({
      type: 'AWAKEN_GREAT_POWER',
      payload: { id: greatPower.id }
    });
  }

  if (greatPower.effects) {
    const deathMessage = COMBAT_STRINGS.soulSuckDeath.player(greatPower.name);

    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: deathMessage },
    });

    greatPower.effects.forEach((effect: any) => {
      dispatch({
        type: 'TRIGGER_EFFECT',
        payload: { 
          effect, 
          position: playerPos, 
          source: 'greatPower', 
          message: deathMessage 
        },
      });
    });
  }
};

const handleNonCollisionObjectEffects = (
  obj: NonCollisionObject,
  state: GameState,
  dispatch: (action: any) => void,
  playerPos: Position
) => {
  if (!obj.collisionEffects) return;

  obj.collisionEffects.forEach((effect) => {
    dispatch({
      type: 'TRIGGER_EFFECT',
      payload: { effect, position: playerPos },
    });

    switch (effect.type) {
      case 'heal':
        console.log(`The ${obj.name} heals you for ${effect.value} HP!`);
        break;
      case 'poison':
        console.log(`The ${obj.name} poisons you!`);
        break;
      // ... other effect types
    }
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

    return checkOverlap(
      position, 1, 1,
      item.position,
      item.size?.width || 1,
      item.size?.height || 1
    );
  });
};