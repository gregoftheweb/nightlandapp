// modules/movement.ts - Fixed version with better combat slot handling
import { GameState, Position, Monster } from "../config/types";

export type Direction = "up" | "down" | "left" | "right" | "stay" | null;

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
  ) {
    console.log("MovementHandler: Constructor called");
  }

  // -------------------- PLAYER MOVEMENT --------------------
  movePlayer(state: GameState, direction: Direction): void {
    if (state.inCombat) {
      console.log("MovementHandler: Player move blocked - in combat");
      return;
    }

    console.log(
      `MovementHandler: Moving player ${direction} from ${state.player.position.row},${state.player.position.col}`
    );

    const movementResult = this.calculateNewPosition(
      state.player.position,
      direction,
      state.gridWidth,
      state.gridHeight
    );

    if (!movementResult.isValid) {
      console.log(
        `MovementHandler: Player move invalid - ${movementResult.blockedReason}`
      );
      if (
        movementResult.blockedReason &&
        movementResult.blockedReason !== "Boundary reached"
      ) {
        this.showDialog(movementResult.blockedReason, 1500);
      }
      return;
    }

    // Check for collisions
    if (this.isPositionBlocked(movementResult.newPosition, state)) {
      console.log(
        `MovementHandler: Player move blocked at ${movementResult.newPosition.row},${movementResult.newPosition.col}`
      );
      this.showDialog("Path is blocked!", 1500);
      return;
    }

    this.dispatch({
      type: "MOVE_PLAYER",
      payload: { position: movementResult.newPosition },
    });
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

    if (absRowDiff < minMoveDistance && absColDiff < minMoveDistance)
      return null;

    if (absRowDiff > absColDiff) return rowDiff < 0 ? "up" : "down";
    if (absColDiff > absRowDiff) return colDiff < 0 ? "left" : "right";
    return absRowDiff >= absColDiff
      ? rowDiff < 0
        ? "up"
        : "down"
      : colDiff < 0
      ? "left"
      : "right";
  }

  calculateNewPosition(
    currentPos: Position,
    direction: Direction,
    gridWidth: number,
    gridHeight: number
  ): MovementResult {
    if (!direction || direction === "stay")
      return { newPosition: currentPos, isValid: true };
    const newPosition = { ...currentPos };
    switch (direction) {
      case "up":
        newPosition.row = Math.max(0, currentPos.row - 1);
        break;
      case "down":
        newPosition.row = Math.min(gridHeight - 1, currentPos.row + 1);
        break;
      case "left":
        newPosition.col = Math.max(0, currentPos.col - 1);
        break;
      case "right":
        newPosition.col = Math.min(gridWidth - 1, currentPos.col + 1);
        break;
      default:
        return {
          newPosition: currentPos,
          isValid: false,
          blockedReason: "Invalid direction",
        };
    }
    const actuallyMoved =
      newPosition.row !== currentPos.row || newPosition.col !== currentPos.col;
    return {
      newPosition,
      isValid: actuallyMoved,
      blockedReason: actuallyMoved ? undefined : "Boundary reached",
    };
  }

  // -------------------- MONSTER MOVEMENT --------------------
  moveMonsterTowardPlayer(
    state: GameState,
    monsterId: string,
    occupiedTiles: Map<string, string>
  ): void {
    const monster = state.activeMonsters.find((m) => m.id === monsterId);
    if (!monster || !state.player?.position) {
      console.log(`MovementHandler: Monster ${monsterId} not found or no player position`);
      return;
    }

    // ✅ Only block THIS monster if it's in a combat slot
    if (monster.inCombatSlot) {
      console.log(`MovementHandler: Monster ${monster.name} is in combat slot, skipping movement`);
      return;
    }

    console.log(`MovementHandler: Moving monster ${monster.name} toward player`);
    
    const primaryDirection = this.calculateDirectionToTarget(
      monster.position,
      state.player.position
    );
    console.log(`MovementHandler: primary direction for ${monster.name}: ${primaryDirection}`);
    
    this.moveMonster(state, monsterId, primaryDirection, occupiedTiles);
  }

  moveMonster(
    state: GameState,
    monsterId: string,
    direction: Direction,
    occupiedTiles: Map<string, string>
  ): void {
    const monster = state.activeMonsters.find((m) => m.id === monsterId);
    if (!monster || !monster.active) return;

    const moveDistance = monster.moveRate || 1;
    let currentPosition = { ...monster.position };
    let finalPosition = currentPosition;
    let movesMade = 0;

    const isBlocked = (pos: Position) => {
      const key = `${pos.row},${pos.col}`;

      // Check for collisions with other monsters
      if (occupiedTiles.has(key) && occupiedTiles.get(key) !== monsterId)
        return true;

      // Check for collision with player
      if (
        state.player.position.row === pos.row &&
        state.player.position.col === pos.col
      )
        return true;

      // Check for collision with objects (only if obj.position exists)
      if (
        state.level?.objects?.some(
          (obj) =>
            obj.active && obj.position && checkCollision(pos, obj.position)
        )
      )
        return true;

      return false;
    };

    for (let step = 0; step < moveDistance; step++) {
      let nextPosition: Position | null = null;

      // Try primary direction
      if (direction) {
        const candidate = this.calculateNewPosition(
          currentPosition,
          direction,
          state.gridWidth,
          state.gridHeight
        ).newPosition;
        if (!isBlocked(candidate)) nextPosition = candidate;
      }

      // If blocked, pick free adjacent tile closest to player
      if (!nextPosition) {
        const freePositions = this.getFreeAdjacentPositions(
          currentPosition,
          state,
          monsterId
        ).filter((p) => !isBlocked(p));
        if (freePositions.length > 0) {
          freePositions.sort(
            (a, b) =>
              Math.abs(a.row - state.player.position.row) +
              Math.abs(a.col - state.player.position.col) -
              (Math.abs(b.row - state.player.position.row) +
                Math.abs(b.col - state.player.position.col))
          );
          nextPosition = freePositions[0];
        } else {
          console.log(
            `MovementHandler: Monster ${monster.name} fully blocked at step ${step}`
          );
          break;
        }
      }

      if (nextPosition) {
        currentPosition = nextPosition;
        finalPosition = nextPosition;
        movesMade++;
        occupiedTiles.set(
          `${finalPosition.row},${finalPosition.col}`,
          monsterId
        );

        // Check if adjacent to player after moving
        if (this.isAdjacentToPlayer(currentPosition, state)) {
          console.log(
            `MovementHandler: Monster ${monster.name} adjacent to player, initiating combat!`
          );
          
          // ✅ Find an available combat slot
          const combatSlot = this.findAvailableCombatSlot(state);
          if (combatSlot) {
            finalPosition = combatSlot;
            console.log(`MovementHandler: Moving ${monster.name} to combat slot ${combatSlot.row},${combatSlot.col}`);
            
            // Mark monster as in combat slot
            this.dispatch({
              type: "MOVE_MONSTER",
              payload: { id: monsterId, position: finalPosition },
            });
            
            // Start combat for this monster
            this.dispatch({
              type: "START_COMBAT",
              payload: { monster: monster }
            });
            
            this.showDialog(`${monster.name} engages you in combat!`, 2000);
            break;
          } else {
            console.log(`MovementHandler: No combat slots available for ${monster.name}`);
          }
        }
      }
    }

    // Only dispatch movement if not entering combat and moves were made
    if (movesMade > 0 && !monster.inCombatSlot) {
      this.dispatch({
        type: "MOVE_MONSTER",
        payload: { id: monsterId, position: finalPosition },
      });
      console.log(
        `MovementHandler: Monster ${monster.name} moved ${movesMade}/${moveDistance} steps to ${finalPosition.row},${finalPosition.col}`
      );
    }
  }

  // ✅ NEW: Find available combat slot around player
  private findAvailableCombatSlot(state: GameState): Position | null {
    const playerPos = state.player.position;
    
    // Define four combat slots relative to player
    const combatSlots = [
      { row: playerPos.row - 1, col: playerPos.col - 1 }, // top-left
      { row: playerPos.row - 1, col: playerPos.col + 1 }, // top-right
      { row: playerPos.row + 1, col: playerPos.col - 1 }, // bottom-left
      { row: playerPos.row + 1, col: playerPos.col + 1 }, // bottom-right
    ];

    // Find first available slot
    for (const slot of combatSlots) {
      // Check bounds
      if (slot.row < 0 || slot.row >= state.gridHeight || 
          slot.col < 0 || slot.col >= state.gridWidth) {
        continue;
      }
      
      const occupied = state.activeMonsters.some(
        (m) => m.position.row === slot.row && m.position.col === slot.col
      );
      
      if (!occupied) {
        return slot;
      }
    }
    
    return null; // No slots available
  }

  getFreeAdjacentPositions(
    pos: Position,
    state: GameState,
    excludeId?: string
  ): Position[] {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const freePositions: Position[] = [];
    for (const dir of directions) {
      const candidate = this.calculateNewPosition(
        pos,
        dir,
        state.gridWidth,
        state.gridHeight
      ).newPosition;
      if (!this.isPositionBlocked(candidate, state, excludeId))
        freePositions.push(candidate);
    }
    return freePositions;
  }

  calculateDirectionToTarget(from: Position, to: Position): Direction {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    if (Math.abs(rowDiff) > Math.abs(colDiff))
      return rowDiff > 0 ? "down" : "up";
    if (Math.abs(colDiff) > Math.abs(rowDiff))
      return colDiff > 0 ? "right" : "left";
    if (rowDiff !== 0) return rowDiff > 0 ? "down" : "up";
    if (colDiff !== 0) return colDiff > 0 ? "right" : "left";
    return null;
  }

  isAdjacentToPlayer(pos: Position, state: GameState): boolean {
    const rowDiff = Math.abs(pos.row - state.player.position.row);
    const colDiff = Math.abs(pos.col - state.player.position.col);
    return rowDiff <= 1 && colDiff <= 1;
  }

  public isPositionBlocked(
    position: Position,
    state: GameState,
    excludeId?: string
  ): boolean {
    // Check for collision with other monsters
    const collidingMonster = state.activeMonsters.find(
      (m) =>
        m.id !== excludeId &&
        m.position.row === position.row &&
        m.position.col === position.col
    );
    if (collidingMonster) return true;

    // Check for collision with player
    if (
      state.player.position.row === position.row &&
      state.player.position.col === position.col
    )
      return true;

    // Check for collision with objects (guard for undefined positions)
    if (
      state.level?.objects?.some(
        (obj) =>
          obj.active && obj.position && checkCollision(position, obj.position)
      )
    )
      return true;

    return false;
  }
}

export const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};