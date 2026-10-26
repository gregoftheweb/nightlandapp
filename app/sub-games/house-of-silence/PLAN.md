# House of Silence — interior MVP plan

Status: the corridor MVP is implemented. See [README.md](./README.md) for the actual file layout, renderer choice, controls, validation, and future encounter-transition scope. The sections below preserve the original implementation plan; the tentative GPU backend was replaced with a shared canvas renderer hosted by WebView/iframe.

<img src="assets/sprite-christos.png" alt="sprite-christos.png" width="235">

## Goal and scope

Build a small first-person dungeon using our own Wolfenstein-style grid raycaster. The first playable test is a fixed corridor with a corner, a junction, a working door, and a small room. Smooth walking and turning, collision, and consistent graphite artwork must work together before procedural generation or encounters are added.

Add a temporary START-screen button labeled **Test House of Silence**. It opens the interior directly after loading, without the princess introduction or a board journey. Later, the House of Silence sprite on the gameboard will launch the same interior through the normal sub-game entry path.

<img src="assets/sprite-jaunt-daemon.png" alt="sprite-jaunt-daemon.png" width="82">

The explorable roguelike interior supersedes the older handoff's scripted-only traversal assumption. Preserve its narrative foundations: Grace enables survival, Hide conceals, charged Discos can harm Silent Ones, and the sanctum resolves the Persius/Tesseract thread. Their mechanics are later work, not requirements of this corridor test.

## Repository review

Reviewed the template README and all five template modules; `_shared` README, exports, persistence, lifecycle controller, and timed-encounter orchestration; Jaunt Cave route wrappers and its battle screen/state hook; the START screen, navigation helper, registry types, root provider placement, and image-preloading path.

| Existing source                                                             | Application here                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_subgame-template/README.md` and screens                                   | Follow its entry/lifecycle pattern, but replace the example intro/puzzle/success presentation with an interior. Do not copy placeholder assets or demo completion.                 |
| `_shared/lifecycle.ts`                                                      | Use `useSubGameLifecycle` for eventual expedition completion, failure, progress, rewards, and return. It also supports an instance resolver for a local definition.                |
| `_shared/persistence.ts`<br><br>                                            | Persistence implementation underneath lifecycle methods; do not bypass the controller when adding saved interior progress.                                                         |
| `_shared/BackgroundImage.tsx`, `BottomActionBar.tsx`, `ReadableTextBox.tsx` | Useful for loading, error, and later narrative screens. A static background image is not the dungeon renderer.                                                                     |
| `jaunt-cave/[instanceId]/*.tsx`                                             | Thin routes delegate to `_shared/timed-encounter/routeScreen.tsx`; the route wrappers no longer contain the battle implementation.                                                 |
| `_shared/timed-encounter/BattleScreen.tsx`                                  | Example of a screen composing specialized state, layout, input, and presentation modules.                                                                                          |
| `jaunt-cave/_components/useBattleState.ts`                                  | Reference for state transitions, terminal guards, focus handling, app-background handling, and timer cleanup; do not copy its daemon combat into the corridor.                     |
| `app/index.tsx`                                                             | START screen; existing transitions include save deletion/reset for new expeditions. The test launcher must not call those handlers.                                                |
| `modules/subGames.ts`                                                       | `enterSubGame` resolves registry assets, preloads, and replaces the route. `exitSubGame` always replaces with `/game`.<br>![sprite-night-hound.png](assets/sprite-night-hound.png) |
| `modules/subGameImageAssets.ts`                                             | One-off definitions can supply `preloadAssets`; no new reusable content manifest is needed.                                                                                        |
| `app/_layout.tsx`                                                           | A shared `GameProvider` wraps START and sub-games. Test entry is not automatically isolated merely because it bypasses the board.                                                  |

The current lifecycle/template documentation takes precedence over older README examples that call persistence directly. Actual navigation lives in `modules/subGames.ts`, despite some old references to `lib/subGames.ts`.

## Identity and lifecycle

The production identity will be `house-of-silence`, shape `one-off`. It is unique authored content with custom mechanics; there is no second instance to justify extracting a shared shape or copying Jaunt Cave's manifest schema.

Separate the temporary preview session from expedition lifecycle effects:

- START enters `/sub-games/house-of-silence?mode=test` and resolves to `interior` with that mode preserved. Missing/unknown modes must not silently authorize a story-gate bypass.
- Preview owns only local camera, door, and input state. Every entry starts fresh. Reset restores the same fixture; it does not reset the expedition.
- Preview has no completion, reward, waypoint, death dispatch, or AsyncStorage writes. Reaching the test room is not completing the real House.
  ![sprite-night-hound-2.png](assets/sprite-night-hound-2.png)
- Preview's **Exit Test** returns to START (`/`). Android back and navigation removal must clean up input/rendering consistently.
- Explicit preview navigation to START is a test-harness boundary, not a normal RPG return. It must not call `failSubGame`, because that currently routes to `/game`.
- Normal expedition entry will use the registered instance and lifecycle controller. All normal RPG returns must signal resume and use the lifecycle exit flow.
-
- Do not create a nested `GameProvider` as an isolation shortcut: audit its autosave behavior first. The preview should not dispatch to the existing global provider at all.

For the scaffold's registered corridor-only instance, declare the following policy explicitly before exposing normal entry:

| Field               | MVP declaration                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry route         | `/sub-games/house-of-silence/interior`                                                                                                          |
| Completion          | Reserved event: explicit confirmation of the eventual final story resolution; idempotent. No corridor-test call site invokes `completeSubGame`. |
| Failure/abandonment | `{ exit: 'safe' }`; no damaging encounters exist in this MVP.                                                                                   |
| Waypoint            | `{ createsWaypoint: false }`                                                                                                                    |
| Revisit             | `restart`; resets the corridor fixture on entry.                                                                                                |
| Progress            | `{ mode: 'local-only' }`                                                                                                                        |
| Reward              | `{ kind: 'none' }`                                                                                                                              |
| RPG return          | `{ signalRpgResume: true, exitSubGame: true }`                                                                                                  |

These are prototype policies, not final endgame decisions. Before real encounters ship, define the death policy, Grace gate, completion event, revisit/ending presentation, and persistence semantics together. The current controller couples completion to RPG return; an ending that stays inside the House will need an explicit supported lifecycle change rather than an accidental return to the board.

## Proposed scaffold

Keep the custom engine private to this sub-game. Only promote code to `_shared` after actual reuse exists. Paths below are proposed, not files already implemented.

```text
app/sub-games/house-of-silence/
  PLAN.md
  index.tsx                 entry mode and lifecycle routing
  interior.tsx              thin interior route
  _components/
    HouseInterior.tsx       loading, renderer, controls, exit/reset
    DungeonViewport.tsx     renderer host and viewport sizing
    DungeonControls.tsx     touch controls and interaction action
  _engine/
    types.ts                grid, camera, door, ray-hit types
    testDungeon.ts          fixed map, spawn, materials, door
    raycast.ts              pure DDA traversal and projection
    movement.ts             collision and camera integration
    doors.ts                interaction, opening, collision rules
    useDungeonSession.ts    input, loop, focus and cleanup
    renderer.*              selected graphics backend
  _config/
    assetCatalog.ts         static WebP requires and material IDs
    tuning.ts               movement, FOV, quality and door timings
    lifecycleConfig.ts      stable instance ID
  __tests__/
    raycast.test.ts
    movement.test.ts
    doors.test.ts
    entryExit.test.tsx
```

Use underscored implementation folders following existing sub-game conventions, and verify the resulting Expo route list. Avoid putting engine implementation into route components.

![sprite-silent-one-9.png](assets/sprite-silent-one-9.png)

## Rendering approach

Use a 2D grid with equal-height walls and perpendicular intersections. DDA traversal finds the first solid surface for each ray. Perpendicular depth determines projected height without fisheye distortion; hit coordinates select wall-texture columns. Floors and ceilings need perspective-correct sampling. Door depth must participate in ray visibility and collision consistently.

Keep raycasting, projection, movement, and doors independent of React and graphics APIs. Camera state updates through refs or a session object; do not dispatch global game actions or rerender a React view for every column on every frame.

T

he graphics backend is the first implementation spike. `expo-gl` is a candidate for a native/web GPU host, but is not currently declared in this app's dependencies. Confirm compatibility with this checkout's Expo SDK and validate texture upload before committing to it. A WebP decoded by React Native's image preloader is not proof it is ready as a GPU texture. Keep asset decode/upload errors visible and recoverable.

Use a browser canvas harness if useful for algorithm verification, but the MVP must also run on native mobile; a browser-only canvas is not the finished app renderer. Avoid a full game engine, general Doom sector renderer, or a large number of per-column React Native image views.

Rendering acceptance:

<img src="assets/sprite-silent-one-10.png" alt="sprite-silent-one-10.png" width="94">

- Stable perspective during walking and turning; no fisheye warp or gaps between columns.
- Consistent material scale on walls and floor; no stretching the whole corridor concept over a wall.
- Adjustable render resolution independent of physical screen pixels, with a provisional 30 FPS mobile target. Measure on an actual device before claiming that target is met.
- Safe-area-aware touch controls, viewport/aspect updates, and predictable portrait/landscape behavior.
- Pause on route blur or inactive app; clear held inputs on release/cancel/blur. Reset the time baseline on resume and clamp frame deltas to prevent teleporting after backgrounding.
- Dispose animation frames, listeners, textures, and graphics resources on exit/unmount; handle graphics-context loss.

## Assets and appearance

Runtime assets are already present at:

```text
assets/images/sub-games/HouseOfSilence/insidePOV/
  wall-pencil-01.webp
  floor-pencil-01.webp
  ceiling-pencil-01.webp
  door-pencil-01.webp
```

All four are 1024 × 1024. Use static `require` calls through `@assets` in the local catalog so Metro can resolve them. Register the same material set for preloading where normal entry uses the registry. Test entry must preload those assets too, and wait separately for renderer texture readiness.

The concept drawing remains a visual reference in `Docs/assets/HouseOfSilence/insidePOV/`; it is not among the four copied runtime assets. Do not reference the Docs folder from app code.

Preserve pale paper highlights, irregular graphite contours, crosshatching, rubbed shading, and dark openings. The initial material set has no baked corridor perspective. The renderer supplies depth and restrained distance shading. Door jambs use wall material/geometry; an open door reveals real space.

The generated surfaces were requested as seamless, but exact edge continuity has not been validated. Inspect a repeated surface and the rendered corner before accepting them. If seams show, fix assets through the image workflow rather than concealing seams with darkness. Animation of pencil marks and a screen-space paper layer can follow after the static rendering reads correctly; neither needs another image for the first test.

## Controls and map fixture

Provide hold-to-walk forward/backward, hold-to-turn left/right, an **Open/Close** interaction, **Reset Test**, and **Exit Test**. Desktop keyboard support helps browser testing; release keys on blur. No combat controls yet.

Use a small bounded authored map with a spawn facing a clear corridor, one 90-degree bend, a junction/dead end, a door, and a room beyond. The door starts closed. Interact only within a short reach and facing the door. Prevent closing onto Christos, walking through a closed door, clipping corners, or moving outside the map. Substep motion or sweep collision so long frames cannot tunnel through walls. Use a player radius rather than a point camera.

No procedural generation in the first fixture. Later, generation produces the same grid/door data and must prove spawn-to-goal connectivity.

## Implementation order

1. Add the local types, tuning, asset catalog, and fixed-map fixture. Register the one-off lifecycle declaration without adding a gameboard entrance.
2. Add START's **Test House of Silence** button and route shell. Respect existing loading/transition disabling, prevent repeated launch, preload the four images, and preserve test mode. Do not invoke new-game reset or save-deletion functions.
3. Prove the graphics backend on web and native with one textured wall; then add the full corridor, floor, and ceiling. Show an actionable loading/error state if rendering cannot initialize.
4. Add the pure raycaster, camera integration, radius collision, touch/keyboard controls, and working door. Wire reset and START return.
5. Validate repeated surfaces, shading, perspective, screen sizes, app suspend/resume, repeated entry/exit, and device performance.
6. Only after the corridor is accepted, add seeded dungeon generation, heartbeat/Grace, Silent Ones, Hide/combat integration, and the sanctum in separate steps.
7. Connect normal entry to the House sprite and progression gates later. Keep the same interior component; remove or explicitly retain the temporary launcher as directed.

## Verification and definition of done

Pure tests should cover ray distance/texture coordinates for cardinal and angled rays, corners and map bounds; radius collision and long-frame movement; and door visibility/collision transitions. Route tests should verify the test launcher reaches the interior, reset stays local, and exit returns to START without completion, rewards, save writes, or game reset. Normal lifecycle tests must cover safe abandonment and registered policies when normal entry is enabled.

Run changed-file formatting, lint, TypeScript, and meaningful targeted tests during implementation. Finish runtime changes with the repository's `pnpm check` and a web export; add native-device interaction and performance review. Documentation alone does not require runtime tests.

The MVP is done when START opens a textured, navigable corridor with the four supplied WebPs, the door reveals a real room, reset/exit work repeatedly, and testing preserves existing expedition state and saves. No story victory is recorded by walking around the test map.
