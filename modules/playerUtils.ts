// modules/playerUtils.ts - Interaction utilities
import { GameState, Position } from '../config/types';

// ==================== ITEM INTERACTION ====================

export const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  setOverlay: (overlay: any) => void
) => {
  const playerPos = state.player.position;

  const collectibleAtPosition = state.items?.find((item: any) => {
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

  // Handle splash screen
  if (collectibleAtPosition.splash) {
    setOverlay({
      image: collectibleAtPosition.splash.image,
      text: collectibleAtPosition.splash.text,
    });
  }

  // Handle item collection
  if (collectibleAtPosition.type === 'weapon') {
    const weapon = state.weapons?.find(
      (w: any) => w.id === collectibleAtPosition.weaponId
    );
    if (!weapon) {
      console.warn('Weapon not found:', collectibleAtPosition.weaponId);
      return;
    }
    const weaponEntry = {
      id: weapon.id,
      equipped: false,
    };
    dispatch({ type: 'ADD_TO_WEAPONS', payload: { weapon: weaponEntry } });
    showDialog(`Picked up ${weapon.name}!`, 3000);
  } else {
    const item = {
      id: `${collectibleAtPosition.shortName}-${Date.now()}`,
      ...collectibleAtPosition,
    };
    dispatch({ type: 'ADD_TO_INVENTORY', payload: { item } });
    showDialog(`Picked up ${item.name}!`, 3000);
  }

  // Deactivate the collected item
  dispatch({
    type: 'UPDATE_ITEM',
    payload: {
      shortName: collectibleAtPosition.shortName,
      updates: { active: false },
    },
  });
};

// ==================== OBJECT INTERACTION ====================

export const checkObjectInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog: (message: string, duration?: number) => void,
  playerPos: Position
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
        showDialog(
          `A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`,
          3000
        );
        break;
      case 'hide':
        showDialog(
          `The ${objectAtPosition.name} cloaks you in silence.`,
          3000
        );
        break;
      case 'heal':
        showDialog(
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