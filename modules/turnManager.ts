// modules/turnManager.ts - Clean turn-based game flow orchestration
import { GameState, Position, Monster } from "../config/types";
import { monsters } from "../config/monsters";
import { handleMoveMonsters } from "./monsterUtils";
import { handleCombatTurn } from "./combat";
import { calculateNewPosition } from "./movement";
import { checkItemInteractions, checkObjectInteractions } from "./interactions";

// ==================== MODULE-LEVEL STATE (Preserved for combat/monster flow integrity) ====================
let currentGameState: GameState;
let gameDispatch: (action: any) => void;
let inCombat: boolean = false;
let turnType: "combat" | "move" | "non-move-turn" = "non-move-turn";

// ==================== CONSTANTS ====================
const INITIAL_ABHUMAN_SPAWNS = 2;
const SPAWN_BASE_DISTANCE = 15;
const SPAWN_RANDOM_DISTANCE = 10;

// ==================== UTILITY FUNCTIONS ====================

const determineTurnType = (
  direction?: string
): "combat" | "move" | "non-move-turn" => {
  if (inCombat) {
    return "combat";
  }
  if (direction && direction !== "stay") {
    return "move";
  }
  return "non-move-turn";
};

const logIfDev = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

// ==================== COMBAT TURN EXECUTION ====================

const doCombatTurn = (
  action: string,
  targetId?: string,
  setDeathMessage?: (message: string) => void
): void => {
  logIfDev(`⚔️ EXECUTING COMBAT TURN: ${action}`);

  // Do Player Attack
  if (action === "attack" && targetId) {
    logIfDev(`Player attacking target: ${targetId}`);
  }

  // Execute full combat round (player + monster attacks) - preserves UI slotting logic
  handleCombatTurn(
    currentGameState,
    gameDispatch,
    action,
    targetId,
    setDeathMessage
  );

  // Check ongoing object interactions at current position (for recuperate, etc.)
  // Use currentGameState (updated via dispatch) for consistency with slotting
  checkObjectInteractions(
    currentGameState,
    gameDispatch,
    currentGameState.player.position
  );

  // Early exit if player died (check after dispatch updates)
  if (currentGameState.player.hp <= 0) {
    logIfDev("💀 Player died in combat - early exit");
    return;
  }
};

// ==================== MOVEMENT TURN EXECUTION ====================

const doMoveTurn = (
  direction: string,
  setOverlay?: (overlay: any) => void
): void => {
  logIfDev(`🚶 EXECUTING MOVE TURN: ${direction}`);

  // Move Player
  const newPosition = calculateNewPosition(
    currentGameState.player.position,
    direction,
    currentGameState
  );
  gameDispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });

  const newMoveCount = currentGameState.moveCount + 1;
  gameDispatch({
    type: "UPDATE_MOVE_COUNT",
    payload: { moveCount: newMoveCount },
  });

  logIfDev(
    `Player moved to: (${newPosition.row}, ${newPosition.col}), Move: ${newMoveCount}`
  );

  // Update game state for interactions AND monster movement (minimal clone for perf)
  currentGameState = {
    ...currentGameState,
    player: { ...currentGameState.player, position: newPosition },
    moveCount: newMoveCount,
  };

  // Handle world interactions at new position
  checkItemInteractions(currentGameState, gameDispatch, setOverlay);
  checkObjectInteractions(currentGameState, gameDispatch, newPosition);
};

// ==================== NON-MOVE TURN EXECUTION ====================

const doNonMoveTurn = (): void => {
  logIfDev(`⏳ EXECUTING NON-MOVE TURN (pass turn)`);

  // Update turn counter for non-move turns
  gameDispatch({ type: "PASS_TURN" });

  // Check ongoing object interactions at current position (for recuperate, etc.)
  checkObjectInteractions(
    currentGameState,
    gameDispatch,
    currentGameState.player.position
  );
};

// ==================== MONSTER MOVEMENT AND COMBAT SETUP ====================

const doMonsterMovement = (): void => {
  logIfDev(`👹 PROCESSING MONSTER MOVEMENT`);

  // Move monsters - preserves specific UI slotting relative to Christos
  handleMoveMonsters(currentGameState, gameDispatch);

  // Monster collision and combat setup logic is handled within handleMoveMonsters
  // If a monster is waiting OR a monster collides with Christos:
  //   - If there is an empty Attack slot: slide into slot
  //   - Else: hold position until next turn (monster waiting)
};

// ==================== SPELL AND EFFECTS EXECUTION ====================

const executeSpellsAndEffects = (): void => {
  // TODO: Execute spells and effects (none yet in game engine)
  if (__DEV__) {
    console.log(`✨ EXECUTE SPELLS AND EFFECTS (not implemented yet)`);
  }
};

// ==================== CLEANUP ====================

const doTurnCleanup = (): void => {
  logIfDev(`🧹 TURN CLEANUP`);

  // Update hidden status if needed
  if (currentGameState.player.isHidden) {
    logIfDev("Christos is hidden");
  }

  // Any other end-of-turn cleanup
};

// ==================== MAIN TURN EXECUTION ====================

const executeTurn = (
  action: string = "move",
  direction?: string,
  targetId?: string,
  setOverlay?: (overlay: any) => void,
  setDeathMessage?: (message: string) => void
): void => {
  logIfDev(`\n🎯 === STARTING TURN EXECUTION ===`);
  logIfDev(
    `Action: ${action}, Direction: ${
      direction || "none"
    }, In Combat: ${inCombat}`
  );

  // Execute spells and effects (placeholder)
  executeSpellsAndEffects();

  // DO TURN
  if (inCombat) {
    // Combat Turn - preserves slotting
    doCombatTurn(action, targetId, setDeathMessage);

    // Early exit if player died
    if (currentGameState.player.hp <= 0) {
      return;
    }
  } else {
    // Non-Combat Turn
    if (turnType === "move") {
      doMoveTurn(direction!, setOverlay);
    } else {
      doNonMoveTurn();
    }
  }

  // Move monsters (always happens unless player died)
  doMonsterMovement();

  // Cleanup
  doTurnCleanup();

  logIfDev(`✅ === TURN EXECUTION COMPLETE ===\n`);
};

// ==================== PUBLIC INTERFACE FUNCTIONS ====================

export const handleMovePlayer = (
  state: GameState,
  dispatch: (action: any) => void,
  direction: string,
  setOverlay?: (overlay: any) => void,
  setDeathMessage?: (message: string) => void
): void => {
  // Set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;

  // Set inCombat boolean
  inCombat = state.inCombat;

  // Cannot move during combat
  if (inCombat) {
    logIfDev("❌ Cannot move during combat");
    return;
  }

  // Set Turn Type
  turnType = determineTurnType(direction);

  // Execute Turn
  executeTurn(
    "move",
    direction,
    undefined,
    setOverlay,
    setDeathMessage
  );
};

export const handleCombatAction = (
  state: GameState,
  dispatch: (action: any) => void,
  action: string,
  targetId?: string,
  setDeathMessage?: (message: string) => void
): void => {
  // Set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;

  // Set inCombat boolean
  inCombat = state.inCombat;

  if (!inCombat) {
    logIfDev("❌ Cannot perform combat action outside of combat");
    return;
  }

  // Set Turn Type
  turnType = "combat";

  // Execute Turn
  executeTurn(
    action,
    undefined,
    targetId,
    undefined,
    setDeathMessage
  );
};

export const handlePassTurn = (
  state: GameState,
  dispatch: (action: any) => void,
): void => {
  // Set current gamestate in module level variables
  currentGameState = state;
  gameDispatch = dispatch;

  // Set inCombat boolean
  inCombat = state.inCombat;

  if (inCombat) {
    logIfDev("❌ Cannot pass turn during combat");
    return;
  }

  // Set Turn Type
  turnType = "non-move-turn";

  // Execute Turn
  executeTurn("pass", undefined, undefined, undefined);
};

// ==================== LEGACY EXPORTS FOR BACKWARD COMPATIBILITY ====================

// Re-export combat handler for existing code
export { handleCombatTurn } from "./combat";

// ==================== GAME INITIALIZATION ====================

export const initializeStartingMonsters = (
  state: GameState,
  dispatch: (action: any) => void
): void => {
  const abhumanTemplate = monsters.find((m) => m.shortName === "abhuman");
  if (abhumanTemplate) {
    const timestamp = Date.now(); // Ensure uniqueness across restarts/game overs

    // Spawn exactly INITIAL_ABHUMAN_SPAWNS abhumans for testing
    for (let i = 0; i < INITIAL_ABHUMAN_SPAWNS; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = SPAWN_BASE_DISTANCE + Math.random() * SPAWN_RANDOM_DISTANCE; // Closer for testing

      let spawnRow = Math.round(
        state.player.position.row + Math.sin(angle) * distance
      );
      let spawnCol = Math.round(
        state.player.position.col + Math.cos(angle) * distance
      );

      spawnRow = Math.max(0, Math.min(state.gridHeight - 1, spawnRow));
      spawnCol = Math.max(0, Math.min(state.gridWidth - 1, spawnCol));

      // Unique ID to prevent React key duplicates during restarts
      const uniqueId = `abhuman-init-${timestamp}-${i}`;

      const newMonster: Monster = {
        ...abhumanTemplate,
        id: uniqueId,
        position: { row: spawnRow, col: spawnCol },
        hp: abhumanTemplate.hp,
        active: true,
      };

      dispatch({
        type: "SPAWN_MONSTER",
        payload: { monster: newMonster },
      });

      logIfDev(
        `🎯 Spawned initial ${newMonster.name} #${
          i + 1
        } at (${spawnRow}, ${spawnCol}), distance: ${Math.round(distance)}`
      );
      logIfDev(
        `   Stats: HP:${newMonster.hp}, Attack:${newMonster.attack}, AC:${newMonster.ac}`
      );
    }
  }
};