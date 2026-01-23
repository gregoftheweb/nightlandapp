# Manual Testing Guide for TESSERACT Puzzle

## Overview

This guide helps you test the complete TESSERACT puzzle flow from start to finish.

## Setup

1. Start the Expo development server:
   ```bash
   npm start
   ```
2. Launch on iOS simulator (`i`) or Android emulator (`a`)
3. Navigate to the TESSERACT sub-game from the main game

## Test Scenarios

### Scenario 1: Successful Completion

**Objective**: Complete the puzzle by spelling TESSERACT correctly

**Steps**:

1. Navigate to TESSERACT intro screen (Screen 1)
2. Tap "explore the stone ruins" → goes to Screen 2 (puzzle board)
3. Tap tiles in this exact order to spell T-E-S-S-E-R-A-C-T:
   - Tap T at position (0,1) - top row, second column
   - Tap E at position (1,3) - second row, fourth column
   - Tap S at position (2,2) - middle row, middle column
   - Tap S at position (4,4) - bottom row, fifth column
   - Tap E at position (4,0) - bottom row, first column
   - Tap R at position (1,2) - second row, third column
   - Tap A at position (0,3) - top row, fourth column
   - Tap C at position (4,1) - bottom row, second column
   - Tap T at position (2,3) - middle row, fourth column

**Expected Results**:

- Each tapped tile shows:
  - Green border
  - Green pulsing circle that fades out
  - Semi-transparent dark overlay (inactive state)
- After each tap, console shows: "Correct so far - continue..."
- After final T, console shows: "SUCCESS - Word completed correctly"
- After 500ms delay, navigates to Screen 4 (success screen)
- Success screen shows:
  - Background image (tesseract-screen4.png)
  - Success message about Christos
  - Two buttons: "read the scroll" and "return to the Night Land"
- Tapping "read the scroll" opens modal with Persius's message
- Modal can be closed by tapping "Close"
- Tapping "return to the Night Land" exits to main game

### Scenario 2: Wrong Letter (Immediate Failure)

**Objective**: Test that wrong letter triggers failure immediately

**Steps**:

1. Navigate to TESSERACT intro screen
2. Tap "explore the stone ruins"
3. Tap T at (0,1) - correct first letter
4. Tap any wrong letter (e.g., Z at (0,0))

**Expected Results**:

- First tile (T) shows green border and becomes inactive
- Second tile (Z) shows green border briefly
- Console shows: "FAILURE - Wrong letter at position 1: got 'Z', expected 'E'"
- After 500ms delay, navigates to Screen 3 (failure screen)
- Failure screen shows:
  - Background image (tesseract-screen3.png)
  - Failure message about ancient evil
  - "reset the puzzle" button
- Tapping reset button returns to Screen 1 (intro)

### Scenario 3: Cannot Re-tap Inactive Tiles

**Objective**: Verify that tapped tiles become inactive

**Steps**:

1. Navigate to puzzle board (Screen 2)
2. Tap T at (0,1)
3. Try tapping T at (0,1) again

**Expected Results**:

- First tap: tile shows green border and overlay
- Second tap: console shows "Tile already tapped" and nothing happens
- No duplicate entries in sequence

### Scenario 4: Reset Functionality

**Objective**: Test that reset clears all state

**Steps**:

1. Navigate to puzzle board
2. Tap a few tiles (e.g., T, E, S)
3. Navigate back to Screen 1
4. If in development mode, tap "Reset Game (Dev)" button
5. Navigate back to puzzle board

**Expected Results**:

- All tiles are active again (no overlays)
- Can tap previously tapped tiles
- Sequence starts fresh

### Scenario 5: Visual Feedback

**Objective**: Verify all visual elements work correctly

**Steps**:

1. Navigate to puzzle board (Screen 2)
2. Tap any tile

**Expected Visual Feedback**:

- Green border appears around tapped tile
- Green circle appears at center and fades out over 2 seconds
- Semi-transparent dark overlay appears on tile (remains)
- All overlays align precisely with tile boundaries

### Scenario 6: Debug Mode (Development Only)

**Objective**: Verify debug visualizations work

**Steps**:

1. Ensure `DEBUG = true` in screen2.tsx (line 24)
2. Navigate to puzzle board

**Expected Debug Visualizations**:

- Yellow border outlining the tile grid area
- Magenta borders around each individual tile
- White labels showing row,col coordinates (e.g., "0,0", "2,3")
- Labels centered in each tile

**Note**: Set `DEBUG = false` before production deployment!

## Grid Reference

The letter grid layout (for reference):

```
Row 0: Z  T  V  A  N
Row 1: L  G  R  E  Y
Row 2: W  P  S  T  H
Row 3: D  <  T  O  M
Row 4: E  C  H  R  S
```

Positions are (row, col) where both are 0-indexed.

## Known Valid Solutions

Solution 1 (tested):

- T(0,1) → E(1,3) → S(2,2) → S(4,4) → E(4,0) → R(1,2) → A(0,3) → C(4,1) → T(2,3)

Alternative solutions exist using different R and T tiles.

## Console Logging

When testing, monitor the console for these key messages:

**Successful tap**:

```
[Tesseract] Tapped tile: row=X, col=Y, letter=Z
[Tesseract] Sequence: ABC..., expected: ABC...
[Tesseract] Correct so far - continue...
```

**Wrong letter**:

```
[Tesseract] FAILURE - Wrong letter at position X: got 'Y', expected 'Z'
```

**Success**:

```
[Tesseract] SUCCESS - Word completed correctly: TESSERACT
```

**Duplicate tap**:

```
[Tesseract] Tile already tapped: row=X, col=Y, letter=Z
```

## Troubleshooting

### Tiles not responding to taps

- Check console for "Image layout" and "Generated 25 tiles" logs
- Verify imageLayout and actualImageSize are set
- Try hard reload

### Overlays misaligned

- This is a calibration issue with GRID_RECT
- See CALIBRATION_GUIDE.md for adjustment instructions
- Current values should be correct for standard devices

### Navigation not working

- Check that screen3.tsx and screen4.tsx files exist
- Verify router.push() calls use correct paths
- Check console for navigation errors

## Success Criteria

✅ All test scenarios pass
✅ Visual feedback is precise and smooth
✅ No console errors during normal gameplay
✅ Transitions between screens are clean
✅ Modal opens and closes properly
✅ Game state is marked as complete on success
✅ Reset functionality works correctly
