# Visual Testing Guide for Tesseract Grid Implementation

## What to Expect When Testing

This guide shows what you should see when testing the grid implementation with DEBUG mode enabled.

## Screen Flow

### Step 1: Navigate to Tesseract

1. Launch the app
2. You'll see the main game screen
3. Navigate to the Tesseract sub-game

### Step 2: See Intro Screen (Screen 1)

- Shows the stone ruins background
- Two buttons at bottom:
  - "leave without exploring"
  - "explore the stone ruins" ← Tap this one

### Step 3: Puzzle Board Screen (Screen 2)

This is where you'll see the grid implementation in action.

## What You Should See (DEBUG = true)

### The Puzzle Board Image

- 5x5 grid of stone tiles with glowing blue letters
- Letters: Z T V A N / L G R E Y / W P S T H / D < T O M / E C H R Z
- Each tile in its own recessed stone frame
- Thick stone/brick border around the entire grid
- Dark grout lines between tiles

### Debug Overlay #1: Yellow Grid Rectangle

- **Color**: Semi-transparent yellow
- **Border**: 2px yellow line
- **Fill**: Very light yellow (10% opacity)
- **Position**: Should tightly frame ONLY the 5x5 letter tile area
- **What it shows**: The GRID_RECT bounds we calculated

**Expected alignment:**

- Yellow border should be INSIDE the outer stone border
- Yellow border should frame the tile field, not overlap it
- Small gap between yellow border and first/last tiles

### Debug Overlay #2: Magenta Tile Grid

- **Color**: Semi-transparent magenta (pink/purple)
- **Lines**: Thin 1px borders around each tile
- **Count**: 25 tiles (5 rows × 5 columns)
- **What it shows**: Individual tile boundaries

**Expected alignment:**

- Each magenta box should align with a letter tile face
- Magenta lines should NOT overlap grout lines significantly
- Grid should be evenly spaced
- Each box should contain exactly one letter

### Debug Overlay #3: Tile Labels

- **Text**: White on black background (e.g., "0,0", "2,3", "4,4")
- **Font**: Small (10px)
- **Position**: Centered in each tile
- **Format**: "row,col" where both are 0-4

**Expected positions:**

- "0,0" in top-left tile (Z)
- "0,4" in top-right tile (N)
- "2,2" in center tile (S)
- "4,0" in bottom-left tile (E)
- "4,4" in bottom-right tile (Z)

## Interactive Testing

### Test 1: Tap on Letter Tiles

**Action**: Tap the center of any letter tile (e.g., the "S" in the middle)

**Expected behavior:**

1. Console log: `[Tesseract] Tap at: X.X, Y.Y`
2. Console log: `[Tesseract] Tapped tile: row=2, col=2`
3. **Green border** appears around the tapped tile
4. **Green circle** (30px diameter, semi-transparent) appears centered on the letter

**Visual validation:**

- Green border should exactly frame the tile face
- Green border should NOT extend into grout lines
- Green circle should be centered on the letter character

### Test 2: Tap Between Tiles (Grout Lines)

**Action**: Tap in the dark grout line between two tiles

**Expected behavior:**

- Should register as the nearest tile (due to small gap)
- OR might not register if gap is wide enough
- Console log will show which tile was registered

### Test 3: Tap Outer Stone Border

**Action**: Tap the thick stone border area outside the letter grid

**Expected behavior:**

1. Console log: `[Tesseract] Tap at: X.X, Y.Y`
2. Console log: `[Tesseract] Tap outside tile grid`
3. **NO green border** appears
4. **NO green circle** appears

**Visual validation:**

- Taps in border area should be completely ignored
- Previous green overlays (if any) should disappear

### Test 4: Sequential Tile Tapping

**Action**: Tap several different tiles in sequence (e.g., T, V, A, N in top row)

**Expected behavior:**

- Green border moves to each newly tapped tile
- Green circle appears in center of each tapped tile
- Console shows correct row,col for each tap
- Labels confirm you're tapping the right tile

### Test 5: Test All Four Corners

**Action**: Tap each corner tile

**Expected tiles:**

- Top-left: row=0, col=0 (Z)
- Top-right: row=0, col=4 (N)
- Bottom-left: row=4, col=0 (E)
- Bottom-right: row=4, col=4 (Z)

**Visual validation:**

- Green overlays should align perfectly even in corners
- No overlap with outer border

## Calibration Check

### Alignment Issues to Look For

**If yellow border is too small (overlaps tiles):**

```
Problem: Yellow border cutting into letter tiles
Fix: Increase GRID_RECT margins (move values away from 0.5)
Example: left: 0.075 → 0.085
```

**If yellow border is too large (in border area):**

```
Problem: Yellow border extends into outer stone border
Fix: Decrease GRID_RECT margins (move values toward 0.5)
Example: left: 0.075 → 0.065
```

**If magenta grid misaligned:**

```
Problem: Tile boxes don't line up with tile faces
Fix: Adjust GRID_RECT to shift the entire grid
- Shift right: decrease 'left', increase 'right'
- Shift left: increase 'left', decrease 'right'
- Shift down: decrease 'top', increase 'bottom'
- Shift up: increase 'top', decrease 'bottom'
```

**If green overlays misaligned:**

```
Problem: Usually means the grid is misaligned
Fix: Same as fixing magenta grid alignment above
```

## Console Output Examples

### Successful Tap on Center Tile:

```
[Tesseract] Image layout: 350x350
[Tesseract] Generated 25 tiles
[Tesseract] Tap at: 175.0, 175.0
[Tesseract] Tapped tile: row=2, col=2
```

### Tap Outside Grid:

```
[Tesseract] Tap at: 20.0, 20.0
[Tesseract] Tap outside tile grid
```

### Multiple Taps:

```
[Tesseract] Tap at: 100.5, 50.3
[Tesseract] Tapped tile: row=0, col=1
[Tesseract] Tap at: 200.8, 150.2
[Tesseract] Tapped tile: row=2, col=3
```

## Common Issues and Solutions

### Issue: Don't see any overlays

**Cause**: DEBUG might be false or not in development mode
**Fix**:

1. Check `DEBUG = true` in screen2.tsx (line 24)
2. Ensure running in development mode (**DEV** is true)
3. Hard reload the app

### Issue: Overlays appear but are tiny/huge

**Cause**: Image not scaling properly
**Fix**: Check console for "Image layout" log - should show reasonable size like 350x350, not 0x0 or 9999x9999

### Issue: Taps not registering at all

**Cause**: Pressable overlay not rendering or imageLayout not set
**Fix**:

1. Check console for "Image layout" and "Generated 25 tiles" logs
2. If missing, image onLayout may not be firing
3. Try hard reload

### Issue: Green overlays appear in wrong place

**Cause**: GRID_RECT misaligned with actual image
**Fix**: Follow calibration guide to adjust GRID_RECT values

## Success Criteria

✅ **Visual alignment perfect when:**

- Yellow border tightly frames the 5x5 tile area
- Magenta grid lines align with tile faces
- Each tile label is in its corresponding tile
- Tapping any letter shows green border around that tile only
- Green circle appears centered on the letter
- Tapping border area shows no overlays and logs "outside tile grid"

✅ **Ready for production when:**

- All above criteria met
- GRID_RECT values documented with calibration date
- DEBUG set to false
- All tests passing
- No console errors

## After Calibration

Once you're satisfied with the alignment:

1. Set `DEBUG = false` in screen2.tsx line 24
2. Save and reload app
3. Verify debug overlays are gone
4. Test that tile tapping still works (green border and circle)
5. Ready to deploy!
