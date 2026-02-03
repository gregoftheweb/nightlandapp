# Visual Flow: Sub-Game Launch Feature

## User Journey

### Scenario A: Player NOT on aeroWreckage

```
┌─────────────────────────────────────────┐
│  [Game Board]                           │
│                                         │
│         🧍 Christos (player)            │
│                                         │
│                                         │
│              ✈️  aeroWreckage           │
│                                         │
│                                         │
└─────────────────────────────────────────┘
                    ↓ Player taps object
┌─────────────────────────────────────────┐
│         ╔════════════════════╗          │
│         ║  Aero-Wreckage    ║          │
│         ║                   ║          │
│         ║  [Image of wreck] ║          │
│         ║                   ║          │
│         ║  The twisted      ║          │
│         ║  remnants of a    ║          │
│         ║  long-lost...     ║          │
│         ║                   ║          │
│         ║      [X Close]    ║          │
│         ╚════════════════════╝          │
└─────────────────────────────────────────┘
                NO CTA BUTTON
```

### Scenario B: Player ON aeroWreckage

```
┌─────────────────────────────────────────┐
│  [Game Board]                           │
│                                         │
│                                         │
│              ✈️  aeroWreckage           │
│              🧍 Christos                │
│                                         │
│                                         │
└─────────────────────────────────────────┘
                    ↓ Player taps object
┌─────────────────────────────────────────┐
│         ╔════════════════════╗          │
│         ║  Aero-Wreckage    ║          │
│         ║                   ║          │
│         ║  [Image of wreck] ║          │
│         ║                   ║          │
│         ║  The twisted      ║          │
│         ║  remnants of a    ║          │
│         ║  long-lost...     ║          │
│         ║                   ║          │
│         ║ ┌───────────────┐ ║          │
│         ║ │ Investigate   │ ║ ← CTA!   │
│         ║ └───────────────┘ ║          │
│         ║      [X Close]    ║          │
│         ╚════════════════════╝          │
└─────────────────────────────────────────┘
                    ↓ Player taps "Investigate"
┌─────────────────────────────────────────┐
│  [Sub-Game Screen]                      │
│                                         │
│     Aero-Wreckage Puzzle                │
│                                         │
│  You investigate the ancient            │
│  aerocraft wreckage. Strange            │
│  devices and mysterious                 │
│  mechanisms lie before you.             │
│                                         │
│         ┌───────────────┐               │
│         │    I Win      │               │
│         └───────────────┘               │
│                                         │
└─────────────────────────────────────────┘
                    ↓ Player taps "I Win"
┌─────────────────────────────────────────┐
│  [Game Board - Returned]                │
│                                         │
│                                         │
│              ✈️  aeroWreckage           │
│              🧍 Christos                │
│         (same position!)                │
│                                         │
│  GameState updated:                     │
│  subGamesCompleted.aerowreckagePuzzle   │
│  = true                                 │
└─────────────────────────────────────────┘
```

## State Flow Diagram

```
┌───────────────────────────────────────────────────────────┐
│                    GameContext                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  GameState {                                        │  │
│  │    player: { position: {row, col}, hp, ... }        │  │
│  │    level: { ... }                                   │  │
│  │    subGamesCompleted: {                             │  │
│  │      aerowreckagePuzzle: false → true               │  │
│  │    }                                                 │  │
│  │  }                                                   │  │
│  │                                                      │  │
│  │  rpgResumeNonce: 0 → 1 → 2 → ...                    │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
         ↑                                      ↑
         │ useGameContext()                    │ useGameContext()
         │                                      │
    ┌────┴────────┐                      ┌─────┴──────────┐
    │  RPG Screen │ ←──── router.back() ─│  Sub-Game      │
    │  (game/)    │                      │  Screen        │
    │             │ ──── router.push() ─→│  (sub-games/)  │
    └─────────────┘                      └────────────────┘
         │                                      │
         │ handleBuildingTap():                 │ handleWin():
         │ - Check player position              │ - dispatch(action)
         │ - Check object.subGame               │ - signalRpgResume()
         │ - Gate CTA visibility                │ - exitSubGame()
         │ - enterSubGame()                     │
         └──────────────────────────────────────┘
```

## Code Flow

### 1. Player Taps Building

```typescript
// GameBoard.tsx - handleBuildingTap()
const launch = building.subGame // from config
const playerOnObject = isPlayerOnObject(
  state.player.position,
  building.position,
  building.width,
  building.height
)
const canLaunch = launch && playerOnObject

if (canLaunch) {
  showInfo(
    building.name,
    building.description,
    building.image,
    launch.ctaLabel, // "Investigate"
    () => {
      setInfoVisible(false)
      enterSubGame(launch.subGameName) // "aerowreckage-puzzle"
    }
  )
}
```

### 2. InfoBox Renders

```typescript
// InfoBox.tsx
<Text style={styles.description}>{description}</Text>

{ctaLabel && onCtaPress && (
  <TouchableOpacity onPress={onCtaPress}>
    <Text>{ctaLabel}</Text>
  </TouchableOpacity>
)}
```

### 3. Navigation to Sub-Game

```typescript
// lib/subGames.ts
export function enterSubGame(subGameName: string) {
  router.push(`/sub-games/${subGameName}`)
  // Routes to: app/sub-games/aerowreckage-puzzle/index.tsx
}
```

### 4. Sub-Game Completion

```typescript
// app/sub-games/aerowreckage-puzzle/index.tsx
const handleWin = () => {
  dispatch({
    type: 'SET_SUB_GAME_COMPLETED',
    payload: { subGameName: 'aerowreckagePuzzle', completed: true },
  })
  signalRpgResume() // Increment nonce
  exitSubGame({ completed: true })
}
```

### 5. Return to RPG

```typescript
// lib/subGames.ts
export function exitSubGame(result?: SubGameResult) {
  router.back() // Return to previous screen (RPG)
}

// GameContext maintains state across navigation
// RPG screen can watch rpgResumeNonce to trigger refresh
```

## Data Flow Summary

1. **Config** → Object defines sub-game metadata
2. **Tap** → GameBoard checks player position
3. **Gate** → CTA only shown if player on object
4. **Navigate** → Router pushes to sub-game screen
5. **Access** → Sub-game reads/writes GameContext
6. **Complete** → Sub-game dispatches action, signals resume
7. **Return** → Router pops back to RPG
8. **Refresh** → RPG watches nonce, refreshes board
9. **Preserve** → GameContext state survives navigation

## Key Design Principles

✅ **Config-Driven**: Object config is single source of truth  
✅ **Presentational UI**: InfoBox has no business logic  
✅ **Position-Based**: Player must be at object to interact  
✅ **State Preservation**: Navigation doesn't reset game state  
✅ **Scalable**: Adding new sub-games requires minimal code
