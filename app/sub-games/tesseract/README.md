# Tesseract Puzzle Sub-Game

## Overview

The Tesseract puzzle is a 5x5 letter tile puzzle where players can interact with individual letter tiles on a stone puzzle board.

## Implementation Details

### Files

- `index.tsx` - Entry point that routes to main screen
- `main.tsx` - Screen 1: Introduction with option to explore the ruins
- `screen2.tsx` - Screen 2: Interactive puzzle board
- `tiles.ts` - Tile grid configuration and utilities
- `__tests__/tiles.test.ts` - Test coverage for tile utilities

### Grid Bounds Configuration

The puzzle board image (`tesseract-puzzle-board.png`) contains a 5x5 grid of letter tiles surrounded by a stone border. The tiles don't extend to the image edges.

**GRID_RECT** defines the inner bounds of the tile field using normalized coordinates (0..1):

- `left: 0.075` - 7.5% from left edge
- `top: 0.065` - 6.5% from top edge
- `right: 0.925` - 7.5% from right edge
- `bottom: 0.89` - 11% from bottom edge (bottom border is slightly larger)

These values were calibrated by analyzing the actual puzzle board image and can be visually verified/fine-tuned using debug mode.

### Debug Mode

To visually verify and calibrate the grid alignment:

1. In `screen2.tsx`, ensure `DEBUG` constant is set to `true` (line 21):

   ```typescript
   const DEBUG = true
   ```

2. Run the app on a device or simulator:

   ```bash
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

3. Navigate to the Tesseract puzzle (tap "explore the stone ruins" from Screen 1)

4. You should see:
   - **Yellow border**: Outline of the GRID_RECT bounds
   - **Magenta grid lines**: Individual tile cell outlines (5x5)
   - **Small labels**: Row,col coordinates in each tile (e.g., "0,0", "2,3")

5. Verify alignment:
   - The yellow border should tightly frame the 5x5 letter tile area
   - The magenta grid lines should align with the tile faces
   - Each tile label should be centered within its corresponding letter tile

6. If adjustment is needed:
   - Edit `GRID_RECT` values in `tiles.ts`
   - Hot reload will show changes immediately
   - Fine-tune until the overlay perfectly matches the tile faces

### Interactive Features

When tapping the puzzle board:

- **Green border**: Shows the currently selected/pressed tile
- **Green circle**: Marks the center of the last tapped tile
- **Console logs**: Developer logs show tap coordinates and tile row/col

Taps outside the tile grid (in the border area) are ignored and logged as "Tap outside tile grid".

### Gap Configuration

A small gap (0.5% = 0.005 normalized) is applied between tiles to avoid the grout lines between stone tiles. This is configured in the `generateTilesFromGridRect()` call in `screen2.tsx`:

```typescript
const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0.005)
```

Adjust this value if needed to better avoid or include the grout lines in the hit area.

### Testing

Run the tile utility tests:

```bash
npm test -- app/sub-games/tesseract/__tests__/tiles.test.ts
```

All 12 tests should pass, covering:

- GRID_RECT validation
- Tile generation
- Pixel coordinate conversion
- Hit testing

## Production Deployment

Before deploying to production:

1. Set `DEBUG = false` in `screen2.tsx` to remove debug overlays
2. Ensure all tests pass
3. Test on multiple screen sizes to verify responsive behavior

## Future Enhancements

Potential additions:

- Puzzle solution logic
- Animation effects when selecting tiles
- Sound effects for tile interactions
- Victory condition detection
- Hint system
