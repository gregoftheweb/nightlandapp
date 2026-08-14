# Nightland Codebase Review: Performance, Reliability, and iOS Readiness

**Review date:** 2026-08-13  
**Scope:** Current React Native / Expo codebase, with emphasis on performance gains, race conditions and correctness risks, and likely issues when expanding testing from Android to iOS.  
**Method:** Static review of application code and configuration, plus TypeScript, ESLint, and Jest runs. The current source is treated as authoritative; older review documents are historical context only.

## Executive summary

The codebase has already made several good performance-oriented choices: game logic is separated from configuration, the reducer is split into slices, the game screen passes a narrowed state object to `GameBoard`, entity position maps replace repeated linear searches, and most animation timers have explicit cleanup.

The highest-value work is not broad micro-optimization. It is concentrated in four areas:

1. Make persistence serialize the **latest** state and prevent writes after deletion/reset.
2. Reduce the amount of React work performed by the game board on every movement update.
3. Make viewport and full-screen layout reactive and safe-area aware before iPhone/iPad testing.
4. Restore a clean type-check/lint/test baseline so regressions in these complicated paths are detectable.

The most serious current finding is the autosave lifecycle. A throttled callback captures an old state object, while death/reset deletion does not cancel or invalidate queued/in-flight saves. This can save stale progress or recreate a supposedly deleted current-game save.

## Priority map

| Priority | Area                                             | Potential impact                                                          | Confidence               |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------ |
| P0       | Autosave snapshot ordering and delete/write race | Stale saves; current save can reappear after death/reset                  | Confirmed from code flow |
| P0       | Safe-dial delayed save ordering                  | A milestone/opened state can be overwritten by an older delayed state     | Confirmed from code flow |
| P1       | GameBoard render architecture                    | Largest likely frame-time improvement during movement/combat              | High                     |
| P1       | Static viewport dimensions and iOS safe areas    | Incorrect hit testing, clipping, or controls under notches/home indicator | High                     |
| P1       | Waypoint index read-modify-write operations      | Duplicate/lost index entries under repeated completion calls              | High                     |
| P1       | Broken validation baseline                       | Real regressions can merge unnoticed; iOS build readiness is uncertain    | Confirmed by tooling     |
| P2       | Asset payload and eager root initialization      | Larger binaries, slower install/update/startup, wasted work               | High                     |
| P2       | Timer-driven sub-game state machines             | Navigation or state updates after transitions; difficult timing bugs      | Medium-high              |
| P2       | Audio lifecycle and app interruption handling    | Incorrect playback flags after interruptions/backgrounding                | Medium                   |

## Progress checklist

- [x] P1 — Render the board as a viewport, not a large React element tree
- [x] P1 — Stabilize fallback identities so existing memoization actually holds
- [ ] P2 — Avoid serializing and logging more than necessary on frequent state changes
- [ ] P2 — Reduce packaged assets and remove editor/source artifacts
- [ ] P2 — Remove unused root initialization
- [x] P0 — Autosave captures the first state in a throttle window, not the latest
- [x] P0 — Death/reset deletion races queued or in-flight autosaves
- [x] P0 — Safe-dial milestone saves can be overwritten by delayed older saves
- [x] P1 — Waypoint saves use an unprotected multi-step transaction
- [ ] P1 — Replace fixed-delay state/navigation synchronization
- [ ] P1 — Correct callbacks that read stale closures
- [ ] P2 — Give timer-driven battle and navigation code explicit lifecycle ownership
- [ ] P2 — Keep audio flags synchronized with native playback state
- [ ] P1 — Make viewport dimensions react to size and safe-area changes
- [ ] P1 — Apply safe areas consistently
- [ ] P1 — Protect game transitions from iOS back-swipe gestures
- [x] P1 — Restore type-checking and automated validation gates
- [ ] P2 — Explicitly gate Android-only native calls
- [ ] P2 — Validate assets, fonts, shadows, and haptics on real iOS hardware

## Highest-potential performance gains

### P1 — Render the board as a viewport, not a large React element tree

`components/GameBoard.tsx` builds one React `View` for every visible grid cell and independently maps every entity collection on board-relevant updates. The board has memoization and O(1) position maps, which are useful, but player movement changes the camera/player dependencies and necessarily rebuilds much of the visible tree.

The viewport dimensions are calculated as `screen / 32`. A typical phone creates hundreds of cell views; a supported iPad can create well over a thousand before entity, background, projectile, and overlay nodes are included. Per-cell style arrays and string keys are also allocated during the rebuild.

Recommended sequence:

1. Profile a release build on a slower Android device and an iPhone using React Native performance tooling. Measure JS/UI frame time while holding movement and during multi-monster combat.
2. First remove per-cell React views when grid borders/debug coloring are not visible. Render a single background/grid layer, or use a small repeated tile/canvas/native-backed layer.
3. Split static scenery, dynamic actors, effects, and dialogs into memoized child components. Give each child the narrowest primitive props possible.
4. Spatially index buildings and non-collision objects as well as monsters/items if level populations grow. Cull before mapping rather than mapping the complete level and returning `null`.
5. Consider Reanimated/shared values for camera movement and transient effects if profiling shows JS-thread frame drops. Do not migrate blindly; the node-count reduction should come first.

Relevant code: `components/GameBoard.tsx:21-32`, `components/GameBoard.tsx:131-172`, `components/GameBoard.tsx:437+`, and `app/game/index.tsx:117-167`.

### P1 — Stabilize fallback identities so existing memoization actually holds

In `GameBoard`, expressions such as `state.activeMonsters ?? []` and `state.level?.objects ?? []` create a new empty array on each render when data is absent. ESLint correctly reports that these can invalidate multiple `useMemo`/`useEffect` dependencies. A module-level frozen `EMPTY_ARRAY`, or defaults guaranteed by the state model, would preserve identity.

Also add the missing `state.player?.hideActive` dependency to the grid-cell memo. Its absence is primarily a correctness bug—the cell appearance can remain stale—but correcting the component boundaries will make dependency management less fragile.

Relevant code: `components/GameBoard.tsx:131-172` and the grid memo ending near line 482.

### P2 — Avoid serializing and logging more than necessary on frequent state changes

Every reducer update makes the `GameProvider` compute a JSON fingerprint. The selected object is currently small, so this is not the top hotspot, but `subGamesCompleted` and `waypointSavesCreated` can grow. More importantly, movement produces frequent development logs across the game, save, and component lifecycle paths. Debug logging can substantially distort development performance and obscure timing behavior.

Use a monotonic persistence revision/dirty counter changed by save-relevant reducer actions, or compare selected primitives without `JSON.stringify`. Gate all verbose logs consistently behind a dedicated debug flag, not only `__DEV__`.

Relevant code: `context/GameContext.tsx:72-83`, `modules/autoSave.ts:139-152`, and `modules/saveGame.ts:40-71`.

### P2 — Reduce packaged assets and remove editor/source artifacts

The assets directory is approximately **51 MB**. It contains many 2–3 MB PNG backgrounds and a roughly **4.5 MB** Krita autosave file (`silo-screen5.png-autosave.kra`). `app.json` uses `assetBundlePatterns: ["**/*"]`, so the release bundle should be inspected to ensure source/editor artifacts and unused images are not shipped.

Convert remaining large PNG runtime backgrounds to appropriately sized WebP/AVIF where Expo target support permits, remove editor files from bundle patterns, deduplicate superseded assets, and verify actual release IPA/APK contents before estimating the gain.

Relevant configuration: `app.json`.

### P2 — Remove unused root initialization

`app/_layout.tsx` creates and retains an initial game state that is never supplied to `GameProvider`; the provider creates another initial state. Remove the unused `gameState` and `serializeGameState` import. The one-time cost is smaller than board rendering, but it is unnecessary startup work and adds ambiguity about which state is authoritative.

Relevant code: `app/_layout.tsx:7` and `app/_layout.tsx:32-36`.

## Race conditions and tricky correctness sections

### P0 — Autosave captures the first state in a throttle window, not the latest

**Completed:** The autosave controller retains the latest requested state, atomically consumes it
when the throttle expires, and schedules another trailing save when newer state arrives during an
active write. Forced saves wait for an active write to preserve ordering. Fake-timer regression tests
cover rapid requests within one throttle window and requests made while storage is unresolved.

`requestAutoSave(state)` schedules a timeout whose closure retains that call's `state`. Later requests merely set `pendingSave = true` and return while the timeout exists. When the timeout fires, it passes the original state to `performAutoSave`.

Example: move 10 times within two seconds; the saved snapshot may represent the first move that scheduled the timer, not the tenth move expected from a trailing throttle.

Fix by storing `latestPendingState` (or, better, a snapshot/revision) at module/controller scope on every request. The timer should atomically consume the latest value. After a write finishes, it must check whether a newer revision arrived during the write and drain it. Unit-test this with fake timers and a controllable storage promise.

Relevant code: `modules/autoSave.ts:18-56`.

### P0 — Death/reset deletion races queued or in-flight autosaves

**Completed:** Current-save deletion is now one autosave-controller operation that cancels queued
state, waits for any non-cancellable AsyncStorage write already in progress, and deletes only after
that write settles. Death, restart/new-game, and waypoint-load flows all use this ordered boundary.
Regression tests verify both queued cancellation and write-before-delete ordering.

The game-over effect calls `deleteCurrentGame`, but it never calls `cancelAutoSave`; `cancelAutoSave` has no callers. A queued callback may hold a pre-death state for which `gameOver` is false. It can run after deletion and recreate the current save. Cancellation alone does not stop a write already awaiting `AsyncStorage.setItem`.

Use a persistence generation/session token:

- Increment the generation before death, reset, new game, or loading a waypoint.
- Cancel queued work.
- Serialize writes through one queue/mutex.
- Before committing or scheduling a follow-up, verify the generation is still current.
- Make “delete current save and invalidate pending saves” one persistence operation rather than independent calls in screens and context effects.

Relevant code: `context/GameContext.tsx:85-100`, `modules/autoSave.ts:65-132`, `app/index.tsx:63-76`, and `app/death/index.tsx:32-58`.

### P0 — Safe-dial milestone saves can be overwritten by delayed older saves

**Completed:** Successful tumbler locks now cancel the pending debounce and enter a serialized save
queue, so any older write finishes before the milestone is persisted. Reset also drains the queue
before clearing storage. Regression tests cover both a still-delayed snapshot and an older write
already in flight. The accompanying dial review corrected physical CW/CCW behavior, made animation
continuous across 39/0, clarified the on-screen instructions, and added direction/control tests.

The safe-dial hook debounces ordinary state saves for 250 ms, then performs an unawaited immediate save when a tumbler locks. A previously scheduled timer is not cleared in `attemptLock`. AsyncStorage writes have no revision check, so the older delayed write can finish after the milestone write and overwrite it. On the final step, `state.isOpened` prevents scheduling a new debounce but does not cancel an existing one, making this especially important.

Clear the debounce before an immediate save and serialize/revision-stamp writes. Consider exposing a single `saveLatest` controller rather than mixing timer and direct writes. Await or explicitly handle errors for milestone writes.

Relevant code: `app/sub-games/aerowreckage-puzzle/hooks/usePuzzleState.ts:25-57` and `:150-183`.

### P1 — Waypoint saves use an unprotected multi-step transaction

**Completed:** All waypoint index mutations now run through a module-level promise queue. Saving
re-checks same-name entries inside that boundary, writes the replacement record first, commits one
filtered index, and only then removes superseded records. Mutation reads fail closed rather than
treating an unreadable index as empty. Tests cover concurrent same-name saves, commit ordering, index
write failure recovery, and index read failure.

`saveWaypoint` reads the index, removes old records, writes a filtered index, writes the new record, reads the index again, then appends metadata. Two invocations for the same waypoint can interleave. Both callers can pass the UI-level “already created” test before either asynchronous save dispatches `SET_WAYPOINT_CREATED`, creating duplicates or losing an index update. A failure between item and index writes also leaves an orphan or missing record.

Serialize waypoint mutations with a module-level promise queue/mutex. Re-check by name inside that critical section. Prefer writing the new record before deleting the old one, then commit one new index; clean obsolete records after the index commit. Disable/guard completion handlers while saving.

Relevant code: `modules/saveGame.ts:178-242`, `app/sub-games/hermit-hollow/main.tsx:144-177`, and `app/sub-games/jaunt-cave/screen3.tsx:62-104`.

### P1 — A fixed 50 ms delay is used as state/navigation synchronization

The Continue flow dispatches hydration, sleeps for 50 ms, and navigates. React does not guarantee that an arbitrary timeout represents a committed provider update, and behavior can differ under device load. The waypoint flow does not use the same delay, which demonstrates that the contract is unclear.

Make hydration and navigation deterministic: navigate in an effect keyed to a load token/revision after the hydrated state is observed, or mount the game provider from an explicit loaded initial state. Guard buttons with an in-progress flag to prevent concurrent load/new-game operations.

Relevant code: `app/index.tsx:79-141`.

### P1 — Several callbacks intentionally or accidentally read stale closures

ESLint identifies missing hook dependencies in the safe puzzle, hermit completion flow, deep-silo animation, `CombatDialog`, and especially `useWeapon`. The `useWeapon` callback performs damage using equipped-weapon data and callbacks omitted from its dependency list. That can apply damage using an old weapon after equipment changes.

Treat hook dependency warnings in gameplay code as correctness failures. Prefer functional state updates or “latest value” refs only where a stable callback is genuinely required, and document that choice. Do not suppress dependencies merely to reduce renders.

### P2 — Timer-driven battle and navigation code needs explicit lifecycle ownership

`useBattleState` is comparatively careful: it uses refs, a single animation timer, death guards, and cleanup. It is still a deeply nested timer state machine with separate animation, block, player-death navigation, and daemon-death navigation timers. The risk is conflicting navigation/state updates when death, victory, back navigation, focus loss, or rapid input happen near the same boundary.

Recommended hardening:

- Model the sequence as an explicit reducer/state machine with one cancellable scheduled transition.
- Add a mounted/focused generation token checked by every timer callback.
- Stop the loop on screen blur/AppState background, not only unmount.
- Ensure player death and daemon death are mutually exclusive terminal states.
- Use fake-timer tests for unmount, backgrounding, simultaneous lethal hits, block boundaries, and double taps.

Relevant code: `app/sub-games/jaunt-cave/_components/useBattleState.ts` and `useWeapon.ts`.

### P2 — Audio flags can diverge from native playback state

`AudioManager` maintains its own `isBackgroundPlaying` boolean and does not subscribe to playback-status changes or `AppState`. iOS interruptions (Siri, calls, Control Center, route changes) can pause/stop native audio without updating the flag. Later `playBackgroundMusic` can return early because the JavaScript flag still says it is playing. Cleanup is async but its promise is discarded by the React effect cleanup.

Use playback status as the source of truth, handle app foreground/background and interruptions, and make load/unload operations generation-safe. The explicit `playsInSilentModeIOS: true` is a product choice: verify that playing ambient audio despite the iPhone silent switch is desired.

Relevant code: `modules/audioManager.ts` and `app/_layout.tsx:48-66`.

## iOS testing risks and readiness work

### P1 — Viewport constants do not react to size or safe-area changes

The main game, board, inventory, settings, splash, princess, and death screens read `Dimensions.get('window')` at module load. These values will not update reliably for rotation, iPad split view/multitasking, Stage Manager, or other window-size changes. `supportsTablet: true` increases the likelihood that this matters. Main-game tap conversion also uses these static values, so this is not just visual: taps can map to the wrong world cell after a resize.

Use `useWindowDimensions()` at the screen boundary and derive rows, columns, camera offset, and hit-test geometry from the same live layout measurement. Prefer `onLayout` dimensions for the actual board container so safe-area/container differences cannot skew coordinates.

Relevant code: `components/GameBoard.tsx:21-27`, `app/game/index.tsx:36` and `:199-210`, plus module-level dimensions in `components/Settings.tsx`, `components/Inventory.tsx`, `app/index.tsx`, `app/princess/index.tsx`, and `app/death/index.tsx`.

### P1 — Safe areas are inconsistently applied

The app installs `SafeAreaProvider`, and `PlayerHUD`/`BottomActionBar` use insets, but several absolute/fixed layouts do not. The status bar is hidden, but iOS still has physical cutouts, rounded corners, the Dynamic Island, and the home indicator. Fixed bottom values/padding can either waste space or place buttons in the gesture region. `CombatDialog` uses a fixed `top: 80`; death and sub-game success screens use fixed bottom padding.

Audit every interactive screen on at least a notched iPhone, a smaller iPhone, and iPad. Apply safe-area insets at the screen shell and let shared components consume them consistently. Test larger accessibility text sizes because several dialog/HUD regions use fixed widths and heights.

### P1 — iOS back-swipe gestures can bypass intended game transitions

Stack gestures are enabled globally. Many sub-games mix `push`, `replace`, and `back`, and some persist completion only on specific forward actions. An iOS edge swipe is easier to trigger than Android system-back behavior and can expose intermediate screens or bypass cleanup/state transitions.

Define navigation policy per flow. Disable gestures on battle, death, loading, timed animation, and one-way completion screens; or intercept removal and perform the same cleanup as explicit buttons. Test repeated swipes during timers and AsyncStorage writes.

Relevant configuration: `app/_layout.tsx:120-137` and the sub-game routes.

### P1 — The project does not currently type-check cleanly

The current TypeScript run reports errors including unsupported `foregroundFit` props in two live screens:

- `app/sub-games/aerowreckage-puzzle/success.tsx`
- `app/sub-games/tesseract/screen3.tsx`

It also reports a missing `@testing-library/react-hooks` dependency and stale test fixtures. These do not prove an iOS-only failure, but a clean production compile should be required before the first iOS build so native/platform failures are not mixed with existing errors.

### P2 — Android-only native calls should be explicitly gated

`expo-navigation-bar` setup is described as Android-only but is called on every platform and relies on exception handling elsewhere. Guard it with `Platform.OS === 'android'`. Keep Android-only `StatusBar` props and navigation-bar behavior isolated so iOS behavior is intentional and logs stay clean.

Relevant code: `app/_layout.tsx:82-104`.

### P2 — Validate assets, fonts, shadows, and haptics on real iOS hardware

These APIs are cross-platform but do not look or feel identical:

- Custom font metrics can change wrapping and vertical alignment.
- React Native shadows render differently from Android elevation.
- Haptic types vary by hardware/settings and promises are currently fire-and-forget.
- Large background images have different memory consequences from compressed file size; decode dimensions matter.
- Audio behavior must be checked with the silent switch, headphones/Bluetooth, interruptions, and background/foreground transitions.

The app uses the New Architecture. Test a release build, not only Expo Go/development mode, because native timing and performance differ materially.

## Validation baseline observed during this review

### TypeScript

`tsc --noEmit` failed. Notable live-code failures are the two invalid `foregroundFit` props. Test-only failures include the missing hook-test package and outdated `GameState` fixtures.

### ESLint

ESLint reported **90 findings: 1 error and 89 warnings**. The blocking error is the unresolved `@testing-library/react-hooks` import. Several warnings are material to runtime correctness, particularly missing hook dependencies and unstable memo dependencies; the remainder include unused code/imports.

### Jest

The suite did not complete. `components/__tests__/ThemedText-test.tsx` failed under React 19 with an update outside `act`, a `null` snapshot result, a post-teardown import, and then `window.dispatchEvent is not a function`. Because the process aborted, this run cannot establish how many gameplay tests currently pass.

The repository's `test` script uses watch mode. Add CI-friendly scripts such as `test:ci`, `typecheck`, and a strict lint command, and run them in CI on every change.

## Recommended implementation order

### Phase 1 — Protect player data and establish trustworthy checks

1. Replace autosave booleans with a latest-state/revision queue and persistence generation token.
2. Make death/reset/load invalidate queued and in-flight current-save operations.
3. Serialize safe-dial and waypoint persistence; add fake-timer/concurrency tests.
4. Fix live TypeScript errors, hook dependency correctness, and the Jest environment.

### Phase 2 — Make layout portable before iOS testing

1. Derive the board from live container dimensions.
2. Apply consistent safe-area shells to all screens and bottom controls.
3. Define per-route iOS gesture policy.
4. Gate Android native calls and test audio/haptics/interruption behavior.

### Phase 3 — Measure and optimize rendering/package size

1. Capture release-build frame profiles and React render counts.
2. Remove per-cell board views or move the grid to a single rendered layer.
3. Split/cull board layers based on measured cost.
4. Audit release assets and remove/convert oversized or non-runtime files.

## Suggested iOS test matrix

- Small iPhone and current notched/Dynamic Island iPhone.
- iPad because `supportsTablet` is enabled; include split view or Stage Manager resizing.
- Fresh install, upgrade over an existing save, corrupted save, and low-storage write failure.
- Rapid movement followed immediately by backgrounding, force-close, death, new game, and waypoint load.
- Edge-swipe back during every timed sub-game transition and during save completion.
- Silent switch on/off, incoming audio interruption, Bluetooth route change, and app background/foreground.
- Default and large accessibility text, reduced motion, and haptics disabled.
- Release build with the New Architecture enabled.

## Bottom line

Fix persistence ordering before optimizing visuals: it is the only area currently capable of silently restoring stale/deleted progress. Then make the board responsive to live container size and safe areas; this unlocks reliable iOS/iPad testing and also creates the clean boundary needed for the largest rendering optimization. Finally, profile the release board and reduce grid node count based on measurements.
