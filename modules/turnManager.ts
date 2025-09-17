// modules/gameLoop.ts - Clean game flow orchestration
import { GameState, Position, Monster } from "../config/types";
import { monsters } from "../config/monsters";
import { handleMoveMonsters } from "./monsterUtils";
import { handleCombatTurn } from "./combat";
import { calculateNewPosition } from "./movement";

// ==================== ITEM AND OBJECT INTERACTIONS ====================

const checkItemInteractions = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  setOverlay?: (overlay: any) => void
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
  if (collectibleAtPosition.splash && setOverlay) {
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
    showDialog?.(`Picked up ${weapon.name}!`, 3000);
  } else {
    const item = {
      id: `${collectibleAtPosition.shortName}-${Date.now()}`,
      ...collectibleAtPosition,
    };
    dispatch({ type: 'ADD_TO_INVENTORY', payload: { item } });
    showDialog?.(`Picked up ${item.name}!`, 3000);
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

const checkObjectInteractions = (
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

// ==================== MAIN PLAYER MOVEMENT HANDLER ====================

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  setOverlay?: (overlay: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  // Cannot move during combat
  if (state.inCombat) return;

  // Calculate new player position
  const newPosition = calculateNewPosition(state.player.position, direction, state);
  
  // Move player and update turn counter
  dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  
  console.log(`Player moved to: (${newPosition.row}, ${newPosition.col}), Move: ${newMoveCount}`);

  // Update game state for interactions
  const updatedState = { 
    ...state, 
    player: { ...state.player, position: newPosition },
    moveCount: newMoveCount 
  };

  // Handle world interactions at new position
  checkItemInteractions(updatedState, dispatch, showDialog, setOverlay);
  checkObjectInteractions(updatedState, dispatch, newPosition, showDialog);

  // Process monster movement and combat checks
  handleMoveMonsters(updatedState, dispatch, showDialog);
  
  console.log(`✅ Player turn completed`);
};

// ==================== COMBAT TURN HANDLER (DELEGATED) ====================

export { handleCombatTurn } from "./combat";

// ==================== GAME INITIALIZATION ====================

export const initializeStartingMonsters = (
  state: GameState,
  dispatch: (action: any) => void
): void => {
  const abhumanTemplate = monsters.find(m => m.shortName === 'abhuman');
  if (abhumanTemplate) {
    // Spawn exactly 2 abhumans for testing
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 15 + Math.random() * 10; // Closer for testing
      
      let spawnRow = Math.round(state.player.position.row + Math.sin(angle) * distance);
      let spawnCol = Math.round(state.player.position.col + Math.cos(angle) * distance);
      
      spawnRow = Math.max(0, Math.min(state.gridHeight - 1, spawnRow));
      spawnCol = Math.max(0, Math.min(state.gridWidth - 1, spawnCol));
      
      const newMonster: Monster = {
        ...abhumanTemplate,
        id: `abhuman-init-${i}`,
        position: { row: spawnRow, col: spawnCol },
        hp: abhumanTemplate.hp, // Use hp from template
        active: true,
      };

      dispatch({
        type: "SPAWN_MONSTER",
        payload: { monster: newMonster },
      });
      
      console.log(`🎯 Spawned initial ${newMonster.name} #${i+1} at (${spawnRow}, ${spawnCol}), distance: ${Math.round(distance)}`);
      console.log(`   Stats: HP:${newMonster.hp}, Attack:${newMonster.attack}, AC:${newMonster.ac}`);
    }
  }
};