# House of Silence — corridor MVP

On START, choose **Test House of Silence**. This opens a fresh local test session directly in the interior. **Exit test** returns to START. No expedition reset, save deletion, completion, reward, waypoint, or player-state dispatch occurs during testing.

## First test

- Hold the up/down buttons to walk, the straight sideways arrows to strafe, and the curved arrows to turn. Movement and turning can be held together.
- On desktop, click inside the viewport to focus it, then use WASD or arrow keys. Z/C strafe left/right without turning; combined forward/sideways movement keeps the same maximum speed. E/Space interacts with a nearby door; R resets the fixture.
- Walk north from the initial position into the junction. The wooden door is down the passage to the east. The room beyond is actual walkable space.
- **Open door** becomes available within reach while facing the door; it changes to **Close door** after opening. A door closes automatically after a full crossing once Christos's body clears it. Peeking and retreating leaves it open. It can be reopened from either side and cannot close onto Christos.
- **Reset test** restores the camera and closes the door. It does not touch expedition state.
- A single tall Silent One stands motionless in the room beyond the wooden door. It is a transparent pencil sprite, scaled with perspective and occluded by walls and the closed door. Its circular body blocks walking, so Christos must go around it. It has no AI, attack, or combat interaction yet.
- The room beyond the door has a two-unit ceiling; the corridor and wooden doorway remain one unit high. Camera eye height, floor level, and the Silent One's size stay the same.
- Four round stone columns stand in two pairs inside the chamber. They reach the ceiling and block both movement and the view of the Silent One. There is a clear entrance and space to walk around every column.
- A low stone altar stands between the northern columns, with clearance on every side. It blocks walking, has a visible slab top, and hides only the lower portions of figures behind it. It has no interaction or reward.
- Door opening plays a wooden hinge creak; manual or automatic closing plays a shorter creak and latch/thud. **Sound on/off** mutes these effects. Reset, pause, blur, and exit stop active sounds. Background ambience is intentionally left for a later asset selection.

## Implementation

This is a registered `one-off`, instance ID `house-of-silence`, with local-only progress, safe abandonment, no rewards, no waypoint, and restart revisits. The corridor prototype never calls completion. Expedition return uses `_shared/useSubGameLifecycle`; the separate preview exit returns to START.

Expo Router uses `routes/` in this app. The two House route wrappers there export the implementations in this directory; engine/config/component files are not routes.

The renderer is our own DDA grid raycaster with perspective floor/ceiling sampling. A canvas runs in the existing React Native WebView on iOS/Android and in a sandboxed iframe on web. This replaces the planning document's tentative `expo-gl` backend with a small shared software renderer for the MVP. No third-party game engine is used.

`ceilingRegions` supplies the encounter chamber's height. Rays continue through height transitions and return ordered spans: each span projects its own ceiling plane, while nearer ceilings clip the view beyond. Looking from the tall room into the corridor renders a wall lintel above the opening. A closed door stays one unit tall with masonry above it. Taller walls repeat the pencil material at its original world scale instead of stretching it. The current ceiling is flat; vault ribs and curved ceiling geometry are subsequent work.

`columns` supplies four world-space circular footprints (radius 0.32). Ray/cylinder intersection joins the existing ordered height spans, so columns occlude sprites and are themselves occluded by nearer walls or doors. Movement adds the player's radius to each column's radius; the floor tiles around a column remain walkable. The existing stone texture wraps around the cylinders with directional pencil shading, vertical grooves, and capital/base bands. No new bitmap assets are required. Columns follow the surrounding ceiling height.

`blocks` supplies low solid furniture. The altar's footprint is 1.4 × 0.6 world units, at height 0.36 below the camera's eye height of 0.5. Separate box-ray intervals project its vertical faces and horizontal top without terminating the wall/ceiling ray. A reusable per-pixel depth buffer preserves partial sprite occlusion and nearer walls/columns. Circle-versus-box player clearance keeps the altar solid while allowing rounded movement around its corners. All materials reuse the existing pencil stone texture.

Four surface WebPs plus `silent-one-standing-pencil-01.webp` are statically referenced from `assets/images/sub-games/HouseOfSilence/insidePOV/`. Native uses `expo-asset` and the SDK-compatible `expo-file-system` to embed downloaded/bundled assets as data URIs. Web fetches the Metro asset URLs and embeds them too. The canvas document needs no network/file permissions or storage access. Surface textures are sampled at 256 × 256; the transparent portrait sprite is sampled at 512 pixels tall with its aspect ratio preserved. Source files are unchanged.

The Silent One's original PNG, optimized WebP, and generation prompt are retained in `Nightland/Docs/assets/HouseOfSilence/insidePOV/`. Only its 703 × 1024 WebP (approximately 122 KB) is referenced by the app. Per-column wall depth clips the figure, and alpha blending preserves the pencil cutout edges without a rectangular background.

The pure engine owns camera and door state; the rendering document owns its animation loop, keyboard/pointer input, and texture buffers. Frame deltas are clamped, radius collision is substepped, and blur/suspend clears inputs. Route focus and app state pause the host. Unmount destroys the document and its resources. Test reset is entirely inside that document.

The embedded engine and browser runtime are generated as static strings so native Hermes release builds never depend on `Function.toString()`. After editing `_engine/dungeon.ts` or `_engine/browserRuntime.ts`, run `node scripts/build-house-runtime.cjs`. A test checks that the generated source stays synchronized.

`doorAudio.ts` is also embedded by that generator. It lazily creates a Web Audio context from a user gesture and generates two short cached PCM effects locally, with no network request or additional audio library. The samples are first-pass procedural effects, designed to be replaceable with recorded door assets later. Engine door-transition events drive playback once per actual state change, including automatic closing; failed interactions and reset emit no door sounds. Unsupported audio contexts degrade to silent operation. This follows the [Web Audio user-gesture guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy). Native-device listening still needs a phone check.

## Future encounter transitions

The intended expansion includes side corridors, encounter rooms and battles, plus occasional psychedelic passages of white and gray streaks. The psychedelic puzzle mechanic remains undecided.

Before adding those screens, introduce explicit session modes such as `crawl`, `battle`, and `psychedelic`, with camera/door state retained by the session owner. Entering an encounter pauses crawl input/rendering; returning restores the same camera and dungeon state rather than resetting the floor. Define success, retreat, and death return events for each encounter. Do not invoke sub-game completion merely to leave an internal encounter screen.

That future session owner must bridge the renderer's local state into an explicit snapshot/restore API; the current fixture does not pretend to implement encounter transitions. Keep internal transitions separate from lifecycle completion and RPG exit. Seeded layout generation, Grace/heartbeat survival, Silent Ones, and final story resolution are also future work.

## Verification

The altar update passed 30 House tests, TypeScript, changed-file lint/formatting, generated-runtime verification, and iOS/Android/web exports. Geometry tests cover cardinal and non-unit box rays, collision clearance, and connected paths to all four sides of the altar. Rendered-pixel tests verify that a figure's feet are hidden behind the slab while its upper body remains visible, a nearer figure renders in front, and nearer walls hide both. The production browser walkthrough verified room entry, approaching the altar through the central aisle, reset, pause/resume, exit, and unchanged localStorage. Previews are saved as `Nightland/Docs/assets/HouseOfSilence/insidePOV/altar-room-preview.png` and `altar-closeup-preview.png`. Native-device visual review remains outstanding.

The columns update passed 25 House tests, TypeScript, changed-file lint/formatting, and iOS/Android/web exports. Tests cover ray/cylinder depth with non-unit rays, circular movement clearance, nearer-wall occlusion, blocked door reach, sprite occlusion, high-ceiling spans, and connected routes around all four columns. The production browser walkthrough passed entry, room traversal, reset, pause/resume, and exit with no runtime errors or localStorage changes. A preview is saved as `Nightland/Docs/assets/HouseOfSilence/insidePOV/columns-room-preview.png`.

The room-height update passed 20 House tests, TypeScript, changed-file lint/formatting, and production exports for iOS, Android, and web. The production web walkthrough at 430 × 900 verified entering the tall room, looking north at its higher ceiling, looking back through the normal-height doorway, and the existing walk/reset/pause/exit flow. There were no browser runtime exceptions or localStorage changes. Preview screenshots are saved in `Nightland/Docs/assets/HouseOfSilence/insidePOV/` with the `double-height-room-` prefix. Native-device visual review remains outstanding.

Tests cover cardinal and angled rays, bounded traversal, texture coordinates, collision radius, long frames, doors, map connectivity, serialized engine execution, local reset, and preview versus expedition exit behavior. A real-browser check exercises the production web build. Native bundling is checked separately; a native-device playthrough and performance measurement are still required before calling mobile rendering validated.

Completed checks for this pass:

- Repository-wide formatting, lint (existing warnings), TypeScript, and the full Jest suite: 84 suites / 659 tests passed before the final embedded-runtime hardening.
- Final targeted House, registry, and navigation checks after that hardening: 4 suites / 32 tests passed, plus formatting, changed-file lint, and TypeScript.
- Production exports completed for iOS, Android, and web.
- Headless Chromium exercised the final production web build at 430 × 900: START entry, all texture decodes, walking/reset, door opening and room entry, pause/resume input clearing, and START return. No runtime exceptions; browser localStorage was unchanged by the test.
- Preview screenshots are saved alongside the concept art in `Nightland/Docs/assets/HouseOfSilence/insidePOV/` as `mvp-corridor-preview.png`, `mvp-open-door-preview.png`, and `mvp-room-preview.png`.

See [PLAN.md](./PLAN.md) for the original scope and lifecycle design.
