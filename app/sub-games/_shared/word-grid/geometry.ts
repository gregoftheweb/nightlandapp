import type { GridRect, WordGridConfig, WordGridTile } from './types'

export function getGridLetter(
  letters: readonly (readonly string[])[],
  row: number,
  col: number
): string {
  return letters[row]?.[col] ?? ''
}

export function generateWordGridTiles(
  gridRect: GridRect,
  rows: number,
  columns: number,
  gap: number,
  letters: readonly (readonly string[])[]
): WordGridTile[] {
  const tiles: WordGridTile[] = []
  const tileWidth = (gridRect.right - gridRect.left) / columns
  const tileHeight = (gridRect.bottom - gridRect.top) / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      tiles.push({
        id: `tile-${row}-${col}`,
        row,
        col,
        letter: getGridLetter(letters, row, col),
        left: gridRect.left + col * tileWidth + gap,
        top: gridRect.top + row * tileHeight + gap,
        right: gridRect.left + (col + 1) * tileWidth - gap,
        bottom: gridRect.top + (row + 1) * tileHeight - gap,
      })
    }
  }

  return tiles
}

export function wordGridTilesToPixels(
  tiles: readonly WordGridTile[],
  imageWidth: number,
  imageHeight: number
): WordGridTile[] {
  return tiles.map((tile) => ({
    ...tile,
    leftPx: tile.left * imageWidth,
    topPx: tile.top * imageHeight,
    rightPx: tile.right * imageWidth,
    bottomPx: tile.bottom * imageHeight,
    widthPx: (tile.right - tile.left) * imageWidth,
    heightPx: (tile.bottom - tile.top) * imageHeight,
  }))
}

export function getWordGridTileAtPoint(
  tiles: readonly WordGridTile[],
  x: number,
  y: number
): WordGridTile | null {
  return (
    tiles.find(
      (tile) =>
        tile.leftPx !== undefined &&
        tile.topPx !== undefined &&
        tile.rightPx !== undefined &&
        tile.bottomPx !== undefined &&
        x >= tile.leftPx &&
        x <= tile.rightPx &&
        y >= tile.topPx &&
        y <= tile.bottomPx
    ) ?? null
  )
}

export function validateWordGridGeometry(
  gridRect: GridRect,
  rows: number,
  columns: number,
  letters: readonly (readonly string[])[]
): void {
  if (
    gridRect.left < 0 ||
    gridRect.top < 0 ||
    gridRect.right > 1 ||
    gridRect.bottom > 1 ||
    gridRect.right <= gridRect.left ||
    gridRect.bottom <= gridRect.top
  ) {
    throw new Error('Word-grid bounds must be ordered normalized coordinates')
  }
  if (letters.length !== rows || letters.some((row) => row.length !== columns)) {
    throw new Error(`Word-grid letters must exactly match ${rows} rows by ${columns} columns`)
  }
}

export function validateWordGridConfig(config: WordGridConfig): void {
  validateWordGridGeometry(config.gridRect, config.rows, config.columns, config.letters)
  if (config.intrinsicSize.width <= 0 || config.intrinsicSize.height <= 0) {
    throw new Error('Word-grid intrinsic image dimensions must be positive')
  }
  if (config.targetSequence.length === 0) {
    throw new Error('Word-grid target sequence must not be empty')
  }
}
