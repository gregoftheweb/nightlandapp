// Debugging version of movement.ts - Add extensive logging
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

  private getAlternativeDirections(primary: Direction): Direction[] {
    switch (primary) {
      case "up":
        return ["up", "left", "right", "down"];
      case "down":
        return ["down", "left", "right", "up"];
      case "left":
        return ["left", "up", "down", "right"];
      case "right":
        return ["right", "up", "down", "left"];
      default:
        return ["up", "down", "left", "right"];
    }
  }

  private getFreeAdjacentPositions(pos: Position, state: GameState, excludeId?: string): Position[] {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const freePositions: Position[] = [];

    for (const dir of directions) {
      const nextPos = this.calculateNewPosition(pos, dir, state.gridWidth, state.gridHeight).newPosition;
      if (!this.isPositionBlocked(nextPos, state, excludeId)) {
        freePositions.push(nextPos);
      }
    }

    return freePositions;
  }

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
      if (movementResult.blockedReason && movementResult.blockedReason !== "Boundary reached") {
        this.showDialog(movementResult.blockedReason, 1500);
      }
      return;
    }

    // Check if the target position is blocked BEFORE moving
    const isBlocked = this.isPositionBlocked(movementResult.newPosition, state);
    if (isBlocked) {
      console.log(
        `MovementHandler: Player move blocked by collision at ${movementResult.newPosition.row},${movementResult.newPosition.col}`
      );
      this.showDialog("Path is blocked!", 1500);
      return;
    }

    console.log(
      `MovementHandler: Player moving to ${movementResult.newPosition.row},${movementResult.newPosition.col}`
    );
    this.dispatch({
      type: "MOVE_PLAYER",
      payload: { position: movementResult.newPosition },
    });
  }

  moveMonster(
    state: GameState,
    monsterId: string,
    direction: Direction,
    occupiedTiles: Map<string, string>
  ): void {
    const monster = state.activeMonsters.find((m) => m.id === monsterId);
    if (!monster || state.inCombat) return;

    const moveDistance = monster.moveRate || 1;
    let currentPosition = { ...monster.position };
    let finalPosition = currentPosition;
    let movesMade = 0;

    console.log(
      `MovementHandler: Moving monster ${monster.name} (${monsterId}) ${direction} with moveRate ${moveDistance}`
    );
    console.log(`MovementHandler: Monster starting at ${currentPosition.row},${currentPosition.col}`);

    const isBlocked = (pos: Position) => {
      const key = `${pos.row},${pos.col}`;

      // Check for collisions with other monsters
      if (occupiedTiles.has(key) && occupiedTiles.get(key) !== monsterId) return true;

      // Check for collision with player
      if (state.player.position.row === pos.row && state.player.position.col === pos.col) return true;

      // Check for collision with objects
      if (state.level?.objects?.some((obj) => obj.active && obj.position && checkCollision(pos, obj.position))) return true;

      return false;
    };

    for (let step = 0; step < moveDistance; step++) {
      let nextPosition: Position | null = null;

      // Try primary direction first
      if (direction) {
        const candidate = this.calculateNewPosition(currentPosition, direction, state.gridWidth, state.gridHeight).newPosition;
        if (!isBlocked(candidate)) {
          nextPosition = candidate;
        } else {
          console.log(`MovementHandler: Monster ${monster.name} blocked at ${candidate.row},${candidate.col} in primary direction`);
        }
      }

      // If primary blocked, pick a free adjacent tile
      if (!nextPosition) {
        const freePositions = this.getFreeAdjacentPositions(currentPosition, state, monsterId)
          .filter((pos) => !isBlocked(pos));

        if (freePositions.length > 0) {
          // Pick the tile closest to the player
          freePositions.sort((a, b) => {
            const distA =
              Math.abs(a.row - state.player.position.row) + Math.abs(a.col - state.player.position.col);
            const distB =
              Math.abs(b.row - state.player.position.row) + Math.abs(b.col - state.player.position.col);
            return distA - distB;
          });
          nextPosition = freePositions[0];
          console.log(
            `MovementHandler: Monster ${monster.name} moving to alternative position ${nextPosition.row},${nextPosition.col}`
          );
        } else {
          console.log(`MovementHandler: Monster ${monster.name} fully blocked at step ${step}`);
          break; // no move possible
        }
      }

      // Apply move
      currentPosition = nextPosition!;
      finalPosition = nextPosition!;
      movesMade++;

      // Mark tile as occupied for the turn
      occupiedTiles.set(`${finalPosition.row},${finalPosition.col}`, monsterId);

      console.log(`MovementHandler: Monster ${monster.name} step ${step + 1} to ${currentPosition.row},${currentPosition.col}`);

      // Check if monster is adjacent to player to start combat
      if (this.isAdjacentToPlayer(currentPosition, state)) {
        console.log(`MovementHandler: Monster ${monster.name} is adjacent to player - initiating combat!`);
        state.inCombat = true;

        // Move monster into "slot 1" (top-left adjacent)
        const slotPosition: Position = {
          row: Math.max(0, state.player.position.row - 1),
          col: Math.max(0, state.player.position.col - 1),
        };
        finalPosition = slotPosition;
        this.dispatch({
          type: "MOVE_MONSTER",
          payload: { id: monsterId, position: finalPosition },
        });

        this.showDialog(`${monster.name} engages you in combat!`, 2000);
        break; // stop monster movement
      }
    }

    if (movesMade > 0 && !state.inCombat) {
      console.log(
        `MovementHandler: Monster ${monster.name} moved ${movesMade}/${moveDistance} steps to: ${finalPosition.row},${finalPosition.col}`
      );
      this.dispatch({
        type: "MOVE_MONSTER",
        payload: { id: monsterId, position: finalPosition },
      });
    } else if (movesMade === 0) {
      console.log(`MovementHandler: Monster ${monster.name} couldn't move at all`);
    }
  }

  moveMonsterTowardPlayer(
    state: GameState,
    monsterId: string,
    occupiedTiles: Map<string, string>
  ): void {
    const monster = state.activeMonsters.find((m) => m.id === monsterId);
    if (!monster || state.inCombat || !state.player?.position) {
      console.log(`MovementHandler: moveMonsterTowardPlayer blocked for ${monsterId}`);
      return;
    }

    console.log(`MovementHandler: Moving monster ${monster.name} toward player`);

    const primaryDirection = this.calculateDirectionToTarget(monster.position, state.player.position);
    console.log(`MovementHandler: Calculated primary direction: ${primaryDirection}`);

    // Call moveMonster with occupancy map
    this.moveMonster(state, monsterId, primaryDirection, occupiedTiles);
  }

  private isAdjacentToPlayer(pos: Position, state: GameState): boolean {
    const rowDiff = Math.abs(pos.row - state.player.position.row);
    const colDiff = Math.abs(pos.col - state.player.position.col);
    return rowDiff <= 1 && colDiff <= 1;
  }

  public isPositionBlocked(position: Position, state: GameState, excludeId?: string): boolean {
    console.log(
      `MovementHandler: Checking if position ${position.row},${position.col} is blocked (excluding ${excludeId || "none"})`
    );

    // Check for collision with other monsters
    const collidingMonster = state.activeMonsters.find(
      (m: Monster) =>
        m.id !== excludeId &&
        m.position.row === position.row &&
        m.position.col === position.col
    );

    if (collidingMonster) {
      console.log(
        `MovementHandler: Position blocked by monster ${collidingMonster.name} (${collidingMonster.id})`
      );
      return true;
    }

    // Check for collision with player
    if (state.player.position.row === position.row && state.player.position.col === position.col) {
      console.log(`MovementHandler: Position blocked by player`);
      return true;
    }

    // Check for collision with objects
    const collidingObject = state.level?.objects?.find((obj: any) => {
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

    if (collidingObject) {
      console.log(`MovementHandler: Position blocked by object ${collidingObject.name}`);
      return true;
    }

    console.log(`MovementHandler: Position ${position.row},${position.col} is clear`);
    return false;
  }

  calculateNewPosition(currentPos: Position, direction: Direction, gridWidth: number, gridHeight: number): MovementResult {
    if (!direction || direction === "stay") {
      return { newPosition: currentPos, isValid: true };
    }

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
        console.warn(`MovementHandler: Unhandled direction: ${direction}`);
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

  calculateDirectionToTarget(fromPos: Position, toPos: Position): Direction {
    const rowDiff = toPos.row - fromPos.row;
    const colDiff = toPos.col - fromPos.col;

    console.log(
      `MovementHandler: Direction calc - from ${fromPos.row},${fromPos.col} to ${toPos.row},${toPos.col} (diff: ${rowDiff},${colDiff})`
    );

    if (Math.abs(rowDiff) > Math.abs(colDiff)) {
      return rowDiff > 0 ? "down" : "up";
    } else if (Math.abs(colDiff) > Math.abs(rowDiff)) {
      return colDiff > 0 ? "right" : "left";
    } else if (rowDiff !== 0) {
      return rowDiff > 0 ? "down" : "up";
    } else if (colDiff !== 0) {
      return colDiff > 0 ? "right" : "left";
    }

    return null;
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
      return rowDiff < 0 ? "up" : "down";
    } else if (absColDiff > absRowDiff) {
      return colDiff < 0 ? "left" : "right";
    } else {
      return absRowDiff >= absColDiff
        ? rowDiff < 0
          ? "up"
          : "down"
        : colDiff < 0
        ? "left"
        : "right";
    }
  }
}

export const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};
