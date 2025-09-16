// modules/gameLoop.ts - Updated with combat integration
import { GameState, Position, Monster } from "../config/types";
import { monsters } from "../config/monsters";
import { handleMoveMonsters } from "./monsterUtils";
import { processCombatTurn, checkCombatEnd } from "./combat";

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

// ==================== ITEM AND OBJECT INTERACTION FUNCTIONS ====================

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
  if (state.inCombat) return;

  const newPosition = { ...state.player.position };

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
      return;
  }

  dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  console.log(`Player moved to: (${newPosition.row}, ${newPosition.col})`);
  
  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  console.log(`Move count: ${newMoveCount}`);

  const updatedState = { 
    ...state, 
    player: { ...state.player, position: newPosition },
    moveCount: newMoveCount 
  };

  checkItemInteractions(updatedState, dispatch, showDialog, setOverlay);
  checkObjectInteractions(updatedState, dispatch, newPosition, showDialog);

  console.log(`\n📊 GAME STATE AFTER MOVE:`);
  console.log(`Active monsters: ${updatedState.activeMonsters.length}`);
  console.log(`Attack slots: ${updatedState.attackSlots?.length || 0}`);
  console.log(`In combat: ${updatedState.inCombat}`);

  console.log(`🃏 About to process monster turn...`);
  
  handleMoveMonsters(updatedState, dispatch, showDialog);
  
  console.log(`✅ Player move completed`);
};

// ==================== COMBAT TURN HANDLER ====================

export const handleCombatTurn = (
  state: GameState,
  dispatch: any,
  action: string,
  targetId?: string,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  if (!state.inCombat) {
    console.warn("handleCombatTurn called but not in combat");
    return;
  }

  console.log(`\n⚔️ PROCESSING COMBAT ACTION: ${action} (target: ${targetId || 'none'})`);

  // Process the full combat round, passing targetId for player attack
  processCombatTurn(state, dispatch, showDialog, targetId);

  // Check if combat has ended
  const combatEnded = checkCombatEnd(state, dispatch, showDialog);

  if (combatEnded) {
    console.log("Combat has ended");
    if (state.player.hp <= 0) {
      setDeathMessage?.("You have been defeated in combat!");
      dispatch({ type: "GAME_OVER" });
    } else {
      // Combat won - move non-combat monsters and increment turn count
      handleMoveMonsters(state, dispatch, showDialog);
      dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: state.moveCount + 1 } });
    }
  } else {
    console.log("Combat continues...");
    // Combat ongoing - move non-combat monsters and increment turn count
    handleMoveMonsters(state, dispatch, showDialog);
    dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: state.moveCount + 1 } });
  }
};



// ==================== MONSTER MOVEMENT ====================

export const moveMonsters = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
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

      newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
      newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));

      if (checkCollision(newPos, playerPos)) {
        if (!state.player.isHidden) {
          setupCombat(state, dispatch, monster, showDialog, playerPos);
        }
        return;
      }
    }

    dispatch({
      type: "MOVE_MONSTER",
      payload: { id: monster.id, position: newPos },
    });
    console.log(`Monster ${monster.name} moved to (${newPos.row}, ${newPos.col})`);
  });
};

// ==================== COMBAT SETUP ====================
export const setupCombat = (
  state: GameState,
  dispatch: (action: any) => void,
  monster: Monster,
  showDialog?: (message: string, duration?: number) => void,
  playerPosOverride?: Position
): void => {
  console.log(`\n⚔️ SETTING UP COMBAT with ${monster.name}`);
  
  let newAttackSlots = [...(state.attackSlots || [])];
  let newWaitingMonsters = [...(state.waitingMonsters || [])];

  // Define attack slot positions around player
  const slotPositions = [
    { row: state.player.position.row - 1, col: state.player.position.col - 1 }, // Slot 0
    { row: state.player.position.row - 1, col: state.player.position.col + 1 }, // Slot 1
    { row: state.player.position.row + 1, col: state.player.position.col - 1 }, // Slot 2
    { row: state.player.position.row + 1, col: state.player.position.col + 1 }, // Slot 3
  ];

  // Check if monster is already in combat
  if (newAttackSlots.some((slot: any) => slot.id === monster.id)) {
    console.warn(`Monster ${monster.name} already in attack slots`);
    return;
  }

  // Try to add to attack slots
  if (newAttackSlots.length < (state.maxAttackers || 4)) {
    const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0);
    const nextUISlot = [0, 1, 2, 3].find(slot => !usedUISlots.includes(slot));
    
    if (nextUISlot !== undefined) {
      const combatMonster = {
        ...monster,
        position: { ...slotPositions[nextUISlot] },
        uiSlot: nextUISlot,
        inCombatSlot: true,
      };
      
      newAttackSlots.push(combatMonster);
      
      dispatch({
        type: "MOVE_MONSTER",
        payload: { id: monster.id, position: combatMonster.position },
      });
      
      console.log(`✅ Monster ${monster.name} assigned to attack slot ${nextUISlot}`);
      showDialog?.(`${monster.name} enters combat!`, 2000);
    } else {
      console.warn("No available UI slot for combat monster");
      return;
    }
  } else {
    // Add to waiting monsters
    if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
      newWaitingMonsters.push(monster);
      console.log(`Monster ${monster.name} added to waiting queue`);
    }
    return;
  }

  const newTurnOrder = [state.player, ...newAttackSlots];

  const combatPayload = {
    inCombat: true,
    attackSlots: newAttackSlots,
    waitingMonsters: newWaitingMonsters,
    turnOrder: newTurnOrder,
    combatTurn: newTurnOrder[0] || state.player,
  };

  console.log("🎯 Dispatching SET_COMBAT:", combatPayload);
  dispatch({ type: "SET_COMBAT", payload: combatPayload });

  console.log(`⚔️ Combat initiated! ${newAttackSlots.length} monsters in attack slots`);
};

// ==================== INITIALIZATION ====================
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