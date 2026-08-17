# Sub-Game Architecture Analysis

## Scope and method

This report examines the actual implementation of the five sub-games under `app/sub-games/`, the
`_subgame-template` scaffold, the `_shared` utilities, the central registry in
`config/subGames.ts`, and the entry/exit helpers in `modules/subGames.ts`. Tests and local design
notes were used as supporting context, but the ratings below are based on runtime code rather than
folder names or README claims.

The intended growth target is approximately 20 sub-games. The useful architectural distinction for
that target is:

- a **shell**: common entry, exit, completion, revisit, reward, safe-area, and navigation behavior;
- a **shape**: a reusable mechanic such as a dialogue graph, dial sequence, word grid, or branching
  exploration sequence;
- an **instance config**: the assets, prose, targets, rewards, effects, and tuning values that make
  one instance distinct;
- a **one-off**: bespoke code whose mechanic or presentation does not justify a generalized shape.

Today the visual shell is partly shared, but the lifecycle shell and most shape/instance boundaries
are informal.

## Executive findings

1. `_subgame-template` defines a useful three-stage narrative flow—intro, puzzle, success—but it is
   a copy-and-edit scaffold, not a reusable runtime abstraction. It does not enforce its own stated
   persistence guidance and leaves important lifecycle policy to each copied game.
2. All five games use `BackgroundImage`; all use `BottomActionBar` on at least their ordinary action
   screens; all use `subGameTheme`. Only Jaunt Cave uses `ReadableTextBox`. Only Aero-Wreckage uses
   `_shared/persistence`.
3. Completion is not uniform. Aero-Wreckage, Hermit Hollow, Jaunt Cave, and Tesseract set global
   completion flags at different moments. Deep Silo never sets one and currently has no terminal
   “complete and return” path after power restoration.
4. Tesseract is not yet “add a tiles config file.” Its letter layout is in `tiles.ts`, but the target
   word, board asset, image dimensions, calibrated grid, route outcomes, story, failure, reward, and
   revisit policy are spread across screen files.
5. Hermit Hollow has the cleanest content/mechanic boundary because its dialogue graph is data. The
   effect interpreter and completion/waypoint behavior remain game-specific code.
6. Aero-Wreckage has the cleanest mechanical config for a conventional puzzle. Its dial engine is a
   good candidate for the first true reusable shape after its config dependencies are injected.
7. Jaunt Cave is correctly treated as a one-off encounter. A generic timed-encounter kernel could be
   extracted only after a second concrete encounter demonstrates the same needs; extracting it now
   would mostly turn carefully tuned behavior into a large speculative configuration surface.

## 1. Template versus reality

### The pattern defined by `_subgame-template`

The template defines this nominal flow:

```text
overworld interaction
  -> index (replace)
  -> main/intro (start or exit incomplete)
  -> puzzle (local state; solve or exit incomplete)
  -> success (reward, completion, resume signal)
  -> /game (replace through exitSubGame)
```

Its intended responsibilities are:

- **State:** global RPG state through `useGameContext`; local puzzle state through React state.
- **Completion:** dispatch `SET_SUB_GAME_COMPLETED` with the folder slug on successful exit.
- **Rewards:** grant an idempotent inventory/weapon reward, nominally on the success screen.
- **Resume:** call `signalRpgResume()` from `GameContext`, then `exitSubGame({ completed: true })`.
- **Navigation:** `replace` from the index, `push` forward within the sub-game, and
  `exitSubGame()` rather than stack navigation when returning to the RPG.
- **Presentation:** use `BackgroundImage`, `BottomActionBar`, and `subGameTheme`.
- **Persistence:** the template README says completion persists in `state.subGamesCompleted`; the
  separate `_shared` README describes versioned AsyncStorage progress saves. The template itself
  does not load or save in-progress puzzle state.

The template is best understood as a **golden-path example**, not a contract. Several details are
underspecified or internally loose:

- The README says to dispatch completion with `true/false` on exit, but incomplete exits only call
  `exitSubGame({ completed: false })`; that result currently affects navigation only and is not stored.
- “Never use `router.back()`” is too broad. Returning within a multi-screen sub-game is different
  from exiting to the RPG, and real games reasonably use `back()` for the former.
- Revisit behavior is absent. The real games variously redirect to success/aftermath, initialize at
  a terminal dialogue node, or restart.
- Failure/death behavior is absent.
- Reward timing is ambiguous: the sample effect is designed to grant on success-screen mount, while
  the UI separately says “Claim Reward.”
- The template has no standard protection against duplicate completion presses, navigation races,
  asynchronous rewards, or waypoint-save ordering.
- Shared progress persistence is documented but optional, with no version migration or completion
  cleanup policy enforced by the scaffold.
- `config/subGames.ts` centralizes entrance metadata, but the template does not instruct new games
  to consume the registry for all instance content. Routes and most copy are still literal strings.

### Conformance matrix

| Game          | Template resemblance                                                                       | Genuine divergence                                                                                                                                | Drift/inconsistency worth fixing                                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aero-Wreckage | Entry, exploration/puzzle, success/reward, completion, exit; strong shared-UI use          | Branching exploration before the dial; persistent partial puzzle progress; custom dial/haptics                                                    | Routes, prose, assets, reward ID, success behavior, and config are scattered. Each screen creates its own `usePuzzleState`, and internal `back()` contradicts the README wording but is not itself wrong.                                                                                                                 |
| Deep Silo     | Index plus a forward screen sequence; shared background/action shell                       | It is a visual descent/exploration sequence with a timed switch animation rather than a conventional puzzle                                       | No completion dispatch, resume signal, terminal exit, revisit policy, or progress save. Eight nearly identical screens encode data as components. This is the largest lifecycle divergence that looks like incompleteness/drift rather than mechanical necessity.                                                         |
| Hermit Hollow | Index, a main interaction, completion, return, and revisit handling                        | A branching dialogue graph; node effects; ability unlock; waypoint creation; no separate success screen                                           | The graph is data-driven, but effect-name interpretation is hardcoded in the screen. It reimplements the visual text box instead of using `ReadableTextBox`, whose comment says Hermit is its source of truth. Completion occurs on reaching the end node, not on exit; that is defensible but should be explicit policy. |
| Jaunt Cave    | Intro, active challenge, victory, reward/ability, completion, exit, revisit aftermath      | Real-time combat, death route, hand-tuned state machine, AppState/focus lifecycle, weapon inventory, projectile and block timing, waypoint reward | Some content/tuning remains embedded across hooks and components, but most divergence is legitimate. Its lifecycle rules should not be forced into the simple puzzle template.                                                                                                                                            |
| Tesseract     | Closest visible match: intro, puzzle, failure/success, reward, completion, exit; shared UI | Wrong input causes game death rather than a retry; completed visits route directly to success                                                     | Content separation is only partial. The target word is in the screen, letters/calibration are in `tiles.ts`, and narrative/reward/failure/assets are elsewhere. Debug mode is hardcoded on (though rendered only in development), and the puzzle uses literal image dimensions and routes.                                |

## 2. Per-game architecture overview

### Aero-Wreckage Puzzle

**Core mechanic.** The player explores two branches of a wreck: the cockpit reveals narrative clues,
while the rear contains a safe. The safe is opened by setting a three-step clockwise/counter-clockwise
dial combination, with haptics and persisted partial progress.

**Code versus configuration.** Mechanical parameters are unusually well separated in `config.ts`:
40 dial positions, the ordered direction/target sequence, tolerance, tick size, save key, and initial
state. `types.ts` and `utils.ts` contain mostly reusable dial concepts. The hook still imports the
singleton config directly, and `Dial.tsx`, individual screens, and success handling contain instance
assets, styling, instructions, and rewards.

**State, save, and completion.** `usePuzzleState` owns typed local state, loads a versioned shared
AsyncStorage save, throttles ordinary updates, serializes milestone writes, and clears on an explicit
development reset. Opening the safe routes to `success`. The success screen grants the laser pistol
idempotently and sets `subGamesCompleted['aerowreckage-puzzle']` only when the player chooses to
return. The persisted dial save is not cleared on completion. Completion/revisit redirection is not
handled at index; the index always reloads progress and routes to entry.

**Shared use.** Uses `BackgroundImage`, `BottomActionBar`, `subGameTheme`, and all three progress-save
operations (`getSubGameSave`, `setSubGameSave`, `clearSubGameSave`). It does not use
`ReadableTextBox`; it maintains a separate `theme.ts` and several bespoke modal/indicator components.

### Deep Silo

**Core mechanic.** The player repeatedly chooses whether to descend or retreat through image-led
levels, reads and acquires Persius Note 2, reaches a control panel, and watches a three-frame timed
power-switch animation.

**Code versus configuration.** Almost all instance content is hardcoded. Screens 1–5 are nearly the
same component with a different background, next route, log text, and labels. Screens 6–8 add the
note, switch choice, animation, and powered-on view. Animation frames, native image dimensions,
frame holds, flash timing, shake timing, routes, reward ID, and prose are module constants rather
than one sequence definition.

**State, save, and completion.** Local state exists only for the note modal/read gate and switch
animation. Acquiring the note is effectively persistent because it is added to global inventory.
There is no `_shared` progress save, no `SET_SUB_GAME_COMPLETED`, no `signalRpgResume`, and no
success exit. Screen 8 only goes back to the control panel, so re-entry starts again at screen 1 and
the power-restored outcome is not recorded.

**Shared use.** All eight ordinary screens use `BackgroundImage`, `BottomActionBar`, and
`subGameTheme`. The animation screen renders directly. It does not use `ReadableTextBox` or shared
persistence.

### Hermit Hollow

**Core mechanic.** The player traverses a branching conversation with the Hermit. Reaching certain
nodes records lore flags, unlocks hiding, and ultimately completes the encounter and creates a
waypoint; return visits open at the Hermit's trance state.

**Code versus configuration.** Dialogue prose, choices, links, effect names, and terminal status are
cleanly represented by `HERMIT_DIALOGUE`, an array of `DialogueNode`. The renderer is generic over
that graph. The interpretation of effects is not generic: `main.tsx` contains explicit branches for
`hermit_enters_trance` and `unlock_hide_ability`, a convention for storing all other strings as
completion flags, and Hermit-specific waypoint construction.

**State, save, and completion.** Current node and effect-application guards are local state and are
not persisted mid-conversation. Global completion and lore flags are dispatched as nodes are
entered. At the terminal node the code builds a state snapshot containing those flags and creates a
one-time waypoint. Exit signals the RPG and reports completion. On revisit, completion initializes
the dialogue at the end node and suppresses its effects.

**Shared use.** Uses `BackgroundImage`, `BottomActionBar`, and `subGameTheme`. It does not use shared
progress persistence. It also does not use `ReadableTextBox`, despite that component explicitly
claiming Hermit Hollow's text treatment as its source; the screen keeps its own scrollable text-box
styles because it needs constrained scrolling.

### Jaunt Cave

**Core mechanic.** A narrative lock-in leads to real-time combat against a teleporting daemon. The
player selects a ranged weapon and target, fires during a vulnerability window, and times a block
during a short preparation phase; victory unlocks Jaunt and a waypoint, while defeat enters the
global death flow.

**Code versus configuration.** This is primarily game-specific code. `BATTLE_TIMINGS` is centralized,
but hit chances, damage, attack probability, positions, weapon damage variance, laser multiplier,
projectile timing, feedback, assets, and layout calibration are distributed across `useBattleState`,
`useWeapon`, `screen2`, `useArenaLayout`, and presentation components. Global weapon/inventory data
is reused, but the encounter model is not configured as data.

**State, save, and completion.** `useBattleState` is an explicit reducer-backed timed sequence with
one scheduled transition, terminal-state arbitration, and focus/AppState generation invalidation.
`useWeapon` separately owns generation-safe projectile/menu work. Player HP and inventory are global;
daemon HP and battle phase are local and intentionally restart rather than persist. Victory is
confirmed on screen 3, which sets completion, unlocks Jaunt, and creates a one-time waypoint from an
explicit updated snapshot. Re-entry redirects to an aftermath screen. Player death dispatches
`GAME_OVER` and navigates through a bespoke death screen.

**Shared use.** Broadly uses `BackgroundImage`, `BottomActionBar`, `ReadableTextBox`, and
`subGameTheme`. It does not use `_shared` progress persistence. Its battle HUD, health bars,
inventory modal, sprite animation, projectiles, hit feedback, block shield, arena layout, and state
hooks are rightly local today.

### Tesseract

**Core mechanic.** The player taps letters on a calibrated 5×5 image grid, consuming each tile, to
spell `TESSERACT` in order. Any wrong letter leads to death; completing the word yields Persius's
scroll and marks the encounter complete.

**Code versus configuration.** `tiles.ts` separates the tile type, grid calibration, letter matrix,
grid subdivision, pixel conversion, and hit testing from the screen. That is a useful start, but it
mixes reusable geometry with this instance's data. The target word is separately hardcoded in
`screen2`, as are 5×5 dimensions, the gap, image aspect/dimensions, animation delays, board asset,
outcome routes, and debug behavior. Success/failure prose, the scroll, reward ID, and backgrounds
are in other screens.

**State, save, and completion.** Selected tiles, current sequence, and inactive tiles are local and
not persisted. The puzzle resets when its screen remounts. Wrong input dispatches global `GAME_OVER`
from the failure screen. Success adds the scroll on first success-screen mount; completion is set
when returning to the Night Land. The index checks global completion and directs return visits to
the success screen, whose copy and reward logic are revisit-aware.

**Shared use.** Uses `BackgroundImage`, `BottomActionBar`, and `subGameTheme`; it does not use
`ReadableTextBox` or shared persistence. One failure screen reimplements an absolute bottom bar
instead of using `BottomActionBar`.

## 3. Duplication readiness

The score measures **current readiness to create a materially different instance without copying and
editing game logic**. A mechanically simple game can therefore score lower than a complex but
well-configured one.

| Game          | Readiness | Assessment                                                                                                                                       |
| ------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Aero-Wreckage |   **4/5** | Dial mechanics and progress state are already structured. One dependency-injection pass could make a reusable dial-safe shape.                   |
| Deep Silo     |   **2/5** | Mechanically easy to duplicate, architecturally poor to duplicate: content is encoded as eight route components and completion is missing.       |
| Hermit Hollow |   **4/5** | Dialogue content is already a graph. A typed effect/action layer and generic completion wrapper would make variants mostly data.                 |
| Jaunt Cave    |   **1/5** | Its battle is cohesive but bespoke, and tuning/content are distributed across a large interacting system. Copying it would fork a combat engine. |
| Tesseract     |   **3/5** | Geometry helpers are reusable and letters are data, but a variant still requires coordinated edits across the puzzle and outcome screens.        |

### Is Tesseract currently “add a new tiles config file”?

No. `tiles.ts` is approximately 190 lines because it combines three things:

1. reusable grid geometry and hit testing;
2. asset-specific calibration (`GRID_RECT`);
3. instance content (`LETTER_GRID`).

A second word-grid variant also has to change `TARGET` in `screen2`, the board asset, intrinsic image
dimensions/aspect ratio, row/column counts, gap, routes, intro copy, failure behavior, success copy,
reward item, scroll text, background assets, completion slug, and revisit handling. If letters are
baked into each board image—as the comments imply—the image and `LETTER_GRID` must also remain
synchronized manually. The tests validate spelling and tile geometry, but there is no single config
whose consistency can be checked.

To reach “add one config,” split reusable geometry into a shape module and define a typed instance:

```text
WordGridConfig
  id, boardAsset, intrinsicSize, gridRect, rows, columns, gap
  letters, targetSequence
  tapFeedback/timing, wrongInputOutcome, successOutcome
  intro/success/failure presentation
  reward, completion/revisit policy
```

Add validation that the matrix dimensions match the grid, the target can be formed without illegal
tile reuse, and asset calibration is present. Route files should become thin wrappers over one
generic word-grid flow.

### Required extraction by game

#### Aero-Wreckage → dial-lock shape

Already configurable: dial size, code steps, tolerance, tick size, initial state, and save key.

Still extract:

- inject `PuzzleConfig` into utilities and `usePuzzleState` instead of importing `PUZZLE_CONFIG`;
- sub-game ID, all routes, background/icon assets, cockpit/rear narrative, and button labels;
- dial presentation/calibration and haptic policy where currently embedded in `Dial`/screens;
- success transition timing and feedback text;
- reward type/ID (`weapon-lazer-pistol-001`), modal copy, and grant timing;
- completion and revisit policy, including whether completed progress saves should be cleared;
- optional exploration branches, represented as data rather than separate copied screens.

#### Deep Silo → image-led exploration sequence

Extract nearly everything into a `SequenceConfig`:

- an ordered/branching node list with background, body text, choices, labels, and destinations;
- note/reward nodes with item template IDs and modal presentation;
- animation nodes with frames, image dimensions, holds, flash/shake parameters, and destination;
- sub-game ID, completion node, exit behavior, resume signal, and revisit start node;
- optional progress checkpoint policy.

Then replace screens 1–8 with one generic sequence-node route (or a small route wrapper that resolves
the node ID). Do not duplicate the current eight-component form.

#### Hermit Hollow → dialogue encounter shape

Already configurable: node IDs, NPC text, choices, links, effect names, and end markers.

Still extract:

- a typed action/effect union instead of free-form strings;
- generic actions such as `setFlag`, `applyEffect`, `grantItem`, `unlockAbility`, `completeSubGame`,
  and `createWaypoint`, each with typed payloads;
- start/end/revisit node IDs and whether end-node effects replay;
- speaker identity, backgrounds, text/choice styles, and exit labels;
- optional mid-dialogue persistence and schema version;
- waypoint name and completion snapshot behavior.

The generic renderer should accommodate a scrollable text region; simply replacing it with the
current `ReadableTextBox` would lose Hermit's overflow behavior.

#### Jaunt Cave → keep one-off; config only for maintenance

Useful local consolidation, even without duplication:

- one encounter tuning object for HP, hit/attack probabilities, damage ranges, timings, positions,
  target anchors, weapon variance/multipliers, projectile duration, and feedback strings;
- one asset map for background, daemon phase sprites, victory/death/aftermath images;
- one outcome definition for completion flag, ability unlock, charges, waypoint, and death copy.

That would improve auditability, but it would not make a safe generic template by itself. The battle
state transitions, input windows, animation choreography, inventory integration, lifecycle ownership,
and terminal arbitration remain the shape.

#### Tesseract → word-grid shape

Extract:

- separate reusable grid math from `WordGridConfig` instance data;
- target, letter matrix, grid dimensions/gap, calibration, asset and intrinsic size in one config;
- correct/wrong/complete delays and visual feedback parameters;
- failure outcome (retry, penalty, or death) and its narrative;
- intro, success, revisit, and reward content;
- sub-game ID, routes, completion flag, and progress policy;
- a development calibration flag controlled centrally rather than `DEBUG = true` in the screen.

## 4. Why Jaunt Cave is a one-off

The quoted 4,192 lines are accurate when the entire directory—including tests—is counted. Runtime
source is about 3,296 lines; either measure makes it substantially larger than the other games.

Its size is structural, not merely duplicated screen chrome:

- a reducer-backed daemon sequence with randomized resting, phase transitions, vulnerability,
  attacks, landing, crossfade, and mutually exclusive terminal outcomes;
- a single cancellable scheduled transition plus generation checks across focus, backgrounding, and
  unmount;
- a separate generation-safe weapon timeline for menus, projectiles, hit evaluation, damage, and
  feedback cleanup;
- player HP and global inventory integration, weapon selection, damage ranges, and a special laser
  multiplier;
- responsive arena-to-background coordinate mapping and distinct projectile/daemon anchors;
- six daemon visual phases, glow/fizzle/brightness/crossfade animation, health bars, battle HUD,
  block shield, feedback, and hit indicators;
- death integration, victory ability unlock, one-time waypoint construction, and aftermath revisits.

Those systems are tightly coupled to the encounter's readable tells and hand-tuned feel. Turning all
of them into config today would not remove complexity; it would move behavior into a large, difficult
schema with only one consumer.

### What could become a reusable timed-encounter shape

A future second encounter might justify a kernel containing:

- lifecycle generation ownership and one cancellable scheduled transition;
- generic phase definitions with durations and legal inputs;
- terminal-state arbitration and outcome callbacks;
- configurable actor stats/damage rolls;
- a generic scheduled projectile/action pipeline;
- generic health bars and feedback primitives.

The daemon's phases, targeting model, block-window semantics, sprite choreography, arena anchors,
weapon multiplier, reward, and narrative should remain instance-specific. Extraction should happen
only after designing a second timed encounter and identifying the intersection. Jaunt Cave itself
should not be rewritten merely to create an unproven abstraction.

## 5. New reusable game shapes

### 1. Signal Ossuary — frequency matching

**Core loop.** The player adjusts three or four coarse controls (frequency, phase, and gain) to align
a dying transmission with a target waveform. Each adjustment changes a visual/noise pattern; a
limited number of “listen” attempts reveals whether each axis is high, low, or aligned.

**Config-driven content.** Target values and tolerances, number/range of controls, attempt budget,
feedback vocabulary, waveform/noise assets, transmission fragments, background, success/failure
outcomes, reward, and completion/revisit policy.

**Complexity.** **Medium**—more interactive than Hermit Hollow and Deep Silo, comparable to the
Aero-Wreckage dial, far smaller than Jaunt Cave. Once built, many variants can change target profiles
and intercepted lore without new logic.

### 2. Black Glass Reliquary — constraint placement

**Core loop.** The player places a small set of relic shards into sockets. Each shard carries two or
three symbols, and adjacent sockets impose simple constraints such as “no matching mark,” “one light
mark touches the center,” or “the eye must face outward.” Incorrect arrangements produce local clues
rather than a word-spelling mechanic.

**Config-driven content.** Board topology, socket coordinates, shard shapes/symbols, adjacency rules,
fixed starting pieces, clue text, move/attempt limits, assets, reward, and outcome policy.

**Complexity.** **Medium**—a reusable drag/tap placement and constraint engine. It is mechanically
distinct from Tesseract because order and vocabulary do not matter; the challenge is spatial
constraint satisfaction.

### 3. The Listening Door — timed observation sequence

**Core loop.** The player watches or hears a short sequence of environmental events—knocks, lamp
flickers, moving shadows—then reproduces it using three to five controls. Difficulty comes from
sequence length, simultaneous cues, and limited replays, not reflex combat.

**Config-driven content.** Cue channels, sequence, cue/replay timing, control mapping, allowed
mistakes, presentation assets/audio, narrative fragments, failure consequence, reward, and revisit
policy.

**Complexity.** **Small-to-medium**—larger than a dialogue renderer, smaller than the dial if input is
button-based. One playback/input engine could support many atmospheric variants.

## 6. Recommendation summary

### Recommended portfolio for approximately 20 total games

Keep the current five, then add fifteen instances in this mix:

- **5 existing-shape variants**:
  - 2 additional dialogue encounters using a hardened Hermit shape;
  - 2 additional dial/control-lock encounters using the Aero-Wreckage shape;
  - 1 additional word-grid instance after Tesseract becomes genuinely config-driven.
- **3 new reusable shapes**, the concepts above, with **2 instances each** initially: 6 games.
- **3 image-led exploration sequences** using a rebuilt Deep Silo sequence shape. These are relatively
  inexpensive content vehicles and can carry lore, inventory finds, and world-state changes.
- **1 additional true one-off** beyond Jaunt Cave, reserved for a major narrative/mechanical climax.

That produces 20 total: 5 current + 5 existing-shape variants + 6 new-shape instances + 3
exploration sequences + 1 new one-off. It creates seven reusable shapes overall: dialogue, dial,
word-grid, exploration sequence, frequency matching, constraint placement, and observation sequence,
with Jaunt remaining outside that set. Bespoke investment stays rare.

The exact content count can shift, but the key ratio should remain: roughly **70–75% instances of
proven shapes, 15–20% first implementations of new shapes, and no more than 10% true one-offs**.

### Refactor before duplication

1. **Define a lifecycle contract first.** Create one documented policy for entry, incomplete exit,
   success, completion timing, rewards, revisit routing, failure/death, resume signaling, and optional
   progress persistence. It need not force every game into three screens, but every shape must declare
   these decisions.
2. **Make the registry extensible.** `SubGameId` is currently a closed five-value union and registry
   metadata covers entrances better than instances. Add typed shape and lifecycle metadata before
   multiplying route literals and completion slugs.
3. **Replace the copy-only template with thin shape templates.** Keep a minimal one-off scaffold, but
   add canonical dialogue, dial, word-grid, and sequence examples whose screen code consumes config.
4. **Fix Deep Silo's lifecycle before cloning it.** Decide what restored power means, where completion
   occurs, how the player exits, and what a return visit shows. Then collapse its repeated screens into
   sequence data.
5. **Extract Tesseract's complete instance config.** Do not create a second grid until target, letters,
   calibration, asset geometry, outcomes, reward, and copy are validated together.
6. **Inject Aero-Wreckage config.** Its utilities/hook should accept an instance configuration; avoid
   copying modules that import one global `PUZZLE_CONFIG`.
7. **Type Hermit actions.** Replace magic effect strings and screen-level special cases with typed
   dialogue actions before authoring more graphs.
8. **Standardize shared presentation selectively.** Add a shared action button/modal and a scrollable
   `ReadableTextBox` variant where repetition warrants it. Do not erase intentional visual identity.
9. **Leave Jaunt Cave alone until a second timed encounter exists.** Consolidating its local tuning is
   useful; extracting a public encounter framework is premature.

### Proposed minimum template contract

Every new instance or one-off should explicitly provide:

- stable `id`, shape, entry route, and registration metadata;
- completion flag and the exact event that commits it;
- incomplete-exit and success-exit behavior;
- revisit policy (`restart`, `resume`, `success`, `aftermath`, or unavailable);
- progress persistence policy and schema version, or an explicit `none`;
- reward/effect actions with idempotency rules;
- failure policy, including whether it enters global death;
- foreground/background and delayed-navigation policy if timers exist;
- assets, prose, labels, and tunable mechanic parameters in instance config;
- contract tests for entry, incomplete exit, completion, repeat visit, and duplicate reward prevention.

With that contract in place, adding 15 games becomes primarily content work. Without it, each copied
folder will preserve a different interpretation of completion, saving, navigation, and revisit
behavior, making later unification substantially more expensive.
