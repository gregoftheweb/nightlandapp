# Encounter Manifest & Gameboard System — Progress Checklist

**Last updated:** end of session, after the entrance-contract commit
**Docs:** `docs/ENCOUNTER_CONTENT_PATTERN.md`, `docs/WORD_GRID_ENCOUNTER_CONTENT_SPEC.md`, `docs/GAMEBOARD_MANIFEST_SPEC.md` (archived predecessor: `docs/archive/ENCOUNTER_MANIFEST_SPEC.md`, superseded, do not implement against it)

---

## Design phase — COMPLETE

- [x] Original manifest concept drafted, reviewed by Codex (4 rounds), corrected each time
- [x] Discovered and fixed: adjacency-rule inaccuracy, revisit-routing gap, `placementPolicy` design flaw
- [x] Discovered the "manifest" was actually mislabeled Tier 1 content, not the real manifest — led to the three-tier model (content / catalog / gameboard manifest)
- [x] Split into three final documents: generic pattern, word-grid-specific content spec, gameboard manifest spec
- [x] Final review round found and fixed: `introAssetId` contradiction, `foregroundFit` type regression, raw/parsed catalog wording, global instanceId uniqueness, one-off vs. dialogue catalog ownership (Hermit Hollow correction), region semantics, generator dependency injection, save-identity hashing for registry-backed content
- [x] Old `ENCOUNTER_MANIFEST_SPEC.md` (v4) archived with a supersession notice

## Other completed work (separate threads, logged here for continuity)

- [x] **App icon set.** Repaired baked-in white corners on the source artwork, generated `icon.png` (iOS/general), `adaptive-icon.png` (Android, safe-zone padded to avoid mask clipping), and `favicon.png` (web). Wired into `app.json`.
- [x] **Full weapon-stat system.** Wired weapon damage/accuracy into main-loop combat for the first time (previously unused). Added real range enforcement (new mechanic). Added repeatable per-weapon upgrades (`GameState.weaponUpgrades`). Added 3 new ranged weapons (Bolter, Needler, Torch) with full stats/visuals/lore, not yet obtainable. Added per-weapon hide-preservation rules (Shurikens never break hide; Needler 50%). Rewired Jaunt Cave's damage math onto the same shared formula, removing a hardcoded 3x Lazer Pistol multiplier — playtested and confirmed the resulting pacing shift makes the fight better, not worse. Removed dead Short Sword weapon. _(Branch: `feat/weapon-stat-system-and-hide-mechanics`)_. Reference doc: `COMBAT_SYSTEM_REFERENCE.md`.
- [x] **Deep Silo's ending completed.** Table/power-pad puzzle (place Discos before powering on to permanently charge it; wrong order deals real, potentially-lethal damage). New shared lifecycle reward kind `weapon-upgrade` added to the generic pattern (not word-grid-specific). Deep Silo's lifecycle contract finally completed (`createsWaypoint: true`, `revisit: aftermath-screen`, async-storage progress). _(Branch: `feat/deep-silo-ending-and-weapon-upgrade-reward`, plus a small follow-up commit swapping in real table-state art and fixing an invisible button label)_

## Build order — steps 1-7 COMPLETE, step 8 deferred

**Note:** this section was previously out of sync with reality — steps 4-7 were actually completed during the debug-tools/occupancy-bug/weapon-system stretch but never marked done here. Corrected now based on Codex's investigation confirming what actually exists in the codebase.

- [x] **Step 1 — Tier 1 cleanup.** Renamed manifest terminology to content terminology (`WordGridEncounterContent`, `WordGridContentDetails`, `WordGridPresentationContent`, `content.ts`). Retired `EncounterManifest`. Removed `placementPolicy` from content and the four hardcoded registry entries. Fixed the duplicate-export lint error. Fixed `introAssetId`/`foregroundFit` schema bugs. _(Branch: `refactor/word-grid-content-tier1-cleanup`)_

- [x] **Step 2 — Tier 2 raw/parsed catalog infrastructure.** Built `RawContentCatalog<T>`/`ParsedContentCatalog<T>`/`buildParsedCatalog()` (generic, in `config/contentCatalog.ts`) and `buildRawCatalog()` with duplicate-registration detection. Word-grid's catalog built and tested against fixture content. _(Branch: `feat/word-grid-content-catalog`)_

- [x] **Step 3 — Tesseract's real content migrated into Tier 1/2.** Authored `tesseract-crypt-01` (later renamed `word-tile-crypt-01`) as real `WordGridEncounterContent`. Direct field-by-field equivalence test against the hardcoded runtime config. _(Branch: `feat/word-grid-entrance-contract`)_

  - [x] **Sub-task — generic authored entrance contract.** `EncounterEntranceContent` added to the pattern doc; word-grid's `metadata.entrance` uses it.

- [x] **Step 4 — `GameboardManifest` types and validator.** `config/types/gameboard.ts` (discriminated slot union matching spec §3.2) and `config/gameboardManifestValidator.ts` — full Tier 3 validation, 25+ rules each with fixture coverage, tested against real content (Jaunt Cave, Deep Silo, Aero-Wreckage, Hermit Hollow, word-tile-crypt-01). A cross-catalog content-resolution bug was found and fixed this session (a word-grid encounter mislabeled `one-off` previously produced the wrong error code because lookup only checked the claimed catalog).

- [x] **Step 5 — Real gameboard manifest authored.** `config/gameboardManifest.ts` — `range` slots for Hermit Hollow, Aero-Wreckage, Jaunt Cave, Deep Silo (Hermit Hollow correctly `dialogue`, not `one-off`); `scattered-group` for word-grid. Placement percentages widened once (2-27% band) specifically to give `generateLayout` enough room to avoid collisions, verified via the debug minimap.

- [x] **Step 6 — `generateLayout()` + runtime wiring.** Board occupancy registry (`modules/gameboardLayout.ts`) seeds from every real hand-placed object (buildings, footsteps, river's actual mask segments, player spawn, Great Powers — the last one added via a real bugfix after a live overlap was found under the Watcher). Generated placements convert to real `LevelObjectInstance`s via `createSubGameEntranceInstance()`, merged into the runtime object list at new-game creation. All five encounters' old hardcoded `config/levels.ts` entries removed. Save schema includes `encounterPlacements[]` + `GameboardCatalogIdentity`. _(Branches: `feat/gameboard-layout-generator`, `fix/gameboard-occupancy-great-powers-and-segments`)_

- [x] **Step 7 — Second word-grid instance authored and proven.** `word-tile-crypt-02` (SALAMANDER, narratively tied to the Salamander/Earth Current thread and to `word-tile-crypt-01`'s Persius letter). This also surfaced and fixed a real gap the original extraction had left unfinished: word-grid's routing was never actually generalized to a true dynamic route — it still ran through Tesseract's old static screen files. Built the real `app/sub-games/word-grid/[instanceId]/` dynamic route, migrated both instances onto it, removed the old static files. Also: board-letter rendering moved from a baked-into-the-image approach to a real data-driven text overlay (the original baked-letter board was actively wrong for a second instance), tap-feedback colors, a scrollable reward-note dialog, and grid-jumbling polish.

- [ ] **Step 8 — Real trail geometry, more content, more shapes.** Not started, explicitly deferred. This is the only remaining item in the original build order.

  **Footstep breadcrumb generation, trail geometry, and branches — full design captured in `docs/TRAIL_GEOMETRY_SPEC.md` (v5, implementation-ready after four technical review rounds covering branch placement identity, unified spacing/distance model, traversability vs. occupancy reconciliation, persistence, branch content allocation guarantee, endpoint clearance, and a measurable trunk-length target).** Key points: a new red-footprints template/asset generates breadcrumbs along both the trunk and branches, fully additive alongside the existing hand-authored blue footsteps in `config/levels.ts` (never touched/replaced). `EncounterPlacement` gains a `location: TrailLocation` field to distinguish trunk vs. branch placements. Trail geometry and generated footsteps are persisted directly in saves, not regenerated on load. This is real trunk/branch/persistence/spacing work, not just an angle-calculation formula.

---

## Explicitly deferred (not on the critical path, don't start early)

- [ ] **House of Silence / Tesseract ending reward idea:** upon reaching House of Silence and obtaining the Tesseract, part of its granted powers should be unlocking the currently dev-only jump menu and minimap as real, player-facing abilities (re-skinned/polished for production at that point, not the raw debug versions). A nice thematic payoff — turns meta tools into an earned, diegetic reward befitting a world-changing device. Not buildable yet — House of Silence doesn't exist as content, and the Tesseract ending sequence itself is a future design project of its own. Captured here so it's not lost.
- [ ] Real Persius' Footsteps trail geometry (the actual `PathPositionResolver` implementation) — **now in active design, see `TRAIL_GEOMETRY_SPEC.md`**
- [ ] Subset selection (`selectCount` on `scattered-group`, using fewer than all instances per playthrough)
- [ ] One-file-per-instance manifest organization (only revisit if the single-file catalog becomes unwieldy)
- [ ] New shapes beyond word-grid / one-off / dialogue
- [ ] Migrating Hermit Hollow / Aero-Wreckage into their own reusable shapes (separate from this whole system — only worth doing once each has a genuine second real instance to justify it, per the original sub-game architecture analysis)
- [ ] Fixing the pre-existing `active: false` inconsistency in building rendering/tap hit-testing (found as a side effect of the entrance-contract investigation — real bug, not blocking, not part of this system)

## Resolved during this session (moved from "known open items")

- [x] `AWAKEN_GREAT_POWER` desync — resolved by removing the vestigial awaken mechanic entirely (design intent: Great Powers are stationary, always-lethal hazards, no sleep/wake needed). Collision-path dispatch was found to be actively broken (payload mismatch) on top of being unwanted. Duplicate top-level `state.greatPowers` removed; `state.level.greatPowers` is now the sole source.
- [x] `UPDATE_OBJECT` desync — fixed by having the reducer build one array and assign the same reference to both `state.objects` and `state.level.objects`, rather than removing the duplicate (smaller, lower-risk fix given how many systems still consume `state.objects`). Cursed Totem cooldown regression-tested directly.

## Known open items unrelated to this system (parked earlier today, still open)

- [ ] The 6 remaining `GameBoard.tsx` unused-handler lint warnings — possible P1 board-rework regression, never fully investigated
- [ ] Real iOS hardware validation pass (fonts, shadows, haptics, audio interruptions) — needs a device, can't be scripted
- [ ] Save-identity gap: `GameboardCatalogIdentity` only hashes the manifest structure and referenced encounter content — it does NOT capture the occupancy registry's output or level occupancy, so a save created with buggy placement logic (e.g. the now-fixed Watcher overlap) is NOT caught by the incompatible-save check on load. Pre-release stance means the practical fix is "just start a new game" rather than trying to load anything old, but this is a real architectural gap worth a proper fix eventually if save compatibility ever needs to matter for real (found while fixing the Great Powers occupancy bug)
- [ ] Hide-state combat-collision inconsistency: `modules/combat.ts`'s direct collision guard checks only `player.isHidden`, not `player.hideActive` — so a player hidden via the Hermit-unlocked ability (not environmental cover) can still trigger this specific collision check inconsistently with how monster movement/avoidance treats them elsewhere. Found while investigating the weapon-specific hide-break mechanic; not fixed, just logged.
- [ ] `DECREMENT_CLOAKING_TURNS` (environmental `isHidden`/`hideTurns` timed expiration) is fully implemented in the reducer but never actually dispatched anywhere — cloaking effects' documented turn-based expiration currently does not run in real gameplay. Found during the same investigation; likely either dead code to remove or a real gap to wire up, worth a decision later.

---

_Update this checklist as each remaining step lands — it's the fastest way to pick this back up cleanly next session._
