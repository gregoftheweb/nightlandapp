// modules/turnManager.ts - Clean turn-based game flow orchestration
import { GameState, Position, Monster } from "../config/types";
import { monsters } from "../config/monsters";
import { handleMoveMonsters } from "./monsterUtils";
import { handleCombatTurn } from "./combat";
import { calculateNewPosition } from "./movement";
import { checkItemInteractions, checkObjectInteractions } from "./interactions";

// ==================== MODULE-LEVEL STATE ====================
let currentGameState: GameState;
let gameDispatch: (action: any) => void;
let inCombat: boolean = false;
let turnType: 'combat' | 'move' | 'non-move-turn' = 'non-move-turn';

// ==================== TURN TYPE DETERMINATION ====================

const determineTurnType = (direction?: string): 'combat' | 'move' | 'non-move-turn' => {
  if (inCombat) {
    return 'combat';
  }
  if (direction && direction !== 'stay') {
    return 'move';
  }
  return 'non-move-turn';
};

// ==================== COMBAT TURN EXECUTION ====================

const doCombatTurn = (
  action: string,
  targetId?: string,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  console.log(`⚔️ EXECUTING COMBAT TURN: ${action}`);
  
  // Do Player Attack
  if (action === 'attack' && targetId) {
    console.log(`Player attacking target: ${targetId}`);
  }
  
  // Execute full combat round (player + monster attacks)
  handleCombatTurn(currentGameState, gameDispatch, action, targetId, showDialog, setDeathMessage);
  
  // Check if Player Dead - exit to princess page and reset game
  if (currentGameState.player.hp <= 0) {
    console.log("💀 PLAYER DEFEATED - Resetting game");
    setDeathMessage?.("You have been defeated in combat!");
    gameDispatch({ type: "GAME_OVER" });
    // Note: Navigation to /app/princess/index.tsx should be handled by the calling component
    return;
  }
};

// ==================== MOVEMENT TURN EXECUTION ====================

const doMoveTurn = (
  direction: string,
  setOverlay?: (overlay: any) => void,
  showDialog?: (message: string, duration?: number) => void
): void => {
  console.log(`🚶 EXECUTING MOVE TURN: ${direction}`);
  
  // Move Player
  const newPosition = calculateNewPosition(currentGameState.player.position, direction, currentGameState);
  gameDispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  
  const newMoveCount = currentGameState.moveCount + 1;
  gameDispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  
  console.log(`Player moved to: (${newPosition.row}, ${newPosition.col}), Move: ${newMoveCount}`);

  // Update game state for interactions AND monster movement
  currentGameState = { 
    ...currentGameState, 
    player: { ...currentGameState.player, position: newPosition },
    moveCount: newMoveCount 
  };

  // Handle world interactions at new position
  checkItemInteractions(currentGameState, gameDispatch, showDialog, setOverlay);
  checkObjectInteractions(currentGameState, gameDispatch, newPosition, showDialog);
};

// ==================== NON-MOVE TURN EXECUTION ====================

const doNonMoveTurn = (): void => {
  console.log(`⏳ EXECUTING NON-MOVE TURN (pass turn)`);
  
  // Update turn counter for non-move turns
  gameDispatch({ type: "PASS_TURN" });
};

// ==================== MONSTER MOVEMENT AND COMBAT SETUP ====================

const doMonsterMovement = (
  showDialog?: (message: string, duration?: number) => void
): void => {
  console.log(`👹 PROCESSING MONSTER MOVEMENT`);
  
  // Move monsters
  handleMoveMonsters(currentGameState, gameDispatch, showDialog);
  
  // Monster collision and combat setup logic is handled within handleMoveMonsters
  // If a monster is waiting OR a monster collides with Christos:
  //   - If there is an empty Attack slot: slide into slot
  //   - Else: hold position until next turn (monster waiting)
};

// ==================== SPELL AND EFFECTS EXECUTION ====================

const executeSpellsAndEffects = (): void => {
  // TODO: Execute spells and effects (none yet in game engine)
  console.log(`✨ EXECUTE SPELLS AND EFFECTS (not implemented yet)`);
};

// ==================== CLEANUP ====================

const doTurnCleanup = (): void => {
  console.log(`🧹 TURN CLEANUP`);
  
  // Update hidden status if needed
  if (currentGameState.player.isHidden) {
    // Hidden status management could go here
  }
  
  // Any other end-of-turn cleanup
};

// ==================== MAIN TURN EXECUTION ====================

const executeTurn = (
  action: string = 'move',
  direction?: string,
  targetId?: string,
  setOverlay?: (overlay: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  console.log(`\n🎯 === STARTING TURN EXECUTION ===`);
  console.log(`Action: ${action}, Direction: ${direction || 'none'}, In Combat: ${inCombat}`);

  // Execute spells and effects (placeholder)
  executeSpellsAndEffects();
  
  // DO TURN
  if (inCombat) {
    // Combat Turn
    doCombatTurn(action, targetId, showDialog, setDeathMessage);
    
    // Early exit if player died
    if (currentGameState.player.hp <= 0) {
      return;
    }
  } else {
    // Non-Combat Turn
    if (turnType === 'move') {
      doMoveTurn(direction!, setOverlay, showDialog);
    } else {
      doNonMoveTurn();
    }
  }
  
  // Move monsters (always happens unless player died)
  doMonsterMovement(showDialog);
  
  // Cleanup
  doTurnCleanup();
  
  console.log(`✅ === TURN EXECUTION COMPLETE ===\n`);
};

// ==================== PUBLIC INTERFACE FUNCTIONS ====================

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  setOverlay?: (overlay: any) => void,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  // Get and set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;
  
  // Set inCombat boolean
  inCombat = state.inCombat;
  
  // Cannot move during combat
  if (inCombat) {
    console.log("❌ Cannot move during combat");
    return;
  }
  
  // Set Turn Type
  turnType = determineTurnType(direction);
  
  // Execute Turn
  executeTurn('move', direction, undefined, setOverlay, showDialog, setDeathMessage);
};

export const handleCombatAction = (
  state: GameState,
  dispatch: (action: any) => void,
  action: string,
  targetId?: string,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  // Get and set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;
  
  // Set inCombat boolean
  inCombat = state.inCombat;
  
  if (!inCombat) {
    console.log("❌ Cannot perform combat action outside of combat");
    return;
  }
  
  // Set Turn Type
  turnType = 'combat';
  
  // Execute Turn
  executeTurn(action, undefined, targetId, undefined, showDialog, setDeathMessage);
};

export const handlePassTurn = (
  state: GameState,
  dispatch: (action: any) => void,
  showDialog?: (message: string, duration?: number) => void
): void => {
  // Get and set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;
  
  // Set inCombat boolean
  inCombat = state.inCombat;
  
  if (inCombat) {
    console.log("❌ Cannot pass turn during combat");
    return;
  }
  
  // Set Turn Type
  turnType = 'non-move-turn';
  
  // Execute Turn
  executeTurn('pass', undefined, undefined, undefined, showDialog);
};

// ==================== LEGACY EXPORTS FOR BACKWARD COMPATIBILITY ====================

// Re-export combat handler for existing code
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
        hp: abhumanTemplate.hp,
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