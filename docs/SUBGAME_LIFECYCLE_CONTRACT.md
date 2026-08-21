# Sub-Game Lifecycle Contract

## Purpose

Every Nightland sub-game must explicitly declare its lifecycle. New sub-games must satisfy this
contract before implementation is considered complete. Existing sub-games should be migrated to it
before being duplicated.

The declaration belongs in `config/subGames.ts` registry metadata or an equivalent typed instance
config. Behavior must match the declaration; documentation alone is not compliance.

## Required declaration

The following TypeScript-like schema is normative. Names may change when implemented, but every
field and decision must remain represented.

```ts
type SubGameShapeId = 'dialogue' | 'word-grid' | 'one-off'

type FailurePolicy =
  | { exit: 'safe' }
  | {
      exit: 'death'
      message: string
      killerName: string
      suppressDeathDialog: boolean
      deathRoute: string
    }

type RevisitPolicy = 'restart' | 'resume' | 'success-screen' | 'aftermath-screen' | 'unavailable'

type ProgressPersistence =
  | { mode: 'local-only' }
  | {
      mode: 'async-storage'
      saveKey: string
      version: number
      clearOnCompletion: boolean
    }

interface SubGameLifecycleContract {
  completion: {
    event: string
    idempotent: true
  }

  failure: FailurePolicy

  waypoint:
    | { createsWaypoint: false }
    | {
        createsWaypoint: true
        waypointName: string
        snapshot: string
        idempotent: true
      }

  revisit: RevisitPolicy

  progress: ProgressPersistence

  reward:
    | { kind: 'none' }
    | {
        kind: 'item' | 'weapon' | 'effect' | 'ability'
        id: string
        grantEvent: string
        idempotent: true
      }

  returnToRpg: {
    signalRpgResume: true
    exitSubGame: true
  }
}

interface SubGameInstanceDefinition {
  instanceId: string
  shapeId: SubGameShapeId
  entryRoute: string
  lifecycle: SubGameLifecycleContract
}
```

Custom shapes are allowed, but they must be registered and added to the typed shape union rather
than represented by an unvalidated string. A shape is reusable only after two real instances prove
the shared mechanic; otherwise use `one-off`.

## Field rules

### 1. Identity

- `instanceId` is stable, unique, and matches the completion, reward, and waypoint registry keys.
- `shapeId` names the reusable mechanic or declares the game a `one-off`; it is not save identity.
- `entryRoute` is the route used by `enterSubGame`; internal routes are shape-specific.

Renaming an ID is a save-data migration, not a cosmetic change.

### 2. Completion

`completion.event` must name the exact player or system event that dispatches:

```ts
dispatch({
  type: 'SET_SUB_GAME_COMPLETED',
  payload: { subGameName: instanceId, completed: true },
})
```

Examples are “player confirms Return on the victory screen” or “terminal dialogue node effects
commit.” “When the game is done” is not specific enough.

Completion must be idempotent. Repeated presses, remounts, or revisits may dispatch the same truthy
state safely, but must not repeat rewards, waypoints, or other one-time effects.

### 3. Failure policy

Every game declares exactly one policy, even if its mechanic has no ordinary failure state:

- `{ exit: 'death', ... }`: failure dispatches `GAME_OVER` with the declared `message`, required
  `killerName`, and `suppressDeathDialog`, then enters the declared `deathRoute`.
- `{ exit: 'safe' }`: failure or abandonment returns to the RPG without killing the player and without marking
  completion.

`N/A`, omission, and implicit behavior are not allowed. A dialogue with no losing branch declares
`{ exit: 'safe' }` because leaving it incomplete is non-lethal. Every death declaration requires a
human-readable killer name; the sub-game ID is not an acceptable fallback.

Internal retreat to an earlier sub-game screen is not a failure exit.

### 4. Waypoint policy

Every game declares `createsWaypoint`.

If true, the declaration must name the waypoint and describe the exact state snapshot. The snapshot
must include all completion, reward, ability, inventory, and player-state changes that the waypoint
is intended to preserve, including changes dispatched immediately before the save.

Waypoint creation is one-time and idempotent. It must use a persistent creation marker such as
`state.waypointSavesCreated[waypointName]`; remounts, repeated completion presses, and revisits must
not create another waypoint.

### 5. Revisit policy

The completed-state entry behavior must be one of:

- `restart`: begin the mechanic again from a clean initial state, without re-granting one-time effects.
- `resume`: load the persisted state or deterministic terminal state and continue from it.
- `success-screen`: route directly to the success/reward-information screen.
- `aftermath-screen`: route to a distinct post-completion scene.
- `unavailable`: prevent entry after completion.

The index or entry controller must consult completion before rendering interactive first-play content.

### 6. Progress persistence

Every game explicitly chooses:

- `local-only`: progress resets when the mechanic remounts; or
- `async-storage`: progress uses `_shared` `getSubGameSave`, `setSubGameSave`, and
  `clearSubGameSave`, with a unique key, schema version, and stated completion cleanup policy.

Global completion, inventory, effects, and waypoints are not substitutes for declaring mid-game
progress behavior. If only those global outcomes persist, the game is still `local-only`.

### 7. Reward policy

Every game declares either `none` or one reward, effect, ability, or weapon-upgrade payload and its
exact grant event. A weapon upgrade identifies the weapon plus its multiplicative damage and additive
hit modifiers. Multiple rewards may be represented as a typed list when needed.

Every grant must be idempotent. The implementation must check durable state—such as inventory IDs,
an unlocked ability, or a completion/reward flag—rather than relying only on component-local state.
Opening a success screen twice must not duplicate a reward.

If `reward.grantEvent` occurs before completion, the screen calls the lifecycle controller's
`grantReward()` action at that event. `completeSubGame()` calls the same action as a safety net, so
completion cannot omit or duplicate the reward.

### 8. Return signal

Any path that returns normally to the RPG must:

1. commit required completion/reward/waypoint state;
2. call `signalRpgResume()`;
3. call `exitSubGame({ completed })`.

Do not use `router.back()` or a raw route to `/game` as the sub-game exit. `router.push`, `replace`,
or `back` may still be used for navigation wholly inside the sub-game. A `death` failure enters the
global death flow instead of performing a normal RPG resume.

## Worked declarations for existing games

These are migration targets based on current behavior. “Action required” identifies behavior that
must be decided or aligned before the declaration can be enforced.

| Game          | Identity                                                                     | Completion event                                                  | Failure                                                                        | Waypoint                                                                                                   | Revisit                                                                                     | Progress                                                                    | Reward                                                                               | Return                                                                                               |
| ------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Hermit Hollow | `hermit-hollow`; `dialogue`; `/sub-games/hermit-hollow/main`                 | Entering `silence_end` applies `hermit_enters_trance`; idempotent | `{ exit: 'safe' }` (the previous “N/A” maps to the required non-lethal policy) | Yes; one-time `hermit-hollow waypoint` snapshot containing all dialogue flags and the hide unlock          | `resume` at the deterministic terminal/end node                                             | `local-only` for the dialogue path                                          | Ability/effect `unlock_hide_ability`; durable ability check required                 | End-state exit calls resume signal and `exitSubGame`                                                 |
| Jaunt Cave    | `jaunt-cave`; `one-off`; `/sub-games/jaunt-cave/main`                        | Player confirms return from victory screen; idempotent            | Death; killer `Jaunt Daemon`; instance death copy and route required           | Yes; one-time `jaunt-cave` snapshot containing completion, Jaunt unlock, charges, and related player state | `aftermath-screen`                                                                          | `local-only`; battle restarts after remount before completion               | Ability `jaunt`; grant on confirmed victory, idempotent via completion/ability state | Victory/aftermath exits use resume signal and `exitSubGame`; death uses death flow                   |
| Tesseract     | `word-tile-crypt-01`; `word-grid`; `/sub-games/word-grid/word-tile-crypt-01` | Player confirms return from success screen; idempotent            | Death; killer `Ancient Evil`; suppress dialog; route `/death`                  | No                                                                                                         | `success-screen`                                                                            | `local-only`; selected letters reset on remount                             | Item `persius-scroll`; grant once using inventory ID                                 | Success exit calls resume signal and `exitSubGame`; death uses death flow                            |
| Aero-Wreckage | `aerowreckage-puzzle`; `one-off`; `/sub-games/aerowreckage-puzzle/entry`     | Player confirms Return to Quest on success screen; idempotent     | `{ exit: 'safe' }`                                                             | No                                                                                                         | `resume`: re-enter at entry, with saved dial/open state restored when the puzzle is reached | `async-storage`; key `aerowreckage-puzzle`, version 1; retain on completion | Weapon `weapon-lazer-pistol-001`; grant once using ranged inventory ID               | Incomplete exit and success exit use `exitSubGame`; verify every normal exit also signals RPG resume |
| Deep Silo     | `deep-silo`; `one-off`; `/sub-games/deep-silo/screen1`                       | Charged Discos retrieved; player confirms return                  | `{ exit: 'safe' }`                                                             | `Deep Silo Restored`; completion + Discos upgrade + Persius note                                           | `aftermath-screen` → `/sub-games/deep-silo/screen8`                                         | `async-storage`; `deep-silo-power-puzzle`; v1; retained after completion    | `weapon-upgrade`; Discos ×2 damage, +2 hit; on confirmed return                      | Complete                                                                                             |

Deep Silo uses a persisted table/control-panel state. Completion is gated on charging and retrieving
Discos; its generator surge remains an internal hazard rather than a structural lifecycle failure.

## How to add a new sub-game

1. Choose an existing shape or explicitly register a new shape; use `one-off` only when reuse is not
   justified.
2. Add the stable ID, entry route, and complete lifecycle declaration to the registry or typed
   instance config.
3. Define the exact completion and failure events before building screens.
4. Choose revisit and progress-persistence policies; add a versioned save key if using AsyncStorage.
5. Define rewards/effects and waypoint snapshots with durable idempotency guards.
6. Implement internal navigation, then ensure every normal RPG return calls `signalRpgResume()` and
   `exitSubGame()`.
7. Exercise first entry, abandonment, success, failure, remount, and completed revisit manually.
8. Do not mark the sub-game complete until implementation and declaration match.

## Future shared contract tests

Contract compliance should eventually be enforced by a shared test harness. Given a registered
sub-game declaration and shape adapter, it should assert:

- **Entry:** `enterSubGame(id)` resolves to the declared entry route, and completed entry follows the
  declared revisit policy.
- **Incomplete exit:** a safe exit does not set completion or grant completion-only rewards, calls
  the resume signal, and exits through `exitSubGame`; a death failure dispatches `GAME_OVER` and does
  not perform a normal RPG return.
- **Completion:** only the declared event sets the correct completion key, and required state changes
  are committed before exit/waypoint capture.
- **Repeat visit:** the completed game follows exactly one declared revisit path and does not expose
  inappropriate first-play interactions.
- **Duplicate reward prevention:** repeated completion actions, remounting the success screen, and
  revisiting cannot duplicate items, weapons, effects, abilities, or waypoints.
- **Progress policy:** local-only games reset on remount; AsyncStorage games restore their declared
  schema and honor `clearOnCompletion`.

These tests are a follow-up task; this document defines the behavior they should enforce.
