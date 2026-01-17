# Dead Dial Safe-Cracking Puzzle

## Overview
The Dead Dial is a tactile safe-cracking puzzle sub-game for the aerowreckage scenario. Players must rotate a virtual dial to input a three-number combination, with specific direction changes and timing requirements.

## File Structure

```
app/sub-games/
├── _shared/                          # Shared utilities for all sub-games
│   ├── index.ts                      # Barrel export
│   ├── persistence.ts                # AsyncStorage helpers
│   └── types.ts                      # Shared TypeScript types
│
└── aerowreckage-puzzle/              # Dead Dial puzzle implementation
    ├── components/
    │   ├── Dial.tsx                  # Rotatable dial with gesture handling
    │   ├── InstructionOverlay.tsx    # Flavor text and instructions
    │   └── StepIndicator.tsx         # Progress visualization
    ├── hooks/
    │   └── usePuzzleState.ts         # State management and validation
    ├── config.ts                     # Puzzle configuration
    ├── index.tsx                     # Main screen component
    ├── theme.ts                      # Art-deco color palette
    ├── types.ts                      # Puzzle-specific types
    └── utils.ts                      # Helper functions
```

## Features

### 1. Tactile Dial UI
- **Gesture Control**: Uses `PanResponder` for smooth, touch-based rotation
- **Visual Feedback**: Rotating pointer and number display
- **Art-Deco Styling**: Dark theme with brass/gold accents, geometric patterns
- **Pure View-Based**: No external image assets required

### 2. Code Sequence Mechanism
- **Three-Step Combination**: Left-28, Right-15, Left-7
- **Direction Changes**: Requires alternating rotation directions (L-R-L)
- **Tolerance System**: Must be within ±0.5 numbers of target

### 3. Dwell Time Requirement
- **Lock Timer**: 400ms pause required on each target number
- **Visual Indicator**: Center hub changes color during dwell
- **Cancellation**: Moving away from target cancels the lock attempt

### 4. Progress Feedback
- **Step Indicators**: Three circles showing locked/active/pending steps
- **Direction Labels**: Shows required rotation direction (L/R)
- **Completed Numbers**: Displays locked-in numbers
- **Success Message**: "SAFE OPENED" when complete

### 5. Haptic Feedback
Uses `expo-haptics` for tactile responses:
- **Light Impact**: When dial crosses number boundaries (tick sound)
- **Medium Impact**: When a step successfully locks
- **Error Notification**: When rotating in wrong direction
- **Success Pattern**: When safe opens

### 6. State Persistence
Saves to AsyncStorage:
- Current step index
- Current dial angle and number
- Rotation history
- Safe opened status
- Restores on re-entry

### 7. Validation Logic
- **Direction Tracking**: Monitors clockwise (R) vs counter-clockwise (L) rotation
- **Step Requirements**: Each step validates direction + target number + dwell time
- **Failure Handling**: Wrong direction triggers haptic error and cancels dwell
- **Sequential Progress**: Must complete steps in order

## Configuration

Edit `config.ts` to customize:

```typescript
export const PUZZLE_CONFIG: PuzzleConfig = {
  totalNumbers: 40,           // Numbers on dial (0-39)
  codeSteps: [
    { direction: 'L', target: 28, dwellMs: 400 },
    { direction: 'R', target: 15, dwellMs: 400 },
    { direction: 'L', target: 7, dwellMs: 400 },
  ],
  tolerance: 0.5,             // Allowed deviation from target
  tickStepSize: 1,            // Haptic tick every N numbers
};
```

## Theme Customization

Edit `theme.ts` to adjust colors:

```typescript
export const THEME = {
  background: '#0a0e1a',      // Deep black-blue
  brass: '#d4af37',           // Primary brass/gold
  dialBackground: '#1a2332',  // Dial surface
  numberColor: '#f0d98d',     // Number markers
  pointerColor: '#ef4444',    // Red pointer
  // ... more colors
};
```

## Integration with Main Game

The puzzle integrates with the existing sub-game framework:

1. **Entry**: Called via `enterSubGame('aerowreckage-puzzle')`
2. **Context**: Accesses `GameContext` for shared state
3. **Exit**: Calls `exitSubGame()` and `signalRpgResume()`
4. **Completion**: Sets `subGamesCompleted['aerowreckage-puzzle'] = true`

## Usage

### Playing the Puzzle
1. Tap and drag the dial to rotate
2. Watch the center number and step indicators
3. Rotate to the first target (28) in the LEFT direction
4. Hold steady for 400ms to lock it in
5. Repeat for remaining steps (R-15, L-7)
6. Collect the maguffin when safe opens

### Resetting
- Tap "Reset Puzzle" to clear progress and start over
- Exit and re-enter to resume from saved state

### Exiting
- Tap "Exit" to return to main game
- Progress is automatically saved

## Technical Details

### Angle Calculation
```typescript
// Convert touch position to angle (radians)
const angle = Math.atan2(dy, dx) + DIAL_ORIENTATION_OFFSET;

// Convert angle to dial number
const number = angleToNumber(normalizeAngle(angle));
```

### Direction Detection
```typescript
// Compare current angle to previous angle
const delta = currentAngle - previousAngle;
const direction = getRotationDirection(delta); // 'L' or 'R'
```

### Tolerance Check
```typescript
// Account for wrap-around (39 -> 0)
const diff = Math.abs(current - target);
const wrapDiff = totalNumbers - diff;
const shortestDiff = Math.min(diff, wrapDiff);
return shortestDiff <= tolerance;
```

### State Management Flow
1. User drags dial → `updateAngle()` called
2. New number calculated, haptic tick if changed
3. Direction validated against current step requirement
4. If within tolerance, start dwell timer
5. After dwellMs, lock step and advance
6. If last step, mark safe as opened
7. Throttled auto-save every 250ms

## Dependencies

- `@react-native-async-storage/async-storage` - State persistence
- `expo-haptics` - Tactile feedback
- React Native PanResponder - Gesture handling
- React hooks - State management

## Future Enhancements

Possible improvements:
- **Sound Effects**: Audible clicks, lock sounds, safe opening
- **Difficulty Levels**: More steps, tighter tolerance, less dwell time
- **Slip Behavior**: Dial drifts back if idle too long
- **Combo Randomization**: Generate random codes per playthrough
- **Hints System**: Show target numbers after N failures
- **Time Pressure**: Optional countdown timer
- **Achievements**: Track best times, fewest mistakes

## Testing Checklist

- [ ] Dial rotates smoothly with touch gestures
- [ ] Numbers update correctly as dial rotates
- [ ] Haptic ticks fire when crossing number boundaries
- [ ] Dwell timer activates when on target number
- [ ] Wrong direction cancels dwell and gives error haptic
- [ ] Steps lock successfully after dwell time
- [ ] Step indicators update correctly
- [ ] Safe opens after completing all steps
- [ ] State persists when exiting and re-entering
- [ ] Reset button clears all progress
- [ ] Collect button marks puzzle as completed
- [ ] Game state updates correctly on completion

## Art Direction

**Art-Deco Dark Fantasy Aesthetic**:
- Geometric patterns and symmetry
- Brass/gold metallics on dark backgrounds
- Deep blues and blacks
- Sharp angles and clean lines
- Retro-futuristic (1920s-1930s inspired)
- Minimal, elegant, mysterious

This matches the "ancient art-deco airplane wreck" setting and the grim fantasy tone of The Night Land.
