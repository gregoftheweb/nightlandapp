# Manual Testing Guide: Touch Input Changes

## Overview
This guide helps verify that the new touch input behavior works correctly. The key changes are:
- **Single tap ALWAYS triggers navigation** (even on objects)
- **Long press on empty space starts continuous movement**
- **Long press on objects opens InfoBox**

## Test Scenarios

### 1. Single Tap Navigation
**Expected Behavior**: Tapping anywhere should move the player in that direction

**Test Steps**:
1. Launch the game
2. Single tap on empty space → Player should move toward that direction
3. Single tap on a monster → Player should move toward that direction (NO InfoBox should open)
4. Single tap on a building → Player should move toward that direction (NO InfoBox should open)
5. Single tap on an item → Player should move toward that direction (NO InfoBox should open)

**Success Criteria**:
- ✅ Player moves in tapped direction
- ✅ NO InfoBox opens on single tap
- ✅ Works consistently across all tap targets

---

### 2. Long Press on Empty Space (Continuous Movement)
**Expected Behavior**: Long pressing empty space starts continuous movement

**Test Steps**:
1. Launch the game
2. Long press and hold on empty space (not on any object)
3. Observe player movement
4. Release the press

**Success Criteria**:
- ✅ Player starts moving continuously in the tapped direction
- ✅ Player continues moving while press is held
- ✅ Player stops when press is released
- ✅ NO navigation occurs when you release the long press

---

### 3. Long Press on Objects (InfoBox)
**Expected Behavior**: Long pressing an object opens its InfoBox

**Test Steps**:
1. Long press on the player → InfoBox should open showing player stats
2. Long press on a monster → InfoBox should open showing monster info
3. Long press on a building → InfoBox should open showing building info
4. Long press on an item → InfoBox should open showing item info
5. Long press on a Great Power → InfoBox should open showing Great Power info

**Success Criteria**:
- ✅ InfoBox opens for each object type
- ✅ InfoBox shows correct information
- ✅ NO navigation occurs when you release the long press
- ✅ CTA buttons work if present (e.g., entering sub-games)

---

### 4. Player Standing on Object
**Expected Behavior**: When player is on an object, tap navigates, long press opens InfoBox

**Test Steps**:
1. Move player onto a building or item
2. Single tap on the player → Should navigate
3. Long press on the player position → Should open InfoBox for the object underneath

**Success Criteria**:
- ✅ Single tap navigates even when on an object
- ✅ Long press shows InfoBox for the object

---

### 5. Ranged Attack Mode (No Regression)
**Expected Behavior**: Ranged attack targeting should still work

**Test Steps**:
1. Enter ranged attack mode (press ZAP button)
2. Tap on a monster → Should retarget to that monster
3. Press ZAP again → Should fire at targeted monster
4. Long press on a monster while in ranged mode → Should show InfoBox (not retarget)

**Success Criteria**:
- ✅ Tapping monsters retargets correctly
- ✅ Ranged attacks fire correctly
- ✅ No InfoBox opens on single tap during ranged mode
- ✅ Long press can still open InfoBox if desired

---

### 6. Combat Mode
**Expected Behavior**: Combat interactions should work normally

**Test Steps**:
1. Enter combat with a monster
2. Single tap on monster → Should select as target
3. Long press on monster → Should open InfoBox
4. Attack button should work normally

**Success Criteria**:
- ✅ Monster selection works
- ✅ Combat flows normally
- ✅ Long press InfoBox works during combat

---

### 7. Edge Cases
**Test Steps**:
1. Rapidly tap multiple objects → Should only navigate, no InfoBoxes
2. Long press, drag, and release on different spot → Should not cause issues
3. Open InfoBox via long press, then tap elsewhere → InfoBox should close and navigate
4. Test with all object types: monsters, buildings, items, Great Powers, non-collision objects

**Success Criteria**:
- ✅ No crashes or unexpected behavior
- ✅ Gestures are responsive
- ✅ No double-actions (e.g., navigation + InfoBox)

---

## Priority Order Verification
The hit-testing follows this priority (highest to lowest):
1. Player
2. Monsters (active monsters and combat slots)
3. Great Powers
4. Items
5. Buildings (level objects)
6. Non-collision objects (with collision masks)

**Test**: If objects overlap, long press should open InfoBox for the highest priority object.

---

## Known Technical Details

### Long Press Suppression
- When a long press is detected, a `didLongPress` flag is set
- The subsequent `onPress` event checks this flag and returns early
- This prevents navigation from firing after a long press completes

### Hit Testing
- All hit testing is centralized in `getObjectAtPoint()` utility function
- Screen coordinates are converted to world coordinates before testing
- Multi-tile objects and collision masks are properly handled

---

## Reporting Issues
If you find any issues during testing, please note:
1. Which test scenario failed
2. What you expected to happen
3. What actually happened
4. Steps to reproduce
5. Any console errors (check with `__DEV__` mode enabled)
