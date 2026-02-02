# Touch Input Refactoring - Implementation Summary

## Problem Statement

Fix navigation getting disrupted by InfoBox popups. The goal was to change interaction so that:

- **Single tap is ALWAYS navigation**, even if the tap lands on an object
- **Long press is contextual**:
  - Long press on empty screen => continuous movement
  - Long press on object => open InfoBox

## Solution Overview

### 1. Centralized Hit-Testing (`modules/utils.ts`)

Created `getObjectAtPoint(worldRow, worldCol, state)` function that:

- Accepts world coordinates and game state
- Returns the object at that position with type information
- Implements deterministic priority order:
  1. Player
  2. Monsters (active + combat slots)
  3. Great Powers
  4. Items
  5. Buildings
  6. Non-collision objects
- Handles multi-tile objects and collision masks correctly

### 2. Gesture Handling (`app/game/index.tsx`)

#### Single Tap (handlePress)

1. Check didLongPress flag - if true, suppress and return
2. Otherwise, calculate tap position
3. Determine movement direction
4. Trigger navigation

#### Long Press (handleLongPress)

1. Calculate tap position
2. Call getObjectAtPoint to check for objects
3. If object found:
   - Set didLongPress flag
   - Show InfoBox via showInfoRef
   - Call game logic handler (targeting, awakening, etc.)
4. If no object:
   - Set didLongPress flag
   - Start continuous movement

#### Long Press Suppression

- React Native `Pressable` fires both `onLongPress` AND `onPress` events
- We use `didLongPress` ref flag to prevent double-firing
- When long press detected, set `didLongPress.current = true`
- Next `onPress` checks flag and returns early if true
- Flag is reset after being checked

### 3. InfoBox Display Pattern (`showInfoRef`)

**Problem**: GameBoard manages InfoBox state internally, but gesture handling is in game/index.tsx

**Solution**: Expose showInfo function via ref - GameBoard exposes it, game/index.tsx uses it

### 4. Entity Rendering (`components/GameBoard.tsx`)

**Before**: Each entity rendered as `TouchableOpacity` with `onPress` handler
**After**: Entities render as `View` with `pointerEvents="none"`

This allows touch events to pass through to the `Pressable` wrapper in game/index.tsx.

## Behavior Changes

| Interaction         | Old Behavior        | New Behavior                    |
| ------------------- | ------------------- | ------------------------------- |
| Tap on monster      | Opens InfoBox       | Navigates toward monster        |
| Tap on building     | Opens InfoBox       | Navigates toward building       |
| Tap on item         | Opens InfoBox       | Navigates toward item           |
| Long press empty    | Continuous movement | Continuous movement (unchanged) |
| Long press monster  | Continuous movement | Opens InfoBox                   |
| Long press building | Continuous movement | Opens InfoBox                   |

## Files Modified

- `/modules/utils.ts`: Added `getObjectAtPoint` function
- `/app/game/index.tsx`: Gesture handling + helper functions
- `/components/GameBoard.tsx`: Ref exposure + View rendering
- `/modules/__tests__/utils.test.ts` (New): Unit tests
- `/TESTING_GUIDE.md` (New): Manual testing guide

## Testing

See `TESTING_GUIDE.md` for manual testing scenarios including single tap navigation, long press InfoBox, ranged attack mode, and edge cases.

## Conclusion

This refactoring successfully decouples navigation from InfoBox display while maintaining all existing game functionality. The centralized hit-testing and gesture handling provides a cleaner architecture that's easier to maintain and extend.
