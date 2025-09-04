// modules/movement.ts
import { GameState, Position, Monster } from '../config/types';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'stay' | null;

export interface MovementResult {
  newPosition: Position;
  isValid: boolean;
  blockedReason?: string;
}

export class MovementHandler {
  constructor(
    private dispatch: (action: any) => void,
    private showDialog: (message: string, duration?: number) => void,
    private setOverlay: (overlay: any) => void,
    private setDeathMessage: (message: string) => void
  ) {}

  calculateNewPosition(currentPos: Position, direction: Direction, gridWidth: number, gridHeight: number): MovementResult {
    if (!direction || direction === 'stay') {
      return { newPosition: currentPos, isValid: true };
    }

    const newPosition = { ...currentPos };

    switch (direction) {
      case 'up':
        newPosition.row = Math.max(0, currentPos.row - 1);
        break;
      case 'down':
        newPosition.row = Math.min(gridHeight - 1, currentPos.row + 1);
        break;
      case 'left':
        newPosition.col = Math.max(0, currentPos.col - 1);
        break;
      case 'right':
        newPosition.col = Math.min(gridWidth - 1, currentPos.col + 1);
        break;
      default:
        console.warn(`Unhandled direction: ${direction}`);
        return { newPosition: currentPos, isValid: false, blockedReason: 'Invalid direction' };
    }

    // Check if position actually changed (hit boundary)
    const actuallyMoved = newPosition.row !== currentPos.row || newPosition.col !== currentPos.col;
    
    return { 
      newPosition, 
      isValid: actuallyMoved,
      blockedReason: actuallyMoved ? undefined : 'Boundary reached'
    };
  }

  movePlayer(state: GameState, direction: Direction): void {
    if (state.inCombat) return;

    console.log(`Moving player ${direction}: ${state.player.position.row},${state.player.position.col}`);

    const movementResult = this.calculateNewPosition(
      state.player.position, 
      direction, 
      state.gridWidth, 
      state.gridHeight
    );

    if (!movementResult.isValid) {
      if (movementResult.blockedReason && movementResult.blockedReason !== 'Boundary reached') {
        this.showDialog(movementResult.blockedReason, 1500);
      }
      return;
    }

    this.dispatch({ 
      type: 'MOVE_PLAYER', 
      payload: { position: movementResult.newPosition } 
    });

    console.log(`Player moved to: ${movementResult.newPosition.row},${movementResult.newPosition.col}`);
  }

  moveMonster(state: GameState, monsterId: string, direction: Direction): void {
    const monster = state.activeMonsters.find((m: Monster) => m.id === monsterId);
    if (!monster || state.inCombat) return;

    const moveDistance = monster.moveRate || 1;
    let targetPosition = { ...monster.position };

    // Calculate movement based on direction and move rate
    switch (direction) {
      case 'up':
        targetPosition.row = Math.max(0, monster.position.row - moveDistance);
        break;
      case 'down':
        targetPosition.row = Math.min(state.gridHeight - 1, monster.position.row + moveDistance);
        break;
      case 'left':
        targetPosition.col = Math.max(0, monster.position.col - moveDistance);
        break;
      case 'right':
        targetPosition.col = Math.min(state.gridWidth - 1, monster.position.col + moveDistance);
        break;
      default:
        return;
    }

    // Check for collisions with other monsters or objects
    const isBlocked = this.isPositionBlocked(targetPosition, state, monsterId);
    
    if (!isBlocked) {
      this.dispatch({
        type: 'MOVE_MONSTER',
        payload: { id: monsterId, position: targetPosition },
      });
    }
  }

  calculateDirectionToTarget(fromPos: Position, toPos: Position): Direction {
    const rowDiff = toPos.row - fromPos.row;
    const colDiff = toPos.col - fromPos.col;

    // Prioritize larger difference
    if (Math.abs(rowDiff) > Math.abs(colDiff)) {
      return rowDiff > 0 ? 'down' : 'up';
    } else if (Math.abs(colDiff) > Math.abs(rowDiff)) {
      return colDiff > 0 ? 'right' : 'left';
    } else if (rowDiff !== 0) {
      return rowDiff > 0 ? 'down' : 'up';
    } else if (colDiff !== 0) {
      return colDiff > 0 ? 'right' : 'left';
    }

    return null; // Already at target
  }

  getMovementDirectionFromTap(
    tapRow: number, 
    tapCol: number, 
    playerRow: number, 
    playerCol: number,
    minMoveDistance: number = 1
  ): Direction {
    const rowDiff = tapRow - playerRow;
    const colDiff = tapCol - playerCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    if (absRowDiff < minMoveDistance && absColDiff < minMoveDistance) {
      return null;
    }

    if (absRowDiff > absColDiff) {
      return rowDiff < 0 ? 'up' : 'down';
    } else if (absColDiff > absRowDiff) {
      return colDiff < 0 ? 'left' : 'right';
    } else {
      return absRowDiff >= absColDiff ? (rowDiff < 0 ? 'up' : 'down') : (colDiff < 0 ? 'left' : 'right');
    }
  }

  private isPositionBlocked(position: Position, state: GameState, excludeId?: string): boolean {
    // Check for collision with other monsters
    const hasMonsterCollision = state.activeMonsters.some(
      (m: Monster) => m.id !== excludeId && m.position.row === position.row && m.position.col === position.col
    );

    if (hasMonsterCollision) return true;

    // Check for collision with player
    const hasPlayerCollision = state.player.position.row === position.row && 
                              state.player.position.col === position.col;

    if (hasPlayerCollision) return true;

    // Check for collision with objects (buildings, obstacles)
    const hasObjectCollision = state.level?.objects?.some((obj: any) => {
      if (!obj.active) return false;

      if (obj.collisionMask) {
        return obj.collisionMask.some((mask: any) => {
          const objRowStart = obj.position.row + mask.row;
          const objColStart = obj.position.col + mask.col;
          const objRowEnd = objRowStart + (mask.height || 1) - 1;
          const objColEnd = objColStart + (mask.width || 1) - 1;

          return (
            position.row >= objRowStart &&
            position.row <= objRowEnd &&
            position.col >= objColStart &&
            position.col <= objColEnd
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
          position.row >= objRowStart &&
          position.row <= objRowEnd &&
          position.col >= objColStart &&
          position.col <= objColEnd
        );
      }
    });

    return hasObjectCollision || false;
  }
}

export const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};