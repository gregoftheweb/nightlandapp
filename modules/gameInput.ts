// modules/gameInput.ts
import { handleMovePlayer } from './playerUtils';

export interface TapHandlerCallbacks {
  dispatch: (action: any) => void;
  showDialog: (message: string, duration?: number) => void;
  setOverlay: (overlay: any) => void;
  setDeathMessage: (message: string) => void;
  onOpenInventory?: () => void;
  onOpenCharacterSheet?: () => void;
  onSelectCombatTarget?: (monsterId: string) => void;
}

export interface GridCoordinates {
  row: number;
  col: number;
}

export interface TapContext {
  tapPosition: GridCoordinates;
  playerPosition: GridCoordinates;
  gameState: any;
}

export class GameInputHandler {
  private callbacks: TapHandlerCallbacks;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private continuousMovementTimer: ReturnType<typeof setInterval> | null = null;
  private currentDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private isLongPressing = false;
  private longPressThreshold = 500; // milliseconds
  private continuousMovementInterval = 200; // milliseconds between moves

  constructor(callbacks: TapHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  handleGridTouchStart(context: TapContext): void {
    const { tapPosition, playerPosition, gameState } = context;
    
    // Clear any existing timers
    this.clearTimers();
    
    // Check what was touched
    const tappedPlayer = this.isSamePosition(tapPosition, playerPosition);
    const tappedMonster = this.findMonsterAtPosition(tapPosition, gameState);

    if (tappedPlayer) {
      // Handle player tap immediately (no long press for player)
      this.handlePlayerTap(gameState);
      return;
    } else if (tappedMonster) {
      // Handle monster tap immediately (no long press for monsters)
      this.handleMonsterTap(tappedMonster, gameState);
      return;
    } else if (!gameState.inCombat) {
      // Calculate direction for potential movement
      const direction = this.calculateDirection(tapPosition, playerPosition);
      
      if (direction) {
        this.currentDirection = direction;
        
        // Perform immediate movement
        this.performMovement(gameState);
        
        // Start long press timer
        this.longPressTimer = setTimeout(() => {
          this.startContinuousMovement(gameState);
        }, this.longPressThreshold);
      }
    }
  }

  handleGridTouchEnd(): void {
    this.clearTimers();
    this.currentDirection = null;
    this.isLongPressing = false;
  }

  // Legacy method for backward compatibility
  handleGridTap(context: TapContext): void {
    this.handleGridTouchStart(context);
  }

  private startContinuousMovement(gameState: any): void {
    this.isLongPressing = true;
    
    // Start continuous movement
    this.continuousMovementTimer = setInterval(() => {
      if (this.currentDirection && this.isLongPressing) {
        this.performMovement(gameState);
      }
    }, this.continuousMovementInterval);
  }

  private performMovement(gameState: any): void {
    if (this.currentDirection) {
      handleMovePlayer(
        gameState,
        this.callbacks.dispatch,
        this.currentDirection,
        this.callbacks.setOverlay,
        this.callbacks.showDialog,
        this.callbacks.setDeathMessage
      );
    }
  }

  private clearTimers(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (this.continuousMovementTimer) {
      clearInterval(this.continuousMovementTimer);
      this.continuousMovementTimer = null;
    }
  }

  private handlePlayerTap(gameState: any): void {
    if (gameState.inCombat) {
      this.callbacks.showDialog(
        `Christos - HP: ${gameState.player.hp}/${gameState.player.maxHP}`, 
        2000
      );
    } else {
      if (this.callbacks.onOpenCharacterSheet) {
        this.callbacks.onOpenCharacterSheet();
      } else {
        this.callbacks.showDialog("Character Options", 2000);
      }
    }
  }

  private handleMonsterTap(monster: any, gameState: any): void {
    if (gameState.inCombat) {
      if (gameState.combatTurn?.name === gameState.player.name) {
        if (this.callbacks.onSelectCombatTarget) {
          this.callbacks.onSelectCombatTarget(monster.id);
        } else {
          this.callbacks.showDialog(`Targeting ${monster.name}`, 1500);
        }
      } else {
        this.callbacks.showDialog(`${monster.name} - HP: ${monster.hp}`, 2000);
      }
    } else {
      this.callbacks.showDialog(`${monster.name} spotted in the distance`, 2000);
    }
  }

  private calculateDirection(
    tapPosition: GridCoordinates,
    playerPosition: GridCoordinates
  ): 'up' | 'down' | 'left' | 'right' | null {
    const rowDiff = Math.abs(tapPosition.row - playerPosition.row);
    const colDiff = Math.abs(tapPosition.col - playerPosition.col);

    // Only allow movement to adjacent cells for initial tap
    if (rowDiff > 1 || colDiff > 1) return null;
    
    // Prioritize the larger difference for diagonal taps
    if (rowDiff > colDiff) {
      return tapPosition.row < playerPosition.row ? 'up' : 'down';
    } else if (colDiff > rowDiff) {
      return tapPosition.col < playerPosition.col ? 'left' : 'right';
    }

    return null; // Same position
  }

  private isSamePosition(pos1: GridCoordinates, pos2: GridCoordinates): boolean {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  }

  private findMonsterAtPosition(position: GridCoordinates, gameState: any): any {
    return gameState.activeMonsters?.find((monster: any) => 
      monster.position.row === position.row && monster.position.col === position.col
    );
  }

  // Configuration methods
  setLongPressThreshold(threshold: number): void {
    this.longPressThreshold = threshold;
  }

  setContinuousMovementInterval(interval: number): void {
    this.continuousMovementInterval = interval;
  }

  // Cleanup method to call when component unmounts
  cleanup(): void {
    this.clearTimers();
  }
}