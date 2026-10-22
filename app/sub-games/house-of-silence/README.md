# House of Silence — corridor MVP

On START, choose **Test House of Silence**. This opens a fresh local test session directly in the interior. **Exit test** returns to START. No expedition reset, save deletion, completion, reward, waypoint, or player-state dispatch occurs during testing.

## First test

- Hold the up/down buttons to walk and the curved arrows to turn. Forward and turning can be held together.
- On desktop, click inside the viewport to focus it, then use WASD or arrow keys. E/Space interacts with a nearby door; R resets the fixture.
- Walk north from the initial position into the junction. The wooden door is down the passage to the east. The room beyond is actual walkable space.
- **Open door** becomes available within reach while facing the door; it changes to **Close door** after opening. A door cannot close onto Christos.
- **Reset test** restores the camera and closes the door. It does not touch expedition state.
- A single tall Silent One stands motionless in the room beyond the wooden door. It is a transparent pencil sprite, scaled with perspective and occluded by walls and the closed door. It has no interaction, collision, AI, or combat behavior.
- The room beyond the door has a two-unit ceiling; the corridor and wooden doorway remain one unit high. Camera eye height, floor level, and the Silent One's size stay the same.

## Implementation

This is a registered `one-off`, instance ID `house-of-silence`, with local-only progress, safe abandonment, no rewards, no waypoint, and restart revisits. The corridor prototype never calls completion. Expedition return uses `_shared/useSubGameLifecycle`; the separate preview exit returns to START.

Expo Router uses `routes/` in this app. The two House route wrappers there export the implementations in this directory; engine/config/component files are not routes.

The renderer is our own DDA grid raycaster with perspective floor/ceiling sampling. A canvas runs in the existing React Native WebView on iOS/Android and in a sandboxed iframe on web. This replaces the planning document's tentative `expo-gl` backend with a small shared software renderer for the MVP. No third-party game engine is used.

`ceilingRegions` supplies the encounter chamber's height. Rays continue through height transitions and return ordered spans: each span projects its own ceiling plane, while nearer ceilings clip the view beyond. Looking from the tall room into the corridor renders a wall lintel above the opening. A closed door stays one unit tall with masonry above it. Taller walls repeat the pencil material at its original world scale instead of stretching it. This pass adds a flat double-height ceiling; vault ribs, curved ceiling geometry, columns, and an altar are subsequent work.

Four surface WebPs plus `silent-one-standing-pencil-01.webp` are statically referenced from `assets/images/sub-games/HouseOfSilence/insidePOV/`. Native uses `expo-asset` and the SDK-compatible `expo-file-system` to embed downloaded/bundled assets as data URIs. Web fetches the Metro asset URLs and embeds them too. The canvas document needs no network/file permissions or storage access. Surface textures are sampled at 256 × 256; the transparent portrait sprite is sampled at 512 pixels tall with its aspect ratio preserved. Source files are unchanged.

The Silent One's original PNG, optimized WebP, and generation prompt are retained in `Nightland/Docs/assets/HouseOfSilence/insidePOV/`. Only its 703 × 1024 WebP (approximately 122 KB) is referenced by the app. Per-column wall depth clips the figure, and alpha blending preserves the pencil cutout edges without a rectangular background.

The pure engine owns camera and door state; the rendering document owns its animation loop, keyboard/pointer input, and texture buffers. Frame deltas are clamped, radius collision is substepped, and blur/suspend clears inputs. Route focus and app state pause the host. Unmount destroys the document and its resources. Test reset is entirely inside that document.

The embedded engine and browser runtime are generated as static strings so native Hermes release builds never depend on `Function.toString()`. After editing `_engine/dungeon.ts` or `_engine/browserRuntime.ts`, run `node scripts/build-house-runtime.cjs`. A test checks that the generated source stays synchronized.

## Future encounter transitions

The intended expansion includes side corridors, encounter rooms and battles, plus occasional psychedelic passages of white and gray streaks. The psychedelic puzzle mechanic remains undecided.

Before adding those screens, introduce explicit session modes such as `crawl`, `battle`, and `psychedelic`, with camera/door state retained by the session owner. Entering an encounter pauses crawl input/rendering; returning restores the same camera and dungeon state rather than resetting the floor. Define success, retreat, and death return events for each encounter. Do not invoke sub-game completion merely to leave an internal encounter screen.

That future session owner must bridge the renderer's local state into an explicit snapshot/restore API; the current fixture does not pretend to implement encounter transitions. Keep internal transitions separate from lifecycle completion and RPG exit. Seeded layout generation, Grace/heartbeat survival, Silent Ones, and final story resolution are also future work.

## Verification

The room-height update passed 20 House tests, TypeScript, changed-file lint/formatting, and production exports for iOS, Android, and web. The production web walkthrough at 430 × 900 verified entering the tall room, looking north at its higher ceiling, looking back through the normal-height doorway, and the existing walk/reset/pause/exit flow. There were no browser runtime exceptions or localStorage changes. Preview screenshots are saved in `Nightland/Docs/assets/HouseOfSilence/insidePOV/` with the `double-height-room-` prefix. Native-device visual review remains outstanding.

Tests cover cardinal and angled rays, bounded traversal, texture coordinates, collision radius, long frames, doors, map connectivity, serialized engine execution, local reset, and preview versus expedition exit behavior. A real-browser check exercises the production web build. Native bundling is checked separately; a native-device playthrough and performance measurement are still required before calling mobile rendering validated.

Completed checks for this pass:

- Repository-wide formatting, lint (existing warnings), TypeScript, and the full Jest suite: 84 suites / 659 tests passed before the final embedded-runtime hardening.
- Final targeted House, registry, and navigation checks after that hardening: 4 suites / 32 tests passed, plus formatting, changed-file lint, and TypeScript.
- Production exports completed for iOS, Android, and web.
- Headless Chromium exercised the final production web build at 430 × 900: START entry, all texture decodes, walking/reset, door opening and room entry, pause/resume input clearing, and START return. No runtime exceptions; browser localStorage was unchanged by the test.
- Preview screenshots are saved alongside the concept art in `Nightland/Docs/assets/HouseOfSilence/insidePOV/` as `mvp-corridor-preview.png`, `mvp-open-door-preview.png`, and `mvp-room-preview.png`.

See [PLAN.md](./PLAN.md) for the original scope and lifecycle design.
