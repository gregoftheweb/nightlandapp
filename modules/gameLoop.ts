// modules/gameLoop.ts
import { GameState } from '../config/types';
import { handleMoveMonsters } from './monsterUtils';
import { checkItemInteractions } from './playerUtils';
import { calculateCameraOffset } from "./utils";
import { MovementHandler, Direction } from './movement';

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
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      console.log("GameLoop initialized");
    }
  }

  stop(): void {
    this.isRunning = false;
  }

  cleanup(): void {
    this.stop();
  }

  // Process a single turn based on player action
  processTurn(state: GameState, actionType: string, actionPayload?: any): GameState {
    let newState = { ...state };

    switch (actionType) {
      case 'MOVE_PLAYER':
        if (newState.inCombat) return newState; // No movement during combat
        newState = this.handlePlayerMove(newState, actionPayload.direction);
        break;
      case 'START_COMBAT':
        newState = this.handleCombatStart(newState, actionPayload.monster);
        break;
      // Add other action types as needed (e.g., ATTACK, USE_ITEM)
      default:
        return newState;
    }

    // Update lastAction for tracking
    newState.lastAction = actionType;
    return newState;
  }

  // Handle player movement and trigger world updates - NOW USING MovementHandler
  private handlePlayerMove(state: GameState, direction: string): GameState {
    if (!this.dispatch) return state; // Safety check

    // Use MovementHandler instead of direct dispatch
    console.log(`GameLoop handling player move: ${direction}`);
    this.movementHandler.movePlayer(state, direction as Direction);

    // Process world updates on player turn
    this.updateWorld(state);
    return state; // Return current state since updates are dispatched
  }

  // Start combat with a monster
  private handleCombatStart(state: GameState, monster: any): GameState {
    if (!this.dispatch) return state;

    this.dispatch({ type: 'START_COMBAT', payload: { monster } });
    this.showDialog(`${monster.name} has engaged in combat!`, 2000);
    return { ...state, inCombat: true }; // Return updated state
  }

  // Update world state (monsters, items) on player turn
  private updateWorld(state: GameState): void {
    handleMoveMonsters(state, this.dispatch, this.showDialog);
    checkItemInteractions(state, this.dispatch, this.showDialog, this.setOverlay);
  }
}