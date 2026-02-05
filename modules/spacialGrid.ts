// /modules/spacialgrid.ts
import {
  Position,
  GameObject,
  Monster,
  Item,
  LevelObjectInstance,
  NonCollisionObject,
} from '../config/types'

export interface GridEntity {
  id: string
  position: Position
  width: number
  height: number
  type: 'monster' | 'item' | 'object' | 'nonCollisionObject'
  data: Monster | Item | LevelObjectInstance | NonCollisionObject
}

export class SpatialGrid {
  private cellSize: number
  private cols: number
  private rows: number
  private cells: Map<string, GridEntity[]>

  constructor(cellSize: number, worldWidth: number, worldHeight: number) {
    this.cellSize = cellSize
    this.cols = Math.ceil(worldWidth / cellSize)
    this.rows = Math.ceil(worldHeight / cellSize)
    this.cells = new Map()
  }

  private getKey(row: number, col: number): string {
    const gridCol = Math.floor(col / this.cellSize)
    const gridRow = Math.floor(row / this.cellSize)
    return `${gridRow},${gridCol}`
  }

  clear(): void {
    this.cells.clear()
  }

  // Insert an entity into the grid (can span multiple cells)
  insert(entity: GridEntity): void {
    const { position, width, height } = entity

    // Calculate which cells this entity occupies
    const startRow = Math.floor(position.row / this.cellSize)
    const endRow = Math.floor((position.row + height - 1) / this.cellSize)
    const startCol = Math.floor(position.col / this.cellSize)
    const endCol = Math.floor((position.col + width - 1) / this.cellSize)

    // Add to all cells it spans
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = `${row},${col}`
        if (!this.cells.has(key)) {
          this.cells.set(key, [])
        }
        this.cells.get(key)!.push(entity)
      }
    }
  }

  // Get all entities near a position (checks surrounding cells)
  getNearby(position: Position, radiusCells: number = 1): GridEntity[] {
    const centerRow = Math.floor(position.row / this.cellSize)
    const centerCol = Math.floor(position.col / this.cellSize)

    const nearby = new Map<string, GridEntity>() // Use map to deduplicate

    for (let row = centerRow - radiusCells; row <= centerRow + radiusCells; row++) {
      for (let col = centerCol - radiusCells; col <= centerCol + radiusCells; col++) {
        const key = `${row},${col}`
        const entities = this.cells.get(key)

        if (entities) {
          entities.forEach((entity) => {
            nearby.set(entity.id, entity)
          })
        }
      }
    }

    return Array.from(nearby.values())
  }

  // Get entities of specific type near a position
  getNearbyByType(
    position: Position,
    type: GridEntity['type'],
    radiusCells: number = 1
  ): GridEntity[] {
    return this.getNearby(position, radiusCells).filter((e) => e.type === type)
  }
}

// Helper to check if positions overlap (accounting for size)
export function checkOverlap(
  pos1: Position,
  width1: number,
  height1: number,
  pos2: Position,
  width2: number,
  height2: number
): boolean {
  const row1Start = pos1.row
  const row1End = pos1.row + height1 - 1
  const col1Start = pos1.col
  const col1End = pos1.col + width1 - 1

  const row2Start = pos2.row
  const row2End = pos2.row + height2 - 1
  const col2Start = pos2.col
  const col2End = pos2.col + width2 - 1

  return (
    row1Start <= row2End && row1End >= row2Start && col1Start <= col2End && col1End >= col2Start
  )
}

// Helper to build grid from game state
export function buildSpatialGrid(gameState: any, cellSize: number = 10): SpatialGrid {
  const grid = new SpatialGrid(cellSize, gameState.gridWidth, gameState.gridHeight)

  // Add active monsters
  gameState.activeMonsters?.forEach((monster: Monster) => {
    if (monster.position) {
      grid.insert({
        id: monster.id!,
        position: monster.position,
        width: monster.width || 1,
        height: monster.height || 1,
        type: 'monster',
        data: monster,
      })
    }
  })

  // Add collectible items
  gameState.items?.forEach((item: Item) => {
    if (item.active && item.collectible && item.position) {
      grid.insert({
        id: item.id || `item-${item.shortName}`,
        position: item.position,
        width: item.size?.width || 1,
        height: item.size?.height || 1,
        type: 'item',
        data: item,
      })
    }
  })

  // Add objects (skip footsteps)
  gameState.objects?.forEach((obj: LevelObjectInstance) => {
    if (
      obj.active &&
      obj.position &&
      obj.category !== 'footstep' &&
      obj.shortName !== 'footsteps'
    ) {
      grid.insert({
        id: obj.id,
        position: obj.position,
        width: obj.size?.width || 1,
        height: obj.size?.height || 1,
        type: 'object',
        data: obj,
      })
    }
  })

  // Add non-collision objects (only those with collision masks)
  gameState.nonCollisionObjects?.forEach((obj: NonCollisionObject) => {
    if (obj.active && obj.position && obj.collisionMask && obj.collisionMask.length > 0) {
      // Insert each collision mask tile separately for precise collision detection
      obj.collisionMask.forEach((mask, index) => {
        const maskPosition = {
          row: obj.position.row + mask.row,
          col: obj.position.col + mask.col,
        }

        grid.insert({
          id: `${obj.id}-mask-${index}`,
          position: maskPosition,
          width: mask.width || 1,
          height: mask.height || 1,
          type: 'nonCollisionObject',
          data: obj, // Keep reference to parent object
        })
      })
    }
  })

  return grid
}
