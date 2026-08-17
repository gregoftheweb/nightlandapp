# Lifecycle-Enforced Sub-Game Template

This directory is the minimal working reference for
`docs/SUBGAME_LIFECYCLE_CONTRACT.md`. It is not sufficient to copy screens and manually reproduce
completion logic: every sub-game must declare a typed lifecycle config and use
`useSubGameLifecycle` for completion, failure, revisit routing, progress, rewards, waypoints, and RPG
return.

## Reference flow

```text
index -> main -> puzzle -> success -> RPG
           |        |
           +--------+---- safe failure -> RPG
```

- `lifecycleConfig.ts` contains the complete declaration.
- `index.tsx` calls `resolveEntryRoute()` so completed entry follows the declared revisit policy.
- `main.tsx` and `puzzle.tsx` call `failSubGame()` for the declared safe exit.
- `success.tsx` calls `completeSubGame()` exactly at the declared completion event.
- The shared controller commits completion/reward/waypoint state before signaling and exiting.

The example uses a `one-off` shape, local-only progress, no reward, no waypoint, safe failure, and a
success-screen revisit. It is intentionally simple but fully functional.

## Creating a sub-game

1. Copy this directory and rename it to the stable kebab-case sub-game ID.
2. Update every field in `lifecycleConfig.ts`. Do not leave a lifecycle decision implicit.
3. Update the module-level routes and assets in the screens.
4. Implement the shape mechanic. Reuse an established shape rather than copying its logic when one
   exists.
5. Register the ID and entry route in `config/subGames.ts`.
6. Add shape-specific tests plus the lifecycle cases listed in the contract document.

The config object must remain module-level and stable. Constructing it inside a component is rejected
because it would reset the controller's one-call guards on every render.

## Shared lifecycle API

```ts
const lifecycle = useSubGameLifecycle<MyProgress>(lifecycleConfig)
```

### `completeSubGame(): Promise<void>`

The controller performs the success transaction in this order:

1. dispatches `SET_SUB_GAME_COMPLETED` if needed;
2. grants the configured reward if durable state does not already contain it;
3. derives an updated state snapshot and creates the configured waypoint once;
4. dispatches the persistent waypoint marker;
5. clears AsyncStorage progress when `clearOnCompletion` is true;
6. calls `signalRpgResume()` and `exitSubGame({ completed: true })`.

Concurrent or repeated calls through the same controller share one operation and cannot duplicate
the reward or waypoint. Durable inventory/weapon/reward and waypoint markers protect remounts.

### `grantReward(): Promise<void>`

Grants only the declared reward, using the same durable idempotency checks as completion. Use this
when `reward.grantEvent` occurs before the completion event, such as entering a success screen.
`completeSubGame()` always calls it again as a safety net and will not duplicate the grant.

Reward IDs resolve against repository data:

- `item`: a `collectible` entry whose `id` or `shortName` matches;
- `weapon`: an item in the current game state's weapon catalog;
- `effect` or `ability`: an effect-system type ID.

The controller also writes a durable namespaced reward flag. Unknown IDs fail loudly rather than
silently recording an ungranted reward.

### `failSubGame(): Promise<void>`

- `safe`: signals RPG resume and exits with `{ completed: false }`; it never grants completion or a
  reward.
- `death`: dispatches `GAME_OVER` with the declared message, required killer name, and dialog policy,
  then enters the declared death route; it does not perform a normal RPG resume/exit.

Death copy belongs in the lifecycle declaration so generic shapes can preserve instance-specific
failure presentation without dispatching their own `GAME_OVER` action.

### Revisit routing

`resolveEntryRoute()` returns:

| Policy             | Resolution                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| `restart`          | declared `entryRoute`                                                             |
| `resume`           | declared `entryRoute` (the entry loads progress or selects a deterministic state) |
| `success-screen`   | `success` sibling of the entry route                                              |
| `aftermath-screen` | `aftermath` sibling of the entry route                                            |
| `unavailable`      | `null`                                                                            |

The contract does not contain explicit success/aftermath route fields, so these sibling names are a
required convention. An unavailable entry must handle `null` by blocking entry or performing a
normal non-completion return. It must not invoke a `death` failure merely because the completed game
is unavailable.

### Progress methods

The controller exposes `loadProgress`, `saveProgress`, and `clearProgress`.

- For `local-only`, load returns `null` and save/clear are no-ops.
- For `async-storage`, the methods use `_shared/persistence` with the declared key and version.
- A load with a different schema version returns `null` rather than interpreting incompatible data.
- Completion automatically clears progress when `clearOnCompletion` is true.

Screens own the timing of mechanic-specific saves because the lifecycle config cannot know when
progress changes. They must use these controller methods rather than importing persistence helpers
directly.

## Navigation rule

Do not use `router.back()` or raw navigation to `/game` for the **RPG exit path**. Always use
`completeSubGame()` or `failSubGame()` so the declared lifecycle runs.

Internal sub-game navigation may use `router.push()`, `router.replace()`, or `router.back()` as
appropriate.

## Before considering a clone complete

- The config satisfies every field in `SubGameLifecycleConfig`.
- The declared completion event is the only success call site.
- Failure follows the declared safe/death branch.
- Completed entry follows the declared revisit policy.
- Rewards and waypoints survive repeated presses and remounts without duplication.
- Progress behavior matches `local-only` or `async-storage` explicitly.
- Normal exits always go through the lifecycle controller.
