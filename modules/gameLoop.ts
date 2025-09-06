// modules/gameLoop.ts - Enhanced with proper movement handler integration
import { GameState } from "../config/types";
import { handleMoveMonsters, setMovementHandler } from "./monsterUtils";
import { checkItemInteractions } from "./playerUtils";
import { calculateCameraOffset } from "./utils";
import { MovementHandler, Direction } from "./movement";

export class GameLoop {
  private isRunning = false;
  private dispatch: (action: any) => void;
  private showDialog: (message: string, duration?: number) => void;
  private setOverlay: (overlay: any) => void;
  private setDeathMessage: (message: string) => void;
  private movementHandler: MovementHandler;

  constructor(
    dispatch: (action: any) => void,
    showDialog: (message: string, duration?: number) => void,
    setOverlay: (overlay: any) => void,
    setDeathMessage: (message: string) => void
  ) {
    this.dispatch = dispatch;
    this.showDialog = showDialog;
    this.setOverlay = setOverlay;
    this.setDeathMessage = setDeathMessage;

    // Initialize MovementHandler
    this.movementHandler = new MovementHandler(
      this.dispatch,
      this.showDialog,
      this.setOverlay,
      this.setDeathMessage
    );

    // Set global movement handler for monster AI
    setMovementHandler(this.movementHandler);
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      console.log("GameLoop initialized with MovementHandler");
    }
  }

  stop(): void {
    this.isRunning = false;
  }

  cleanup(): void {
    this.stop();
  }



  // Process a single turn based on player action
// Process a single turn based on player action
processTurn(
  state: GameState,
  actionType: string,
  actionPayload?: any
): GameState {
  let newState = { ...state };

  console.log("GameLoop.processTurn:", actionType, actionPayload);

  switch (actionType) {
    case "MOVE_PLAYER": {
      // Check adjacency before player moves
      const adjacentMonster = newState.activeMonsters.find(
        (m) =>
          Math.abs(m.position.row - newState.player.position.row) <= 1 &&
          Math.abs(m.position.col - newState.player.position.col) <= 1
      );

      if (adjacentMonster) {
        console.log("GameLoop: Combat triggered before player move!");
        return this.handleCombatStart(newState, adjacentMonster);
      }

      newState = this.handlePlayerMove(newState, actionPayload.direction);
      break;
    }

    case "START_COMBAT": {
      newState = this.handleCombatStart(newState, actionPayload.monster);
      break;
    }

    case "PASS_TURN": {
      newState = this.handlePassTurn(newState);
      break;
    }

    case "PLAYER_ATTACK": {
      console.log("GameLoop: Player attacks!");
      // TODO: damage calculation, animations, etc.
      // After the attack, monsters still act
      this.updateWorld(newState);
      break;
    }

    default:
      return newState;
  }

  newState.lastAction = actionType;
  return newState;
}





private handlePlayerMove(state: GameState, direction: string): GameState {
  if (!this.dispatch) return state;

  console.log(`GameLoop handling player move: ${direction}`);
  this.movementHandler.movePlayer(state, direction as Direction);

  // After player moves, check for adjacent monsters
  const adjacentMonster = state.activeMonsters.find(
    m => Math.abs(m.position.row - state.player.position.row) <= 1 &&
         Math.abs(m.position.col - state.player.position.col) <= 1
  );

  if (adjacentMonster) {
    console.log("GameLoop: Player moved adjacent to monster, initiating combat");
    return this.handleCombatStart(state, adjacentMonster);
  }

  // Update world only if combat hasn't started
  this.updateWorld(state);
  return state;
}




  // Handle a turn where player stays in place
  private handlePassTurn(state: GameState): GameState {
    if (!this.dispatch) return state; // Safety check

    console.log("GameLoop handling pass turn");
    // Process world updates without moving player
    this.updateWorld(state);
    return state; // Return current state since updates are dispatched
  }

  // Start combat with a monster
// Start combat with a monster
private handleCombatStart(state: GameState, monster: any): GameState {
  if (!this.dispatch || state.inCombat) return state; // Already in combat, ignore

  const playerPos = state.player.position;

  // Define four combat slots relative to player
  const combatSlots = [
    { row: playerPos.row - 1, col: playerPos.col - 1 }, // top-left
    { row: playerPos.row - 1, col: playerPos.col + 1 }, // top-right
    { row: playerPos.row + 1, col: playerPos.col - 1 }, // bottom-left
    { row: playerPos.row + 1, col: playerPos.col + 1 }, // bottom-right
  ];

  // Pick first available slot
  let assignedSlot = combatSlots[0];
  for (const slot of combatSlots) {
    const occupied = state.activeMonsters.some(
      (m) => m.position.row === slot.row && m.position.col === slot.col
    );
    if (!occupied) {
      assignedSlot = slot;
      break;
    }
  }

  // Mark combat active
  state.inCombat = true;

  // ✅ Mark monster as being in a combat slot
  monster.inCombatSlot = true;

  // Move monster into combat slot
  this.dispatch({
    type: "MOVE_MONSTER",
    payload: { id: monster.id, position: assignedSlot },
  });

  // Officially start combat
  this.dispatch({ type: "START_COMBAT", payload: { monster } });
  this.showDialog(`${monster.name} has engaged in combat!`, 2000);

  return state;
}




// Update world state (monsters, items) on player turn

private updateWorld(state: GameState): void {
  console.log(`Updating world - Active monsters: ${state.activeMonsters.length}`);

  // Move all monsters, letting monsterUtils skip those in combat slots
  handleMoveMonsters(state, this.dispatch, this.showDialog);

  // Check item interactions as usual
  checkItemInteractions(state, this.dispatch, this.showDialog, this.setOverlay);

  console.log(`World update complete - Active monsters: ${state.activeMonsters.length}`);
}



  // Expose movement handler for external use
  getMovementHandler(): MovementHandler {
    return this.movementHandler;
  }
}