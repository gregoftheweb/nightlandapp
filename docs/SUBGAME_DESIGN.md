# Sub-Game Launch Feature - Design Notes

## Overview

This implementation enables dynamic sub-game launching from interactive objects in the RPG world, with aeroWreckage as the initial proof-of-concept.

## Architecture Decisions

### 1. Config-Driven Approach

**Why**: Keeps sub-game metadata alongside object definitions, making it easy to add new sub-game-enabled objects without modifying core systems.

**How**: Extended `GameObject` type with optional `subGame: SubGameLaunch` field containing:

- `subGameName`: Maps to route `/sub-games/<subGameName>`
- `ctaLabel`: Dynamic button text for InfoBox
- `requiresPlayerOnObject`: Conditional visibility based on player position

**Benefits**:

- Zero hardcoding in InfoBox or GameBoard logic
- Easy to add new sub-game objects (just update config)
- Clear separation of concerns

### 2. Presentational InfoBox

**Why**: Keeps UI component reusable and testable; all business logic remains in GameBoard.

**How**: InfoBox receives optional `ctaLabel` and `onCtaPress` props. It doesn't know about navigation or sub-games.

**Benefits**:

- InfoBox can be used for any modal with optional action button
- GameBoard owns the navigation decision
- Easy to test and reason about

### 3. Shared GameState via Context

**Why**: Avoids prop drilling and ensures sub-games access the same state source as RPG.

**How**:

- `GameProvider` wraps entire app in `app/_layout.tsx`
- Both RPG screens and sub-game screens use `useGameContext()` hook
- State persistence across navigation is automatic (Context survives route changes)

**Benefits**:

- No state duplication or sync issues
- Sub-games can read/write same gamestate safely
- Resume signal via `rpgResumeNonce` triggers board refresh without reset

### 4. Navigation via Expo Router

**Why**: Leverages existing file-based routing system; no new navigation library needed.

**How**:

- Sub-games live in `/app/sub-games/<subGameName>/index.tsx`
- `enterSubGame()` uses `router.push()` to navigate
- `exitSubGame()` uses `router.back()` to return
- Screen stack preserves state across navigation

**Benefits**:

- Consistent with app's existing navigation pattern
- File structure clearly shows available sub-games
- Browser/deep-linking friendly (if needed later)

### 5. Position-Based CTA Gating

**Why**: Ensures player must be "at" the object to interact with sub-game (game feel requirement).

**How**:

- `isPlayerOnObject()` utility checks if player position overlaps object bounds
- `handleBuildingTap` computes `canLaunch` based on config + player position
- CTA only passed to InfoBox when `canLaunch === true`

**Benefits**:

- Natural game interaction pattern (move to object, then interact)
- Flexible per-object (via `requiresPlayerOnObject` flag)
- Reusable utility for future position-based interactions

## Scalability to Many Sub-Games

### Adding a New Sub-Game (3 steps):

1. **Config**: Add `subGame` field to object definition in `config/objects.ts`
2. **Screen**: Create `/app/sub-games/<name>/index.tsx` with screen logic
3. **Done**: No changes to InfoBox, GameBoard, or navigation code needed

### Example:

```typescript
// config/objects.ts
mysteriousDoor: {
  // ... existing fields
  subGame: {
    subGameName: "door-puzzle",
    ctaLabel: "Examine Lock",
    requiresPlayerOnObject: true,
  },
}

// app/sub-games/door-puzzle/index.tsx
export default function DoorPuzzle() {
  const { state, dispatch, signalRpgResume } = useGameContext();
  // ... puzzle logic
  const handleSuccess = () => {
    dispatch({ type: 'UNLOCK_DOOR', payload: { doorId: 'mysteriousDoor' } });
    signalRpgResume();
    exitSubGame({ completed: true });
  };
}
```

### State Management at Scale:

- `subGamesCompleted: Record<string, boolean>` tracks completion flags
- Sub-games can dispatch any reducer action (unlock doors, grant items, etc.)
- Resume nonce ensures board refreshes without losing player position or progress

### Future Enhancements (if needed):

- Sub-game can pass result data via `exitSubGame({ data: {...} })`
- Context parameter `enterSubGame(name, { objectId, ... })` supports sub-game customization
- Multiple sub-games can share components (puzzle UI, rewards screen, etc.)

## Testing Strategy

1. **Player ON object**: CTA appears, navigates to sub-game
2. **Player NOT ON object**: No CTA, InfoBox shows description only
3. **Sub-game completion**: State updates persist, board refreshes, player position unchanged
4. **Navigation**: Back button and "I win" both return to RPG correctly

## Trade-offs

- **Pro**: Highly extensible, minimal code duplication, clean separation of concerns
- **Con**: Requires creating full screen component per sub-game (but provides max flexibility)
- **Alternative considered**: Modal-based sub-games (rejected: limits UI complexity, awkward on mobile)

## Files Changed

- `config/types.ts`: New types (`SubGameLaunch`, `SubGameResult`), extended `GameObject`
- `config/objects.ts`: Updated `aeroWreckage` config
- `components/InfoBox.tsx`: Added optional CTA props
- `components/GameBoard.tsx`: Position checking, CTA gating, sub-game navigation
- `context/GameContext.tsx`: Added `rpgResumeNonce` and `signalRpgResume()`
- `modules/utils.ts`: Added `isPlayerOnObject()` utility
- `state/reducer.ts`: Added `SET_SUB_GAME_COMPLETED` action
- `modules/gameState.ts`: Initialized `subGamesCompleted`
- `lib/subGames.ts`: Navigation helpers
- `app/sub-games/aerowreckage-puzzle/index.tsx`: First sub-game screen
