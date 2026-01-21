# Dead Dial Safe-Cracking Puzzle

## Overview

The Dead Dial is a tactile safe-cracking puzzle sub-game for the aerowreckage scenario. Players explore a ruined ancient aerocraft, discovering clues in the cockpit that help them crack a safe in the rear section. The puzzle features multiple screens with exploration choices and a tactile dial-based safe-cracking mechanism.

## File Structure

```
app/sub-games/
├── _shared/                          # Shared utilities for all sub-games
│   ├── index.ts                      # Barrel export
│   ├── persistence.ts                # AsyncStorage helpers
│   ├── BackgroundImage.tsx           # Background image component
│   ├── BottomActionBar.tsx           # Bottom action bar component
│   └── types.ts                      # Shared TypeScript types
│
└── aerowreckage-puzzle/              # Dead Dial puzzle implementation
    ├── components/
    │   ├── Dial.tsx                  # Rotatable dial with gesture handling
    │   ├── InstructionOverlay.tsx    # Flavor text and instructions
    │   ├── StepIndicator.tsx         # Progress visualization
    │   └── FeedbackModal.tsx         # Feedback modal for attempts
    ├── hooks/
    │   └── usePuzzleState.ts         # State management and validation
    ├── index.tsx                     # Entry router (redirects to entry or success)
    ├── entry.tsx                     # Screen [1]: Main fuselage interior choice screen
    ├── cockpit.tsx                   # Screen [2]: Cockpit overview
    ├── cockpit-closeup.tsx           # Screen [3]: Cockpit closeup (shows combo)
    ├── rear-entry.tsx                # Screen [A]: Rear section with safe
    ├── safe.tsx                      # Screen [B]: Safe-cracking puzzle
    ├── success.tsx                   # Screen [C]: Success screen
    ├── config.ts                     # Puzzle configuration
    ├── theme.ts                      # Art-deco color palette
    ├── types.ts                      # Puzzle-specific types
    └── utils.ts                      # Helper functions
```

## Screen Flow & Navigation

### Route Map

- `/sub-games/aerowreckage-puzzle` → `index.tsx` (router)
  - Routes to `entry.tsx` if puzzle not completed
  - Routes to `success.tsx` if puzzle already completed
- `/sub-games/aerowreckage-puzzle/entry` → Screen [1]: Main entry
- `/sub-games/aerowreckage-puzzle/cockpit` → Screen [2]: Cockpit overview
- `/sub-games/aerowreckage-puzzle/cockpit-closeup` → Screen [3]: Cockpit closeup with combo
- `/sub-games/aerowreckage-puzzle/rear-entry` → Screen [A]: Rear section with safe
- `/sub-games/aerowreckage-puzzle/safe` → Screen [B]: Safe puzzle
- `/sub-games/aerowreckage-puzzle/success` → Screen [C]: Success

### Navigation Flow

```
InfoBox "Investigate" → index.tsx (router)
                            ↓
                     [Puzzle completed?]
                      ↙            ↘
                   NO              YES
                    ↓               ↓
              entry.tsx         success.tsx
           (Screen [1] - NEW!)  (Screen [C])
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   "Explore    "Exit       "Explore
   cockpit"    without     the rear"
        ↓      exploring"      ↓
        ↓           ↓           ↓
  cockpit.tsx   [Exit to   rear-entry.tsx
  (Screen [2])    RPG]     (Screen [A])
        ↓                       ↓
  "Look more              ┌─────┴─────┐
   closely"               ↓           ↓
        ↓            "Attempt    "Leave it
        ↓            to open"    untouched"
cockpit-closeup.tsx      ↓           ↓
  (Screen [3])      safe.tsx    [Back to
   Shows combo:     (Screen [B])  entry.tsx]
   "28-15-7"            ↓
        ↓          [Complete
        ↓           puzzle]
  "Continue"           ↓
   exploration"   success.tsx
        ↓         (Screen [C])
 [Back to              ↓
 cockpit.tsx]    "Return to Quest"
                       ↓
                  [Exit to RPG
                   as completed]
```

### Screen Details

#### Screen [1]: Main Entry (entry.tsx)

- **Background**: `aerowreck-safe4.png`
- **Description**: Ruined fuselage interior with art deco details, torn hull, wires
- **Buttons**:
  - "Explore the cockpit" → Navigate to Screen [2]
  - "Exit without exploring" → Exit to RPG
  - "Explore the rear" → Navigate to Screen [A]
  - Dev Reset button (dev mode only)

#### Screen [2]: Cockpit Overview (cockpit.tsx)

- **Background**: `aerowreck-safe5.png`
- **Description**: Ruined cockpit with shattered glass, brass art-deco instruments
- **Buttons**:
  - "Look more closely" → Navigate to Screen [3]
  - "Return back to entrance" → Navigate back to Screen [1]

#### Screen [3]: Cockpit Closeup (cockpit-closeup.tsx)

- **Background**: `aerowreck-safe6.png`
- **Description**: Shows etched combo "28-15-7" on metal panel
- **Buttons**:
  - "Continue exploration" → Navigate back to Screen [2]

#### Screen [A]: Rear Entry (rear-entry.tsx)

- **Background**: `aerowreck-safe1.png`
- **Description**: Dusty safe under wreckage
- **Buttons**:
  - "Attempt to Open It" → Navigate to Screen [B]
  - "Leave It Untouched" → Navigate back to Screen [1] (changed from exiting to RPG)
  - Dev Reset button (dev mode only)

#### Screen [B]: Safe Puzzle (safe.tsx)

- **Background**: `aerowreck-safe2.png`
- **Interactive**: Rotatable dial with 3-step combination (L-28, R-15, L-7)
- **Buttons**:
  - "Try Combination" → Attempt to unlock
  - "Leave Without Unlocking" → Exit to RPG
- **Auto-navigation**: Navigates to Screen [C] on successful unlock

#### Screen [C]: Success (success.tsx)

- **Background**: `aerowreck-safe3.png`
- **Description**: "Christos Succeeds!" message
- **Buttons**:
  - "Return to Quest" → Exit to RPG (marks puzzle as completed)
  - Dev Reset button (dev mode only)

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
  totalNumbers: 40, // Numbers on dial (0-39)
  codeSteps: [
    { direction: 'L', target: 28, dwellMs: 400 },
    { direction: 'R', target: 15, dwellMs: 400 },
    { direction: 'L', target: 7, dwellMs: 400 },
  ],
  tolerance: 0.5, // Allowed deviation from target
  tickStepSize: 1, // Haptic tick every N numbers
}
```

## Theme Customization

Edit `theme.ts` to adjust colors:

```typescript
export const THEME = {
  background: '#0a0e1a', // Deep black-blue
  brass: '#d4af37', // Primary brass/gold
  dialBackground: '#1a2332', // Dial surface
  numberColor: '#f0d98d', // Number markers
  pointerColor: '#ef4444', // Red pointer
  // ... more colors
}
```

## Integration with Main Game

The puzzle integrates with the existing sub-game framework:

1. **Entry**: Called via `enterSubGame('aerowreckage-puzzle')` from InfoBox
2. **Routing**: `index.tsx` routes to appropriate screen based on puzzle state
3. **Context**: Accesses `GameContext` for shared state
4. **Exit**: Calls `exitSubGame()` and `signalRpgResume()`
5. **Completion**: Sets `subGamesCompleted['aerowreckage-puzzle'] = true`

## Usage

### Playing the Puzzle

**Exploration Phase:**

1. Start at the main fuselage interior (Screen [1])
2. Choose to explore the cockpit to discover the combination "28-15-7"
   - OR go directly to the rear to attempt the safe
3. Navigate through cockpit screens to find the etched combination
4. Return to entrance and explore the rear section

**Safe-Cracking Phase:**

1. Find the safe in the rear section (Screen [A])
2. Attempt to open it (Screen [B])
3. Rotate the dial to input the combination:
   - First: Turn LEFT to 28 and hold for 400ms
   - Second: Turn RIGHT to 15 and hold for 400ms
   - Third: Turn LEFT to 7 and hold for 400ms
4. Tap "Try Combination" or tap the dial center
5. Collect the reward when the safe opens (Screen [C])

### Resetting

- Tap "Reset Puzzle" (dev mode only) to clear progress and restart
- Reset from any screen returns to the entry screen
- Exit and re-enter to resume from saved state

### Exiting

- "Exit without exploring" from entry screen → returns to main game
- "Leave Without Unlocking" from safe screen → returns to main game
- "Return to Quest" from success screen → returns to main game (marks completed)
- Progress is automatically saved

## Technical Details

### Angle Calculation

```typescript
// Convert touch position to angle (radians)
const angle = Math.atan2(dy, dx) + DIAL_ORIENTATION_OFFSET

// Convert angle to dial number
const number = angleToNumber(normalizeAngle(angle))
```

### Direction Detection

```typescript
// Compare current angle to previous angle
const delta = currentAngle - previousAngle
const direction = getRotationDirection(delta) // 'L' or 'R'
```

### Tolerance Check

```typescript
// Account for wrap-around (39 -> 0)
const diff = Math.abs(current - target)
const wrapDiff = totalNumbers - diff
const shortestDiff = Math.min(diff, wrapDiff)
return shortestDiff <= tolerance
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
