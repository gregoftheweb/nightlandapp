# Refinement Pass — Review Notes

**Scope of this pass:** polish and cohesion on the existing systems, per the brief. No new
systems, no mini-game rebuilds. Everything below is either a real bug fix, a content rewrite
of an already-flagged TODO, or a small, contained feel improvement reusing an existing pattern
elsewhere in the codebase.

The codebase was already in excellent shape going in — deep design docs (`docs/GAMEPLAY_STORY_DESIGN.md`,
`docs/COMBAT_SYSTEM_REFERENCE.md`, `docs/SUBGAME_ARCHITECTURE_ANALYSIS.md`,
`docs/GAMEBOARD_SYSTEM_CHECKLIST.md`) already tracked most of the real gaps. This pass mostly
closed out items those docs had already identified and left open, rather than discovering new
problems from scratch.

## Changes made

### 1. Bug fix — Hide ability didn't actually protect against a direct collision
`modules/combat.ts: checkForCombatCollision` only checked `player.isHidden` (the environmental/safe-zone
flag), not `player.hideActive` (the ability the player earns from the Hermit and spends charges on).
Monster *movement* already treats the two flags as equivalent evasion states (`modules/movement.ts`
checks both everywhere), so a monster would flee from a hidden-via-ability player — but if terrain or
timing still put a monster on the player's tile, combat would trigger anyway, silently defeating the
ability players had just earned. Fixed to check both flags, matching movement's existing behavior.
This was a documented known inconsistency (`COMBAT_SYSTEM_REFERENCE.md` §7, `GAMEBOARD_SYSTEM_CHECKLIST.md`).

### 2. Bug fix — timed Cloaking never expired
`DECREMENT_CLOAKING_TURNS` was fully implemented in `state/slices/hideSlice.ts` but never dispatched
anywhere in the turn loop (also a documented known issue). Practically, this meant the `cloaking` effect
(timed invisibility, distinct from the Hermit's charge-based Hide) never actually timed out once granted —
it was either permanent or simply never used for its designed "limited window" tension. Added the dispatch
to `turnManager.ts`'s per-turn cleanup, guarded so it only runs while `hideTurns > 0` (so it can't interfere
with the separate, charge-based `hideActive` ability or with indefinite environmental hiding, which never
sets `hideTurns`).

### 3. Content — Salamander's Letter now pays off Hermit Hollow's foreshadowing
`docs/GAMEPLAY_STORY_DESIGN.md` explicitly flagged this as unwritten: the letter needed to reveal that the
Salamander invented Discos, and that the Current-Looms are how it can be strengthened. Rewrote
`SALAMANDER_LETTER_TEXT` in `config/objects.ts` to add both reveals, in the Salamander's voice, consistent
with the existing text and with the mechanical reality already built (`weaponUpgrades`, 5 Current-Loom
instances, Deep Silo's planned Discos upgrade). This directly strengthens main-loop/sub-game cohesion: the
Tesseract and Salamander puzzles, Hermit Hollow's dialogue, and the Current-Loom encounters now form one
legible thread instead of four disconnected curiosities.

### 4. Content — removed an explicit "ability unlocked" announcement that breaks the intended reveal
The design doc was explicit: learning to read runes should be discovered organically (revisiting an old
note and simply noticing it's now readable), never announced as "you can now read runes!" The rune cipher
effect handler (`modules/effects.ts`) was doing exactly the announcement the doc said not to do. Replaced it
with an in-fiction line about the obelisk itself falling silent — atmosphere without breaking the diegetic
reveal.

### 5. Feel — player getting hit now actually registers
Overworld combat had rich text feedback (combat log, varied hit/miss/kill messages) but zero *physical*
feedback when the player took damage — no haptic, no visual. Jaunt Cave already has local hit-feedback
patterns (`HitIndicator`, `BlockShield`); the main loop had nothing equivalent. Added a short haptic buzz
(`expo-haptics`, already a dependency, previously unused anywhere in the app) and a brief red vignette flash
on `GameBoard` whenever `player.currentHP` decreases. This is intentionally small and self-contained — a
single `useEffect` + one `Animated.View` overlay, no changes to combat math, no new state, nothing other
subsystems need to know about.

## Verified
- `npx tsc --noEmit` — clean.
- `npx eslint` on every touched file — 0 errors (only pre-existing unrelated warnings).
- `pnpm run test` — 510 passed / 134 failed across 82 suites. **All 33 failing suites fail with the same
  pre-existing, unrelated error** (`TypeError: actImplementation is not a function`, a
  `@testing-library/react-native` environment/version issue affecting every component-render test in the
  repo, confirmed before touching anything here). None of the failing suites touch `combat.ts`,
  `turnManager.ts`, `effects.ts`, `hideSlice.ts`, or `GameBoard.tsx` logic directly, and `combatWeapons.test.ts`
  / `effects.test.ts` (closest coverage to the bug fixes) both pass. This pre-existing harness issue is worth
  a dedicated fix but is out of scope for a gameplay-feel pass.

## Looked at, deliberately left alone
- **Early-game difficulty before Hermit Hollow** (`GAMEPLAY_STORY_DESIGN.md` flags this as an open design
  question — zero defensive tools for the whole opening stretch, possibly intentional per "I want the player
  to die a lot"). This is a real design call, not a bug, and reversing it without the designer's steer would
  be the kind of balance decision this pass shouldn't make unilaterally.
- **Hermit Hollow Salamander introduction** — doc flagged this as needing a check; it already does the job
  (`tesseract_partial_history` node). No change needed.
- **Jaunt Cave / combat engine internals** — explicitly called out as "leave alone until a second timed
  encounter exists" in `SUBGAME_ARCHITECTURE_ANALYSIS.md`. Not touched.
- **Sub-game architecture extraction (word-grid shape, dialogue shape, etc.)** — valuable but is a refactor
  for authoring velocity, not a player-facing fun/feel improvement. Out of scope here by the brief's own
  "don't rebuild systems" instruction.

## Suggested next pass (not done here, flagged for follow-up)
- A dedicated `combat-feel` pass: brief monster-flash-on-hit, a subtler "near miss" distinction in the
  combat log copy (currently miss is flat — "X missed" — with no texture), and audio cues if
  `modules/audioManager.ts` has hooks for them.
- Fix the `@testing-library/react-native` `act` incompatibility — it's silently hiding real test coverage
  for ~40% of the component suite.
- The two still-unwritten word-grid notes from the design doc's Act One Pacing Plan (Deep Silo reveal,
  Current-Loom reveal) — real content work, flagged but not started, consistent with "don't add new
  systems" but is new *writing*, which felt like a bigger lift than this pass's budget.

---

## Follow-up pass — pickup feedback, inventory grouping, non-blocking victory popup

### 1. Item pickup now shows a short, non-blocking toast
`modules/interactions.ts`'s `handleWeaponCollection`/`handleConsumableCollection` dispatch an
`ADD_COMBAT_LOG` message ("Picked up: X") right after a successful collection. This reuses the
already-shipped `CombatDialog` pipeline — `GameBoard.tsx`'s combat-dialog orchestration effect already
shows any new combat-log entry that arrives outside combat (the same path "The terrain blocks the way."
already used), and `CombatDialog` auto-dismisses after exactly 2000ms with no touch handlers. No new
component, no new state. Also added `pointerEvents="none"` to `CombatDialog`'s root view defensively, so
it can never swallow a tap-to-move even if a future layout change puts it over the touch target.

### 2. Inventory groups identical items instead of one row per pickup
`components/Inventory.tsx` now derives a `groupedInventory` list (keyed by `shortName`/`name`) from the
flat `inventory` array for display only — the underlying array is untouched, so drop/use still act on one
real `Item` instance (the group's first). A group of 2+ renders as `"2 X Healing Potion"`; a singleton
renders as before. Weapons tab intentionally left ungrouped (equip state is per-instance and duplicates are
rare there).

### 3. Melee-victory popup no longer blocks tap-to-move
`components/effects/VictoryPopup.tsx` was wrapped in a transparent RN `<Modal>`. A transparent `Modal`
still owns its own native touch layer and swallows all taps underneath for its full 2.5s on-screen time —
that's why tap-to-move stalled after every melee kill that ended combat. Replaced it with the same
non-interactive overlay idiom already used by `TeleportFlash`/`CombatDialog` (`pointerEvents="none"`,
plain `Animated.View` with `StyleSheet.absoluteFill`), so the image still fades in/holds/out exactly as
before but taps now pass straight through to the board. Minor visual trade-off: it's now centered over the
game viewport rather than the literal full device window (it previously ignored all parent layout via the
Modal's separate native root); since the viewport is the entire play area, this is not visible in practice.

**Verified:** `tsc --noEmit` clean, `eslint` clean on all four touched files, targeted Jest run
(`potionEffects`, `monsterCreation`, `effects`) green. No dedicated test files exist yet for
`Inventory.tsx`, `VictoryPopup.tsx`, or the pickup path in `interactions.ts`.

**Noticed, not fixed (out of scope for this ask):** `checkItemInteractions` always dispatches
`REMOVE_ITEM_FROM_GAMEBOARD` after attempting a collection, even when `handleWeaponCollection` silently
aborts because the weapon inventory is full — the item would vanish from the board without actually being
collected. Pre-existing, unrelated to this pass's three requests; worth a follow-up ticket.

---

## Follow-up pass — debug "walkthrough mode" toggle (monsters off)

Added a `__DEV__`-only toggle in Settings > Debug: **"Disable Monsters (walkthrough mode)"**, next to the
existing minimap/jump-to-location tools.

- `modules/settingsManager.ts` gained a second persisted flag, `monstersDisabled`, read synchronously via
  `settingsManager.getMonstersDisabled()`. Its `AsyncStorage` import was made **lazy** (dynamic `import()`
  inside `initialize()`/`persist()` instead of a static top-level import) specifically because several
  combat/movement/effects module tests don't mock `@react-native-async-storage` and would otherwise fail
  to load the moment those modules pulled in this file. Verified via a full `pnpm run test` run before and
  after: identical 33 pre-existing failing suites, 510 passed both times.
- Enforcement is three small, independent guards (defense in depth, not one mega-switch) so each call site
  stays simple and the system degrades safely if one is ever bypassed:
  - `modules/turnManager.ts: doMonsterMovement` — skips `handleMoveMonsters` entirely (covers monster
    advance *and* ranged attacks, since both live inside that call).
  - `modules/turnManager.ts: initializeStartingMonsters` — new games don't seed any monsters while active.
  - `modules/combat.ts: checkForCombatCollision` — a direct overlap never triggers combat.
  - `modules/effects.ts: executeSwarmEffect` — totems/dark-ritual spawns no-op with flavor text instead of
    adding monsters (so those objects don't need their own special-case).
- `app/game/index.tsx`'s new `handleToggleMonstersDisabled` also clears anything already on the board the
  moment the toggle flips on — `activeMonsters` to `[]` and combat state reset — so turning it on
  mid-playthrough is immediately clean, not just clean "from here on."
- **Scope note:** Great Powers (Watchers, House of Silence) are untouched — they're stationary world
  hazards tied to fixed map locations, not spawning/chasing "monsters," and the request was specifically
  about encounters during a walkthrough. Flag if that's wanted too.

**Verified:** `tsc --noEmit` clean, `eslint` clean on all touched files, full `pnpm run test` run shows the
same 510 passed / 33 pre-existing-unrelated-failures baseline as before this change (diffed suite-by-suite).
