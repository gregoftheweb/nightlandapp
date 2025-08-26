// modules/gameInput.ts
import { handleMovePlayer } from './gameLoop';

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

  constructor(callbacks: TapHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  handleGridTap(context: TapContext): void {
    const { tapPosition, playerPosition, gameState } = context;
    
    // Check what was tapped
    const tappedPlayer = this.isSamePosition(tapPosition, playerPosition);
    const tappedMonster = this.findMonsterAtPosition(tapPosition, gameState);

    if (tappedPlayer) {
      this.handlePlayerTap(gameState);
    } else if (tappedMonster) {
      this.handleMonsterTap(tappedMonster, gameState);
    } else if (!gameState.inCombat) {
      this.handleMovementTap(tapPosition, playerPosition, gameState);
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

  private handleMovementTap(
    tapPosition: GridCoordinates, 
    playerPosition: GridCoordinates, 
    gameState: any
  ): void {
    const direction = this.calculateDirection(tapPosition, playerPosition);
    
    if (direction) {
      handleMovePlayer(
        gameState,
        this.callbacks.dispatch,
        direction,
        this.callbacks.setOverlay,
        this.callbacks.showDialog,
        this.callbacks.setDeathMessage
      );
    }
  }

  private calculateDirection(
    tapPosition: GridCoordinates,
    playerPosition: GridCoordinates
  ): 'up' | 'down' | 'left' | 'right' | null {
    const rowDiff = Math.abs(tapPosition.row - playerPosition.row);
    const colDiff = Math.abs(tapPosition.col - playerPosition.col);

    // Only allow movement to adjacent cells
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
}