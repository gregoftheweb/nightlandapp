# Manual Test Plan: Sub-Game Launch Feature

## Test Setup

- aeroWreckage is located at position (row: 340, col: 298)
- aeroWreckage dimensions: 4x4 cells
- Player starting position: ~(row: 395, col: 200)

## Test Cases

### Test 1: Tap aeroWreckage when player is NOT on the object

**Steps:**

1. Start game
2. Move player near but NOT onto aeroWreckage (e.g., adjacent cell)
3. Tap on aeroWreckage

**Expected Result:**

- InfoBox appears with:
  - Title: "Aero-Wreckage"
  - Description: "The twisted remnants of a long-lost crashed aerocraft..."
  - Image: aeroWreckage image
  - NO "Investigate" button visible

### Test 2: Tap aeroWreckage when player IS on the object

**Steps:**

1. Start game
2. Move player onto aeroWreckage (any cell within rows 340-343, cols 298-301)
3. Tap on aeroWreckage

**Expected Result:**

- InfoBox appears with:
  - Title: "Aero-Wreckage"
  - Description: "The twisted remnants of a long-lost crashed aerocraft..."
  - Image: aeroWreckage image
  - "Investigate" button visible at bottom

### Test 3: Navigate to sub-game

**Steps:**

1. Complete Test 2 to show InfoBox with "Investigate" button
2. Tap "Investigate" button

**Expected Result:**

- InfoBox closes
- Navigate to aerowreckage-puzzle screen
- Screen shows:
  - Black background
  - Title: "Aero-Wreckage Puzzle"
  - Description: "You investigate the ancient aerocraft wreckage..."
  - Centered "I Win" button

### Test 4: Complete sub-game and return to RPG

**Steps:**

1. Complete Test 3 to reach sub-game screen
2. Tap "I Win" button

**Expected Result:**

- Navigate back to RPG game screen
- Player position unchanged (still at aeroWreckage location)
- Game state preserved (HP, inventory, etc.)
- Board is refreshed (no visual glitches)
- Console logs show:
  - `[AeroWreckagePuzzle] Player won! Updating gamestate...`
  - `SET_SUB_GAME_COMPLETED: aerowreckagePuzzle = true`
  - `[GameContext] RPG resume signaled`

### Test 5: Verify gamestate persistence

**Steps:**

1. Check console for gamestate.subGamesCompleted
2. Navigate to sub-game again
3. Complete it again

**Expected Result:**

- First completion: `subGamesCompleted.aerowreckagePuzzle` becomes `true`
- State persists across navigation
- Can complete sub-game multiple times (no one-time lock in current implementation)

## Verification Checklist

- [ ] CTA only appears when player is ON object
- [ ] CTA label comes from object config ("Investigate")
- [ ] Sub-game route is correct (/sub-games/aerowreckage-puzzle)
- [ ] Sub-game can read gamestate (useGameContext works)
- [ ] Sub-game can update gamestate (dispatch works)
- [ ] Returning from sub-game preserves RPG state
- [ ] Board refreshes without player position reset
- [ ] No console errors during navigation
- [ ] InfoBox closes before navigation
- [ ] Back button from sub-game also works (alternative to "I Win")

## Known Edge Cases

1. **Multiple objects with same position**: Not tested, but should work (first match wins)
2. **Player at corner of object**: Should count as "on object" (bounds check is inclusive)
3. **Object without subGame config**: No CTA appears (works as before)
4. **Rapid tapping**: InfoBox state should handle correctly (tested in existing code)

## Future Test Cases (when more sub-games added)

- Multiple sub-games available in same level
- Sub-games with different CTA labels
- Sub-games that DON'T require player on object (requiresPlayerOnObject: false)
- Sub-games that grant items/unlock doors
- Sub-games with failure states
