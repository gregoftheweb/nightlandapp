# Tesseract Grid Calibration Guide

## Purpose
This guide explains how to visually verify and fine-tune the grid alignment for the Tesseract puzzle board to ensure accurate tile hit detection.

## Quick Start

1. **Enable Debug Mode** (already enabled by default)
   - Open `app/sub-games/tesseract/screen2.tsx`
   - Verify line ~24 has: `const DEBUG = true`

2. **Run the App**
   ```bash
   cd /home/runner/work/nightlandapp/nightlandapp
   npm start
   # Press 'i' for iOS simulator or 'a' for Android emulator
   ```

3. **Navigate to Puzzle**
   - Launch the app
   - Navigate to the Tesseract sub-game
   - Tap "explore the stone ruins"
   - You'll see Screen 2 with the puzzle board

## What You Should See

### Debug Overlays (when DEBUG = true)

1. **Yellow Border**
   - Semi-transparent yellow rectangle
   - Shows the GRID_RECT bounds
   - Should tightly frame the 5x5 letter tile area (not the outer stone border)

2. **Magenta Grid Lines**  
   - Thin magenta lines dividing the grid into 5x5 cells
   - Should align with each letter tile face
   - Should NOT overlap the grout lines between tiles

3. **Tile Labels**
   - Small white text on black background in each cell
   - Shows row,col coordinates (e.g., "0,0" to "4,4")
   - Should be centered within each letter tile

### Interactive Overlays (always visible)

4. **Green Border**
   - Appears when you tap/press a tile
   - Shows the bounds of the selected tile
   - Should frame the tapped tile accurately

5. **Green Circle**
   - Appears at the center of the last tapped tile
   - Should be centered on the letter within the tile

## Verification Checklist

- [ ] Yellow border tightly frames the 5x5 letter grid (excludes outer stone border)
- [ ] Magenta grid lines align with tile faces
- [ ] Grid lines avoid overlapping grout lines between tiles
- [ ] Tile labels (row,col) are centered in each tile
- [ ] Tapping the center of any letter shows green border around that tile only
- [ ] Tapping between tiles (grout area) still registers the nearest tile
- [ ] Tapping the outer stone border does NOT register a tile (console shows "Tap outside tile grid")
- [ ] Green circle appears centered on the letter when tapping a tile
- [ ] All 25 tiles are accessible and have unique coordinates

## Fine-Tuning GRID_RECT

If the alignment is off, adjust the values in `app/sub-games/tesseract/tiles.ts`:

### Current Values
```typescript
export const GRID_RECT: GridRect = {
  left: 0.075,    // 7.5% from left edge
  top: 0.065,     // 6.5% from top edge
  right: 0.925,   // 7.5% from right edge
  bottom: 0.89,   // 11% from bottom edge
}
```

### Adjustment Guidelines

**If yellow border is too far from tile edges:**
- Decrease margins (move values toward 0.5)
- Example: `left: 0.07` (if border too far right)

**If yellow border overlaps outer stone border:**
- Increase margins (move values away from 0.5)
- Example: `left: 0.08` (if border too far left)

**If top/bottom alignment is off:**
- Adjust `top` and `bottom` independently
- The bottom border is typically larger than top

**If left/right alignment is off:**
- Adjust `left` and `right` independently
- Typically these should be symmetric

### Adjustment Strategy

1. Make small changes (0.005-0.01 increments)
2. Save the file (hot reload will update the app)
3. Observe the new alignment
4. Iterate until perfect

### Example Adjustments

**Grid too small (border showing inside tiles):**
```typescript
left: 0.07,     // was 0.075, moved 0.005 left
top: 0.055,     // was 0.065, moved 0.01 up
right: 0.93,    // was 0.925, moved 0.005 right
bottom: 0.90,   // was 0.89, moved 0.01 down
```

**Grid too large (border in outer stone area):**
```typescript
left: 0.085,    // was 0.075, moved 0.01 right
top: 0.075,     // was 0.065, moved 0.01 down
right: 0.915,   // was 0.925, moved 0.01 left
bottom: 0.88,   // was 0.89, moved 0.01 up
```

## Adjusting Gap Between Tiles

If the grid lines overlap too much with grout lines, adjust the gap in `screen2.tsx`:

```typescript
// Current: 0.005 = 0.5% gap
const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0.005)

// Larger gap (if grout lines thick):
const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0.01)

// No gap (if you want tiles to touch):
const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
```

## Testing on Multiple Devices

Test on various screen sizes to ensure responsive behavior:
- Small phone (iPhone SE)
- Standard phone (iPhone 14)
- Large phone (iPhone 14 Pro Max)
- Tablet (iPad)

The grid should scale proportionally on all devices.

## Console Logging

When DEBUG mode is enabled, check the console for useful information:

```
[Tesseract] Image layout: 360x360
[Tesseract] Generated 25 tiles
[Tesseract] Tap at: 180.5, 180.5
[Tesseract] Tapped tile: row=2, col=2
```

or

```
[Tesseract] Tap at: 20.0, 20.0
[Tesseract] Tap outside tile grid
```

## Production Deployment

Once calibration is complete:

1. **Disable Debug Mode**
   ```typescript
   const DEBUG = false  // in screen2.tsx
   ```

2. **Run Tests**
   ```bash
   npm test -- app/sub-games/tesseract/__tests__/tiles.test.ts
   ```

3. **Final Verification**
   - Test tile tapping still works
   - Verify no debug overlays visible
   - Confirm clean console (no debug logs in production build)

4. **Document Final Values**
   - Add a comment in `tiles.ts` noting the calibration date
   - Include any device-specific notes if needed

## Troubleshooting

**Problem: Can't see any overlays**
- Check that `__DEV__` is true (development build)
- Verify `DEBUG = true` in screen2.tsx
- Ensure you're on Screen 2 (puzzle board screen)

**Problem: Grid appears on every screen**
- The overlays are only on Screen 2
- Navigate to Tesseract > "explore the stone ruins"

**Problem: Overlays don't update after changes**
- Hard reload: Shake device > "Reload"
- Or restart: `npm start` again

**Problem: Tests failing**
- Run: `npm test -- app/sub-games/tesseract/__tests__/tiles.test.ts`
- All 12 tests should pass
- If GRID_RECT changed, tests validate bounds are still valid (0..1 range)

**Problem: Tiles not responsive to taps**
- Check that Pressable overlay is rendering
- Verify imageLayout state is set (check console for "Image layout" log)
- Ensure tiles array has 25 elements (check console for "Generated 25 tiles")
